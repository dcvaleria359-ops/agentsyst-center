import { LLM } from './config'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface LLMClient {
  generate(prompt: string, systemPrompt?: string): Promise<string>
}

export function createLLMClient(apiKey: string, model?: string): LLMClient {
  const modelId = model ?? process.env.OPENROUTER_MODEL ?? LLM.MODEL
  return {
    async generate(prompt, systemPrompt = LLM.SYSTEM_ANALYST) {
      const res = await fetch(OPENROUTER_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
        }),
      })
      if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`)
      const data = await res.json() as { choices: Array<{ message: { content: string } }> }
      return data.choices[0]?.message?.content ?? ''
    },
  }
}

export function createMockLLMClient(response: string): LLMClient {
  return {
    async generate() {
      return response
    },
  }
}

export function parseJSONResponse<T>(text: string): T {
  const clean = text
    .replace(/^```json\s*/m, '')
    .replace(/^```\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim()
  return JSON.parse(clean) as T
}
