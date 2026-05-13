export type NavigationKey = 'dashboard' | 'leads' | 'casos' | 'agentes'

export type CasePhase =
  | 'Caso abierto'
  | 'Diagnóstico realizado'
  | 'Solución propuesta'
  | 'Demo preparada'
  | 'Propuesta lista'
  | 'Contactado'
  | 'Seguimiento'
  | 'Ganado'
  | 'Perdido'
  | 'Dormido'

export interface CaseItem {
  id: string
  lead_id: number | null
  company: string
  contact_name: string | null
  website: string | null
  sector: string | null
  email: string | null
  whatsapp: string | null
  instagram: string | null
  origin: string | null
  request: string | null
  current_phase: CasePhase
  commercial_status: string | null
  notes: string | null
  history: string | null
  created_at: string
  updated_at: string | null
  analysis_generated_at: string | null
  // Diagnóstico
  diagnosis: string | null
  opportunities: string | null
  sources: string | null
  // Análisis estructurado (Agente 2)
  raw_business_data: string | null
  business_analysis: Record<string, unknown> | null
  markdown_report: string | null
  agent3_handoff: string | null
  human_notes: string | null
  human_review_status: string | null
  // Solución
  proposed_solution: string | null
  included_modules: string | null
  estimated_price: string | null
  difficulty: string | null
  tools_needed: string | null
  // Demo
  demo_status: string | null
  demo_url: string | null
  demo_description: string | null
  demo_notes: string | null
  demo_prompt: string | null
  demo_tool: string | null
  // Propuesta comercial
  commercial_proposal: string | null
  whatsapp_message: string | null
  proposal_status: string | null
  // Seguimiento
  last_contact_at: string | null
  next_step: string | null
  next_action: string | null
  client_response: string | null
}

export interface AgentItem {
  id: string
  name: string
  phase: CasePhase
  mission: string
  output: string
  slug?: string
  installed?: boolean
  status?: string
}

export interface PhaseItem {
  phase: CasePhase
  agent: string
  output: string
  description: string
}

export interface LeadItem {
  id: number
  fecha: string
  nombre_negocio: string | null
  nombre_contacto: string | null
  tipo_negocio: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null
  problema: string | null
  estado: string | null
  notas: string | null
  gdpr_aceptado: boolean
}
