import type {
  WebsiteAnalysis, SocialAnalysis, ValueChainAnalysis, PestleAnalysis,
  CompetitorAnalysis, SwotMatrix, SwotItem, Recommendation, Evidence,
} from './types'
import type { LLMClient } from './llm'

interface SynthesisResult {
  swot: SwotMatrix
  recommendations: Recommendation[]
  summary: string
  insights_for_agent3: string[]
  inferred_insights: string[]
}

function ev(field: string, value: string | number | boolean | null, note?: string): Evidence {
  return { field, value, note }
}

function buildStrengths(website: WebsiteAnalysis, social: SocialAnalysis): SwotItem[] {
  const items: SwotItem[] = []

  if (website.has_analytics) {
    items.push({ text: 'Herramientas de analítica web instaladas (GTM/Analytics)', evidence: [ev('stack_details.marketing_tools', true)] })
  }
  if (website.tech_stack.length > 0) {
    items.push({ text: `Presencia web activa con ${website.tech_stack[0]}`, evidence: [ev('website.tech_stack', website.tech_stack.join(', '))] })
  }

  const activeCh = social.channels.filter(c => c.status === 'active')
  if (activeCh.length > 0) {
    items.push({ text: `Canal social activo: ${activeCh.map(c => c.platform).join(', ')}`, evidence: [ev('social_profiles', social.most_active_channel)] })
  }

  const igCh = social.channels.find(c => c.platform === 'instagram')
  if (igCh && (igCh.engagement_ratio ?? 0) > 0.05) {
    items.push({ text: `Engagement en Instagram por encima de la media (${((igCh.engagement_ratio ?? 0) * 100).toFixed(1)}%)`, evidence: [ev('instagram.engagement_ratio', igCh.engagement_ratio)] })
  }

  return items
}

function buildWeaknesses(website: WebsiteAnalysis, social: SocialAnalysis, valueChain: ValueChainAnalysis): SwotItem[] {
  const items: SwotItem[] = []

  website.alerts.forEach(alert => {
    items.push({ text: alert, evidence: [ev('website.alerts', alert)] })
  })

  social.channels.filter(c => c.status === 'dormant').forEach(ch => {
    items.push({
      text: ch.alerts[0] ?? `Canal ${ch.platform} inactivo`,
      evidence: [ev(`${ch.platform}.days_since_last_post`, ch.days_since_last_post)],
    })
  })

  valueChain.process_gaps.forEach(gap => {
    items.push({ text: gap.gap, evidence: gap.evidence })
  })

  return items
}

function buildOpportunities(pestle: PestleAnalysis): SwotItem[] {
  const items: SwotItem[] = []
  for (const factor of pestle.factors) {
    for (const opp of factor.opportunities) {
      items.push({ text: opp, evidence: [ev(`pestle.${factor.factor}`, factor.factor)] })
    }
  }
  return items
}

function buildThreats(pestle: PestleAnalysis, competitor: CompetitorAnalysis): SwotItem[] {
  const items: SwotItem[] = []
  for (const factor of pestle.factors) {
    for (const risk of factor.risks) {
      items.push({ text: risk, evidence: [ev(`pestle.${factor.factor}`, factor.factor)] })
    }
  }
  return items
}

function buildRecommendations(website: WebsiteAnalysis, social: SocialAnalysis, valueChain: ValueChainAnalysis): Recommendation[] {
  const recs: Recommendation[] = []

  if (!valueChain.has_booking) {
    recs.push({
      category: 'tecnología',
      description: 'Implementar sistema de reservas online (Fresha, Booksy o equivalente). Permite captar citas 24h sin atención telefónica.',
      impact: 'alto', effort: 'bajo', confidence: 'confirmed',
      evidence: [ev('stack_details.booking_tools', 0, 'Sin herramienta de reservas detectada')],
    })
  }

  if (social.channels.find(c => c.platform === 'instagram' && c.status === 'dormant')) {
    const ig = social.channels.find(c => c.platform === 'instagram')!
    recs.push({
      category: 'contenido',
      description: 'Reactivar Instagram con plan de publicación mínimo (2 posts/semana). Mostrar trabajos, promociones y testimonio de clientes.',
      impact: 'alto', effort: 'bajo', confidence: 'confirmed',
      evidence: [ev('instagram.days_since_last_post', ig.days_since_last_post, `Sin publicar desde hace ${ig.days_since_last_post} días`)],
    })
  }

  if (!website.has_h1) {
    recs.push({
      category: 'marketing',
      description: 'Añadir H1 con keyword principal (ej. "Peluquería en [ciudad]") para mejorar SEO on-page básico.',
      impact: 'medio', effort: 'bajo', confidence: 'confirmed',
      evidence: [ev('website.has_h1', false)],
    })
  }

  if (website.cta_count === 0) {
    recs.push({
      category: 'marketing',
      description: 'Añadir CTA visible en la web: botón WhatsApp o enlace directo de reserva en portada.',
      impact: 'alto', effort: 'bajo', confidence: 'confirmed',
      evidence: [ev('website.cta_links', 0)],
    })
  }

  if (!valueChain.has_review_management) {
    recs.push({
      category: 'reputación',
      description: 'Activar perfil Google My Business y responder a todas las reseñas. Solicitar reseñas a clientes activos vía WhatsApp.',
      impact: 'alto', effort: 'bajo', confidence: 'inferred',
      evidence: [ev('reviews.status', 'pending_connector', 'Datos de GMB no disponibles — se infiere gap')],
    })
  }

  if (!website.has_marketing_pixel) {
    recs.push({
      category: 'marketing',
      description: 'Instalar Meta Pixel para habilitar campañas de retargeting en Facebook/Instagram Ads.',
      impact: 'medio', effort: 'bajo', confidence: 'confirmed',
      evidence: [ev('website.tech_stack', website.tech_stack.join(', '), 'Sin pixel detectado')],
    })
  }

  return recs
}

