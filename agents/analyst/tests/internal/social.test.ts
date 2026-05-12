import { describe, it, expect } from 'vitest'
import { analyzeSocial } from '../../internal/social'
import type { NormalizedInput } from '../../types'

const BASE_INPUT: NormalizedInput = {
  case_id: 'test-001',
  website_url: null,
  website: null,
  instagram: {
    followers: 94,
    posts_count: 4,
    posts_per_week: 0,
    avg_likes: 14,
    avg_comments: 1,
    engagement_ratio: 0.1489,
    days_since_last_post: 361,
    bio: '💇 Peluquería unisex. Estética, uñas.',
  },
  gmb: null,
  stack: { cms: null, booking_tools: [], marketing_tools: [] },
  sector: 'peluquería',
  location: 'Mutxamel',
  required_data: [],
  confirmed_data: ['instagram'],
  sources: [],
}

describe('analyzeSocial', () => {
  it('marks instagram as dormant when days_since_last_post > 180', () => {
    const result = analyzeSocial(BASE_INPUT)
    const ig = result.channels.find(c => c.platform === 'instagram')
    expect(ig?.status).toBe('dormant')
  })

  it('generates dormant alert for instagram', () => {
    const result = analyzeSocial(BASE_INPUT)
    const ig = result.channels.find(c => c.platform === 'instagram')
    expect(ig?.alerts.some(a => a.includes('dormid') || a.includes('meses'))).toBe(true)
  })

  it('maps followers and engagement_ratio', () => {
    const result = analyzeSocial(BASE_INPUT)
    const ig = result.channels.find(c => c.platform === 'instagram')
    expect(ig?.followers).toBe(94)
    expect(ig?.engagement_ratio).toBe(0.1489)
  })

  it('marks facebook and tiktok as absent', () => {
    const result = analyzeSocial(BASE_INPUT)
    const fb = result.channels.find(c => c.platform === 'facebook')
    const tt = result.channels.find(c => c.platform === 'tiktok')
    expect(fb?.status).toBe('absent')
    expect(tt?.status).toBe('absent')
  })

  it('sets overall_status to weak when only dormant channels', () => {
    const result = analyzeSocial(BASE_INPUT)
    expect(result.overall_status).toBe('weak')
  })

  it('detects bio_has_cta as false when bio has no CTA keyword', () => {
    const result = analyzeSocial(BASE_INPUT)
    const ig = result.channels.find(c => c.platform === 'instagram')
    expect(ig?.bio_has_cta).toBe(false)
  })

  it('evidence includes days_since_last_post field', () => {
    const result = analyzeSocial(BASE_INPUT)
    const ig = result.channels.find(c => c.platform === 'instagram')
    expect(ig?.evidence.some(e => e.field === 'instagram.days_since_last_post')).toBe(true)
  })

  it('sets overall_status to absent when no instagram', () => {
    const input = { ...BASE_INPUT, instagram: null }
    const result = analyzeSocial(input)
    expect(result.overall_status).toBe('absent')
  })

  it('detects bio_has_cta as true when bio contains CTA keyword', () => {
    const input = {
      ...BASE_INPUT,
      instagram: { ...BASE_INPUT.instagram!, bio: 'Reserva tu cita aquí' },
    }
    const result = analyzeSocial(input)
    const ig = result.channels.find(c => c.platform === 'instagram')
    expect(ig?.bio_has_cta).toBe(true)
  })

  it('marks instagram as active when recent and frequent posts', () => {
    const input = {
      ...BASE_INPUT,
      instagram: {
        ...BASE_INPUT.instagram!,
        posts_per_week: 3,
        days_since_last_post: 2,
      },
    }
    const result = analyzeSocial(input)
    const ig = result.channels.find(c => c.platform === 'instagram')
    expect(ig?.status).toBe('active')
    expect(result.overall_status).toBe('active')
  })
})
