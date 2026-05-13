import { describe, it, expect } from 'vitest'
import { toMarkdown } from '../../reports/markdown'
import type { BusinessAnalysis } from '../../types'

const ANALYSIS: BusinessAnalysis = {
  case_id: 'peluqueria-udos',
  summary: 'U-Dos Peluquería tiene potencial de mejora digital significativo.',
  website_analysis: {
    has_h1: false, heading_count: 2, cta_count: 0, has_booking_tool: false,
    has_analytics: true, has_marketing_pixel: false,
    tech_stack: ['WordPress', 'Elementor'], completeness_score: 20,
    alerts: ['Sin H1', 'Sin CTAs'], evidence: [],
  },
  social_analysis: {
    channels: [{
      platform: 'instagram', status: 'dormant', followers: 94, posts_count: 4,
      posts_per_week: 0, engagement_ratio: 0.1489, days_since_last_post: 361,
      bio_has_cta: false, bio_has_contact: false,
      alerts: ['Instagram dormido ~12 meses'], evidence: [],
    }],
    most_active_channel: null, most_neglected_channel: 'facebook',
    overall_status: 'weak', evidence: [],
  },
  pestle_analysis: {
    factors: [{ factor: 'tecnológico', analysis: 'Digitalización acelerada.', opportunities: ['Reservas online'], risks: ['Competencia apps'] }],
    sector: 'peluquería', location: 'Mutxamel', generated_by: 'llm',
  },
  competitor_analysis: {
    confirmed: [],
    inferred: ['Alta rivalidad local'],
    missing: ['google_my_business_reviews'],
    porters_five_forces: { rivalry: 'Alta', bargaining_power_customers: 'Alto', bargaining_power_suppliers: 'Bajo', threat_new_entrants: 'Moderada', threat_substitutes: 'Moderada' },
    generated_by: 'llm_inference',
  },
  process_gaps: [{ area: 'reservas', gap: 'Sin reservas online', impact: 'alto', evidence: [] }],
  swot: {
    strengths: [{ text: 'Presencia web activa', evidence: [] }],
    weaknesses: [{ text: 'Sin H1', evidence: [] }, { text: 'Instagram inactivo', evidence: [] }],
    opportunities: [{ text: 'Reservas online', evidence: [] }],
    threats: [{ text: 'Competencia apps', evidence: [] }],
  },
  recommendations: [{
    category: 'tecnología',
    description: 'Implementar sistema de reservas online.',
    impact: 'alto', effort: 'bajo', confidence: 'confirmed', evidence: [],
  }],
  required_data: ['google_my_business_reviews'],
  confirmed_data: ['website', 'instagram'],
  inferred_insights: ['[INFERIDO] Alta rivalidad local'],
  insights_for_agent3: ['AUTOMATIZACIÓN: Sistema de reservas con WhatsApp'],
  markdown_report: '',
  sources_used: ['https://www.peluqueriaudos.com'],
  confidence_level: 'medium',
  human_review_status: 'draft',
  generated_at: '2026-05-12T10:00:00.000Z',
}

describe('toMarkdown', () => {
  it('contains the case_id or summary text', () => {
    const md = toMarkdown(ANALYSIS)
    expect(md).toContain('U-Dos')
  })

  it('includes SWOT section', () => {
    const md = toMarkdown(ANALYSIS)
    expect(md.toLowerCase()).toContain('swot')
  })

  it('includes recommendations section', () => {
    const md = toMarkdown(ANALYSIS)
    expect(md.toLowerCase()).toContain('recomendaci')
  })

  it('includes datos pendientes section when required_data is non-empty', () => {
    const md = toMarkdown(ANALYSIS)
    expect(md.toLowerCase()).toContain('pendiente')
  })

  it('includes PESTLE section', () => {
    const md = toMarkdown(ANALYSIS)
    expect(md.toLowerCase()).toContain('pestle')
  })

  it('includes human_review_status in footer', () => {
    const md = toMarkdown(ANALYSIS)
    expect(md).toContain('draft')
  })

  it('lists process gaps', () => {
    const md = toMarkdown(ANALYSIS)
    expect(md).toContain('reservas')
  })

  it('includes sources_used', () => {
    const md = toMarkdown(ANALYSIS)
    expect(md).toContain('peluqueriaudos.com')
  })

  it('shows inferred dynamics from competitor analysis', () => {
    const md = toMarkdown(ANALYSIS)
    expect(md.toLowerCase()).toContain('inferid')
  })

  it('includes insights_for_agent3 section', () => {
    const md = toMarkdown(ANALYSIS)
    expect(md.toLowerCase()).toContain('arquitecto') // "Para el Arquitecto de Solución"
  })

  it('omits datos pendientes section when required_data is empty', () => {
    const noRequired = { ...ANALYSIS, required_data: [] }
    const md = toMarkdown(noRequired)
    // Should not have a "Datos Pendientes" heading
    expect(md).not.toMatch(/## Datos Pendientes/)
  })
})
