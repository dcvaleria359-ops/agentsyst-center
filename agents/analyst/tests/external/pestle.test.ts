import { describe, it, expect } from 'vitest'
import { analyzePestle } from '../../external/pestle'
import { createMockLLMClient } from '../../llm'
import type { NormalizedInput } from '../../types'

const INPUT: NormalizedInput = {
  case_id: 'test-001',
  website_url: 'https://example.com',
  website: null,
  instagram: null,
  gmb: null,
  stack: { cms: 'WordPress', booking_tools: [], marketing_tools: [] },
  sector: 'peluquería',
  location: 'Mutxamel, Alicante',
  required_data: [],
  confirmed_data: [],
  sources: [],
}

const MOCK_PESTLE_RESPONSE = JSON.stringify({
  factors: [
    {
      factor: 'político',
      analysis: 'Regulación estable para negocios de estética en España.',
      opportunities: ['Subvenciones para digitalización de pymes'],
      risks: ['Cambios en normativa de protección de datos'],
    },
    {
      factor: 'económico',
      analysis: 'Sector resistente a crisis económicas moderadas.',
      opportunities: ['Crecimiento del turismo en la Costa Blanca'],
      risks: ['Inflación en costes de productos capilares'],
    },
    {
      factor: 'social',
      analysis: 'Creciente demanda de servicios de bienestar personal.',
      opportunities: ['Tendencia selfcare en millennials y Gen Z'],
      risks: ['Cambio de hábitos post-pandemia'],
    },
    {
      factor: 'tecnológico',
      analysis: 'Digitalización acelerada del sector.',
      opportunities: ['Reservas online, recordatorios WhatsApp'],
      risks: ['Competencia de apps de reservas centralizadas (Fresha, Treatwell)'],
    },
    {
      factor: 'legal',
      analysis: 'RGPD aplica a la gestión de datos de clientes.',
      opportunities: ['Diferenciación por transparencia en privacidad'],
      risks: ['Multas por no cumplir RGPD en captación digital'],
    },
    {
      factor: 'ambiental',
      analysis: 'Tendencia hacia productos eco-friendly en cosmética.',
      opportunities: ['Posicionamiento como peluquería eco/sostenible'],
      risks: ['Mayor coste de productos sostenibles frente a convencionales'],
    },
  ],
})

describe('analyzePestle', () => {
  it('returns 6 PESTLE factors', async () => {
    const llm = createMockLLMClient(MOCK_PESTLE_RESPONSE)
    const result = await analyzePestle(INPUT, llm)
    expect(result.factors).toHaveLength(6)
  })

  it('each factor has analysis, opportunities and risks', async () => {
    const llm = createMockLLMClient(MOCK_PESTLE_RESPONSE)
    const result = await analyzePestle(INPUT, llm)
    for (const factor of result.factors) {
      expect(factor.analysis).toBeTruthy()
      expect(factor.opportunities.length).toBeGreaterThan(0)
      expect(factor.risks.length).toBeGreaterThan(0)
    }
  })

  it('sets sector and location from input', async () => {
    const llm = createMockLLMClient(MOCK_PESTLE_RESPONSE)
    const result = await analyzePestle(INPUT, llm)
    expect(result.sector).toBe('peluquería')
    expect(result.location).toBe('Mutxamel, Alicante')
  })

  it('sets generated_by to llm', async () => {
    const llm = createMockLLMClient(MOCK_PESTLE_RESPONSE)
    const result = await analyzePestle(INPUT, llm)
    expect(result.generated_by).toBe('llm')
  })

  it('handles LLM response wrapped in markdown code block', async () => {
    const llm = createMockLLMClient('```json\n' + MOCK_PESTLE_RESPONSE + '\n```')
    const result = await analyzePestle(INPUT, llm)
    expect(result.factors).toHaveLength(6)
  })
})
