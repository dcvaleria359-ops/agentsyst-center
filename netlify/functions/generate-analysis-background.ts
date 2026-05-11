import { createClient } from '@supabase/supabase-js'
import {
  type CaseInput,
  buildDataCollectorSystemPrompt,
  buildDataCollectorUserMessage,
  buildAnalystSystemPrompt,
  buildAnalystUserMessage,
} from './lib/prompts'

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

function extractOpportunities(briefing: string): string {
  const m8 = briefing.match(/## 8\.[^\n]*\n([\s\S]+?)(?=\n---)/i)
  const m9 = briefing.match(/## 9\.[^\n]*\n([\s\S]+?)(?=\n---)/i)
  const parts: string[] = []
  if (m8) parts.push('AUTOMATIZACIÓN:\n' + m8[1].trim())
  if (m9) parts.push('COMERCIALES:\n' + m9[1].trim())
  return parts.join('\n\n')
}

// In a background function, return values are ignored after the 202 is sent.
// Errors MUST be written to Supabase so the frontend polling can detect them.
export const handler = async (event: { body: string | null; httpMethod: string }) => {
  const supabaseUrl        = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const apiKey             = process.env.AI_API_KEY
  const dataModel          = process.env.DATA_MODEL     ?? 'perplexity/sonar-pro'
  const analysisModel      = process.env.ANALYSIS_MODEL ?? 'deepseek/deepseek-chat'

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

  console.log(`[generate-analysis] caseId=${caseId} DATA_MODEL=${dataModel} ANALYSIS_MODEL=${analysisModel}`)

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

    // ── Phase 1: Data Collector ───────────────────────────────────────────────

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
      console.error(`[generate-analysis] Phase 1 FAIL — ${Date.now() - t1}ms — ${(e as Error).message}`)
      await saveError(`Data Collector (${dataModel}): ${(e as Error).message}`)
      return
    }

    // ── Phase 2: Business Analyst ─────────────────────────────────────────────

    let briefing: string
    const t2 = Date.now()
    try {
      briefing = await callModel(
        analysisModel, apiKey,
        buildAnalystSystemPrompt(),
        buildAnalystUserMessage(c, rawData),
        4096,
      )
      console.log(`[generate-analysis] Phase 2 OK — ${Date.now() - t2}ms`)
    } catch (e) {
      console.error(`[generate-analysis] Phase 2 FAIL — ${Date.now() - t2}ms — ${(e as Error).message}`)
      await saveError(`Business Analyst (${analysisModel}): ${(e as Error).message}`)
      return
    }

    // ── Save result to Supabase ───────────────────────────────────────────────

    const sources       = extractSources(rawData)
    const opportunities = extractOpportunities(briefing)

    const { data: existing } = await supabase
      .from('client_cases').select('history').eq('id', caseId).single()

    const historyEntry = `[${now.slice(0, 10)}] Análisis — Data Collector: ${dataModel} · Analyst: ${analysisModel}`
    const history = [existing?.history, historyEntry].filter(Boolean).join('\n')

    const { error: updateError } = await supabase
      .from('client_cases')
      .update({
        diagnosis:             briefing,
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
    }

  } catch (topErr) {
    await saveError(`Error inesperado: ${(topErr as Error).message}`)
  }
}
