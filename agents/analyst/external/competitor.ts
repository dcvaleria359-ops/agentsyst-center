import type { NormalizedInput, CompetitorAnalysis, PortersFiveForces } from '../types'
import type { LLMClient } from '../llm'
import { parseJSONResponse } from '../llm'

interface LLMCompetitorResponse {
  porters_five_forces: PortersFiveForces
  inferred_dynamics: string[]
}

function buildCompetitorPrompt(input: NormalizedInput, hasConfirmedData: boolean): string {
  const confirmedSection = hasConfirmedData
    ? 'Datos confirmados de competidores: disponibles (procesados por el sistema).'
    : 'Datos confirmados de competidores: no disponibles (Google Places API no configurada).'

  return `Analiza el contexto competitivo para un negocio de ${input.sector} en ${input.location}.

${confirmedSection}

Instrucciones:
- Genera un análisis Porter's Five Forces específico para el sector ${input.sector} en una zona como ${input.location}
- No inventes nombres concretos de competidores si no se proporcionan datos verificados
- Sí puedes analizar dinámicas competitivas típicas del sector y la zona basándote en patrones conocidos
- Las dinámicas inferidas deben estar claramente marcadas como hipótesis razonables, no hechos

Responde ÚNICAMENTE con este JSON (sin markdown, sin explicación):
{
  "porters_five_forces": {
    "rivalry": "análisis de rivalidad competitiva en la zona",
    "bargaining_power_customers": "poder de negociación de clientes",
    "bargaining_power_suppliers": "poder de negociación de proveedores",
    "threat_new_entrants": "amenaza de nuevos entrantes",
    "threat_substitutes": "amenaza de sustitutos"
  },
  "inferred_dynamics": [
    "hipótesis razonable 1 sobre el contexto competitivo",
    "hipótesis razonable 2"
  ]
}`
}

export async function analyzeCompetitors(input: NormalizedInput, llm: LLMClient): Promise<CompetitorAnalysis> {
  const confirmed: CompetitorAnalysis['confirmed'] = []
  // Future: populate confirmed from input.gmb competitor data if/when collector provides it

  const hasConfirmedData = confirmed.length > 0
  const prompt = buildCompetitorPrompt(input, hasConfirmedData)
  const response = await llm.generate(prompt)
  const parsed = parseJSONResponse<LLMCompetitorResponse>(response)

  const missing = [...input.required_data]

  return {
    confirmed,
    inferred: parsed.inferred_dynamics,
    missing,
    porters_five_forces: parsed.porters_five_forces,
    generated_by: hasConfirmedData ? 'mixed' : 'llm_inference',
  }
}
