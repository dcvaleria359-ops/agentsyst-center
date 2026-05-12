import type { CollectorOutput, NormalizedInput } from './types'

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

function inferSector(title: string | null, bio: string | null): string {
  const text = `${title ?? ''} ${bio ?? ''}`.toLowerCase()
  if (/peluquer|barber|estilista|capilar/.test(text)) return 'peluquería'
  if (/restaurant|cocina|gastronomí|comer|chef/.test(text)) return 'restauración'
  if (/clínica|médic|salud|estética|belleza/.test(text)) return 'salud y estética'
  if (/inmobiliar|piso|alquiler|venta de/.test(text)) return 'inmobiliaria'
  return 'negocio local'
}

function inferLocation(address: string | null, title: string | null): string {
  if (address) {
    // Try to extract postal code + city: "28001 Madrid" or "Madrid" after a comma
    const postalCityMatch = address.match(/\b(\d{5})\s+([A-ZÀ-Ú][a-záàäâãéèëêíìïîóòöôõúùüûñç]+(?:\s+[A-ZÀ-Ú][a-záàäâãéèëêíìïîóòöôõúùüûñç]+)*)\b/)
    if (postalCityMatch) return `${postalCityMatch[1]} ${postalCityMatch[2]}`
    // Try last capitalized word/phrase after a comma
    const commaCity = address.match(/,\s*([A-ZÀ-Ú][a-záàäâãéèëêíìïîóòöôõúùüûñç]+(?:\s+[A-ZÀ-Ú][a-záàäâãéèëêíìïîóòöôõúùüûñç]+)*)/)
    if (commaCity) return commaCity[1].trim()
  }
  if (title) {
    const match = title.match(/en\s+([A-ZÀ-Ú][a-záàäâãéèëêíìïîóòöôõúùüûñç]+(?:[,\s]+[A-ZÀ-Ú][a-záàäâãéèëêíìïîóòöôõúùüûñç]+)?)/i)
    if (match) return match[1].trim()
  }
  return 'ubicación desconocida'
}

function mostRecentPostDate(
  posts: Array<{ timestamp: string | null }> | undefined
): Date | null {
  if (!posts || posts.length === 0) return null
  const timestamps = posts
    .map(p => (p.timestamp ? new Date(p.timestamp).getTime() : 0))
    .filter(t => t > 0)
  if (timestamps.length === 0) return null
  return new Date(Math.max(...timestamps))
}

export function normalize(raw: CollectorOutput, now = new Date()): NormalizedInput {
  const required: string[] = []
  const confirmed: string[] = []

  // Website
  let website: NormalizedInput['website'] = null
  if (raw.website_info && raw.website_info.status === 'ok') {
    website = {
      title: raw.website_info.title,
      has_h1: raw.website_info.h1 !== null && raw.website_info.h1 !== '',
      heading_count: raw.website_info.h2_h3.length,
      cta_links: raw.website_info.cta_links,
      tech_stack: raw.website_info.tech_stack,
      contacts: raw.website_info.contacts,
    }
    confirmed.push('website')
  } else {
    required.push('website')
  }

  // Instagram
  let instagram: NormalizedInput['instagram'] = null
  const ig = raw.social_profiles.instagram
  if (ig && ig.status === 'ok') {
    const lastPostDate = mostRecentPostDate(ig.recent_posts_sample)
    instagram = {
      followers: ig.followers ?? 0,
      posts_count: ig.posts_count ?? 0,
      posts_per_week: ig.posts_per_week ?? 0,
      avg_likes: ig.avg_likes ?? 0,
      avg_comments: ig.avg_comments ?? 0,
      engagement_ratio: ig.engagement_ratio ?? 0,
      days_since_last_post: lastPostDate ? daysBetween(lastPostDate, now) : null,
      bio: ig.bio,
    }
    confirmed.push('instagram')
  } else if (!ig) {
    required.push('instagram')
  }

  // GMB / reviews
  let gmb: NormalizedInput['gmb'] = null
  if (raw.reviews.status === 'ok') {
    gmb = {
      avg_rating: raw.reviews.avg_rating,
      review_count: raw.reviews.review_count,
    }
    confirmed.push('google_my_business')
  } else {
    required.push('google_my_business_reviews')
  }

  // Stack
  const stack: NormalizedInput['stack'] = {
    cms: raw.stack_details.cms,
    booking_tools: raw.stack_details.booking_tools,
    marketing_tools: raw.stack_details.marketing_tools,
  }
  if (raw.stack_details.status === 'ok') confirmed.push('tech_stack')

  // Sector & location inference
  const titleText = raw.website_info?.title ?? null
  const bioText = ig?.bio ?? null
  const addressText = raw.website_info?.contacts?.address ?? null

  const sector = inferSector(titleText, bioText)
  const location = inferLocation(addressText, titleText)

  return {
    case_id: raw.case_id,
    website_url: raw.website_info?.url ?? null,
    website,
    instagram,
    gmb,
    stack,
    sector,
    location,
    required_data: required,
    confirmed_data: confirmed,
    sources: raw.sources,
  }
}
