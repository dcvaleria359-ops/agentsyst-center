import { useMemo, useState, type ReactNode } from 'react'
import './App.css'
import { agents, navigation, phases } from './data'
import type { CaseItem, CasePhase, NavigationKey, Priority } from './types'

type DraftCase = {
  company: string
  website: string
  sector: string
  origin: string
  request: string
  priority: Priority
  notes: string
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

function App() {
  const [activeView, setActiveView] = useState<NavigationKey>('panel')
  const [cases, setCases] = useState<CaseItem[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [draft, setDraft] = useState<DraftCase>(initialDraft)
  const [search, setSearch] = useState('')

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

  const currentCasesLabel = `${cases.length} caso${cases.length === 1 ? '' : 's'} en el motor`

  const handleCreateCase = () => {
    if (!draft.company.trim() || !draft.sector.trim() || !draft.origin.trim() || !draft.request.trim()) return

    const nextNumber = String(cases.length + 1).padStart(3, '0')
    const newCase: CaseItem = {
      id: `CASE-${nextNumber}`,
      company: draft.company.trim(),
      website: draft.website.trim(),
      sector: draft.sector.trim(),
      origin: draft.origin.trim(),
      request: draft.request.trim(),
      priority: draft.priority,
      notes: draft.notes.trim(),
      currentPhase: 'Nuevo caso',
      currentAgent: 'Agente analista de negocio',
      expectedOutput: 'Ficha de caso creada y prioridad inicial',
      nextStep: 'Revisar datos de entrada y lanzar análisis',
      blocker: 'Sin bloqueos',
      status: 'Nuevo',
      documents: ['Ficha de caso'],
      checklist: [
        { label: 'Datos básicos registrados', done: true },
        { label: 'Prioridad inicial definida', done: true },
        { label: 'Análisis lanzado', done: false },
      ],
      history: [{ label: 'Caso creado desde Nuevo caso', time: 'Ahora' }],
    }

    setCases((prev) => [newCase, ...prev])
    setSelectedCaseId(newCase.id)
    setDraft(initialDraft)
    setIsCreateOpen(false)
    setActiveView('casos')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">A</div>
          <p className="eyebrow">AGENTSYST Center</p>
          <h1>Panel interno v1</h1>
          <p className="muted">Entrada real por Nuevo caso. Sin relleno visible. Flujo comercial-operativo claro de principio a fin.</p>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeView === item.key ? 'active' : ''}`}
              onClick={() => setActiveView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="sidebar-card">
          <p className="eyebrow">Entrada obligatoria</p>
          <h3>Nuevo caso</h3>
          <p className="muted">Crea un caso manualmente o deja preparado el hueco para importar una ficha desde web o captación.</p>
          <div className="stack-sm">
            <button className="primary-btn" onClick={() => setIsCreateOpen(true)}>Crear caso</button>
            <button className="ghost-btn" type="button">Importar ficha próximamente</button>
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
            <input
              className="search"
              placeholder="Buscar por empresa, caso, origen o fase"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button className="primary-btn" onClick={() => setIsCreateOpen(true)}>Nuevo caso</button>
          </div>
        </header>

        {activeView === 'panel' && (
          <div className="stack-lg">
            <section className="hero-card panel-card">
              <div>
                <p className="eyebrow">Arranque del sistema</p>
                <h3>Todo empieza creando un caso real</h3>
                <p className="muted">El panel no muestra leads ficticios por defecto. Si el motor está vacío, el primer paso es abrir Nuevo caso y capturar el contexto mínimo.</p>
              </div>
              <div className="hero-actions">
                <button className="primary-btn" onClick={() => setIsCreateOpen(true)}>Crear caso</button>
                <button className="ghost-btn" type="button">Importar ficha próximamente</button>
              </div>
            </section>

            <section className="metrics-grid">
              <MetricCard label="Estado del motor" value={currentCasesLabel} detail={cases.length === 0 ? 'Listo para arrancar' : 'Casos activos en seguimiento'} />
              <MetricCard label="Bloqueos" value={String(cases.filter((item) => item.status === 'Bloqueado').length)} detail="Casos que requieren decisión" />
              <MetricCard label="Fase actual más poblada" value={getTopPhase(phaseCounts)} detail="Ayuda a detectar carga operativa" />
            </section>

            <section className="panel-card stack-md">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Flujo oficial v1</p>
                  <h3>Recorrido completo del caso</h3>
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
              {filteredCases.length === 0 ? (
                <EmptyState onCreate={() => setIsCreateOpen(true)} />
              ) : (
                <div className="case-list">
                  {filteredCases.map((item) => (
                    <button
                      key={item.id}
                      className={`case-row ${selectedCase?.id === item.id ? 'active' : ''}`}
                      onClick={() => setSelectedCaseId(item.id)}
                    >
                      <div>
                        <strong>{item.company}</strong>
                        <p>{item.id} · {item.sector}</p>
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
              {selectedCase ? <CaseDetail item={selectedCase} /> : <EmptyDetail />}
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
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {isCreateOpen && (
        <CreateCaseModal draft={draft} onChange={setDraft} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateCase} />
      )}
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

function CaseDetail({ item }: { item: CaseItem }) {
  return (
    <>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Ficha de caso</p>
          <h3>{item.id} · {item.company}</h3>
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
          <ul>
            {item.documents.map((doc) => <li key={doc}>{doc}</li>)}
          </ul>
        </article>
        <article className="detail-block">
          <strong>Checklist</strong>
          <ul>
            {item.checklist.map((check) => <li key={check.label}>{check.done ? '✓' : '•'} {check.label}</li>)}
          </ul>
        </article>
      </div>

      <article className="detail-block">
        <strong>Historial</strong>
        <ul>
          {item.history.map((event) => <li key={`${event.label}-${event.time}`}>{event.label} · {event.time}</li>)}
        </ul>
      </article>
    </>
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="empty-state">
      <p className="eyebrow">Vacío elegante</p>
      <h3>No hay casos todavía</h3>
      <p>El panel arranca aquí: crea un caso manual o prepara más adelante la importación desde la web o captación.</p>
      <button className="primary-btn" onClick={onCreate}>Crear primer caso</button>
    </div>
  )
}

function EmptyDetail() {
  return (
    <div className="empty-detail">
      <p className="eyebrow">Ficha de caso</p>
      <h3>Selecciona un caso</h3>
      <p>Cuando exista al menos un caso, aquí verás fase actual, responsable, output esperado, siguiente paso, bloqueos y resultados.</p>
    </div>
  )
}

function CreateCaseModal({ draft, onChange, onClose, onSubmit }: { draft: DraftCase; onChange: (draft: DraftCase) => void; onClose: () => void; onSubmit: () => void }) {
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
          <Field label="Empresa">
            <input value={draft.company} onChange={(e) => onChange({ ...draft, company: e.target.value })} placeholder="Ej. Clínica Nova" />
          </Field>
          <Field label="Web">
            <input value={draft.website} onChange={(e) => onChange({ ...draft, website: e.target.value })} placeholder="https://..." />
          </Field>
          <Field label="Sector">
            <input value={draft.sector} onChange={(e) => onChange({ ...draft, sector: e.target.value })} placeholder="Ej. Clínica dental" />
          </Field>
          <Field label="Origen">
            <input value={draft.origin} onChange={(e) => onChange({ ...draft, origin: e.target.value })} placeholder="Web / captación / manual" />
          </Field>
          <Field label="Prioridad">
            <select value={draft.priority} onChange={(e) => onChange({ ...draft, priority: e.target.value as Priority })}>
              <option>Alta</option>
              <option>Media</option>
              <option>Baja</option>
            </select>
          </Field>
          <Field label="Petición o necesidad" full>
            <textarea value={draft.request} onChange={(e) => onChange({ ...draft, request: e.target.value })} rows={4} placeholder="Qué necesita este negocio o qué oportunidad detectamos..." />
          </Field>
          <Field label="Notas" full>
            <textarea value={draft.notes} onChange={(e) => onChange({ ...draft, notes: e.target.value })} rows={3} placeholder="Contexto adicional, contacto, matices..." />
          </Field>
        </div>

        <div className="modal-actions">
          <button className="primary-btn" onClick={onSubmit}>Crear caso</button>
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

export default App
