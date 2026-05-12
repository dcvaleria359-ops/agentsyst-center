import { describe, it, expect } from 'vitest'
import { analyzeWebsite } from '../../internal/website'
import type { NormalizedInput } from '../../types'

const BASE_INPUT: NormalizedInput = {
  case_id: 'test-001',
  website_url: 'https://example.com',
  website: {
    title: 'Test Peluquería en Madrid',
    has_h1: false,
    heading_count: 2,
    cta_links: [],
    tech_stack: ['WordPress', 'Google Tag Manager'],
    contacts: { phone: '911111111', email: 'test@example.com', address: 'Calle Test 1' },
  },
  instagram: null,
  gmb: null,
  stack: { cms: 'WordPress', booking_tools: [], marketing_tools: ['Google Tag Manager'] },
  sector: 'peluquería',
  location: 'Madrid',
  required_data: [],
  confirmed_data: ['website'],
  sources: ['https://example.com'],
}

describe('analyzeWebsite', () => {
  it('detects missing H1', () => {
    const result = analyzeWebsite(BASE_INPUT)
    expect(result.has_h1).toBe(false)
    expect(result.alerts).toContain('Sin H1 — impacta en SEO básico')
  })

  it('reports 0 CTAs and alerts', () => {
    const result = analyzeWebsite(BASE_INPUT)
    expect(result.cta_count).toBe(0)
    expect(result.alerts).toContain('Sin CTAs detectados en la web')
  })

  it('detects no booking tool', () => {
    const result = analyzeWebsite(BASE_INPUT)
    expect(result.has_booking_tool).toBe(false)
    expect(result.alerts).toContain('Sin sistema de reservas online')
  })

  it('detects Google Tag Manager as analytics', () => {
    const result = analyzeWebsite(BASE_INPUT)
    expect(result.has_analytics).toBe(true)
  })

  it('completeness_score below 60 when multiple missing elements', () => {
    const result = analyzeWebsite(BASE_INPUT)
    expect(result.completeness_score).toBeLessThan(60)
  })

  it('evidence references correct fields', () => {
    const result = analyzeWebsite(BASE_INPUT)
    const fields = result.evidence.map(e => e.field)
    expect(fields).toContain('website.has_h1')
    expect(fields).toContain('website.cta_links')
  })

  it('returns full analysis when website is null', () => {
    const input = { ...BASE_INPUT, website: null }
    const result = analyzeWebsite(input)
    expect(result.alerts).toContain('Web no disponible o no analizada')
    expect(result.completeness_score).toBe(0)
  })

  it('detects CTA from cta_links', () => {
    const input = {
      ...BASE_INPUT,
      website: { ...BASE_INPUT.website!, cta_links: ['https://wa.me/34911111111'] },
    }
    const result = analyzeWebsite(input)
    expect(result.cta_count).toBe(1)
  })

  it('has_h1 true when h1 is present', () => {
    const input = {
      ...BASE_INPUT,
      website: { ...BASE_INPUT.website!, has_h1: true },
    }
    const result = analyzeWebsite(input)
    expect(result.has_h1).toBe(true)
    expect(result.alerts).not.toContain('Sin H1 — impacta en SEO básico')
  })

  it('completeness_score is 100 when all signals present', () => {
    const input: NormalizedInput = {
      ...BASE_INPUT,
      website: {
        ...BASE_INPUT.website!,
        has_h1: true,
        cta_links: ['https://wa.me/123'],
        tech_stack: ['WordPress', 'Google Analytics', 'Meta Pixel'],
      },
      stack: {
        cms: 'WordPress',
        booking_tools: ['booksy'],
        marketing_tools: ['Google Analytics'],
      },
    }
    const result = analyzeWebsite(input)
    expect(result.completeness_score).toBe(100)
  })
})
