export type NavigationKey = 'panel' | 'casos' | 'fases' | 'agentes'

export type Priority = 'Alta' | 'Media' | 'Baja'
export type CaseStatus = 'Nuevo' | 'En curso' | 'Bloqueado' | 'Listo para avanzar'
export type CasePhase =
  | 'Nuevo caso'
  | 'Análisis del negocio'
  | 'Soluciones propuestas'
  | 'Propuesta visual'
  | 'Demo preparada'
  | 'Cierre'
  | 'Implementación'

export interface ChecklistItem {
  label: string
  done: boolean
}

export interface HistoryEvent {
  label: string
  time: string
}

export interface CaseItem {
  id: string
  leadId?: number
  company: string
  website: string
  sector: string
  origin: string
  request: string
  priority: Priority
  notes: string
  currentPhase: CasePhase
  currentAgent: string
  expectedOutput: string
  nextStep: string
  blocker: string
  status: CaseStatus
  documents: string[]
  checklist: ChecklistItem[]
  history: HistoryEvent[]
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
