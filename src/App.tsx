import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { API_BASE, fallbackAgents, navigation, phases } from './data'
import type { AgentItem, CaseItem, CasePhase, LeadItem, NavigationKey } from './types'

function App() {
  const [activeView, setActiveView] = useState<NavigationKey>('panel')
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [agents, setAgents] = useState<AgentItem[]>(fallbackAgents)
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyLeadId, setBusyLeadId] = useState<number | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [leadsRes, casesRes, agentsRes] = await Promise.all([
        fetch(`${API_BASE}/leads`),
        fetch(`${API_BASE}/cases`),
        fetch(`${API_BASE}/agents/status`),
      ])

      if (!leadsRes.ok) throw new Error('No se pudieron cargar los leads reales')
      if (!casesRes.ok) throw new Error('No se pudieron cargar los casos reales')
      if (!agentsRes.ok) throw new Error('No se pudo cargar el estado real de agentes')

      const leadsData: LeadItem[] = await leadsRes.json()
      const casesData: CaseItem[] = await casesRes.json()
      const agentsData: AgentItem[] = await agentsRes.json()

      setLeads(leadsData)
      setCases(casesData)
      setAgents(agentsData)
      setSelectedLeadId((current) => current ?? leadsData[0]?.id ?? null)
      setSelectedCaseId((current) => current || casesData[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos reales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const caseLeadIds = useMemo(() => new Set<number>(cases.flatMap((item) => (typeof item.leadId === 'number' ? [item.leadId] : []))), [cases])

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return leads
    return leads.filter((item) =>
      [item.id, item.nombre_negocio, item.nombre_contacto, item.tipo_negocio, item.email, item.website, item.problema]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [leads, search])

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return cases
    return cases.filter((item) =>
      [item.id, item.company, item.sector, item.origin, item.currentPhase].join(' ').toLowerCase().includes(term),
    )
  }, [cases, search])

  const selectedLead = filteredLeads.find((item) => item.id === selectedLeadId) ?? leads.find((item) => item.id === selectedLeadId) ?? null
  const selectedCase = filteredCases.find((item) => item.id === selectedCaseId) ?? cases.find((item) => item.id === selectedCaseId) ?? null

  const phaseCounts = useMemo(
    () => phases.map((phase) => ({ ...phase, count: cases.filter((item) => item.currentPhase === phase.phase).length })),
    [cases],
  )

  const currentCasesLabel = `${cases.length} caso${cases.length === 1 ? '' : 's'} activos`

  const handleConvertLead = async (leadId: number) => {
    setBusyLeadId(leadId)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId }),
      })

      if (!response.ok) throw new Error('No se pudo convertir el lead en caso')

      const payload = await response.json()
      const nextCase: CaseItem = payload.case

      setCases((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== nextCase.id)
        return [nextCase, ...withoutCurrent]
      })
      setSelectedCaseId(nextCase.id)
      setActiveView('casos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo convertir el lead')
    } finally {
      setBusyLeadId(null)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">A</div>
          <p className="eyebrow">AGENTSYST Center</p>
          <h1>Panel interno conectado</h1>
          <p className="muted">Leads reales, casos reales y estado real del motor en una sola vista.</p>
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
          <p className="eyebrow">Sin mock</p>
          <h3>Origen de datos</h3>
          <p className="muted">El Center está leyendo desde {API_BASE}.</p>
          <div className="stack-sm">
            <button className="primary-btn" onClick={() => void loadData()}>Recargar datos</button>
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
              placeholder="Buscar por lead, empresa, email, caso o fase"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button className="ghost-btn" onClick={() => void loadData()}>Actualizar</button>
          </div>
        </header>

        {error && <div className="notice error">{error}</div>}
        {loading && <div className="notice">Cargando datos reales…</div>}

        {activeView === 'panel' && !loading && (
          <div className="stack-lg">
            <section className="metrics-grid">
              <MetricCard label="Leads reales" value={String(leads.length)} detail="Entradas desde backend" />
              <MetricCard label="Casos activos" value={currentCasesLabel} detail="Leads ya convertidos al motor" />
              <MetricCard label="Agentes operativos" value={`${agents.filter((item) => item.installed).length}/6`} detail="Estado real detectado en OpenClaw" />
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
                  <p className="eyebrow">Entrada de captación</p>
                  <h3>Últimos leads reales</h3>
                </div>
              </div>
              <LeadTable leads={filteredLeads.slice(0, 5)} activeCaseLeadIds={caseLeadIds} busyLeadId={busyLeadId} onSelect={setSelectedLeadId} onConvert={handleConvertLead} />
            </section>
          </div>
        )}

        {activeView === 'casos' && !loading && (
          <div className="cases-layout">
            <section className="panel-card stack-md">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Leads reales</p>
                  <h3>Convertir en caso</h3>
                </div>
              </div>
              {filteredLeads.length === 0 ? (
                <EmptyState title="No hay leads reales todavía" body="Cuando el backend reciba leads del formulario, aparecerán aquí." />
              ) : (
                <LeadTable leads={filteredLeads} activeCaseLeadIds={caseLeadIds} busyLeadId={busyLeadId} onSelect={setSelectedLeadId} onConvert={handleConvertLead} />
              )}
            </section>

            <section className="panel-card stack-md">
              {selectedLead ? <LeadDetail lead={selectedLead} alreadyCase={caseLeadIds.has(selectedLead.id)} onConvert={handleConvertLead} busy={busyLeadId === selectedLead.id} /> : <EmptyState title="Selecciona un lead" body="Aquí verás la ficha del lead y la acción para convertirlo en caso." />}
            </section>
          </div>
        )}

        {activeView === 'fases' && !loading && (
          <section className="panel-card stack-md">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Casos activos</p>
                <h3>Motor en tiempo real</h3>
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

        {activeView === 'agentes' && !loading && (
          <section className="panel-card stack-md">
            <div className="panel-head">
              <div>
                <p className="eyebrow">OpenClaw</p>
                <h3>Estado real de los 6 agentes</h3>
              </div>
            </div>
            <div className="agent-grid">
              {agents.map((agent) => (
                <article key={agent.id} className="agent-card">
                  <p className="eyebrow">{agent.phase}</p>
                  <h4>{agent.name}</h4>
                  <p>{agent.mission}</p>
                  <DetailPair label="Output" value={agent.output} />
                  <DetailPair label="Slug" value={agent.slug ?? 'sin slug'} />
                  <DetailPair label="Estado" value={agent.status ?? 'sin estado'} />
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'casos' && selectedCase && (
          <section className="panel-card stack-md top-gap">
            <CaseDetail item={selectedCase} />
          </section>
        )}
      </main>
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
  busyLeadId,
  onSelect,
  onConvert,
}: {
  leads: LeadItem[]
  activeCaseLeadIds: Set<number>
  busyLeadId: number | null
  onSelect: (id: number) => void
  onConvert: (id: number) => void
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Lead</th>
            <th>Contacto</th>
            <th>Sector</th>
            <th>Problema</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const alreadyCase = activeCaseLeadIds.has(lead.id)
            return (
              <tr key={lead.id} onClick={() => onSelect(lead.id)} className="click-row">
                <td>
                  <strong>{lead.nombre_negocio || 'Sin negocio'}</strong>
                  <p>#{lead.id}</p>
                </td>
                <td>{lead.nombre_contacto || lead.email || 'Sin contacto'}</td>
                <td>{lead.tipo_negocio || 'Sin sector'}</td>
                <td>{lead.problema || 'Sin problema detectado'}</td>
                <td>{alreadyCase ? 'En motor' : 'Pendiente'}</td>
                <td>
                  <button
                    className="primary-btn compact-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      if (!alreadyCase) onConvert(lead.id)
                    }}
                    disabled={alreadyCase || busyLeadId === lead.id}
                  >
                    {alreadyCase ? 'Caso activo' : busyLeadId === lead.id ? 'Convirtiendo…' : 'Convertir en caso'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LeadDetail({ lead, alreadyCase, onConvert, busy }: { lead: LeadItem; alreadyCase: boolean; onConvert: (id: number) => void; busy: boolean }) {
  return (
    <>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Ficha del lead</p>
          <h3>{lead.nombre_negocio || 'Sin negocio'} · #{lead.id}</h3>
        </div>
        <span className="pill">{alreadyCase ? 'En motor' : 'Pendiente'}</span>
      </div>

      <div className="detail-grid">
        <DetailPair label="Contacto" value={lead.nombre_contacto || 'No informado'} />
        <DetailPair label="Sector" value={lead.tipo_negocio || 'No informado'} />
        <DetailPair label="WhatsApp" value={lead.whatsapp || 'No informado'} />
        <DetailPair label="Email" value={lead.email || 'No informado'} />
        <DetailPair label="Web" value={lead.website || 'No informada'} />
        <DetailPair label="Instagram" value={lead.instagram || 'No informado'} />
        <DetailPair label="Fecha" value={formatDate(lead.fecha)} />
        <DetailPair label="GDPR" value={lead.gdpr_aceptado ? 'Aceptado' : 'No'} />
      </div>

      <article className="detail-block">
        <strong>Problema detectado</strong>
        <p>{lead.problema || 'Sin texto de problema todavía.'}</p>
      </article>

      <article className="detail-block">
        <strong>Notas</strong>
        <p>{lead.notas || 'Sin notas adicionales.'}</p>
      </article>

      <button className="primary-btn" disabled={alreadyCase || busy} onClick={() => onConvert(lead.id)}>
        {alreadyCase ? 'Este lead ya es un caso activo' : busy ? 'Convirtiendo…' : 'Convertir en caso'}
      </button>
    </>
  )
}

function CaseDetail({ item }: { item: CaseItem }) {
  return (
    <>
      <div className="panel-head">
        <div>
          <p className="eyebrow">Caso activo</p>
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
        <strong>Necesidad</strong>
        <p>{item.request}</p>
      </article>

      <article className="detail-block">
        <strong>Notas</strong>
        <p>{item.notes || 'Sin notas adicionales todavía.'}</p>
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

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <p className="eyebrow">Sin datos</p>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default App
