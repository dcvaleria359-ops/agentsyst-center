import Anthropic from '@anthropic-ai/sdk'
import { LLM } from './config'

export interface LLMClient {
  generate(prompt: string, systemPrompt?: string): Promise<string>
}

export function createLLMClient(apiKey: string): LLMClient {
  const client = new Anthropic({ apiKey })
  return {
    async generate(prompt, systemPrompt = LLM.SYSTEM_ANALYST) {
      const response = await client.messages.create({
        model: LLM.MODEL,
        max_tokens: LLM.MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      })
      const block = response.content[0]
      if (block.type !== 'text') throw new Error('Unexpected LLM response type')
      return block.text
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
