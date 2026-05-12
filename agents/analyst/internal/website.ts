import type { NormalizedInput, WebsiteAnalysis, Evidence } from '../types'
import { ANALYTICS_TOOLS, PIXEL_TOOLS, BOOKING_KEYWORDS } from '../config'

function lc(arr: string[]): string[] {
  return arr.map(s => s.toLowerCase())
}

export function analyzeWebsite(input: NormalizedInput): WebsiteAnalysis {
  const alerts: string[] = []
  const evidence: Evidence[] = []

  if (!input.website) {
    return {
      has_h1: false,
      heading_count: 0,
      cta_count: 0,
      has_booking_tool: false,
      has_analytics: false,
      has_marketing_pixel: false,
      tech_stack: [],
      completeness_score: 0,
      alerts: ['Web no disponible o no analizada'],
      evidence: [{ field: 'website_info', value: null, note: 'website_info ausente en el output del Collector' }],
    }
  }

  const { website, stack } = input
  const techLower = lc(website.tech_stack)
  const stackToolsLower = lc(stack.marketing_tools)
  const allTools = [...techLower, ...stackToolsLower]

  // H1
  evidence.push({ field: 'website.has_h1', value: website.has_h1 })
  if (!website.has_h1) alerts.push('Sin H1 — impacta en SEO básico')

  // CTAs
  const ctaCount = website.cta_links.length
  evidence.push({ field: 'website.cta_links', value: ctaCount, note: `${ctaCount} CTAs detectados` })
  if (ctaCount === 0) alerts.push('Sin CTAs detectados en la web')

  // Booking tool
  const hasBooking =
    stack.booking_tools.length > 0 ||
    BOOKING_KEYWORDS.some(k => allTools.some(t => t.includes(k)))
  evidence.push({ field: 'stack_details.booking_tools', value: hasBooking })
  if (!hasBooking) alerts.push('Sin sistema de reservas online')

  // Analytics
  const hasAnalytics = ANALYTICS_TOOLS.some(a => allTools.some(t => t.includes(a)))
  evidence.push({
    field: 'stack_details.marketing_tools',
    value: hasAnalytics,
    note: hasAnalytics ? 'Analytics/GTM detectado' : 'Sin analytics',
  })

  // Marketing pixel
  const hasPixel = PIXEL_TOOLS.some(p => allTools.some(t => t.includes(p)))
  evidence.push({
    field: 'website.tech_stack',
    value: hasPixel,
    note: hasPixel ? 'Pixel detectado' : 'Sin pixel de retargeting',
  })
  if (!hasPixel) alerts.push('Sin pixel de retargeting (Meta/TikTok)')

  // Completeness score: 5 signals × 20 points each
  let score = 0
  if (website.has_h1) score += 20
  if (ctaCount > 0) score += 20
  if (hasBooking) score += 20
  if (hasAnalytics) score += 20
  if (hasPixel) score += 20

  return {
    has_h1: website.has_h1,
    heading_count: website.heading_count,
    cta_count: ctaCount,
    has_booking_tool: hasBooking,
    has_analytics: hasAnalytics,
    has_marketing_pixel: hasPixel,
    tech_stack: website.tech_stack,
    completeness_score: score,
    alerts,
    evidence,
  }
}
