import type { NormalizedInput, ValueChainAnalysis, ProcessGap, Evidence } from '../types'
import { BOOKING_KEYWORDS, CRM_KEYWORDS, VISIBILITY_KEYWORDS } from '../config'

function hasBookingTool(input: NormalizedInput): boolean {
  if (input.stack.booking_tools.length > 0) return true
  const allTools = [
    ...input.stack.marketing_tools,
    ...(input.website?.tech_stack ?? []),
  ].map(s => s.toLowerCase())
  return BOOKING_KEYWORDS.some(k => allTools.some(t => t.includes(k)))
}

function hasCRM(input: NormalizedInput): boolean {
  const tools = input.stack.marketing_tools.map(s => s.toLowerCase())
  return CRM_KEYWORDS.some(k => tools.some(t => t.includes(k)))
}

function hasLeadCapture(input: NormalizedInput): boolean {
  return (input.website?.cta_links.length ?? 0) > 0
}

function hasReviewManagement(input: NormalizedInput): boolean {
  return input.gmb !== null
}

function hasVisibilityTools(input: NormalizedInput): boolean {
  const all = [
    ...input.stack.marketing_tools,
    ...(input.website?.tech_stack ?? []),
  ].map(t => t.toLowerCase())
  return VISIBILITY_KEYWORDS.some(k => all.some(t => t.includes(k)))
}

export function analyzeValueChain(input: NormalizedInput): ValueChainAnalysis {
  const booking = hasBookingTool(input)
  const crm = hasCRM(input)
  const leadCapture = hasLeadCapture(input)
  const reviewMgmt = hasReviewManagement(input)
  const visibility = hasVisibilityTools(input)

  const gaps: ProcessGap[] = []

  if (!booking) {
    const evidence: Evidence[] = [
      {
        field: 'stack_details.booking_tools',
        value: input.stack.booking_tools.length,
        note: 'Sin herramienta de reservas detectada',
      },
      {
        field: 'website.cta_links',
        value: input.website?.cta_links.length ?? 0,
        note: 'Sin link de reserva detectado en CTAs',
      },
    ]
    gaps.push({
      area: 'reservas',
      gap: 'No hay sistema de reservas online. Los clientes no pueden reservar cita fuera del horario de atención.',
      impact: 'alto',
      evidence,
    })
  }

  if (!leadCapture) {
    const evidence: Evidence[] = [
      {
        field: 'website.cta_links',
        value: input.website?.cta_links.length ?? 0,
        note: 'Sin CTAs ni formularios de captación visibles',
      },
    ]
    gaps.push({
      area: 'captación',
      gap: 'Sin CTAs ni formularios de captación visibles en la web.',
      impact: 'alto',
      evidence,
    })
  }

  if (!reviewMgmt) {
    const evidence: Evidence[] = [
      {
        field: 'reviews.status',
        value: 'pending_connector',
        note: 'Reseñas de GMB no disponibles o no gestionadas activamente',
      },
    ]
    gaps.push({
      area: 'retención',
      gap: 'Sin gestión visible de reseñas en Google My Business.',
      impact: 'medio',
      evidence,
    })
  }

  if (!crm) {
    const evidence: Evidence[] = [
      {
        field: 'stack_details.marketing_tools',
        value: input.stack.marketing_tools.join(', ') || 'ninguna',
        note: 'Sin CRM detectado en herramientas de marketing o tech stack',
      },
    ]
    gaps.push({
      area: 'operaciones',
      gap: 'Sin CRM ni herramienta de seguimiento de clientes detectada.',
      impact: 'medio',
      evidence,
    })
  }

  if (!visibility) {
    gaps.push({
      area: 'visibilidad',
      gap: 'Sin herramientas de medición de tráfico o publicidad digital.',
      impact: 'medio',
      evidence: [
        {
          field: 'stack_details.marketing_tools',
          value: input.stack.marketing_tools.join(', ') || 'ninguna',
          note: 'Sin analytics, GTM ni pixel detectados',
        },
      ],
    })
  }

  return {
    has_booking: booking,
    has_crm: crm,
    has_lead_capture: leadCapture,
    has_review_management: reviewMgmt,
    has_visibility_tools: visibility,
    process_gaps: gaps,
  }
}
