import { createClient } from '@supabase/supabase-js'
import {
  type CaseInput,
  buildDataCollectorSystemPrompt,
  buildDataCollectorUserMessage,
  buildAnalystSystemPrompt,
  buildAnalystUserMessage,
} from './lib/prompts'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const JSON_CT = { 'Content-Type': 'application/json' }

function respond(status: number, body: Record<string, unknown>) {
  return { statusCode: status, headers: JSON_CT, body: JSON.stringify(body) }
}

function fail(error: string, details = '', status = 500) {
  return respond(status, { ok: false, error, details })
}

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

  // Always read as text first — avoids crashing if OpenRouter returns HTML/plain-text errors
  const rawText = await res.text()

  if (!res.ok) {
    throw new Error(`${model} HTTP ${res.status}: ${rawText.slice(0, 400)}`)
  }

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

export const handler = async (event: { body: string | null; httpMethod: string }) => {
  // Top-level catch ensures we ALWAYS return valid JSON, even on unexpected crashes
  try {
    if (event.httpMethod !== 'POST') {
      return fail('Method not allowed', '', 405)
    }

    const supabaseUrl        = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const apiKey             = process.env.AI_API_KEY
    const dataModel          = process.env.DATA_MODEL     ?? 'perplexity/sonar'
    const analysisModel      = process.env.ANALYSIS_MODEL ?? 'deepseek/deepseek-r1'

    if (!supabaseUrl || !supabaseServiceKey) {
      return fail('Supabase config missing', 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
    }
    if (!apiKey) {
      return fail('AI_API_KEY not configured', 'Set AI_API_KEY in Netlify environment variables')
    }

    let caseId: string
    try {
      const body = JSON.parse(event.body ?? '{}') as { case_id?: string }
      caseId = (body.case_id ?? '').trim()
      if (!caseId) throw new Error('case_id is required')
    } catch (e) {
      return fail('Invalid request body', (e as Error).message, 400)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: caseData, error: fetchError } = await supabase
      .from('client_cases')
      .select('*')
      .eq('id', caseId)
      .single()

    if (fetchError || !caseData) {
      return fail('Case not found', fetchError?.message ?? '', 404)
    }

    const c = caseData as CaseInput

    // ── Phase 1: Data Collector ───────────────────────────────────────────────

    let rawData: string
    try {
      rawData = await callModel(
        dataModel, apiKey,
        buildDataCollectorSystemPrompt(),
        buildDataCollectorUserMessage(c),
        2048,
      )
    } catch (e) {
      return fail('Data Collector failed', (e as Error).message, 502)
    }

    // ── Phase 2: Business Analyst ─────────────────────────────────────────────

    let briefing: string
    try {
      briefing = await callModel(
        analysisModel, apiKey,
        buildAnalystSystemPrompt(),
        buildAnalystUserMessage(c, rawData),
        4096,
      )
    } catch (e) {
      return fail('Business Analyst failed', (e as Error).message, 502)
    }

    // ── Save to Supabase ──────────────────────────────────────────────────────

    const now = new Date().toISOString()
    const sources       = extractSources(rawData)
    const opportunities = extractOpportunities(briefing)

    const { data: existing } = await supabase
      .from('client_cases').select('history').eq('id', caseId).single()

    const historyEntry = `[${now.slice(0, 10)}] Análisis — Data Collector: ${dataModel} · Analyst: ${analysisModel}`
    const history = [existing?.history, historyEntry].filter(Boolean).join('\n')

    const { data: updatedCase, error: updateError } = await supabase
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
      .select()
      .single()

    if (updateError) {
      return fail('Failed to save to Supabase', updateError.message)
    }

    return respond(200, { ok: true, case: updatedCase, diagnosis: briefing })

  } catch (topErr) {
    return fail('Unexpected server error', (topErr as Error).message)
  }
}
