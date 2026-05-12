import { describe, it, expect } from 'vitest'
import { analyzeValueChain } from '../../internal/value_chain'
import type { NormalizedInput } from '../../types'

const BASE_INPUT: NormalizedInput = {
  case_id: 'test-001',
  website_url: 'https://example.com',
  website: {
    title: 'Test Peluquería',
    has_h1: false,
    heading_count: 2,
    cta_links: [],
    tech_stack: ['WordPress', 'Google Tag Manager'],
    contacts: { phone: '911111111', email: 'test@example.com', address: 'Calle Test 1' },
  },
  instagram: {
    followers: 94,
    posts_count: 4,
    posts_per_week: 0,
    avg_likes: 14,
    avg_comments: 1,
    engagement_ratio: 0.1489,
    days_since_last_post: 361,
    bio: '💇 Peluquería unisex',
  },
  gmb: null,
  stack: { cms: 'WordPress', booking_tools: [], marketing_tools: ['Google Tag Manager'] },
  sector: 'peluquería',
  location: 'Madrid',
  required_data: ['google_my_business'],
  confirmed_data: ['website', 'instagram'],
  sources: [],
}

describe('analyzeValueChain', () => {
  it('detects no booking system', () => {
    const result = analyzeValueChain(BASE_INPUT)
    expect(result.has_booking).toBe(false)
  })

  it('creates process gap for reservas when no booking', () => {
    const result = analyzeValueChain(BASE_INPUT)
    const gap = result.process_gaps.find(g => g.area === 'reservas')
    expect(gap).toBeDefined()
    expect(gap?.impact).toBe('alto')
  })

  it('detects no review management when gmb is null', () => {
    const result = analyzeValueChain(BASE_INPUT)
    expect(result.has_review_management).toBe(false)
  })

  it('creates process gap for retención when no review management', () => {
    const result = analyzeValueChain(BASE_INPUT)
    const gap = result.process_gaps.find(g => g.area === 'retención')
    expect(gap).toBeDefined()
  })

  it('detects no lead capture when cta_links is empty', () => {
    const result = analyzeValueChain(BASE_INPUT)
    expect(result.has_lead_capture).toBe(false)
  })

  it('each process gap has at least one evidence item', () => {
    const result = analyzeValueChain(BASE_INPUT)
    result.process_gaps.forEach(gap => {
      expect(gap.evidence.length).toBeGreaterThan(0)
    })
  })

  it('detects visibility tools when GTM present', () => {
    const result = analyzeValueChain(BASE_INPUT)
    expect(result.has_visibility_tools).toBe(true)
  })

  it('detects lead capture when cta_links is non-empty', () => {
    const input = {
      ...BASE_INPUT,
      website: { ...BASE_INPUT.website!, cta_links: ['https://wa.me/34911111111'] },
    }
    const result = analyzeValueChain(input)
    expect(result.has_lead_capture).toBe(true)
    expect(result.process_gaps.find(g => g.area === 'captación')).toBeUndefined()
  })

  it('detects booking when booking_tools is non-empty', () => {
    const input = {
      ...BASE_INPUT,
      stack: { ...BASE_INPUT.stack, booking_tools: ['booksy'] },
    }
    const result = analyzeValueChain(input)
    expect(result.has_booking).toBe(true)
    expect(result.process_gaps.find(g => g.area === 'reservas')).toBeUndefined()
  })

  it('detects review management when gmb has data', () => {
    const input = {
      ...BASE_INPUT,
      gmb: { avg_rating: 4.8, review_count: 22 },
    }
    const result = analyzeValueChain(input)
    expect(result.has_review_management).toBe(true)
    expect(result.process_gaps.find(g => g.area === 'retención')).toBeUndefined()
  })

  it('detects no CRM when no CRM tools present', () => {
    const result = analyzeValueChain(BASE_INPUT)
    expect(result.has_crm).toBe(false)
    const gap = result.process_gaps.find(g => g.area === 'operaciones')
    expect(gap).toBeDefined()
    expect(gap?.impact).toBe('medio')
  })

  it('detects CRM when hubspot is in marketing tools', () => {
    const input = {
      ...BASE_INPUT,
      stack: { ...BASE_INPUT.stack, marketing_tools: ['HubSpot', 'Google Tag Manager'] },
    }
    const result = analyzeValueChain(input)
    expect(result.has_crm).toBe(true)
    expect(result.process_gaps.find(g => g.area === 'operaciones')).toBeUndefined()
  })

  it('detects no visibility tools when none present', () => {
    const input = {
      ...BASE_INPUT,
      website: { ...BASE_INPUT.website!, tech_stack: ['WordPress'] },
      stack: { ...BASE_INPUT.stack, marketing_tools: [] },
    }
    const result = analyzeValueChain(input)
    expect(result.has_visibility_tools).toBe(false)
    expect(result.process_gaps.find(g => g.area === 'visibilidad')).toBeDefined()
  })
})
