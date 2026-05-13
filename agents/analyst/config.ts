export const THRESHOLDS = {
  ENGAGEMENT_LOW: 0.03,
  ENGAGEMENT_HIGH: 0.08,
  POSTS_PER_WEEK_DORMANT: 0.1,
  DAYS_DORMANT: 180,
  FOLLOWERS_SMALL: 200,
  COMPLETENESS_SCORE_LOW: 50,
} as const

export const LLM = {
  MODEL: 'deepseek/deepseek-r1-0528',
  MAX_TOKENS: 4096,
  SYSTEM_ANALYST: `Eres un analista de negocio experto en pymes y negocios locales en España y mercados hispanohablantes. Analizas con rigor y produces insights accionables, no relleno genérico. Responde siempre en español.`,
} as const

export const BOOKING_KEYWORDS = ['calendly', 'acuity', 'booksy', 'treatwell', 'vagaro', 'fresha', 'simplybook', 'reservio', 'appointy'] as const

export const ANALYTICS_TOOLS = ['google analytics', 'google tag manager', 'gtm', 'hotjar', 'clarity'] as const

export const PIXEL_TOOLS = ['meta pixel', 'facebook pixel', 'tiktok pixel', 'pinterest tag'] as const

export const CRM_KEYWORDS = ['crm', 'hubspot', 'salesforce', 'zoho'] as const

export const VISIBILITY_KEYWORDS = ['tag manager', 'analytics', 'gtm', 'pixel'] as const

export const CTA_KEYWORDS = ['reservar', 'cita', 'contactar', 'contacto', 'whatsapp', 'llamar', 'pedir', 'book', 'appointment'] as const
