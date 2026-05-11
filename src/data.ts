import type { AgentItem, NavigationKey, PhaseItem } from './types'

export const SUPABASE_URL = 'https://tcwurtymzogbtiizqmwm.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjd3VydHltem9nYnRpaXpxbXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3Njg0MDQsImV4cCI6MjA5MzM0NDQwNH0.h58MdKDBFPGAXsIJcY9BLpTnsI5jhb7ExEziQRv33uY'
export const API_BASE = '/api'

export const navigation: { key: NavigationKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'leads', label: 'Leads' },
  { key: 'casos', label: 'Casos' },
  { key: 'agentes', label: 'Agentes' },
]

export const phases: PhaseItem[] = [
  {
    phase: 'Caso abierto',
    agent: 'Operador',
    output: 'Ficha de caso creada con datos del lead',
    description: 'El lead se ha convertido en caso activo. Se verifica la información y se definen los próximos pasos.',
  },
  {
    phase: 'Diagnóstico realizado',
    agent: 'Operador + IA asistida',
    output: 'Informe de diagnóstico del negocio',
    description: 'Se analiza la web, redes, oferta y puntos débiles del cliente. Se detectan oportunidades de automatización.',
  },
  {
    phase: 'Solución propuesta',
    agent: 'Operador + IA asistida',
    output: 'Briefing de solución con módulos y precio estimado',
    description: 'Se define qué sistema se propone, qué módulos incluye, coste estimado y herramientas necesarias.',
  },
  {
    phase: 'Demo preparada',
    agent: 'Operador + herramientas IA',
    output: 'Demo funcional con enlace compartible',
    description: 'Se crea algo concreto para mostrar al cliente: mini web, formulario, chatbot, flujo visual, etc.',
  },
  {
    phase: 'Propuesta lista',
    agent: 'Operador',
    output: 'Propuesta comercial escrita y mensaje WhatsApp',
    description: 'Se redacta la propuesta completa y el mensaje inicial de contacto comercial.',
  },
  {
    phase: 'Contactado',
    agent: 'Operador',
    output: 'Primer contacto realizado con enlace a demo',
    description: 'Se envía el mensaje por WhatsApp con la demo y propuesta. Se registra la fecha de contacto.',
  },
  {
    phase: 'Seguimiento',
    agent: 'Operador',
    output: 'Estado comercial actualizado',
    description: 'Se hace seguimiento de la respuesta del cliente y se registra el estado del proceso comercial.',
  },
]

export const fallbackAgents: AgentItem[] = phases.map((phase, index) => ({
  id: `AG-${String(index + 1).padStart(3, '0')}`,
  name: phase.agent,
  phase: phase.phase,
  mission: phase.description,
  output: phase.output,
  status: 'manual',
}))
