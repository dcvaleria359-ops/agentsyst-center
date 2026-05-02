export type NavigationKey =
  | 'resumen'
  | 'casos'
  | 'diagnostico'
  | 'arquitectura'
  | 'produccion'
  | 'validacion'
  | 'entrega'
  | 'biblioteca'
  | 'agentes'

export type Tone = 'info' | 'success' | 'warning'
export type Priority = 'Alta' | 'Media' | 'Baja'
export type CaseStatus = 'Nuevo' | 'Activo' | 'Bloqueado' | 'En revisión' | 'Demo ready' | 'Entregado'
export type CasePhase = 'Intake' | 'Diagnóstico' | 'Arquitectura' | 'Diseño' | 'Producción' | 'Validación' | 'Demo / Entrega'
export type AgentStatus = 'Disponible' | 'Ejecutando' | 'Esperando input' | 'Bloqueado' | 'En revisión' | 'Completado'
export type AssetType = 'Prompt' | 'Arquitectura' | 'Plantilla' | 'Playbook' | 'Comercial' | 'Técnico'

export interface KpiCard {
  label: string
  value: string
  delta: string
  tone: 'neutral' | 'positive' | 'warning'
}

export interface HistoryEvent {
  label: string
  time: string
  tone: Tone
}

export interface ChecklistItem {
  label: string
  done: boolean
}

export interface PhaseOutput {
  phase: CasePhase
  ownerAgent: string
  requiredOutput: string
  validationGate: string
}

export interface CaseItem {
  id: string
  company: string
  vertical: string
  projectType: string
  currentPhase: CasePhase
  currentAgent: string
  nextAgent: string
  priority: Priority
  status: CaseStatus
  expectedOutput: string
  blocker: string
  targetDate: string
  origin: string
  need: string
  diagnosisSummary: string
  strategyNote: string
  activeWorkstreams: string[]
  dependencies: string[]
  devSupport: string
  deliveryType: string
  deliveryStatus: string
  missingItems: string[]
  history: HistoryEvent[]
  checklist: ChecklistItem[]
}

export interface DiagnosisItem {
  caseId: string
  company: string
  diagnosisAgent: string
  detectedProblem: string
  opportunity: string
  complexity: 'Baja' | 'Media' | 'Alta'
  reportStatus: string
  nextDecision: string
}

export interface ArchitectureItem {
  caseId: string
  company: string
  solutionType: string
  channels: string
  requiredAgents: string
  mandatoryOutputs: string
  architectureStatus: string
  nextStep: string
}

export interface ProductionItem {
  caseId: string
  company: string
  workstream: string
  ownerAgent: string
  expectedOutput: string
  status: string
  blocker: string
  dependency: string
  deadline: string
}

export interface ValidationItem {
  caseId: string
  company: string
  asset: string
  reviewer: string
  qaStatus: string
  issue: string
  requiredAction: string
}

export interface DeliveryItem {
  caseId: string
  company: string
  deliveryType: string
  demoStatus: string
  missingItems: string
  owner: string
  targetDate: string
  readiness: Array<{ label: string; status: string }>
}

export interface AgentItem {
  id: string
  name: string
  mission: string
  phase: string
  input: string
  output: string
  status: AgentStatus
  handoffTo: string
}

export interface LibraryAsset {
  id: string
  title: string
  type: AssetType
  domain: string
  usage: string
  updatedAt: string
  owner: string
}

export interface TimelineEvent {
  id: string
  title: string
  description: string
  time: string
  tone: Tone
}
