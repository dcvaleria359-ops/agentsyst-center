import type { AgentItem, PhaseItem } from './types'

export const SUPABASE_URL = 'https://tcwurtymzogbtiizqmwm.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjd3VydHltem9nYnRpaXpxbXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3Njg0MDQsImV4cCI6MjA5MzM0NDQwNH0.h58MdKDBFPGAXsIJcY9BLpTnsI5jhb7ExEziQRv33uY'
export const API_BASE = '/api'

export const navigation: { key: 'panel' | 'casos' | 'fases' | 'agentes'; label: string }[] = [
  { key: 'panel', label: 'Panel' },
  { key: 'casos', label: 'Casos' },
  { key: 'fases', label: 'Fases' },
  { key: 'agentes', label: 'Agentes' },
]

export const phases: PhaseItem[] = [
  {
    phase: 'Nuevo caso',
    agent: 'Agente analista de negocio',
    output: 'Ficha de caso creada y prioridad inicial',
    description: 'Se importa una ficha desde captación o se crea manualmente el caso para entrar al motor.',
  },
  {
    phase: 'Análisis del negocio',
    agent: 'Agente analista de negocio',
    output: 'Informe de análisis del negocio',
    description: 'Se revisan web, fricciones, oportunidades, redes y mejoras operativas visibles.',
  },
  {
    phase: 'Soluciones propuestas',
    agent: 'Agente orquestador de soluciones',
    output: 'Briefing de soluciones con opciones priorizadas',
    description: 'Se definen escenarios, impacto esperado y valor potencial para el cliente.',
  },
  {
    phase: 'Propuesta visual',
    agent: 'Agente diseñador de propuestas',
    output: 'Documento visual descargable para cliente',
    description: 'Se presenta la solución con lenguaje de negocio claro, beneficios y comparativas.',
  },
  {
    phase: 'Demo preparada',
    agent: 'Agente creador de demo / landing',
    output: 'Demo funcional y presentable',
    description: 'Se prepara una experiencia visible para enseñar o probar con el cliente.',
  },
  {
    phase: 'Cierre',
    agent: 'Agente de cierre de solución',
    output: 'Briefing final aprobado y hoja de implementación',
    description: 'Se recoge feedback, se aterriza el alcance y se confirma qué se implementa.',
  },
  {
    phase: 'Implementación',
    agent: 'Agente de producción técnica',
    output: 'Sistema implementado',
    description: 'Se ejecutan integraciones, automatizaciones y producción técnica real.',
  },
]

export const fallbackAgents: AgentItem[] = phases.slice(1).map((phase, index) => ({
  id: `AG-${String(index + 1).padStart(3, '0')}`,
  name: phase.agent,
  phase: phase.phase,
  mission: phase.description,
  output: phase.output,
  status: 'sin verificar',
}))
