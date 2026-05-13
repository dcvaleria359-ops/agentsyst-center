import { describe, it, expect } from 'vitest'
import { analyzeCompetitors } from '../../external/competitor'
import { createMockLLMClient } from '../../llm'
import type { NormalizedInput } from '../../types'

const INPUT: NormalizedInput = {
  case_id: 'test-001',
  website_url: 'https://example.com',
  website: null,
  instagram: null,
  gmb: null,
  stack: { cms: null, booking_tools: [], marketing_tools: [] },
  sector: 'peluquería',
  location: 'Mutxamel, Alicante',
  required_data: ['google_my_business_reviews'],
  confirmed_data: [],
  sources: [],
}

const MOCK_RESPONSE = JSON.stringify({
  porters_five_forces: {
    rivalry: 'Alta rivalidad en el sector peluquería de municipios medianos.',
    bargaining_power_customers: 'Alto poder de negociación — clientes con muchas opciones locales.',
    bargaining_power_suppliers: 'Bajo poder de proveedores — mercado mayorista de productos capilares amplio.',
    threat_new_entrants: 'Moderada — barreras de entrada bajas (alquiler local, licencia básica).',
    threat_substitutes: 'Moderada — centros de estética integral pueden sustituir servicios.',
  },
  inferred_dynamics: [
    'El municipio de Mutxamel tiene alta densidad de peluquerías por habitante según patrones típicos de zonas residenciales de la Costa Blanca.',
    'Los negocios con reservas online y presencia activa en Google Maps capturan mayor cuota de nuevos clientes.',
  ],
})

describe('analyzeCompetitors', () => {
  it('returns empty confirmed array when no competitor data in collector', async () => {
    const llm = createMockLLMClient(MOCK_RESPONSE)
    const result = await analyzeCompetitors(INPUT, llm)
    expect(result.confirmed).toEqual([])
  })

  it('returns Porter five forces analysis', async () => {
    const llm = createMockLLMClient(MOCK_RESPONSE)
    const result = await analyzeCompetitors(INPUT, llm)
    expect(result.porters_five_forces.rivalry).toBeTruthy()
    expect(result.porters_five_forces.bargaining_power_customers).toBeTruthy()
    expect(result.porters_five_forces.threat_new_entrants).toBeTruthy()
  })

  it('populates inferred with LLM dynamics', async () => {
    const llm = createMockLLMClient(MOCK_RESPONSE)
    const result = await analyzeCompetitors(INPUT, llm)
    expect(result.inferred.length).toBeGreaterThan(0)
  })

  it('populates missing with required data gaps', async () => {
    const llm = createMockLLMClient(MOCK_RESPONSE)
    const result = await analyzeCompetitors(INPUT, llm)
    expect(result.missing).toContain('google_my_business_reviews')
  })

  it('sets generated_by to llm_inference when no confirmed data', async () => {
    const llm = createMockLLMClient(MOCK_RESPONSE)
    const result = await analyzeCompetitors(INPUT, llm)
    expect(result.generated_by).toBe('llm_inference')
  })

  it('handles markdown-wrapped JSON from LLM', async () => {
    const llm = createMockLLMClient('```json\n' + MOCK_RESPONSE + '\n```')
    const result = await analyzeCompetitors(INPUT, llm)
    expect(result.porters_five_forces.rivalry).toBeTruthy()
  })
})
