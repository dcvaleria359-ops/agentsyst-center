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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
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

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${model} — ${res.status}: ${text.slice(0, 300)}`)
  }

  const result = (await res.json()) as AIResponse
  const content = result.choices[0]?.message?.content ?? ''
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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const supabaseUrl        = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const apiKey             = process.env.AI_API_KEY
  const dataModel          = process.env.DATA_MODEL    ?? 'perplexity/sonar'
  const analysisModel      = process.env.ANALYSIS_MODEL ?? 'deepseek/deepseek-r1'

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase config missing' }) }
  }
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'AI_API_KEY not configured' }) }
  }

  let caseId: string
  try {
    const body = JSON.parse(event.body ?? '{}') as { case_id?: string }
    caseId = (body.case_id ?? '').trim()
    if (!caseId) throw new Error('case_id is required')
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: (err as Error).message }) }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: caseData, error: fetchError } = await supabase
    .from('client_cases')
    .select('*')
    .eq('id', caseId)
    .single()

  if (fetchError || !caseData) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: fetchError?.message ?? 'Case not found' }),
    }
  }

  const c = caseData as CaseInput

  // ── Phase 1: Data Collector ─────────────────────────────────────────────────

  let rawData: string
  try {
    rawData = await callModel(
      dataModel,
      apiKey,
      buildDataCollectorSystemPrompt(),
      buildDataCollectorUserMessage(c),
      2048,
    )
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: `Data Collector: ${(err as Error).message}` }),
    }
  }

  // ── Phase 2: Business Analyst ───────────────────────────────────────────────

  let briefing: string
  try {
    briefing = await callModel(
      analysisModel,
      apiKey,
      buildAnalystSystemPrompt(),
      buildAnalystUserMessage(c, rawData),
      4096,
    )
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: `Business Analyst: ${(err as Error).message}` }),
    }
  }

  // ── Save to Supabase ────────────────────────────────────────────────────────

  const now = new Date().toISOString()

  const sources      = extractSources(rawData)
  const opportunities = extractOpportunities(briefing)

  const { data: existing } = await supabase
    .from('client_cases')
    .select('history')
    .eq('id', caseId)
    .single()

  const historyEntry = `[${now.slice(0, 10)}] Análisis generado — Data Collector: ${dataModel} · Business Analyst: ${analysisModel}`
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
    return { statusCode: 500, body: JSON.stringify({ error: updateError.message }) }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ briefing, generated_at: now }),
  }
}
