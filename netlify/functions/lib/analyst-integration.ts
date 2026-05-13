import type { CollectorOutput } from '../../../agents/analyst/types'

// ── Extraction prompt: Perplexity text → CollectorOutput JSON ─────────────────

export function buildExtractionSystemPrompt(): string {
  return `Eres un extractor de datos estructurados para análisis de negocio digital.

Conviertes informes de investigación en formato JSON estructurado.

REGLAS CRÍTICAS:
1. Extrae SOLO datos mencionados explícitamente. Nunca inventes valores.
2. Usa null para campos desconocidos o no mencionados.
3. status: "ok" si tienes datos válidos · "not_found" si no existe/no detectado · "not_accessible" si existía pero no pudo accederse.
4. h1: null si el informe dice "sin H1", "no tiene H1" o similar. Texto del H1 si está presente.
5. days_last_post: si el texto menciona "hace X días", "X days" o similar, extrae X como entero.
6. Calcula el timestamp del último post: fecha_actual - days_last_post días, en formato ISO 8601. Ponlo en recent_posts_sample[0].timestamp.
7. engagement_ratio: decimal entre 0 y 1 (0.149 no 14.9%).
8. tech_stack en website_info: CMS (WordPress, Wix, Shopify, PrestaShop...), page builders (Elementor, Divi, Gutenberg...).
9. marketing_tools en stack_details: analítica y tracking (Google Analytics, GTM, Meta Pixel, TikTok Pixel...).
10. booking_tools en stack_details: plataformas de citas (Booksy, Fresha, Calendly, SimplyBook, Acuity...).
11. Output: JSON puro sin markdown, sin explicaciones, sin campos adicionales.`
}

export function buildExtractionUserMessage(rawData: string, caseId: string, today: string): string {
  return `Fecha actual: ${today}
case_id: ${caseId}

INFORME A PROCESAR:
${rawData}

Extrae en este JSON exacto (rellena con los datos del informe, null para lo desconocido):

{
  "website_info": {
    "url": null,
    "status": "not_found",
    "title": null,
    "description": null,
    "text_content": null,
    "h1": null,
    "h2_h3": [],
    "contacts": { "phone": null, "email": null, "address": null },
    "cta_links": [],
    "tech_stack": [],
    "error_reason": null
  },
  "reviews": {
    "status": "not_found",
    "avg_rating": null,
    "review_count": null,
    "reviews_sample": [],
    "error_reason": null
  },
  "social_profiles": {
    "instagram": null,
    "facebook": null,
    "tiktok": null
  },
  "stack_details": {
    "status": "not_found",
    "cms": null,
    "frameworks": [],
    "marketing_tools": [],
    "booking_tools": [],
    "error_reason": null
  },
  "sources": []
}

Si Instagram existe y tiene datos, expande social_profiles.instagram con este objeto:
{
  "url": null,
  "status": "ok",
  "username": null,
  "followers": null,
  "posts_count": null,
  "posts_per_week": null,
  "avg_likes": null,
  "avg_comments": null,
  "engagement_ratio": null,
  "bio": null,
  "bio_link": null,
  "recent_posts_sample": [],
  "error_reason": null,
  "days_last_post": null
}`
}

// ── Parse extraction response → CollectorOutput ───────────────────────────────

interface RawExtractedInstagram {
  url?: string | null
  status?: string
  username?: string | null
  followers?: number | null
  posts_count?: number | null
  posts_per_week?: number | null
  avg_likes?: number | null
  avg_comments?: number | null
  engagement_ratio?: number | null
  bio?: string | null
  bio_link?: string | null
  recent_posts_sample?: Array<{ type: string | null; likes: number | null; comments: number | null; timestamp: string | null }>
  error_reason?: string | null
  days_last_post?: number | null
}

