import type { BusinessAnalysis, SwotMatrix, Recommendation, ProcessGap, PestleAnalysis, CompetitorAnalysis } from '../types'

function swotSections(swot: SwotMatrix): string {
  const top4 = <T>(arr: T[]) => arr.slice(0, 4)
  const list = (items: Array<{ text: string }>) =>
    items.length > 0 ? top4(items).map(i => `- ${i.text}`).join('\n') : '_Sin datos._'

  return [
    `### Fortalezas\n${list(swot.strengths)}`,
    `### Debilidades\n${list(swot.weaknesses)}`,
    `### Oportunidades _(análisis de contexto — requieren validación)_\n${list(swot.opportunities)}`,
    `### Amenazas _(análisis de contexto — requieren validación)_\n${list(swot.threats)}`,
  ].join('\n\n')
}

function recsSection(recs: Recommendation[]): string {
  if (recs.length === 0) return '_Sin recomendaciones generadas._\n'
  return recs.map((r, i) => {
    const badge = r.impact === 'alto' ? '🔴' : r.impact === 'medio' ? '🟡' : '🟢'
    return `${i + 1}. ${badge} **[${r.category.toUpperCase()}]** ${r.description}  \n   _Impacto: ${r.impact} · Esfuerzo: ${r.effort} · Confianza: ${r.confidence}_`
  }).join('\n\n')
}

function gapsSection(gaps: ProcessGap[]): string {
  if (gaps.length === 0) return '_Sin brechas críticas detectadas._\n'
  return gaps.map(g => `- **${g.area}** (impacto ${g.impact}): ${g.gap}`).join('\n')
}

function pestleSection(pestle: PestleAnalysis): string {
  if (pestle.factors.length === 0) return '_Análisis PESTLE no disponible._\n'
  return pestle.factors.map(f => {
    const opps = f.opportunities.map(o => `  - ${o}`).join('\n')
    const risks = f.risks.map(r => `  - ${r}`).join('\n')
    return `### ${f.factor.charAt(0).toUpperCase() + f.factor.slice(1)}\n${f.analysis}\n\n**Oportunidades:**\n${opps}\n\n**Riesgos:**\n${risks}`
  }).join('\n\n')
}

function competitorSection(comp: CompetitorAnalysis): string {
  const pf = comp.porters_five_forces
  const lines = pf ? [
    `- **Rivalidad:** ${pf.rivalry}`,
    `- **Poder del cliente:** ${pf.bargaining_power_customers}`,
    `- **Poder del proveedor:** ${pf.bargaining_power_suppliers}`,
    `- **Nuevos entrantes:** ${pf.threat_new_entrants}`,
    `- **Sustitutos:** ${pf.threat_substitutes}`,
  ] : ['_Análisis competitivo no disponible (datos insuficientes)._']
  const confirmed = comp.confirmed.length > 0
    ? '\n\n**Competidores confirmados:**\n' + comp.confirmed.map(c => {
        const rating = c.rating != null ? ` · ${c.rating}★` : ''
        const reviews = c.review_count != null ? ` (${c.review_count} reseñas)` : ''
        return `- ${c.name}${rating}${reviews}${c.notes ? ` — ${c.notes}` : ''}`
      }).join('\n')
    : ''
  const inferred = comp.inferred.length > 0
    ? '\n\n**Dinámicas inferidas (hipótesis):**\n' + comp.inferred.map(d => `- _${d}_`).join('\n')
    : ''
  const missing = comp.missing.length > 0
    ? '\n\n**Datos pendientes para completar:**\n' + comp.missing.map(m => `- ${m}`).join('\n')
    : ''
  return lines.join('\n') + confirmed + inferred + missing
}

export function toMarkdown(analysis: BusinessAnalysis): string {
  const date = new Date(analysis.generated_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })

  const requiredSection = analysis.required_data.length > 0
    ? `## Datos Pendientes\n\nPara completar el análisis se necesita:\n${analysis.required_data.map(d => `- ${d}`).join('\n')}\n\n---\n\n`
    : ''

  const sourcesLine = analysis.sources_used.length > 0
    ? `\n\n**Fuentes:** ${analysis.sources_used.join(' · ')}`
    : ''

  return `# Diagnóstico Digital: ${analysis.case_id}

## Resumen Ejecutivo

${analysis.summary}

---

## Análisis SWOT

${swotSections(analysis.swot)}

---

## Análisis Digital

### Sitio Web

- Completitud: **${analysis.website_analysis.completeness_score}/100**
- H1: ${analysis.website_analysis.has_h1 ? 'Presente' : 'Ausente'}
- CTAs detectados: ${analysis.website_analysis.cta_count}
- Sistema de reservas: ${analysis.website_analysis.has_booking_tool ? 'Sí' : 'No'}
- Analytics: ${analysis.website_analysis.has_analytics ? 'Sí' : 'No'}
- Stack: ${analysis.website_analysis.tech_stack.join(', ') || 'no detectado'}

${analysis.website_analysis.alerts.map(a => `- ${a}`).join('\n')}

### Redes Sociales

Estado general: **${analysis.social_analysis.overall_status}**

${analysis.social_analysis.channels.map(ch => {
    if (ch.status === 'absent') return `- **${ch.platform}**: no detectado`
    return `- **${ch.platform}**: ${ch.followers ?? 0} seguidores, ${ch.posts_per_week ?? 0} posts/semana${ch.days_since_last_post ? `, último post hace ${ch.days_since_last_post} días` : ''}`
  }).join('\n')}

---

## Brechas Operativas

${gapsSection(analysis.process_gaps)}

---

## Análisis PESTLE

${pestleSection(analysis.pestle_analysis)}

---

## Análisis Competitivo

${competitorSection(analysis.competitor_analysis)}

---

## Recomendaciones

${recsSection(analysis.recommendations)}

---

${requiredSection}## Para el Arquitecto de Solución

${analysis.insights_for_agent3.map(i => `- ${i}`).join('\n')}

---

_Generado: ${date} · Confianza: **${analysis.confidence_level}** · Estado: **${analysis.human_review_status}**_${sourcesLine}
`
}
