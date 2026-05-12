// ── Evidence ─────────────────────────────────────────────────────────────────

export interface Evidence {
  field: string
  value: string | number | boolean | null
  note?: string
}

// ── Collector output (mirrors agents/collector/types.ts RawBusinessData) ─────
// Defined here to keep analyst self-contained — do not import from collector.

export type ModuleStatus = 'ok' | 'not_found' | 'not_accessible' | 'pending_connector' | 'error'

export interface CollectorOutput {
  case_id: string
  website_info: {
    url: string
    status: ModuleStatus
    title: string | null
    description: string | null
    text_content: string | null
    h1: string | null
    h2_h3: string[]
    contacts: { phone: string | null; email: string | null; address: string | null }
    cta_links: string[]
    tech_stack: string[]
    error_reason: string | null
  } | null
  reviews: {
    status: ModuleStatus
    avg_rating: number | null
    review_count: number | null
    reviews_sample: Array<{ author: string | null; rating: number | null; text: string | null }>
    error_reason: string | null
  }
  social_profiles: {
    instagram: {
      url: string
      status: ModuleStatus
      username: string | null
      followers: number | null
      posts_count: number | null
      posts_per_week: number | null
      avg_likes: number | null
      avg_comments: number | null
      engagement_ratio: number | null
      bio: string | null
      bio_link: string | null
      recent_posts_sample: Array<{
        type: string | null
        likes: number | null
        comments: number | null
        timestamp: string | null
      }>
      error_reason: string | null
    } | null
    facebook: unknown | null
    tiktok: unknown | null
  }
  stack_details: {
    status: ModuleStatus
    cms: string | null
    frameworks: string[]
    marketing_tools: string[]
    booking_tools: string[]
    error_reason: string | null
  }
  sources: string[]
  errors: Array<{ module: string; message: string; timestamp: string }>
  generated_at: string
}

// ── Normalized input (output of normalizer.ts) ────────────────────────────────

export interface NormalizedInput {
  case_id: string
  website_url: string | null
  website: {
    title: string | null
    has_h1: boolean
    heading_count: number
    cta_links: string[]
    tech_stack: string[]
    contacts: { phone: string | null; email: string | null; address: string | null }
  } | null
  instagram: {
    followers: number
    posts_count: number
    posts_per_week: number
    avg_likes: number
    avg_comments: number
    engagement_ratio: number
    days_since_last_post: number | null
    bio: string | null
  } | null
  gmb: {
    avg_rating: number | null
    review_count: number | null
  } | null
  stack: {
    cms: string | null
    booking_tools: string[]
    marketing_tools: string[]
  }
  sector: string
  location: string
  required_data: string[]
  confirmed_data: string[]
  sources: string[]
}

// ── Internal analysis types ───────────────────────────────────────────────────

export interface WebsiteAnalysis {
  has_h1: boolean
  heading_count: number
  cta_count: number
  has_booking_tool: boolean
  has_analytics: boolean
  has_marketing_pixel: boolean
  tech_stack: string[]
  completeness_score: number
  alerts: string[]
  evidence: Evidence[]
}

export interface SocialChannelAnalysis {
  platform: string
  status: 'active' | 'dormant' | 'absent'
  followers: number | null
  posts_count: number | null
  posts_per_week: number | null
  engagement_ratio: number | null
  days_since_last_post: number | null
  bio_has_cta: boolean | null
  bio_has_contact: boolean | null
  alerts: string[]
  evidence: Evidence[]
}

export interface SocialAnalysis {
  channels: SocialChannelAnalysis[]
  most_active_channel: string | null
  most_neglected_channel: string | null
  overall_status: 'active' | 'weak' | 'absent'
  evidence: Evidence[]
}

export interface ProcessGap {
  area: 'captación' | 'reservas' | 'retención' | 'operaciones' | 'visibilidad'
  gap: string
  impact: 'alto' | 'medio' | 'bajo'
  evidence: Evidence[]
}

export interface ValueChainAnalysis {
  has_booking: boolean
  has_crm: boolean
  has_lead_capture: boolean
  has_review_management: boolean
  has_visibility_tools: boolean
  process_gaps: ProcessGap[]
}

// ── External analysis types ───────────────────────────────────────────────────

export interface PestleFactor {
  factor: 'político' | 'económico' | 'social' | 'tecnológico' | 'legal' | 'ambiental'
  analysis: string
  opportunities: string[]
  risks: string[]
}

export interface PestleAnalysis {
  factors: PestleFactor[]
  sector: string
  location: string
  generated_by: 'llm'
}

export interface PortersFiveForces {
  rivalry: string
  bargaining_power_customers: string
  bargaining_power_suppliers: string
  threat_new_entrants: string
  threat_substitutes: string
}

export interface CompetitorAnalysis {
  confirmed: Array<{
    name: string
    rating?: number | null
    review_count?: number | null
    notes?: string
  }>
  inferred: string[]
  missing: string[]
  porters_five_forces: PortersFiveForces
  generated_by: 'confirmed_data' | 'llm_inference' | 'mixed'
}

// ── Synthesis types ───────────────────────────────────────────────────────────

export interface SwotItem {
  text: string
  evidence: Evidence[]
}

export interface SwotMatrix {
  strengths: SwotItem[]
  weaknesses: SwotItem[]
  opportunities: SwotItem[]
  threats: SwotItem[]
}

export interface Recommendation {
  category: 'marketing' | 'operaciones' | 'tecnología' | 'contenido' | 'reputación'
  description: string
  impact: 'alto' | 'medio' | 'bajo'
  effort: 'alto' | 'medio' | 'bajo'
  confidence: 'confirmed' | 'inferred' | 'speculative'
  evidence: Evidence[]
  editable_notes?: string
}

// ── Iteration (for human review → regeneration, not yet wired) ───────────────

export interface IterationContext {
  version: number
  human_notes: string
  previous_analysis_id?: string
  revised_at: string
}

// ── Final output ─────────────────────────────────────────────────────────────

export interface BusinessAnalysis {
  case_id: string
  summary: string
  website_analysis: WebsiteAnalysis
  social_analysis: SocialAnalysis
  pestle_analysis: PestleAnalysis
  competitor_analysis: CompetitorAnalysis
  process_gaps: ProcessGap[]
  swot: SwotMatrix
  recommendations: Recommendation[]
  required_data: string[]
  confirmed_data: string[]
  inferred_insights: string[]
  insights_for_agent3: string[]
  markdown_report: string
  sources_used: string[]
  confidence_level: 'high' | 'medium' | 'low'
  human_review_status: 'draft' | 'reviewed' | 'needs_revision'
  iteration?: IterationContext
  generated_at: string
}
