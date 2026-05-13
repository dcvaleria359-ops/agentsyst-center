import { describe, it, expect } from 'vitest'
import { synthesize } from '../synthesizer'
import { createMockLLMClient } from '../llm'
import type { WebsiteAnalysis, SocialAnalysis, ValueChainAnalysis, PestleAnalysis, CompetitorAnalysis } from '../types'

const WEBSITE: WebsiteAnalysis = {
  has_h1: false, heading_count: 2, cta_count: 0, has_booking_tool: false,
  has_analytics: true, has_marketing_pixel: false, tech_stack: ['WordPress'],
  completeness_score: 20,
  alerts: ['Sin H1', 'Sin CTAs', 'Sin sistema de reservas'],
  evidence: [{ field: 'website.has_h1', value: false }],
}

const SOCIAL: SocialAnalysis = {
  channels: [{
    platform: 'instagram', status: 'dormant', followers: 94, posts_count: 4,
    posts_per_week: 0, engagement_ratio: 0.1489, days_since_last_post: 361,
    bio_has_cta: false, bio_has_contact: false,
    alerts: ['Instagram dormido ~12 meses'], evidence: [],
  }],
  most_active_channel: null, most_neglected_channel: 'facebook',
  overall_status: 'weak',
  evidence: [{ field: 'social_profiles', value: 'weak' }],
}

const VALUE_CHAIN: ValueChainAnalysis = {
  has_booking: false, has_crm: false, has_lead_capture: false,
  has_review_management: false, has_visibility_tools: true,
  process_gaps: [
    { area: 'reservas', gap: 'Sin reservas online', impact: 'alto', evidence: [{ field: 'stack_details.booking_tools', value: 0 }] },
    { area: 'captación', gap: 'Sin CTAs', impact: 'alto', evidence: [{ field: 'website.cta_links', value: 0 }] },
  ],
}

const PESTLE: PestleAnalysis = {
  factors: [
    { factor: 'tecnológico', analysis: 'Digitalización acelerada.', opportunities: ['Reservas online'], risks: ['Competencia apps'] },
    { factor: 'social', analysis: 'Tendencia selfcare.', opportunities: ['Demanda creciente'], risks: ['Hábitos cambiantes'] },
  ],
  sector: 'peluquería', location: 'Mutxamel', generated_by: 'llm',
}

const COMPETITOR: CompetitorAnalysis = {
  confirmed: [], inferred: ['Alta rivalidad local'], missing: ['google_my_business_reviews'],
  porters_five_forces: {
    rivalry: 'Alta', bargaining_power_customers: 'Alto',
    bargaining_power_suppliers: 'Bajo', threat_new_entrants: 'Moderada', threat_substitutes: 'Moderada',
  },
  generated_by: 'llm_inference',
}

const MOCK_SUMMARY = 'U-Dos Peluquería presenta oportunidades claras de mejora digital. Su presencia online es básica y su Instagram está inactivo desde hace más de un año. Implementar reservas online y reactivar las redes sociales tendría un impacto alto con esfuerzo moderado.'

describe('synthesize', () => {
  it('produces swot with all 4 quadrants populated', async () => {
    const llm = createMockLLMClient(MOCK_SUMMARY)
    const result = await synthesize(WEBSITE, SOCIAL, VALUE_CHAIN, PESTLE, COMPETITOR, llm)
    expect(result.swot.strengths.length).toBeGreaterThan(0)
    expect(result.swot.weaknesses.length).toBeGreaterThan(0)
    expect(result.swot.opportunities.length).toBeGreaterThan(0)
    expect(result.swot.threats.length).toBeGreaterThan(0)
  })

  it('produces recommendations with required fields', async () => {
    const llm = createMockLLMClient(MOCK_SUMMARY)
    const result = await synthesize(WEBSITE, SOCIAL, VALUE_CHAIN, PESTLE, COMPETITOR, llm)
    for (const rec of result.recommendations) {
      expect(rec.category).toBeTruthy()
      expect(rec.description).toBeTruthy()
      expect(rec.impact).toMatch(/alto|medio|bajo/)
      expect(rec.effort).toMatch(/alto|medio|bajo/)
      expect(rec.confidence).toMatch(/confirmed|inferred|speculative/)
      expect(rec.evidence.length).toBeGreaterThan(0)
    }
  })

  it('sets summary from LLM response', async () => {
    const llm = createMockLLMClient(MOCK_SUMMARY)
    const result = await synthesize(WEBSITE, SOCIAL, VALUE_CHAIN, PESTLE, COMPETITOR, llm)
    expect(result.summary).toBe(MOCK_SUMMARY)
  })

  it('produces insights_for_agent3', async () => {
    const llm = createMockLLMClient(MOCK_SUMMARY)
    const result = await synthesize(WEBSITE, SOCIAL, VALUE_CHAIN, PESTLE, COMPETITOR, llm)
    expect(result.insights_for_agent3.length).toBeGreaterThan(0)
  })

  it('weaknesses map from website alerts and process gaps', async () => {
    const llm = createMockLLMClient(MOCK_SUMMARY)
    const result = await synthesize(WEBSITE, SOCIAL, VALUE_CHAIN, PESTLE, COMPETITOR, llm)
    const texts = result.swot.weaknesses.map(w => w.text)
    expect(texts.some(t => t.toLowerCase().includes('reserva') || t.toLowerCase().includes('cta') || t.toLowerCase().includes('h1'))).toBe(true)
  })
})
