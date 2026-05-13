import { describe, it, expect } from 'vitest'
import { toHandoff } from '../../reports/agent3-handoff'
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
    channels: [
      {
        platform: 'instagram', status: 'dormant', followers: 94, posts_count: 4,
        posts_per_week: 0, engagement_ratio: 0.1489, days_since_last_post: 361,
        bio_has_cta: false, bio_has_contact: false,
        alerts: ['Instagram dormido ~12 meses'], evidence: [],
      },
      {
        platform: 'facebook', status: 'absent', followers: null, posts_count: null,
        posts_per_week: null, engagement_ratio: null, days_since_last_post: null,
        bio_has_cta: null, bio_has_contact: null,
        alerts: ['Canal facebook no detectado'], evidence: [],
      },
    ],
    most_active_channel: null, most_neglected_channel: 'facebook',
    overall_status: 'weak', evidence: [],
  },
  pestle_analysis: {
    factors: [{ factor: 'tecnológico', analysis: 'Digitalización acelerada.', opportunities: ['Reservas online'], risks: ['Competencia apps'] }],
    sector: 'peluquería', location: 'Mutxamel', generated_by: 'llm',
  },
  competitor_analysis: {
    confirmed: [], inferred: ['Alta rivalidad local'], missing: ['google_my_business'],
    porters_five_forces: { rivalry: 'Alta', bargaining_power_customers: 'Alto', bargaining_power_suppliers: 'Bajo', threat_new_entrants: 'Moderada', threat_substitutes: 'Moderada' },
    generated_by: 'llm_inference',
  },
  process_gaps: [
    { area: 'reservas', gap: 'Sin reservas online', impact: 'alto', evidence: [] },
    { area: 'captación', gap: 'Sin CTAs', impact: 'alto', evidence: [] },
  ],
  swot: {
    strengths: [{ text: 'Presencia web activa', evidence: [] }],
    weaknesses: [{ text: 'Sin H1', evidence: [] }],
    opportunities: [{ text: 'Reservas online', evidence: [] }],
    threats: [{ text: 'Competencia apps', evidence: [] }],
  },
  recommendations: [
    { category: 'tecnología', description: 'Implementar sistema de reservas online.', impact: 'alto', effort: 'bajo', confidence: 'confirmed', evidence: [] },
    { category: 'reputación', description: 'Activar Google My Business.', impact: 'alto', effort: 'bajo', confidence: 'inferred', evidence: [] },
  ],
  required_data: ['google_my_business'],
  confirmed_data: ['website', 'instagram', 'tech_stack'],
  inferred_insights: ['[INFERIDO] Alta rivalidad local'],
  insights_for_agent3: ['AUTOMATIZACIÓN: Sistema de reservas con WhatsApp'],
  markdown_report: '',
  sources_used: ['https://www.peluqueriaudos.com', 'https://www.instagram.com/peluqueriaudos'],
  confidence_level: 'high',
  human_review_status: 'draft',
  generated_at: '2026-05-13T10:00:00.000Z',
}

describe('toHandoff', () => {
  it('includes case_id in title', () => {
    const md = toHandoff(ANALYSIS)
    expect(md).toContain('peluqueria-udos')
  })

  it('has all 9 numbered sections', () => {
    const md = toHandoff(ANALYSIS)
    for (let i = 1; i <= 9; i++) {
      expect(md).toContain(`## ${i}.`)
    }
  })

  it('separates confirmed from inferred recommendations', () => {
    const md = toHandoff(ANALYSIS)
    expect(md).toContain('✅ Recomendaciones confirmadas')
    expect(md).toContain('⚠️ Recomendaciones inferidas')
    expect(md).toContain('Implementar sistema de reservas online')
    expect(md).toContain('Activar Google My Business')
  })

  it('confirmed rec does not appear in inferred section and vice versa', () => {
    const md = toHandoff(ANALYSIS)
    const confirmedIdx = md.indexOf('✅ Recomendaciones confirmadas')
    const inferredIdx = md.indexOf('⚠️ Recomendaciones inferidas')
    const reservasIdx = md.indexOf('Implementar sistema de reservas online')
    const gmbIdx = md.indexOf('Activar Google My Business')
    expect(reservasIdx).toBeGreaterThan(confirmedIdx)
    expect(reservasIdx).toBeLessThan(inferredIdx)
    expect(gmbIdx).toBeGreaterThan(inferredIdx)
  })

  it('includes required_data in missing section', () => {
    const md = toHandoff(ANALYSIS)
    expect(md).toContain('google_my_business')
    expect(md).toContain('## 8.')
  })

  it('includes NOTA HUMANA placeholders', () => {
    const md = toHandoff(ANALYSIS)
    const count = (md.match(/📝 NOTA HUMANA/g) ?? []).length
    expect(count).toBeGreaterThanOrEqual(3)
  })

  it('includes Agent 3 JSON input block with human_additions', () => {
    const md = toHandoff(ANALYSIS)
    expect(md).toContain('human_additions')
    expect(md).toContain('"owner_name"')
    expect(md).toContain('"human_review_status"')
  })

  it('JSON block contains valid JSON', () => {
    const md = toHandoff(ANALYSIS)
    const match = md.match(/```json\n([\s\S]*?)\n```/)
    expect(match).not.toBeNull()
    expect(() => JSON.parse(match![1])).not.toThrow()
  })

  it('marks PESTLE section as hypothetical when generated_by is llm', () => {
    const md = toHandoff(ANALYSIS)
    expect(md).toContain('⚠️ Hipótesis')
    expect(md).toContain('generado íntegramente por IA')
  })

  it('includes process gaps with impact', () => {
    const md = toHandoff(ANALYSIS)
    expect(md).toContain('reservas')
    expect(md).toContain('captación')
  })

  it('includes inferred_insights from competitor', () => {
    const md = toHandoff(ANALYSIS)
    expect(md).toContain('Alta rivalidad local')
  })

  it('includes automation targets from insights_for_agent3', () => {
    const md = toHandoff(ANALYSIS)
    expect(md).toContain('Sistema de reservas con WhatsApp')
  })

  it('shows dormant social channel with days_inactive', () => {
    const md = toHandoff(ANALYSIS)
    expect(md).toContain('361')
    expect(md).toContain('dormant')
  })

  it('shows absent social channel', () => {
    const md = toHandoff(ANALYSIS)
    expect(md).toContain('facebook')
    expect(md).toContain('no detectado')
  })

  it('does not include analysis.markdown_report content', () => {
    const analysisWithReport = { ...ANALYSIS, markdown_report: 'BLOQUE_EXCLUSIVO_MARKDOWN' }
    const md = toHandoff(analysisWithReport)
    expect(md).not.toContain('BLOQUE_EXCLUSIVO_MARKDOWN')
  })
})
