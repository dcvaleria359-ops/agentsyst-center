import { createClient } from '@supabase/supabase-js'
import {
  type CaseInput,
  buildDataCollectorSystemPrompt,
  buildDataCollectorUserMessage,
} from './lib/prompts'
import {
  buildExtractionSystemPrompt,
  buildExtractionUserMessage,
  parseCollectorOutput,
} from './lib/analyst-integration'
import { createLLMClient } from '../../agents/analyst/llm'
import { runAnalysis, toJSON } from '../../agents/analyst/service'
import { toHandoff } from '../../agents/analyst/reports/agent3-handoff'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface AIResponse {
  choices: Array<{ message: { content: string } }>
}

async function callModel(
  model: string,
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  })

  const rawText = await res.text()
  if (!res.ok) throw new Error(`${model} HTTP ${res.status}: ${rawText.slice(0, 400)}`)

  let parsed: AIResponse
  try {
    parsed = JSON.parse(rawText) as AIResponse
  } catch {
    throw new Error(`${model} returned non-JSON: ${rawText.slice(0, 400)}`)
  }

  const content = parsed.choices?.[0]?.message?.content ?? ''
  if (!content) throw new Error(`Empty response from ${model}`)
  return content
}

function extractSources(rawData: string): string {
  const match = rawData.match(/### FUENTES\s*\n([\s\S]+?)(?:\n###|$)/i)
  return match ? match[1].trim() : ''
}

function inferLocationFromCase(c: CaseInput): string {
  // Use whatever structured location info is in notes or website domain as hint
  if (c.notes) {
    const m = c.notes.match(/ubicaci[oó]n[:\s]+([^\n]+)/i)
    if (m) return m[1].trim()
  }
  return ''
}

export const handler = async (event: { body: string | null; httpMethod: string }) => {
  const supabaseUrl        = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const apiKey             = process.env.AI_API_KEY
  const dataModel          = process.env.DATA_MODEL        ?? 'perplexity/sonar-pro'
  const extractionModel    = process.env.EXTRACTION_MODEL  ?? 'deepseek/deepseek-chat'
  const analysisModel      = process.env.ANALYSIS_MODEL    ?? 'deepseek/deepseek-r1-0528'

  if (!supabaseUrl || !supabaseServiceKey || !apiKey) {
    console.error('[generate-analysis] Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or AI_API_KEY not set')
    return
  }

  let caseId: string
  try {
    const body = JSON.parse(event.body ?? '{}') as { case_id?: string }
    caseId = (body.case_id ?? '').trim()
    if (!caseId) return
  } catch {
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  console.log(`[generate-analysis] caseId=${caseId} DATA=${dataModel} EXTRACT=${extractionModel} ANALYSIS=${analysisModel}`)

  const saveError = async (msg: string) => {
    await supabase
      .from('client_cases')
      .update({ diagnosis: `ANÁLISIS_ERROR: ${msg}`, analysis_generated_at: now, updated_at: now })
      .eq('id', caseId)
      .catch(() => {})
  }

  try {
    const { data: caseData, error: fetchError } = await supabase
      .from('client_cases').select('*').eq('id', caseId).single()

    if (fetchError || !caseData) {
      await saveError(`Case not found: ${fetchError?.message ?? ''}`)
      return
    }

    const c = caseData as CaseInput
    console.log(`[generate-analysis] case fields — website:${!!c.website} instagram:${!!c.instagram} notes:${!!c.notes} request:${!!c.request}`)

    // ── Phase 1: Data Collector (Perplexity) ─────────────────────────────────

    let rawData: string
    const t1 = Date.now()
    try {
      rawData = await callModel(
        dataModel, apiKey,
        buildDataCollectorSystemPrompt(),
        buildDataCollectorUserMessage(c),
        2048,
      )
      console.log(`[generate-analysis] Phase 1 OK — ${Date.now() - t1}ms`)
    } catch (e) {
      await saveError(`Data Collector (${dataModel}): ${(e as Error).message}`)
      return
    }

    // ── Phase 2: Extraction → CollectorOutput ────────────────────────────────

    let collectorOutput
    const t2 = Date.now()
    try {
      const extractionResponse = await callModel(
        extractionModel, apiKey,
        buildExtractionSystemPrompt(),
        buildExtractionUserMessage(rawData, caseId, today),
        2048,
      )
      collectorOutput = parseCollectorOutput(extractionResponse, caseId)
      console.log(`[generate-analysis] Phase 2 OK — ${Date.now() - t2}ms`)
    } catch (e) {
      console.error(`[generate-analysis] Phase 2 FAIL — ${(e as Error).message} — falling back to minimal CollectorOutput`)
      // Fallback: minimal CollectorOutput from case data
      collectorOutput = parseCollectorOutput(`{"sources":${JSON.stringify(c.sources ? [c.sources] : [])}}`, caseId)
    }

    // ── Phase 3: Analyst pipeline ─────────────────────────────────────────────

    let businessAnalysis
    const t3 = Date.now()
    try {
      const llm = createLLMClient(apiKey, analysisModel)
      const overrides = {
        sector: (c as { sector?: string }).sector ?? undefined,
        location: inferLocationFromCase(c) || undefined,
      }
      businessAnalysis = await runAnalysis(collectorOutput, llm, overrides)
      console.log(`[generate-analysis] Phase 3 OK — ${Date.now() - t3}ms`)
    } catch (e) {
      await saveError(`Analyst pipeline (${analysisModel}): ${(e as Error).message}`)
      return
    }

    // ── Phase 4: Generate reports ─────────────────────────────────────────────

    const markdownReport   = businessAnalysis.markdown_report
    const handoff          = toHandoff(businessAnalysis)
    const rawBusinessData  = JSON.stringify(collectorOutput, null, 2)
    const businessAnalysisJSON = toJSON(businessAnalysis)

    const sources       = extractSources(rawData)
    const opportunities = businessAnalysis.insights_for_agent3.join('\n')

    // ── Phase 5: Save to Supabase ─────────────────────────────────────────────

    const { data: existing } = await supabase
      .from('client_cases').select('history').eq('id', caseId).single()

    const historyEntry = `[${today}] Análisis — Data: ${dataModel} · Analyst: ${analysisModel} · Confianza: ${businessAnalysis.confidence_level}`
    const history = [existing?.history, historyEntry].filter(Boolean).join('\n')

    // Main update: existing columns (always works regardless of migration status)
    const { error: updateError } = await supabase
      .from('client_cases')
      .update({
        diagnosis:             markdownReport,
        opportunities:         opportunities || null,
        sources:               sources || null,
        history,
        current_phase:         'Diagnóstico realizado',
        next_step:             'Generar solución propuesta',
        analysis_generated_at: now,
        updated_at:            now,
      })
      .eq('id', caseId)

    if (updateError) {
      await saveError(`Supabase update: ${updateError.message}`)
      return
    }

    // New structured fields (requires Supabase migration)
    const { error: newFieldsError } = await supabase
      .from('client_cases')
      .update({
        raw_business_data:    rawBusinessData,
        business_analysis:    businessAnalysisJSON,
        markdown_report:      markdownReport,
        agent3_handoff:       handoff,
        human_review_status:  'draft',
      })
      .eq('id', caseId)

    if (newFieldsError) {
      console.error(`[generate-analysis] New fields update failed (migration pending?): ${newFieldsError.message}`)
    }

    console.log(`[generate-analysis] Done — confidence:${businessAnalysis.confidence_level} recs:${businessAnalysis.recommendations.length}`)

  } catch (topErr) {
    await saveError(`Error inesperado: ${(topErr as Error).message}`)
  }
}
