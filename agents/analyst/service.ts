import type { CollectorOutput, BusinessAnalysis, PestleAnalysis, CompetitorAnalysis, NormalizedInput } from './types'
import type { LLMClient } from './llm'
import { normalize } from './normalizer'
import { analyzeWebsite } from './internal/website'
import { analyzeSocial } from './internal/social'
import { analyzeValueChain } from './internal/value_chain'
import { analyzePestle } from './external/pestle'
import { analyzeCompetitors } from './external/competitor'
import { synthesize } from './synthesizer'
import { toJSON } from './reports/json'
import { toMarkdown } from './reports/markdown'

function emptyPestle(sector: string, location: string): PestleAnalysis {
  return { factors: [], sector, location, generated_by: 'llm' }
}

function emptyCompetitor(required_data: string[]): CompetitorAnalysis {
  return {
    confirmed: [], inferred: [], missing: required_data,
    porters_five_forces: { rivalry: '', bargaining_power_customers: '', bargaining_power_suppliers: '', threat_new_entrants: '', threat_substitutes: '' },
    generated_by: 'llm_inference',
  }
}

function computeConfidence(normalized: NormalizedInput): BusinessAnalysis['confidence_level'] {
  const score = normalized.confirmed_data.length
  if (score >= 3) return 'high'
  if (score >= 1) return 'medium'
  return 'low'
}

export async function runAnalysis(
  raw: CollectorOutput,
  llm: LLMClient,
  overrides?: { sector?: string; location?: string },
): Promise<BusinessAnalysis> {
  const normalized = normalize(raw)
  if (overrides?.sector) normalized.sector = overrides.sector
  if (overrides?.location) normalized.location = overrides.location

  const website = analyzeWebsite(normalized)
  const social = analyzeSocial(normalized)
  const valueChain = analyzeValueChain(normalized)

  let pestle: PestleAnalysis
  try {
    pestle = await analyzePestle(normalized, llm)
  } catch (e) {
    console.error('[analyst] PESTLE falló, usando fallback vacío:', (e as Error).message)
    pestle = emptyPestle(normalized.sector, normalized.location)
  }

  let competitor: CompetitorAnalysis
  try {
    competitor = await analyzeCompetitors(normalized, llm)
  } catch (e) {
    console.error('[analyst] Competitor falló, usando fallback vacío:', (e as Error).message)
    competitor = emptyCompetitor(normalized.required_data)
  }

  const synthesis = await synthesize(website, social, valueChain, pestle, competitor, llm)

  const analysis: BusinessAnalysis = {
    case_id: normalized.case_id,
    summary: synthesis.summary,
    website_analysis: website,
    social_analysis: social,
    pestle_analysis: pestle,
    competitor_analysis: competitor,
    process_gaps: valueChain.process_gaps,
    swot: synthesis.swot,
    recommendations: synthesis.recommendations,
    required_data: normalized.required_data,
    confirmed_data: normalized.confirmed_data,
    inferred_insights: synthesis.inferred_insights,
    insights_for_agent3: synthesis.insights_for_agent3,
    markdown_report: '',
    sources_used: normalized.sources,
    confidence_level: computeConfidence(normalized),
    human_review_status: 'draft',
    generated_at: new Date().toISOString(),
  }

  analysis.markdown_report = toMarkdown(analysis)

  return analysis
}

export { toJSON }
