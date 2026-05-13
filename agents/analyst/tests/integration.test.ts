import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { runAnalysis } from '../service'
import type { CollectorOutput } from '../types'
import type { LLMClient } from '../llm'

const MOCK_PESTLE = JSON.stringify({
  factors: [
    { factor: 'político', analysis: 'Normativa estable.', opportunities: ['Digitalización'], risks: ['Regulación datos'] },
    { factor: 'económico', analysis: 'Sector resistente.', opportunities: ['Turismo Costa Blanca'], risks: ['Inflación'] },
    { factor: 'social', analysis: 'Tendencia selfcare.', opportunities: ['Demanda creciente'], risks: ['Cambios hábitos'] },
    { factor: 'tecnológico', analysis: 'Digitalización acelerada.', opportunities: ['Reservas online'], risks: ['Apps competencia'] },
    { factor: 'legal', analysis: 'RGPD aplica.', opportunities: ['Diferenciación privacidad'], risks: ['Multas RGPD'] },
    { factor: 'ambiental', analysis: 'Tendencia eco.', opportunities: ['Posicionamiento sostenible'], risks: ['Coste productos eco'] },
  ],
})

const MOCK_COMPETITOR = JSON.stringify({
  porters_five_forces: {
    rivalry: 'Alta en municipios medianos.',
    bargaining_power_customers: 'Alto.',
    bargaining_power_suppliers: 'Bajo.',
    threat_new_entrants: 'Moderada.',
    threat_substitutes: 'Moderada.',
  },
  inferred_dynamics: ['Alta densidad de peluquerías en zonas residenciales de la Costa Blanca.'],
})

const MOCK_SUMMARY = 'U-Dos Peluquería tiene presencia web básica con WordPress pero carece de elementos clave: sin H1, sin CTAs y sin sistema de reservas. Instagram está prácticamente inactivo. Las oportunidades de mejora son claras y de bajo esfuerzo.'

function createSmartMock(): LLMClient {
  return {
    async generate(prompt: string): Promise<string> {
      if (prompt.includes('PESTLE') || prompt.includes('pestle') || prompt.includes('político')) return MOCK_PESTLE
      if (prompt.includes('Porter') || prompt.includes('competiti')) return MOCK_COMPETITOR
      return MOCK_SUMMARY
    },
  }
}

const rawPath = path.resolve(__dirname, '../test-cases/peluqueria-udos.json')
const raw: CollectorOutput = JSON.parse(fs.readFileSync(rawPath, 'utf-8'))

describe('runAnalysis integration (peluqueria-udos)', () => {
  it('completes without throwing', async () => {
    await expect(runAnalysis(raw, createSmartMock())).resolves.toBeDefined()
  })

  it('returns correct case_id', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    expect(result.case_id).toBe('peluqueria-udos')
  })

  it('human_review_status is draft', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    expect(result.human_review_status).toBe('draft')
  })

  it('detects no booking tool', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    expect(result.website_analysis.has_booking_tool).toBe(false)
  })

  it('detects instagram as dormant', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    const ig = result.social_analysis.channels.find(c => c.platform === 'instagram')
    expect(ig?.status).toBe('dormant')
  })

  it('has google_my_business in required_data', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    expect(result.required_data).toContain('google_my_business')
  })

  it('produces non-empty recommendations', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('each recommendation has evidence', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    for (const rec of result.recommendations) {
      expect(rec.evidence.length).toBeGreaterThan(0)
    }
  })

  it('markdown_report is non-empty', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    expect(result.markdown_report.length).toBeGreaterThan(200)
  })

  it('pestle_analysis has 6 factors', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    expect(result.pestle_analysis.factors).toHaveLength(6)
  })

  it('confidence_level is high (website + instagram + tech_stack = 3 confirmed)', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    expect(result.confidence_level).toBe('high')
  })

  it('confirmed_data includes website and instagram', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    expect(result.confirmed_data).toContain('website')
    expect(result.confirmed_data).toContain('instagram')
  })

  it('swot has weaknesses and opportunities', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    expect(result.swot.weaknesses.length).toBeGreaterThan(0)
    expect(result.swot.opportunities.length).toBeGreaterThan(0)
  })

  it('insights_for_agent3 non-empty', async () => {
    const result = await runAnalysis(raw, createSmartMock())
    expect(result.insights_for_agent3.length).toBeGreaterThan(0)
  })
})
