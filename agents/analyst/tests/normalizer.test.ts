import { describe, it, expect } from 'vitest'
import { normalize } from '../normalizer'
import type { CollectorOutput } from '../types'

const BASE: CollectorOutput = {
  case_id: 'test-001',
  website_info: {
    url: 'https://example.com',
    status: 'ok',
    title: 'Test Peluquería en Madrid',
    description: 'Desc',
    text_content: 'Content',
    h1: null,
    h2_h3: ['Servicios', 'Sobre nosotros'],
    contacts: { phone: '911111111', email: 'test@example.com', address: 'Calle Test 1, Madrid' },
    cta_links: [],
    tech_stack: ['WordPress', 'Google Tag Manager'],
    error_reason: null,
  },
  reviews: {
    status: 'pending_connector',
    avg_rating: null,
    review_count: null,
    reviews_sample: [],
    error_reason: 'No API key',
  },
  social_profiles: {
    instagram: {
      url: 'https://instagram.com/test',
      status: 'ok',
      username: 'test',
      followers: 94,
      posts_count: 4,
      posts_per_week: 0,
      avg_likes: 14,
      avg_comments: 1,
      engagement_ratio: 0.1489,
      bio: '💇 Peluquería unisex',
      bio_link: 'http://example.com',
      recent_posts_sample: [
        { type: 'Image', likes: 14, comments: 1, timestamp: '2025-05-16T11:27:57.000Z' },
      ],
      error_reason: null,
    },
    facebook: null,
    tiktok: null,
  },
  stack_details: {
    status: 'ok',
    cms: 'WordPress',
    frameworks: ['Elementor'],
    marketing_tools: ['Google Tag Manager'],
    booking_tools: [],
    error_reason: null,
  },
  sources: ['https://example.com'],
  errors: [],
  generated_at: '2026-05-12T10:00:00.000Z',
}

const FIXED_NOW = new Date('2026-05-12T10:00:00.000Z')

describe('normalize', () => {
  it('maps case_id', () => {
    const result = normalize(BASE, FIXED_NOW)
    expect(result.case_id).toBe('test-001')
  })

  it('maps website fields correctly', () => {
    const result = normalize(BASE, FIXED_NOW)
    expect(result.website?.has_h1).toBe(false)
    expect(result.website?.heading_count).toBe(2)
    expect(result.website?.cta_links).toEqual([])
    expect(result.website?.tech_stack).toEqual(['WordPress', 'Google Tag Manager'])
  })

  it('maps instagram fields correctly', () => {
    const result = normalize(BASE, FIXED_NOW)
    expect(result.instagram?.followers).toBe(94)
    expect(result.instagram?.posts_per_week).toBe(0)
    expect(result.instagram?.engagement_ratio).toBe(0.1489)
  })

  it('calculates days_since_last_post from most recent sample', () => {
    const result = normalize(BASE, FIXED_NOW)
    // 2025-05-16 to 2026-05-12 = ~361 days
    expect(result.instagram?.days_since_last_post).toBeGreaterThan(350)
    expect(result.instagram?.days_since_last_post).toBeLessThan(380)
  })

  it('adds reviews to required_data when status is pending_connector', () => {
    const result = normalize(BASE, FIXED_NOW)
    expect(result.required_data).toContain('google_my_business_reviews')
  })

  it('adds instagram to confirmed_data when status is ok', () => {
    const result = normalize(BASE, FIXED_NOW)
    expect(result.confirmed_data).toContain('instagram')
  })

  it('sets gmb to null when reviews status is not ok', () => {
    const result = normalize(BASE, FIXED_NOW)
    expect(result.gmb).toBeNull()
  })

  it('infers location from website contacts address', () => {
    const result = normalize(BASE, FIXED_NOW)
    expect(result.location).toContain('Madrid')
  })

  it('infers sector from website title', () => {
    const result = normalize(BASE, FIXED_NOW)
    expect(result.sector.toLowerCase()).toContain('peluquer')
  })

  it('handles null website_info gracefully', () => {
    const input = { ...BASE, website_info: null }
    const result = normalize(input, FIXED_NOW)
    expect(result.website).toBeNull()
    expect(result.required_data).toContain('website')
  })
})