function buildInsightsForAgent3(website: WebsiteAnalysis, social: SocialAnalysis, valueChain: ValueChainAnalysis): string[] {
  const insights: string[] = []

  if (!valueChain.has_booking) {
    insights.push('AUTOMATIZACIÓN PRIORITARIA: Sistema de reservas online con recordatorio automático por WhatsApp')
  }
  if (social.overall_status === 'weak' || social.overall_status === 'absent') {
    insights.push('AUTOMATIZACIÓN: Pipeline de contenido para redes sociales — templates + calendario editorial')
  }
  if (!valueChain.has_review_management) {
    insights.push('AUTOMATIZACIÓN: Solicitud automática de reseña Google post-servicio vía WhatsApp')
  }
  if (!website.has_analytics) {
    insights.push('CONFIGURACIÓN: Google Analytics 4 + Meta Pixel antes de cualquier inversión en ads')
  }

  insights.push('PROPUESTA: Diagnóstico digital completo + plan de digitalización en 3 fases (quick wins → medio plazo → transformación)')

  return insights
}

function buildInferredInsights(competitor: CompetitorAnalysis): string[] {
  return competitor.inferred.map(d => `[INFERIDO] ${d}`)
}

function buildSummaryPrompt(
  website: WebsiteAnalysis,
  social: SocialAnalysis,
  recs: Recommendation[],
  swot: SwotMatrix,
): string {
  const topRecs = recs.slice(0, 3).map(r => `- ${r.description}`).join('\n')
  const weaknesses = swot.weaknesses.slice(0, 3).map(w => `- ${w.text}`).join('\n')
  const strengths = swot.strengths.slice(0, 2).map(s => `- ${s.text}`).join('\n') || '- Presencia web activa'

  return `Escribe un resumen ejecutivo de 150-200 palabras en español (tono profesional pero cercano) para el análisis de este negocio.

Datos clave:
- Web: completitud ${website.completeness_score}/100, ${website.cta_count} CTAs
- Redes sociales: estado ${social.overall_status}
- Fortalezas principales:\n${strengths}
- Debilidades principales:\n${weaknesses}
- Top 3 recomendaciones:\n${topRecs}

No uses encabezados ni bullets. Escribe solo el párrafo de resumen. No menciones el nombre del analista ni del sistema. No incluyas el conteo de palabras.`
}

export async function synthesize(
  website: WebsiteAnalysis,
  social: SocialAnalysis,
  valueChain: ValueChainAnalysis,
  pestle: PestleAnalysis,
  competitor: CompetitorAnalysis,
  llm: LLMClient,
): Promise<SynthesisResult> {
  const swot: SwotMatrix = {
    strengths: buildStrengths(website, social),
    weaknesses: buildWeaknesses(website, social, valueChain),
    opportunities: buildOpportunities(pestle),
    threats: buildThreats(pestle, competitor),
  }

  const recommendations = buildRecommendations(website, social, valueChain)
  const insights_for_agent3 = buildInsightsForAgent3(website, social, valueChain)
  const inferred_insights = buildInferredInsights(competitor)

  const summaryPrompt = buildSummaryPrompt(website, social, recommendations, swot)
  const summary = await llm.generate(summaryPrompt)

  return { swot, recommendations, summary, insights_for_agent3, inferred_insights }
}
