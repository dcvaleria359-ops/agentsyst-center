import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'
import { API_BASE, SUPABASE_ANON_KEY, SUPABASE_URL, fallbackAgents, navigation, phases } from './data'
import type { AgentItem, CaseItem, CasePhase, LeadItem, NavigationKey, Priority } from './types'

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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [draft, setDraft] = useState<DraftCase>(initialDraft)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
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

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return leads
    return leads.filter((item) =>
      [item.id, item.nombre_negocio, item.nombre_contacto, item.tipo_negocio, item.email, item.website, item.problema].join(' ').toLowerCase().includes(term),
    )
  }, [leads, search])

  const caseLeadIds = useMemo(() => new Set<number>(cases.flatMap((item) => (typeof item.leadId === 'number' ? [item.leadId] : []))), [cases])

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return cases
    return cases.filter((item) =>
      [item.id, item.company, item.sector, item.origin, item.currentPhase].join(' ').toLowerCase().includes(term),
    )
  }, [cases, search])

  const selectedLead = useMemo(
    () => filteredLeads.find((item) => item.id === selectedLeadId) ?? leads.find((item) => item.id === selectedLeadId) ?? null,
    [filteredLeads, leads, selectedLeadId],
  )

  useMemo(
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
      const leadsResult = await supabase.from('leads').select('*').order('fecha', { ascending: false })
      if (leadsResult.error) throw new Error(`No se pudieron cargar los leads reales: ${leadsResult.error.message}`)
      const nextLeads = (leadsResult.data as LeadItem[]) ?? []
      setLeads(nextLeads)
      setSelectedLeadId((current) => current ?? nextLeads[0]?.id ?? null)

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

  async function handleConvertLead(lead: LeadItem) {
    try {
      setIsCreating(true)
      const payload = await requestJson<{ ok: true; case: CaseItem; storage?: string }>('/cases', {
        method: 'POST',
        body: JSON.stringify({
          company: lead.nombre_negocio || `Lead ${lead.id}`,
          website: lead.website || '',
          sector: lead.tipo_negocio || 'Sin sector',
          origin: 'Lead real desde Supabase',
          request: lead.problema || 'Sin problema informado',
          priority: 'Media',
          notes: lead.notas || '',
        }),
      })

      setCases((prev) => [{ ...payload.case, leadId: lead.id }, ...prev.filter((item) => item.id !== payload.case.id)])
      setSelectedCaseId(payload.case.id)
      setActiveView('casos')
      setFlash({ type: 'success', text: `Lead ${lead.nombre_negocio || `#${lead.id}`} convertido en caso.` })
    } catch (error) {
      setFlash({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo convertir el lead en caso.' })
    } finally {
      setIsCreating(false)
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
            <input className="search" placeholder="Buscar por lead, empresa, email, caso o fase" value={search} onChange={(event) => setSearch(event.target.value)} />
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

            <section className="panel-card stack-md">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Leads reales</p>
                  <h3>Entrada pendiente de convertir</h3>
                </div>
              </div>
              <LeadTable leads={filteredLeads.slice(0, 5)} activeCaseLeadIds={caseLeadIds} selectedLeadId={selectedLeadId} onSelect={setSelectedLeadId} onConvert={handleConvertLead} busy={isCreating} />
            </section>
          </div>
        )}

        {activeView === 'casos' && (
          <div className="cases-layout">
            <section className="panel-card stack-md">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Leads reales</p>
                  <h3>Convertir en caso</h3>
                </div>
              </div>
              {isLoading ? (
                <LoadingState />
              ) : filteredLeads.length === 0 ? (
                <EmptyLeadState />
              ) : (
                <LeadTable leads={filteredLeads} activeCaseLeadIds={caseLeadIds} selectedLeadId={selectedLeadId} onSelect={setSelectedLeadId} onConvert={handleConvertLead} busy={isCreating} />
              )}
            </section>

            <section className="panel-card stack-md">
              {selectedLead ? <LeadDetail lead={selectedLead} alreadyConverted={caseLeadIds.has(selectedLead.id)} onConvert={handleConvertLead} busy={isCreating} /> : <EmptyLeadDetail />}
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

function LeadTable({
  leads,
  activeCaseLeadIds,
  selectedLeadId,
  onSelect,
  onConvert,
  busy,
}: {
  leads: LeadItem[]
  activeCaseLeadIds: Set<number>
  selectedLeadId: number | null
  onSelect: (leadId: number) => void
  onConvert: (lead: LeadItem) => void
  busy: boolean
}) {
  return (
    <div className="lead-table">
      <div className="lead-table-head">
        <span>Lead</span>
        <span>Contacto</span>
        <span>Sector</span>
      </div>
      {leads.map((lead) => (
        <button key={lead.id} className={`lead-row ${selectedLeadId === lead.id ? 'active' : ''}`} onClick={() => onSelect(lead.id)}>
          <div>
            <strong>{lead.nombre_negocio || `Lead #${lead.id}`}</strong>
            <p>#{lead.id}</p>
          </div>
          <span>{lead.nombre_contacto || '—'}</span>
          <div className="lead-row-action">
            <span>{lead.tipo_negocio || '—'}</span>
            <button
              className="ghost-btn"
              type="button"
              disabled={busy || activeCaseLeadIds.has(lead.id)}
              onClick={(event) => {
                event.stopPropagation()
                onConvert(lead)
              }}
            >
              {activeCaseLeadIds.has(lead.id) ? 'Ya en caso' : 'Convertir'}
            </button>
          </div>
        </button>
      ))}
    </div>
  )
}

function LeadDetail({ lead, alreadyConverted, onConvert, busy }: { lead: LeadItem; alreadyConverted: boolean; onConvert: (lead: LeadItem) => void; busy: boolean }) {
  return (
    <>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Ficha del lead</p>
          <h3>{lead.nombre_negocio || `Lead #${lead.id}`}</h3>
        </div>
        <span className="pill subtle">{lead.estado || 'Pendiente'}</span>
      </div>

      <div className="detail-grid">
        <DetailPair label="Contacto" value={lead.nombre_contacto || 'No informado'} />
        <DetailPair label="Sector" value={lead.tipo_negocio || 'No informado'} />
        <DetailPair label="WhatsApp" value={lead.whatsapp || 'No informado'} />
        <DetailPair label="Email" value={lead.email || 'No informado'} />
        <DetailPair label="Web" value={lead.website || 'No informada'} />
        <DetailPair label="Instagram" value={lead.instagram || 'No informado'} />
        <DetailPair label="Fecha" value={lead.fecha || 'No informada'} />
        <DetailPair label="GDPR" value={lead.gdpr_aceptado ? 'Aceptado' : 'Pendiente'} />
      </div>

      <article className="detail-block">
        <strong>Problema detectado</strong>
        <p>{lead.problema || 'Sin problema informado.'}</p>
      </article>

      <article className="detail-block">
        <strong>Notas</strong>
        <p>{lead.notas || 'Sin notas adicionales.'}</p>
      </article>

      <div className="modal-actions">
        <button className="primary-btn" disabled={busy || alreadyConverted} onClick={() => onConvert(lead)}>
          {alreadyConverted ? 'Lead ya convertido' : busy ? 'Convirtiendo…' : 'Convertir en caso'}
        </button>
      </div>
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

function LoadingState() {
  return (
    <div className="empty-state">
      <p className="eyebrow">Cargando</p>
      <h3>Trayendo casos reales</h3>
      <p>Esperando respuesta del backend de AGENTSYST.</p>
    </div>
  )
}

function EmptyLeadState() {
  return (
    <div className="empty-state">
      <p className="eyebrow">Leads</p>
      <h3>No hay leads reales</h3>
      <p>Cuando entren leads en Supabase, aparecerán aquí para convertirlos en caso.</p>
    </div>
  )
}

function EmptyLeadDetail() {
  return (
    <div className="empty-detail">
      <p className="eyebrow">Ficha del lead</p>
      <h3>Selecciona un lead</h3>
      <p>Verás sus datos reales y podrás convertirlo en caso desde aquí.</p>
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

export default App
