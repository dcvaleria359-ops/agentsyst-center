import { createClient } from '@supabase/supabase-js'
import { buildSystemPrompt, buildUserMessage } from './lib/prompts'

const PROVIDER_URLS: Record<string, string> = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  perplexity: 'https://api.perplexity.ai/chat/completions',
  openai:     'https://api.openai.com/v1/chat/completions',
  groq:       'https://api.groq.com/openai/v1/chat/completions',
}

interface AIResponse {
  choices: Array<{ message: { content: string } }>
}

export const handler = async (event: { body: string | null; httpMethod: string }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const supabaseUrl       = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const aiProvider        = (process.env.AI_PROVIDER ?? 'openrouter').toLowerCase()
  const aiApiKey          = process.env.AI_API_KEY
  const aiModel           = process.env.AI_MODEL ?? 'anthropic/claude-3-haiku'

  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase config missing' }) }
  }
  if (!aiApiKey) {
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

  const providerUrl = PROVIDER_URLS[aiProvider] ?? PROVIDER_URLS.openrouter

  let briefing: string
  try {
    const res = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user',   content: buildUserMessage(caseData as Parameters<typeof buildUserMessage>[0]) },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { statusCode: 502, body: JSON.stringify({ error: `AI error: ${errText}` }) }
    }

    const result = (await res.json()) as AIResponse
    briefing = result.choices[0]?.message?.content ?? ''
    if (!briefing) throw new Error('Empty response from AI provider')
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: (err as Error).message }) }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('client_cases')
    .update({
      diagnosis:              briefing,
      current_phase:          'Diagnóstico realizado',
      next_action:            'Revisar diagnóstico y definir solución propuesta',
      analysis_generated_at:  now,
      updated_at:             now,
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
