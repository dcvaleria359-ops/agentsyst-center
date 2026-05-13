import type { BusinessAnalysis, Recommendation, ProcessGap, SocialChannelAnalysis } from '../types'

function yesNo(value: boolean): string {
  return value ? 'Sí' : 'No'
}

function impactBadge(impact: string): string {
  return impact === 'alto' ? '🔴' : impact === 'medio' ? '🟡' : '🟢'
}

function confirmedRecommendations(recs: Recommendation[]): Recommendation[] {
  return recs.filter(r => r.confidence === 'confirmed')
}

function inferredRecommendations(recs: Recommendation[]): Recommendation[] {
  return recs.filter(r => r.confidence !== 'confirmed')
}

function formatSocialRow(ch: SocialChannelAnalysis): string {
  if (ch.status === 'absent') return `- **${ch.platform}**: no detectado`
  const days = ch.days_since_last_post != null ? `, último post hace ${ch.days_since_last_post} días` : ''
  const eng = ch.engagement_ratio != null ? `, engagement ${(ch.engagement_ratio * 100).toFixed(1)}%` : ''
  return `- **${ch.platform}**: ${ch.status} · ${ch.followers ?? 0} seguidores${eng}${days}`
}

function identitySection(analysis: BusinessAnalysis): string {
  const date = new Date(analysis.generated_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  return `## 1. Identidad del caso

| Campo | Valor |
|---|---|
| \`case_id\` | \`${analysis.case_id}\` |
| Sector | ${analysis.pestle_analysis.sector} |
| Ubicación | ${analysis.pestle_analysis.location} |
| Fuentes verificadas | ${analysis.sources_used.join(' · ') || '—'} |
| Confianza del análisis | **${analysis.confidence_level}** (${analysis.confirmed_data.length} fuentes confirmadas: ${analysis.confirmed_data.join(', ')}) |
| Estado | ${analysis.human_review_status} — pendiente revisión humana |
| Generado | ${date} |

> 📝 NOTA HUMANA — Datos del propietario (completar antes de Agente 3):
>
> - Nombre del propietario/a: _______________
> - Teléfono de contacto: _______________
> - Email: _______________
> - ¿Tiene WhatsApp Business activo? Sí / No / No sé
> - Número de empleados: _______________
> - Horario de atención: _______________`
}

function confirmedDataSection(analysis: BusinessAnalysis): string {
  const w = analysis.website_analysis
  const s = analysis.social_analysis

  const websiteBlock = `### Sitio web

- URL: ${analysis.sources_used.find(u => !u.includes('instagram')) ?? '—'}
- Stack: ${w.tech_stack.join(', ') || 'no detectado'}
- Analytics instalado: **${yesNo(w.has_analytics)}**
- H1 presente: **${yesNo(w.has_h1)}**${w.has_h1 ? '' : ' — impacta en SEO básico'}
- CTAs detectados: **${w.cta_count}**
- Sistema de reservas online: **${yesNo(w.has_booking_tool)}**
- Pixel de retargeting (Meta/TikTok): **${yesNo(w.has_marketing_pixel)}**
- Puntuación de completitud: **${w.completeness_score}/100**`

  const socialBlock = `### Redes sociales

Estado general: **${s.overall_status}**

${s.channels.map(formatSocialRow).join('\n')}`

  const gmbBlock = `> 📝 NOTA HUMANA — Google My Business (verificar presencialmente):
>
> - ¿Tiene GMB activo? Sí / No / No sé
> - Nota media de Google: _______________
> - Número de reseñas aproximado: _______________
> - ¿Responde a reseñas? Sí / No
> - ¿Usa algún sistema de citas ahora? _______________`

  return `## 2. ✅ Datos confirmados del negocio

${websiteBlock}

${socialBlock}

${gmbBlock}`
}

function problemsSection(analysis: BusinessAnalysis): string {
  const rows = analysis.website_analysis.alerts.map(a =>
    `| ${a} | website_analysis.alerts | Web |`
  )

  analysis.social_analysis.channels
    .filter(ch => ch.status !== 'active')
    .forEach(ch => {
      const problem = ch.status === 'absent'
        ? `Canal ${ch.platform} no detectado`
        : ch.alerts[0] ?? `${ch.platform} inactivo`
      rows.push(`| ${problem} | ${ch.platform}.status = ${ch.status} | Social |`)
    })

  if (rows.length === 0) return ''

  return `## 3. ✅ Problemas detectados (evidencia directa)

| Problema | Evidencia | Área |
|---|---|---|
${rows.join('\n')}`
}

function gapsSection(gaps: ProcessGap[]): string {
  if (gaps.length === 0) return ''
  const rows = gaps.map(g =>
    `| **${g.area}** | ${g.gap} | ${impactBadge(g.impact)} ${g.impact} |`
  )
  return `## 4. ✅ Brechas operativas (confirmadas)

| Área | Brecha | Impacto |
|---|---|---|
${rows.join('\n')}`
}

function confirmedRecsSection(recs: Recommendation[]): string {
  const confirmed = confirmedRecommendations(recs)
  if (confirmed.length === 0) return ''

  const rows = confirmed.map((r, i) =>
    `| ${i + 1} | ${r.category} | ${r.description} | ${impactBadge(r.impact)} ${r.impact} | ${r.effort} |`
  )

  return `## 5. ✅ Recomendaciones confirmadas (ordenadas por prioridad)

| # | Categoría | Acción | Impacto | Esfuerzo |
|---|---|---|---|---|
${rows.join('\n')}

> 📝 NOTA HUMANA — Contexto comercial para priorizar:
>
> - ¿El cliente ya usa alguna de estas herramientas? _______________
> - ¿Tiene presupuesto mensual estimado para herramientas? _______________
> - ¿Qué acción le interesa más a priori? _______________
> - ¿Quiere gestionar él mismo el contenido de Instagram o prefiere servicio gestionado? _______________`
}

function inferredRecsSection(recs: Recommendation[]): string {
  const inferred = inferredRecommendations(recs)
  if (inferred.length === 0) return ''

  const rows = inferred.map(r =>
    `| ${r.category} | ${r.description} | ${r.confidence} |`
  )

  return `## 6. ⚠️ Recomendaciones inferidas (tratar con cautela)

| Categoría | Acción | Base |
|---|---|---|
${rows.join('\n')}

> 📝 NOTA HUMANA — Confirmar antes de incluir en propuesta:
>
> - ¿Se ha verificado esta información directamente con el cliente? Sí / No`
}

function hypothesesSection(analysis: BusinessAnalysis): string {
  const comp = analysis.competitor_analysis
  const pf = comp.porters_five_forces

  const porterBlock = pf ? [
    `- **Rivalidad:** ${pf.rivalry}`,
    `- **Poder del cliente:** ${pf.bargaining_power_customers}`,
    `- **Poder del proveedor:** ${pf.bargaining_power_suppliers}`,
    `- **Nuevos entrantes:** ${pf.threat_new_entrants}`,
    `- **Sustitutos:** ${pf.threat_substitutes}`,
  ].join('\n') : '_No disponible._'

  const inferredBlock = comp.inferred.length > 0
    ? comp.inferred.map(d => `- ${d}`).join('\n')
    : '_Sin dinámicas inferidas._'

  const pestleWarning = analysis.pestle_analysis.generated_by === 'llm'
    ? `\n> ⚠️ El análisis PESTLE fue generado íntegramente por IA sin acceso a fuentes externas verificadas. Los números específicos que aparecen en el informe son **estimaciones del modelo**, no estadísticas verificadas. No usarlos en propuesta comercial como hechos.`
    : ''

  const inferred3 = analysis.inferred_insights.length > 0
    ? '\n\n### Insights inferidos\n\n' + analysis.inferred_insights.map(i => `- ${i}`).join('\n')
    : ''

  return `## 7. ⚠️ Hipótesis e inferencias del mercado
${pestleWarning}

### Contexto competitivo _(${comp.generated_by})_

${porterBlock}

### Dinámicas inferidas (hipótesis de trabajo)

${inferredBlock}${inferred3}`
}

function missingDataSection(requiredData: string[]): string {
  const required = requiredData.map(d => `- [ ] **${d}**: pendiente de verificación`).join('\n')

  return `## 8. Datos faltantes antes de generar propuesta comercial

### Datos técnicos pendientes

${required.length > 0 ? required : '- [ ] Sin datos técnicos pendientes registrados'}
- [ ] **¿Tiene WhatsApp Business activo?**: afecta automatizaciones de WhatsApp
- [ ] **Tráfico web mensual**: necesario para calcular ROI de mejoras web

### Datos comerciales pendientes

- [ ] **Presupuesto disponible del cliente**: define herramientas a proponer
- [ ] **Número de empleados**: cambia el alcance del sistema de reservas y CRM
- [ ] **Servicios que ofrece**: catálogo real → qué automatizar y a qué precio
- [ ] **Volumen de clientes actual**: citas por semana → ROI de reservas online
- [ ] **Horario de atención**: imprescindible para cualquier sistema de reservas

### Datos para personalizar la propuesta

- [ ] **Nombre del propietario/a**
- [ ] **Email y teléfono de contacto directo**
- [ ] **¿Ha trabajado antes con agencias o consultores digitales?**
- [ ] **¿Qué le preocupa más ahora mismo del negocio?** (en sus palabras)`
}

function agent3InputBlock(analysis: BusinessAnalysis): string {
  const confirmedRecs = confirmedRecommendations(analysis.recommendations).map(r => ({
    category: r.category,
    action: r.description,
    impact: r.impact,
    effort: r.effort,
  }))

  const inferredRecs = inferredRecommendations(analysis.recommendations).map(r => ({
    category: r.category,
    action: r.description,
    impact: r.impact,
    confidence: r.confidence,
  }))

  const socialChannels = analysis.social_analysis.channels.map(ch => ({
    platform: ch.platform,
    status: ch.status,
    followers: ch.followers,
    days_inactive: ch.days_since_last_post,
    ...(ch.engagement_ratio != null ? { engagement_ratio: ch.engagement_ratio } : {}),
  }))

  const gaps = analysis.process_gaps.map(g => ({ area: g.area, impact: g.impact }))

  const input = {
    case_id: analysis.case_id,
    sector: analysis.pestle_analysis.sector,
    location: analysis.pestle_analysis.location,
    confidence_level: analysis.confidence_level,
    human_review_status: 'draft',
    digital_state: {
      website_completeness: analysis.website_analysis.completeness_score,
      tech_stack: analysis.website_analysis.tech_stack,
      has_booking_tool: analysis.website_analysis.has_booking_tool,
      has_analytics: analysis.website_analysis.has_analytics,
      has_marketing_pixel: analysis.website_analysis.has_marketing_pixel,
    },
    social_channels: socialChannels,
    process_gaps: gaps,
    confirmed_recommendations: confirmedRecs,
    inferred_recommendations: inferredRecs,
    automation_targets: analysis.insights_for_agent3,
    required_data: analysis.required_data,
    human_additions: {
      owner_name: '',
      contact_email: '',
      contact_phone: '',
      has_whatsapp_business: null,
      employee_count: null,
      services_offered: [] as string[],
      weekly_client_volume: null,
      opening_hours: '',
      monthly_budget: null,
      gmb_rating: null,
      gmb_review_count: null,
      client_priority: '',
    },
  }

  return `## 9. Input estructurado para el Agente 3

Actualiza los campos de \`human_additions\` antes de ejecutar el Agente 3.
Cambia \`human_review_status\` a \`"reviewed"\` cuando esté listo.

\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\``
}

export function toHandoff(analysis: BusinessAnalysis): string {
  const date = new Date(analysis.generated_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })

  const sections = [
    identitySection(analysis),
    confirmedDataSection(analysis),
    problemsSection(analysis),
    gapsSection(analysis.process_gaps),
    confirmedRecsSection(analysis.recommendations),
    inferredRecsSection(analysis.recommendations),
    hypothesesSection(analysis),
    missingDataSection(analysis.required_data),
    agent3InputBlock(analysis),
  ].filter(Boolean)

  return `# Handoff Agente 2 → Agente 3
## Caso: ${analysis.case_id}

> **Para el revisor humano:** Este documento es editable antes de ejecutar el Agente 3.
> Busca las secciones marcadas con \`📝 NOTA HUMANA\` y completa los campos en blanco.
> Las secciones marcadas con \`⚠️ HIPÓTESIS\` contienen inferencias del LLM — no son hechos verificados.
> No modificar las secciones marcadas con \`✅ CONFIRMADO\` salvo que tengas evidencia contraria.

---

${sections.join('\n\n---\n\n')}

---

_Generado automáticamente por Agente 2 (analyst) · ${date}_
_Basado en: ${analysis.case_id}-analysis.json_
`
}
