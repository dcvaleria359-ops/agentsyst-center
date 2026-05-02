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
}

export interface PhaseItem {
  phase: CasePhase
  agent: string
  output: string
  description: string
}
