import { describe, it, expect } from 'vitest'
import { toJSON } from '../../reports/json'
import type { BusinessAnalysis } from '../../types'

const FULL: BusinessAnalysis = {
  case_id: 'test-001',
  summary: 'Resumen de prueba.',
  website_analysis: {
    has_h1: false,
    heading_count: 2,
    cta_count: 0,
    has_booking_tool: false,
    has_analytics: true,
    has_marketing_pixel: false,
    tech_stack: ['WordPress'],
    completeness_score: 20,
    alerts: ['Sin H1'],
    evidence: [{ field: 'website.has_h1', value: false, note: 'Sin H1 detectado' }],
  },
  social_analysis: {
    channels: [
      {
        platform: 'instagram',
        status: 'dormant',
        followers: 94,
        posts_count: 4,
        posts_per_week: 0,
        engagement_ratio: 0.1489,
        days_since_last_post: 361,
        bio_has_cta: false,
        bio_has_contact: false,
        alerts: ['Instagram dormido'],
        evidence: [],
      },
    ],
    most_active_channel: null,
    most_neglected_channel: 'facebook',
    overall_status: 'weak',
    evidence: [],
  },
  pestle_analysis: {
    factors: [],
    sector: 'peluquería',
    location: 'Madrid',
    generated_by: 'llm',
  },
  competitor_analysis: {
    confirmed: [{ name: 'Competidor A', rating: 4.5, review_count: 120 }],
    inferred: ['Alta rivalidad local'],
    missing: ['google_my_business_reviews'],
    porters_five_forces: {
      rivalry: 'Alta',
      bargaining_power_customers: 'Alto',
      bargaining_power_suppliers: 'Bajo',
      threat_new_entrants: 'Moderada',
      threat_substitutes: 'Moderada',
    },
    generated_by: 'llm_inference',
  },
  process_gaps: [
    {
      area: 'reservas',
      gap: 'Sin reservas online',
      impact: 'alto',
      evidence: [{ field: 'stack_details.booking_tools', value: 0 }],
    },
  ],
  swot: {
    strengths: [{ text: 'Presencia web', evidence: [] }],
    weaknesses: [{ text: 'Sin H1', evidence: [] }],
    opportunities: [{ text: 'Reservas online', evidence: [] }],
    threats: [{ text: 'Competencia apps', evidence: [] }],
  },
  recommendations: [
    {
      category: 'tecnología',
      description: 'Implementar reservas online.',
      impact: 'alto',
      effort: 'bajo',
      confidence: 'confirmed',
      evidence: [{ field: 'stack_details.booking_tools', value: 0 }],
    },
  ],
  required_data: ['google_my_business_reviews'],
  confirmed_data: ['website', 'instagram'],
  inferred_insights: ['[INFERIDO] Alta rivalidad local'],
  insights_for_agent3: ['AUTOMATIZACIÓN: Sistema de reservas'],
  markdown_report: '# Análisis\nContenido.',
  sources_used: ['https://example.com', 'https://instagram.com/test'],
  confidence_level: 'medium',
  human_review_status: 'draft',
  generated_at: '2026-05-12T10:00:00.000Z',
}

describe('toJSON', () => {
  it('returns object with all required top-level fields', () => {
    const result = toJSON(FULL)
    const requiredFields = [
      'case_id',
      'summary',
      'website_analysis',
      'social_analysis',
      'pestle_analysis',
      'competitor_analysis',
      'process_gaps',
      'swot',
      'recommendations',
      'required_data',
      'confirmed_data',
      'inferred_insights',
      'insights_for_agent3',
      'markdown_report',
      'sources_used',
      'confidence_level',
      'human_review_status',
      'generated_at',
    ]
    for (const field of requiredFields) {
      expect(result).toHaveProperty(field)
    }
  })

  it('is serializable to JSON string without error', () => {
    const result = toJSON(FULL)
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('preserves case_id and human_review_status', () => {
    const result = toJSON(FULL)
    expect(result.case_id).toBe('test-001')
    expect(result.human_review_status).toBe('draft')
  })

  it('preserves evidence in website_analysis', () => {
    const result = toJSON(FULL)
    const wa = result.website_analysis as typeof FULL.website_analysis
    expect(wa.evidence).toHaveLength(1)
    expect(wa.evidence[0].field).toBe('website.has_h1')
  })

  it('preserves sources_used array', () => {
    const result = toJSON(FULL)
    const sources = result.sources_used as string[]
    expect(sources).toContain('https://example.com')
    expect(sources).toHaveLength(2)
  })

  it('preserves competitor confirmed, inferred and missing', () => {
    const result = toJSON(FULL)
    const ca = result.competitor_analysis as typeof FULL.competitor_analysis
    expect(ca.confirmed).toHaveLength(1)
    expect(ca.inferred).toContain('Alta rivalidad local')
    expect(ca.missing).toContain('google_my_business_reviews')
  })

  it('omits iteration field when not present', () => {
    const result = toJSON(FULL)
    expect(result).not.toHaveProperty('iteration')
  })

  it('includes iteration when present', () => {
    const withIteration: BusinessAnalysis = {
      ...FULL,
      iteration: {
        version: 2,
        human_notes: 'Revisado por el equipo',
        revised_at: '2026-05-13T09:00:00.000Z',
      },
    }
    const result = toJSON(withIteration)
    expect(result).toHaveProperty('iteration')
    const iter = result.iteration as typeof withIteration.iteration
    expect(iter?.version).toBe(2)
  })
})