interface RawExtracted {
  website_info?: {
    url?: string | null
    status?: string
    title?: string | null
    description?: string | null
    text_content?: string | null
    h1?: string | null
    h2_h3?: string[]
    contacts?: { phone?: string | null; email?: string | null; address?: string | null }
    cta_links?: string[]
    tech_stack?: string[]
    error_reason?: string | null
  } | null
  reviews?: {
    status?: string
    avg_rating?: number | null
    review_count?: number | null
    reviews_sample?: Array<{ author: string | null; rating: number | null; text: string | null }>
    error_reason?: string | null
  }
  social_profiles?: {
    instagram?: RawExtractedInstagram | null
    facebook?: unknown
    tiktok?: unknown
  }
  stack_details?: {
    status?: string
    cms?: string | null
    frameworks?: string[]
    marketing_tools?: string[]
    booking_tools?: string[]
    error_reason?: string | null
  }
  sources?: string[]
}

function asModuleStatus(s: string | undefined): CollectorOutput['reviews']['status'] {
  if (s === 'ok' || s === 'not_found' || s === 'not_accessible' || s === 'pending_connector' || s === 'error') return s
  return 'not_found'
}

export function parseCollectorOutput(
  responseText: string,
  caseId: string,
): CollectorOutput {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON object found in extraction response')

  let extracted: RawExtracted
  try {
    extracted = JSON.parse(jsonMatch[0]) as RawExtracted
  } catch {
    throw new Error(`Extraction response is not valid JSON: ${responseText.slice(0, 200)}`)
  }

  const w = extracted.website_info
  const r = extracted.reviews
  const sp = extracted.social_profiles
  const sd = extracted.stack_details
  const ig = sp?.instagram

  // Resolve days_last_post → recent_posts_sample timestamp
  let igPosts: Array<{ type: string | null; likes: number | null; comments: number | null; timestamp: string | null }> = ig?.recent_posts_sample ?? []
  if (ig?.days_last_post && igPosts.length === 0) {
    const lastPostMs = Date.now() - ig.days_last_post * 24 * 60 * 60 * 1000
    igPosts = [{ type: null, likes: null, comments: null, timestamp: new Date(lastPostMs).toISOString() }]
  }

  return {
    case_id: caseId,
    website_info: w && w.status !== 'not_found' ? {
      url: w.url ?? '',
      status: asModuleStatus(w.status),
      title: w.title ?? null,
      description: w.description ?? null,
      text_content: w.text_content ?? null,
      h1: w.h1 ?? null,
      h2_h3: w.h2_h3 ?? [],
      contacts: {
        phone: w.contacts?.phone ?? null,
        email: w.contacts?.email ?? null,
        address: w.contacts?.address ?? null,
      },
      cta_links: w.cta_links ?? [],
      tech_stack: w.tech_stack ?? [],
      error_reason: w.error_reason ?? null,
    } : null,
    reviews: {
      status: asModuleStatus(r?.status),
      avg_rating: r?.avg_rating ?? null,
      review_count: r?.review_count ?? null,
      reviews_sample: r?.reviews_sample ?? [],
      error_reason: r?.error_reason ?? null,
    },
    social_profiles: {
      instagram: ig && ig.status !== 'not_found' ? {
        url: ig.url ?? '',
        status: asModuleStatus(ig.status),
        username: ig.username ?? null,
        followers: ig.followers ?? null,
        posts_count: ig.posts_count ?? null,
        posts_per_week: ig.posts_per_week ?? null,
        avg_likes: ig.avg_likes ?? null,
        avg_comments: ig.avg_comments ?? null,
        engagement_ratio: ig.engagement_ratio ?? null,
        bio: ig.bio ?? null,
        bio_link: ig.bio_link ?? null,
        recent_posts_sample: igPosts,
        error_reason: ig.error_reason ?? null,
      } : null,
      facebook: null,
      tiktok: null,
    },
    stack_details: {
      status: asModuleStatus(sd?.status),
      cms: sd?.cms ?? null,
      frameworks: sd?.frameworks ?? [],
      marketing_tools: sd?.marketing_tools ?? [],
      booking_tools: sd?.booking_tools ?? [],
      error_reason: sd?.error_reason ?? null,
    },
    sources: extracted.sources ?? [],
    errors: [],
    generated_at: new Date().toISOString(),
  }
}
