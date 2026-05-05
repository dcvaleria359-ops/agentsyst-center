import { useEffect, useMemo, useState, type ReactNode } from 'react'
import './App.css'
import { API_BASE, fallbackAgents, navigation, phases } from './data'
import type { AgentItem, AgentOutputItem, CaseItem, CasePhase, NavigationKey, Priority } from './types'

type DraftCase = {
  company: string
  website: string
  sector: string
  origin: string
  request: string
  priority: Priority
  notes: string
}

type FlashMessage = { type: 'success' | 'error'; text: string } | null

type AgentAction = {
  key: 'agent1' | 'agent2'
  label: string
  helper: string
}

const initialDraft: DraftCase = {
  company: '',
  website: '',
  sector: '',
  origin: 'Creación manual desde panel',
  request: '',
  priority: 'Media',
  notes: '',
}

function apiUrl(path: string) {
  return `${API_BASE}${path}`
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.details || data?.error || 'La petición falló')
  }
  return data as T
}

function App() {
  const [activeView, setActiveView] = useState<NavigationKey>('panel')
  const [cases, setCases] = useState<CaseItem[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [draft, setDraft] = useState<DraftCase>(initialDraft)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [runningAgentKey, setRunningAgentKey] = useState<string | null>(null)
  const [flash, setFlash] = useState<FlashMessage>(null)

  const agents: AgentItem[] = useMemo(
    () => phases.map((phase, index) => ({
      id: `AG-${String(index + 1).padStart(3, '0')}`,
      name: phase.agent,
      phase: phase.phase,
      mission: phase.description,
      output: phase.output,
      status: index < 2 ? 'integrado en panel' : fallbackAgents[index - 1]?.status || 'pendiente',
    })),
    [],
  )

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return cases
    return cases.filter((item) =>
      [item.id, item.company, item.sector, item.origin, item.currentPhase].join(' ').toLowerCase().includes(term),
    )
  }, [cases, search])

  const selectedCase = useMemo(
    () => filteredCases.find((item) => item.id === selectedCaseId) ?? cases.find((item) => item.id === selectedCaseId),
    [cases, filteredCases, selectedCaseId],
  )

  const phaseCounts = useMemo(
    () => phases.map((phase) => ({ ...phase, count: cases.filter((item) => item.currentPhase === phase.phase).length })),
    [cases],
  )

  useEffect(() => {
    void loadCases()
  }, [])

  async function loadCases(keepSelection = true) {
    try {
      setIsLoading(true)
      const payload = await requestJson<{ ok: true; cases: CaseItem[]; storage?: string }>('/cases')
      setCases(payload.cases)
      setSelectedCaseId((current) => {
        if (keepSelection && current && payload.cases.some((item) => item.id === current)) return current
        return payload.cases[0]?.id || ''
      })
      if (payload.storage === 'local_fallback') {
        setFlash({ type: 'error', text: 'El panel funciona, pero el motor sigue guardando en fallback local porque faltan tablas reales en Supabase.' })
      } else {
        setFlash(null)
      }
    } catch (error) {
      setFlash({ type: 'error', text: error instanceof Error ? error.message : 'No se pudieron cargar los casos.' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateCase() {
    if (!draft.company.trim() || !draft.sector.trim() || !draft.origin.trim() || !draft.request.trim()) return

    try {
      setIsCreating(true)
      const payload = await requestJson<{ ok: true; case: CaseItem; storage?: string }>('/cases', {
        method: 'POST',
        body: JSON.stringify({
          company: draft.company,
          website: draft.website,
          sector: draft.sector,
          origin: draft.origin,
          request: draft.request,
          priority: draft.priority,
          notes: draft.notes,
        }),
      })

      setCases((prev) => [payload.case, ...prev.filter((item) => item.id !== payload.case.id)])
      setSelectedCaseId(payload.case.id)
      setDraft(initialDraft)
      setIsCreateOpen(false)
      setActiveView('casos')
      setFlash({ type: 'success', text: `Caso ${payload.case.company} creado y listo para lanzar análisis.` })
    } catch (error) {
      setFlash({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo crear el caso.' })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleRunAgent(caseItem: CaseItem, agentKey: 'agent1' | 'agent2') {
    try {
      setRunningAgentKey(`${caseItem.id}:${agentKey}`)
      const payload = await requestJson<{ ok: true; case: CaseItem }>(`/cases/${caseItem.id}/agents/${agentKey}/run`, {
        method: 'POST',
      })

      setCases((prev) => prev.map((item) => (item.id === payload.case.id ? payload.case : item)))
      setSelectedCaseId(payload.case.id)
      setFlash({ type: 'success', text: `${agentKey === 'agent1' ? 'Agente 1' : 'Agente 2'} ejecutado y guardado en el caso.` })
    } catch (error) {
      setFlash({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo ejecutar el agente.' })
    } finally {
      setRunningAgentKey(null)
    }
  }

  const currentCasesLabel = `${cases.length} caso${cases.length === 1 ? '' : 's'} en el motor`

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">A</div>
          <p className="eyebrow">AGENTSYST Center</p>
          <h1>Panel interno conectado</h1>
          <p className="muted">Aquí es donde debe vivir el flujo real. Agente 1 y 2 ya quedan integrados en este panel.</p>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => (
            <button key={item.key} className={`nav-item ${activeView === item.key ? 'active' : ''}`} onClick={() => setActiveView(item.key)}>
              {item.label}
            </button>
          ))}
        </nav>

        <section className="sidebar-card">
          <p className="eyebrow">Entrada obligatoria</p>
          <h3>Nuevo caso</h3>
          <p className="muted">Crea caso real, ejecuta agente 1, luego agente 2, y deja agente 3 listo.</p>
          <div className="stack-sm">
            <button className="primary-btn" onClick={() => setIsCreateOpen(true)}>Crear caso</button>
            <button className="ghost-btn" type="button" onClick={() => void loadCases(false)}>Recargar casos</button>
          </div>
        </section>
      </aside>

      <main className="main-layout">
        <header className="topbar">
          <div>
            <p className="eyebrow">Motor AGENTSYST</p>
            <h2>{activeView === 'panel' ? 'Visión general' : navigation.find((item) => item.key === activeView)?.label}</h2>
          </div>
          <div className="topbar-actions">
            <input className="search" placeholder="Buscar por empresa, caso, origen o fase" value={search} onChange={(event) => setSearch(event.target.value)} />
            <button className="ghost-btn" onClick={() => void loadCases(false)}>Actualizar</button>
          </div>
        </header>

        {flash && <FlashBanner flash={flash} onClose={() => setFlash(null)} />}

        {activeView === 'panel' && (
          <div className="stack-lg">
            <section className="hero-card panel-card">
              <div>
                <p className="eyebrow">Estado del motor</p>
                <h3>Flujo real mínimo activo en este panel</h3>
                <p className="muted">Crear caso → lanzar análisis → generar soluciones propuestas → dejar agente 3 habilitado.</p>
              </div>
              <div className="hero-actions">
                <button className="primary-btn" onClick={() => setIsCreateOpen(true)}>Crear caso</button>
                <button className="ghost-btn" type="button" onClick={() => void loadCases(false)}>Recargar</button>
              </div>
            </section>

            <section className="metrics-grid">
              <MetricCard label="Estado del motor" value={currentCasesLabel} detail={isLoading ? 'Cargando...' : 'Casos reales del panel'} />
              <MetricCard label="Bloqueos" value={String(cases.filter((item) => item.status === 'Bloqueado').length)} detail="Casos que requieren decisión" />
              <MetricCard label="Fase actual más poblada" value={getTopPhase(phaseCounts)} detail="Carga operativa actual" />
            </section>

            <section className="panel-card stack-md">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Flujo oficial</p>
                  <h3>Distribución por fases</h3>
                </div>
              </div>
              <PhaseBoard phases={phaseCounts} />
            </section>
          </div>
        )}

        {activeView === 'casos' && (
          <div className="cases-layout">
            <section className="panel-card stack-md">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Casos</p>
                  <h3>Vista operativa</h3>
                </div>
              </div>
              {isLoading ? (
                <LoadingState />
              ) : filteredCases.length === 0 ? (
                <EmptyState onCreate={() => setIsCreateOpen(true)} />
              ) : (
                <div className="case-list">
                  {filteredCases.map((item) => (
                    <button key={item.id} className={`case-row ${selectedCase?.id === item.id ? 'active' : ''}`} onClick={() => setSelectedCaseId(item.id)}>
                      <div>
                        <strong>{item.company}</strong>
                        <p>{item.id.slice(0, 8)} · {item.sector}</p>
                      </div>
                      <div className="case-row-meta">
                        <span className="pill">{item.currentPhase}</span>
                        <span className="pill subtle">{item.currentAgent}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="panel-card stack-md">
              {selectedCase ? <CaseDetail item={selectedCase} runningAgentKey={runningAgentKey} onRunAgent={handleRunAgent} /> : <EmptyDetail />}
            </section>
          </div>
        )}

        {activeView === 'fases' && (
          <section className="panel-card stack-md">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Fases</p>
                <h3>Qué ocurre en cada tramo</h3>
              </div>
            </div>
            <div className="phase-detail-list">
              {phaseCounts.map((item) => (
                <article key={item.phase} className="phase-detail-card">
                  <div className="phase-detail-top">
                    <div>
                      <strong>{item.phase}</strong>
                      <p>{item.description}</p>
                    </div>
                    <span className="count-badge">{item.count}</span>
                  </div>
                  <div className="detail-pairs">
                    <DetailPair label="Agente responsable" value={item.agent} />
                    <DetailPair label="Output esperado" value={item.output} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'agentes' && (
          <section className="panel-card stack-md">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Agentes obreros oficiales</p>
                <h3>Responsables del flujo v1</h3>
              </div>
            </div>
            <div className="agent-grid">
              {agents.map((agent) => (
                <article key={agent.id} className="agent-card">
                  <p className="eyebrow">{agent.phase}</p>
                  <h4>{agent.name}</h4>
                  <p>{agent.mission}</p>
                  <DetailPair label="Output" value={agent.output} />
                  <DetailPair label="Estado" value={agent.status || 'pendiente'} />
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {isCreateOpen && (
        <CreateCaseModal draft={draft} isSubmitting={isCreating} onChange={setDraft} onClose={() => setIsCreateOpen(false)} onSubmit={() => void handleCreateCase()} />
      )}
    </div>
  )
}

function FlashBanner({ flash, onClose }: { flash: NonNullable<FlashMessage>; onClose: () => void }) {
  return (
    <div className={`panel-card flash-banner ${flash.type}`}>
      <strong>{flash.type === 'success' ? 'Hecho' : 'Atención'}</strong>
      <p>{flash.text}</p>
      <button className="ghost-btn" onClick={onClose}>Cerrar</button>
    </div>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <h3>{value}</h3>
      <span>{detail}</span>
    </article>
  )
}

function PhaseBoard({ phases }: { phases: Array<{ phase: CasePhase; agent: string; output: string; description: string; count: number }> }) {
  return (
    <div className="phase-board">
      {phases.map((item) => (
        <article key={item.phase} className="phase-column">
          <div className="phase-column-top">
            <strong>{item.phase}</strong>
            <span className="count-badge">{item.count}</span>
          </div>
          <p>{item.description}</p>
          <small>{item.agent}</small>
        </article>
      ))}
    </div>
  )
}

function CaseDetail({ item, runningAgentKey, onRunAgent }: { item: CaseItem; runningAgentKey: string | null; onRunAgent: (item: CaseItem, agentKey: 'agent1' | 'agent2') => void }) {
  const action = getAgentAction(item)
  const isRunning = action ? runningAgentKey === `${item.id}:${action.key}` : false

  return (
    <>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Ficha de caso</p>
          <h3>{item.company}</h3>
        </div>
        <span className="pill">{item.currentPhase}</span>
      </div>

      <div className="detail-grid">
        <DetailPair label="Empresa" value={item.company} />
        <DetailPair label="Web" value={item.website || 'No informada'} />
        <DetailPair label="Sector" value={item.sector} />
        <DetailPair label="Origen" value={item.origin} />
        <DetailPair label="Responsable actual" value={item.currentAgent} />
        <DetailPair label="Estado" value={item.status} />
        <DetailPair label="Output esperado" value={item.expectedOutput} />
        <DetailPair label="Siguiente paso" value={item.nextStep} />
        <DetailPair label="Bloqueos" value={item.blocker} />
      </div>

      <AgentActionCard item={item} action={action} isRunning={isRunning} onRunAgent={onRunAgent} />

      <article className="detail-block">
        <strong>Petición o necesidad</strong>
        <p>{item.request}</p>
      </article>

      <article className="detail-block">
        <strong>Notas</strong>
        <p>{item.notes || 'Sin notas adicionales todavía.'}</p>
      </article>

      <div className="detail-split">
        <article className="detail-block">
          <strong>Documentos o resultados</strong>
          <ul>{item.documents.map((doc) => <li key={doc}>{doc}</li>)}</ul>
        </article>
        <article className="detail-block">
          <strong>Checklist</strong>
          <ul>{item.checklist.map((check) => <li key={check.label}>{check.done ? '✓' : '•'} {check.label}</li>)}</ul>
        </article>
      </div>

      <article className="detail-block">
        <strong>Outputs de agentes</strong>
        {item.outputs.length === 0 ? <p>Todavía no hay outputs guardados.</p> : <OutputList outputs={item.outputs} />}
      </article>

      <article className="detail-block">
        <strong>Historial</strong>
        <ul>{item.history.map((event) => <li key={`${event.label}-${event.time}`}>{event.label} · {event.time}</li>)}</ul>
      </article>
    </>
  )
}

function AgentActionCard({ item, action, isRunning, onRunAgent }: { item: CaseItem; action: AgentAction | null; isRunning: boolean; onRunAgent: (item: CaseItem, agentKey: 'agent1' | 'agent2') => void }) {
  return (
    <article className="detail-block">
      <strong>Acción operativa</strong>
      {action ? (
        <div className="stack-sm">
          <p>{action.helper}</p>
          <button className="primary-btn" disabled={isRunning} onClick={() => onRunAgent(item, action.key)}>{isRunning ? 'Ejecutando…' : action.label}</button>
        </div>
      ) : (
        <p>Este caso ya dejó preparado el siguiente handoff. El agente 3 queda como siguiente integración pendiente.</p>
      )}
    </article>
  )
}

function OutputList({ outputs }: { outputs: AgentOutputItem[] }) {
  return (
    <div className="stack-sm">
      {[...outputs].reverse().map((output) => (
        <article key={output.id} className="output-card">
          <div className="phase-detail-top">
            <div>
              <strong>{output.title}</strong>
              <p>{output.agentName}</p>
            </div>
            <span className="count-badge">{new Date(output.createdAt).toLocaleDateString('es-ES')}</span>
          </div>
          <pre className="output-content">{output.content}</pre>
        </article>
      ))}
    </div>
  )
}

function DetailPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-pair">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="empty-state">
      <p className="eyebrow">Cargando</p>
      <h3>Trayendo casos reales</h3>
      <p>Esperando respuesta del backend de AGENTSYST.</p>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="empty-state">
      <p className="eyebrow">Motor listo</p>
      <h3>No hay casos todavía</h3>
      <p>El flujo real arranca aquí: crea un caso y luego lanza el agente 1 desde la ficha.</p>
      <button className="primary-btn" onClick={onCreate}>Crear primer caso</button>
    </div>
  )
}

function EmptyDetail() {
  return (
    <div className="empty-detail">
      <p className="eyebrow">Ficha de caso</p>
      <h3>Selecciona un caso</h3>
      <p>Cuando exista al menos un caso, aquí verás fase actual, responsable, output esperado y acciones reales.</p>
    </div>
  )
}

function CreateCaseModal({ draft, isSubmitting, onChange, onClose, onSubmit }: { draft: DraftCase; isSubmitting: boolean; onChange: (draft: DraftCase) => void; onClose: () => void; onSubmit: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Nuevo caso</p>
            <h3>Entrada al motor</h3>
          </div>
          <button className="ghost-btn" onClick={onClose}>Cerrar</button>
        </div>

        <div className="form-grid">
          <Field label="Empresa"><input value={draft.company} onChange={(e) => onChange({ ...draft, company: e.target.value })} placeholder="Ej. Clínica Nova" /></Field>
          <Field label="Web"><input value={draft.website} onChange={(e) => onChange({ ...draft, website: e.target.value })} placeholder="https://..." /></Field>
          <Field label="Sector"><input value={draft.sector} onChange={(e) => onChange({ ...draft, sector: e.target.value })} placeholder="Ej. Clínica dental" /></Field>
          <Field label="Origen"><input value={draft.origin} onChange={(e) => onChange({ ...draft, origin: e.target.value })} placeholder="Web / captación / manual" /></Field>
          <Field label="Prioridad">
            <select value={draft.priority} onChange={(e) => onChange({ ...draft, priority: e.target.value as Priority })}>
              <option>Alta</option><option>Media</option><option>Baja</option>
            </select>
          </Field>
          <Field label="Petición o necesidad" full><textarea value={draft.request} onChange={(e) => onChange({ ...draft, request: e.target.value })} rows={4} placeholder="Qué necesita este negocio o qué oportunidad detectamos..." /></Field>
          <Field label="Notas" full><textarea value={draft.notes} onChange={(e) => onChange({ ...draft, notes: e.target.value })} rows={3} placeholder="Contexto adicional, contacto, matices..." /></Field>
        </div>

        <div className="modal-actions">
          <button className="primary-btn" disabled={isSubmitting} onClick={onSubmit}>{isSubmitting ? 'Creando…' : 'Crear caso'}</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function getTopPhase(phasesWithCount: Array<{ phase: CasePhase; count: number }>) {
  const top = phasesWithCount.reduce((best, item) => (item.count > best.count ? item : best), phasesWithCount[0])
  return top.count === 0 ? 'Sin casos aún' : top.phase
}

function getAgentAction(item: CaseItem): AgentAction | null {
  if (item.currentPhase === 'Nuevo caso') return { key: 'agent1', label: 'Lanzar análisis', helper: 'Ejecuta el agente 1, guarda el informe y habilita soluciones propuestas.' }
  if (item.currentPhase === 'Soluciones propuestas') return { key: 'agent2', label: 'Generar soluciones propuestas', helper: 'Ejecuta el agente 2, guarda el briefing y deja listo el agente 3.' }
  return null
}

export default App
