import { describe, it, expect } from 'vitest'
import { runAnalysis } from '../service'
import type { LLMClient } from '../llm'
import type { CollectorOutput } from '../types'

// Sequential mock — returns responses in order, cycling if needed
function createSequenceMock(responses: Array<string | Error>): LLMClient {
  let i = 0
  return {
    generate: async () => {
      const response = responses[i++ % responses.length]
      if (response instanceof Error) throw response
      return response ?? ''
    },
  }
}

const PESTLE_MOCK = JSON.stringify({ factors: [] })
const COMPETITOR_MOCK = JSON.stringify({
  porters_five_forces: {
    rivalry: 'Alta', bargaining_power_customers: 'Alto',
    bargaining_power_suppliers: 'Bajo', threat_new_entrants: 'Moderada', threat_substitutes: 'Moderada',
  },
  inferred_dynamics: ['Alta rivalidad local'],
})
const SUMMARY_MOCK = 'Resumen ejecutivo de prueba.'

const COLLECTOR: CollectorOutput = {
  case_id: 'test-service-001',
  website_info: {
    url: 'https://example.com',
    status: 'ok',
    title: 'Test Peluquería en Madrid',
    description: null,
    text_content: null,
    h1: null,
    h2_h3: [],
    contacts: { phone: null, email: null, address: 'Calle Test 1, Madrid' },
    cta_links: [],
    tech_stack: ['WordPress'],
    error_reason: null,
  },
  reviews: { status: 'pending_connector', avg_rating: null, review_count: null, reviews_sample: [], error_reason: null },
  social_profiles: { instagram: null, facebook: null, tiktok: null },
  stack_details: { status: 'ok', cms: 'WordPress', frameworks: [], marketing_tools: ['Google Tag Manager'], booking_tools: [], error_reason: null },
  sources: ['https://example.com'],
  errors: [],
  generated_at: '2026-05-12T10:00:00.000Z',
}

describe('runAnalysis', () => {
  it('returns BusinessAnalysis with correct case_id', async () => {
    const llm = createSequenceMock([PESTLE_MOCK, COMPETITOR_MOCK, SUMMARY_MOCK])
    const result = await runAnalysis(COLLECTOR, llm)
    expect(result.case_id).toBe('test-service-001')
  })

  it('populates markdown_report', async () => {
    const llm = createSequenceMock([PESTLE_MOCK, COMPETITOR_MOCK, SUMMARY_MOCK])
    const result = await runAnalysis(COLLECTOR, llm)
    expect(result.markdown_report.length).toBeGreaterThan(0)
    expect(result.markdown_report).toContain('test-service-001')
  })

  it('defaults human_review_status to draft', async () => {
    const llm = createSequenceMock([PESTLE_MOCK, COMPETITOR_MOCK, SUMMARY_MOCK])
    const result = await runAnalysis(COLLECTOR, llm)
    expect(result.human_review_status).toBe('draft')
  })

  it('sets confidence_level based on confirmed_data count', async () => {
    const llm = createSequenceMock([PESTLE_MOCK, COMPETITOR_MOCK, SUMMARY_MOCK])
    const result = await runAnalysis(COLLECTOR, llm)
    // COLLECTOR gives confirmed: website + tech_stack = 2 → medium
    expect(result.confidence_level).toBe('medium')
  })

  it('uses PESTLE fallback when LLM fails on first call', async () => {
    const llm = createSequenceMock([new Error('LLM timeout'), COMPETITOR_MOCK, SUMMARY_MOCK])
    const result = await runAnalysis(COLLECTOR, llm)
    expect(result.pestle_analysis.factors).toHaveLength(0)
    expect(result.pestle_analysis.generated_by).toBe('llm')
  })

  it('uses competitor fallback when LLM fails on second call', async () => {
    const llm = createSequenceMock([PESTLE_MOCK, new Error('LLM timeout'), SUMMARY_MOCK])
    const result = await runAnalysis(COLLECTOR, llm)
    expect(result.competitor_analysis.inferred).toHaveLength(0)
    expect(result.competitor_analysis.generated_by).toBe('llm_inference')
  })

  it('preserves sources_used from collector', async () => {
    const llm = createSequenceMock([PESTLE_MOCK, COMPETITOR_MOCK, SUMMARY_MOCK])
    const result = await runAnalysis(COLLECTOR, llm)
    expect(result.sources_used).toContain('https://example.com')
  })

  it('summary comes from LLM response', async () => {
    const llm = createSequenceMock([PESTLE_MOCK, COMPETITOR_MOCK, SUMMARY_MOCK])
    const result = await runAnalysis(COLLECTOR, llm)
    expect(result.summary).toBe(SUMMARY_MOCK)
  })
})
