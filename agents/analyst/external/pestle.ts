import type { NormalizedInput, PestleAnalysis, PestleFactor } from '../types'
import type { LLMClient } from '../llm'
import { parseJSONResponse } from '../llm'

function buildPestlePrompt(input: NormalizedInput): string {
  const stackInfo = [
    input.stack.cms ? `CMS: ${input.stack.cms}` : null,
    input.stack.booking_tools.length ? `Reservas: ${input.stack.booking_tools.join(', ')}` : 'Sin sistema de reservas',
    input.stack.marketing_tools.length ? `Marketing: ${input.stack.marketing_tools.join(', ')}` : null,
  ].filter(Boolean).join(' | ')

  return `Genera un análisis PESTLE completo y específico para un negocio de ${input.sector} ubicado en ${input.location}.

Datos del negocio disponibles:
- Web: ${input.website_url ?? 'no disponible'}
- Stack tecnológico: ${stackInfo}
- Estado digital: ${input.confirmed_data.join(', ') || 'datos limitados'}

Instrucciones:
- Cada factor debe ser específico para este sector y esta zona geográfica, no genérico
- Incluye al menos 2 oportunidades y 2 riesgos por factor
- Las oportunidades y riesgos deben ser accionables para una pyme
- El análisis debe cubrir el mercado local (${input.location}), hábitos digitales del cliente objetivo del sector ${input.sector}, competencia visible en la zona, riesgos comerciales reales, oportunidades prácticas de digitalización, y factores tecnológicos, legales y sociales relevantes para este tipo de negocio

Responde ÚNICAMENTE con este JSON (sin markdown, sin explicación):
{
  "factors": [
    {
      "factor": "político" | "económico" | "social" | "tecnológico" | "legal" | "ambiental",
      "analysis": "2-3 frases de análisis específico",
      "opportunities": ["oportunidad concreta 1", "oportunidad concreta 2"],
      "risks": ["riesgo concreto 1", "riesgo concreto 2"]
    }
  ]
}`
}

export async function analyzePestle(input: NormalizedInput, llm: LLMClient): Promise<PestleAnalysis> {
  const prompt = buildPestlePrompt(input)
  const response = await llm.generate(prompt)
  const parsed = parseJSONResponse<{ factors: PestleFactor[] }>(response)

  return {
    factors: parsed.factors,
    sector: input.sector,
    location: input.location,
    generated_by: 'llm',
  }
}
