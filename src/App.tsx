import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'
import { SUPABASE_ANON_KEY, SUPABASE_URL, fallbackAgents, navigation, phases } from './data'
import type { CaseItem, CasePhase, LeadItem, NavigationKey } from './types'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const PHASE_BAR: CasePhase[] = [
  'Caso abierto',
  'Diagnóstico realizado',
  'Solución propuesta',
  'Demo preparada',
  'Propuesta lista',
  'Contactado',
  'Seguimiento',
]

const ALL_PHASES: CasePhase[] = [
  ...PHASE_BAR,
  'Ganado',
  'Perdido',
  'Dormido',
]

const PHASE_COLOR: Record<string, string> = {
  'Caso abierto':          'badge-gray',
  'Diagnóstico realizado': 'badge-blue',
  'Solución propuesta':    'badge-indigo',
  'Demo preparada':        'badge-violet',
  'Propuesta lista':       'badge-orange',
  'Contactado':            'badge-green-light',
  'Seguimiento':           'badge-green',
  'Ganado':                'badge-green',
  'Perdido':               'badge-gray',
  'Dormido':               'badge-gray',
}

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [activeView, setActiveView] = useState<NavigationKey>('dashboard')
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [agents] = useState(fallbackAgents)
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [busyLeadId, setBusyLeadId] = useState<number | null>(null)
  const [savingCase, setSavingCase] = useState(false)
  const [analyzingCaseId, setAnalyzingCaseId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [leadsResult, casesResult] = await Promise.all([
        supabase.from('leads').select('*').order('fecha', { ascending: false }),
        supabase.from('client_cases').select('*').order('created_at', { ascending: false }),
      ])
      if (leadsResult.error) throw leadsResult.error
      if (casesResult.error) throw casesResult.error
      const leadsData = (leadsResult.data ?? []) as LeadItem[]
      const casesData = (casesResult.data ?? []) as CaseItem[]
      setLeads(leadsData)
      setCases(casesData)
      setSelectedLeadId((c) => c ?? leadsData[0]?.id ?? null)
      setSelectedCaseId((c) => c || casesData[0]?.id || '')
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Error cargando datos'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  const handleConvertLead = async (leadId: number) => {
    setBusyLeadId(leadId)
    setError('')
    const lead = leads.find((l) => l.id === leadId)
    if (!lead) { setBusyLeadId(null); return }
    try {
      const { data: newCase, error: insertError } = await supabase
        .from('client_cases')
        .insert({
          lead_id: leadId,
          company: lead.nombre_negocio ?? 'Sin nombre',
          website: lead.website,
          sector: lead.tipo_negocio,
          origin: 'Formulario web',
          request: lead.problema,
          notes: lead.notas,
          current_phase: 'Caso abierto',
          commercial_status: 'Nuevo',
        })
        .select()
        .single()

      if (insertError) throw insertError
      if (!newCase) throw new Error('No se recibió el caso creado')

      await supabase.from('leads').update({ estado: 'Convertido a caso' }).eq('id', leadId)

      const fresh = await Promise.all([
        supabase.from('leads').select('*').order('fecha', { ascending: false }),
        supabase.from('client_cases').select('*').order('created_at', { ascending: false }),
      ])
      if (!fresh[0].error) setLeads((fresh[0].data ?? []) as LeadItem[])
      if (!fresh[1].error) setCases((fresh[1].data ?? []) as CaseItem[])

      setSelectedCaseId((newCase as CaseItem).id)
      setActiveView('casos')
      setSuccessMessage(`Lead convertido en caso: ${(newCase as CaseItem).company}`)
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Error al convertir el lead'
      setError(msg)
    } finally {
      setBusyLeadId(null)
    }
  }

  const handleSaveCase = async (caseId: string, fields: Record<string, string>) => {
    setSavingCase(true)
    const sanitized: Record<string, string | null> = Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()]),
    )
    try {
      const { error: updateError } = await supabase
        .from('client_cases')
        .update({ ...sanitized, updated_at: new Date().toISOString() })
        .eq('id', caseId)
      if (updateError) throw updateError
      const { data, error: fetchError } = await supabase
        .from('client_cases')
        .select('*')
        .order('created_at', { ascending: false })
      if (!fetchError) setCases((data ?? []) as CaseItem[])
      setSuccessMessage('Cambios guardados')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Error al guardar'
      setError(msg)
    } finally {
      setSavingCase(false)
    }
  }

  const handleGenerateAnalysis = async (caseId: string) => {
    setAnalyzingCaseId(caseId)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/generate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? `Error ${res.status}`)
      }
      const { data: fresh, error: fetchError } = await supabase
        .from('client_cases')
        .select('*')
        .order('created_at', { ascending: false })
      if (!fetchError) setCases((fresh ?? []) as CaseItem[])
      setSuccessMessage('Análisis generado correctamente')
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Error al generar el análisis'
      setError(msg)
    } finally {
      setAnalyzingCaseId(null)
    }
  }

  const caseLeadIds = useMemo(
    () => new Set<number>(cases.flatMap((c) => (typeof c.lead_id === 'number' ? [c.lead_id] : []))),
    [cases],
  )

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return leads
    return leads.filter((l) =>
      [l.id, l.nombre_negocio, l.nombre_contacto, l.tipo_negocio, l.email, l.website, l.problema]
        .join(' ').toLowerCase().includes(term),
    )
  }, [leads, search])

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return cases
    return cases.filter((c) =>
      [c.id, c.company, c.sector, c.origin, c.current_phase, c.commercial_status]
        .join(' ').toLowerCase().includes(term),
    )
  }, [cases, search])

  const selectedLead =
    filteredLeads.find((l) => l.id === selectedLeadId) ??
    leads.find((l) => l.id === selectedLeadId) ??
    null

  const selectedCase =
    filteredCases.find((c) => c.id === selectedCaseId) ??
    cases.find((c) => c.id === selectedCaseId) ??
    null

  const phaseCounts = useMemo(
    () => phases.map((p) => ({ ...p, count: cases.filter((c) => c.current_phase === p.phase).length })),
    [cases],
  )

  const viewLabels: Record<NavigationKey, string> = {
    dashboard: 'Visión general',
    leads: 'Leads',
    casos: 'Casos',
    agentes: 'Agentes',
  }

  const searchPlaceholder: Record<NavigationKey, string> = {
    dashboard: 'Buscar…',
    leads: 'Buscar por negocio, contacto, email…',
    casos: 'Buscar por empresa, sector, fase…',
    agentes: 'Buscar agente…',
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark">A</div>
            <span className="brand-name">AGENTSYST</span>
          </div>
          <nav className="nav">
            {navigation.map((item) => (
              <button
                key={item.key}
                className={`nav-item ${activeView === item.key ? 'nav-item--active' : ''}`}
                onClick={() => setActiveView(item.key)}
              >
                <span className="nav-label">{item.label}</span>
                {item.key === 'leads' && leads.length > 0 && (
                  <span className="nav-badge">{leads.length}</span>
                )}
                {item.key === 'casos' && cases.length > 0 && (
                  <span className="nav-badge">{cases.length}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-agents">
          <p className="sidebar-section-label">Fases v1</p>
          {agents.map((agent) => (
            <div key={agent.id} className="agent-row">
              <span className="agent-dot" />
              <span className="agent-row-name">{agent.phase}</span>
            </div>
          ))}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1 className="view-title">{viewLabels[activeView]}</h1>
          <div className="topbar-right">
            <input
              className="search-input"
              placeholder={searchPlaceholder[activeView]}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn-ghost" onClick={() => void loadData()}>Actualizar</button>
          </div>
        </header>

        {error && (
          <div className="notice notice--error">
            <span>{error}</span>
            <button className="notice-close" onClick={() => setError('')}>×</button>
          </div>
        )}
        {successMessage && (
          <div className="notice notice--success">
            <span>{successMessage}</span>
            <button className="notice-close" onClick={() => setSuccessMessage('')}>×</button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>Cargando datos…</span>
          </div>
        ) : (
          <div className="view-content">
            {activeView === 'dashboard' && (
              <DashboardView
                leads={leads}
                cases={cases}
                phaseCounts={phaseCounts}
                recentLeads={filteredLeads.slice(0, 5)}
                caseLeadIds={caseLeadIds}
                busyLeadId={busyLeadId}
                onSelectLead={(id) => { setSelectedLeadId(id); setActiveView('leads') }}
                onConvertLead={handleConvertLead}
              />
            )}
            {activeView === 'leads' && (
              <LeadsView
                leads={filteredLeads}
                selectedLead={selectedLead}
                caseLeadIds={caseLeadIds}
                busyLeadId={busyLeadId}
                onSelectLead={setSelectedLeadId}
                onConvertLead={handleConvertLead}
              />
            )}
            {activeView === 'casos' && (
              <CasesView
                cases={filteredCases}
                selectedCase={selectedCase}
                savingCase={savingCase}
                analyzingCaseId={analyzingCaseId}
                onSelectCase={setSelectedCaseId}
                onSaveCase={handleSaveCase}
                onGenerateAnalysis={handleGenerateAnalysis}
              />
            )}
            {activeView === 'agentes' && (
              <AgentsView agents={agents} phaseCounts={phaseCounts} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Views ────────────────────────────────────────────────────────────────────

function DashboardView({
  leads, cases, phaseCounts, recentLeads, caseLeadIds, busyLeadId, onSelectLead, onConvertLead,
}: {
  leads: LeadItem[]
  cases: CaseItem[]
  phaseCounts: Array<{ phase: CasePhase; count: number }>
  recentLeads: LeadItem[]
  caseLeadIds: Set<number>
  busyLeadId: number | null
  onSelectLead: (id: number) => void
  onConvertLead: (id: number) => void
}) {
  return (
    <div className="dashboard-layout">
      <div className="metrics-row">
        <MetricCard label="Leads" value={String(leads.length)} detail="Entradas totales" />
        <MetricCard label="Casos activos" value={String(cases.length)} detail="En el motor" />
        <MetricCard
          label="Pendientes de convertir"
          value={String(leads.filter((l) => l.estado !== 'Convertido a caso').length)}
          detail="Leads sin caso asignado"
        />
      </div>

      <section className="panel-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Pipeline</p>
            <h2 className="card-title">Casos por fase</h2>
          </div>
        </div>
        <div className="phase-chips">
          {phaseCounts.map((p) => (
            <div key={p.phase} className="phase-chip">
              <PhaseBadge phase={p.phase} />
              <span className="phase-chip-count">{p.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Captación</p>
            <h2 className="card-title">Últimos leads</h2>
          </div>
        </div>
        {recentLeads.length === 0 ? (
          <EmptyState title="Sin leads todavía" body="Los leads del formulario aparecerán aquí cuando lleguen." />
        ) : (
          <LeadTable
            leads={recentLeads}
            activeCaseLeadIds={caseLeadIds}
            busyLeadId={busyLeadId}
            onSelect={onSelectLead}
            onConvert={onConvertLead}
          />
        )}
      </section>
    </div>
  )
}

function LeadsView({
  leads, selectedLead, caseLeadIds, busyLeadId, onSelectLead, onConvertLead,
}: {
  leads: LeadItem[]
  selectedLead: LeadItem | null
  caseLeadIds: Set<number>
  busyLeadId: number | null
  onSelectLead: (id: number) => void
  onConvertLead: (id: number) => void
}) {
  return (
    <div className="split-layout">
      <section className="panel-card split-left">
        <div className="card-header">
          <div>
            <p className="eyebrow">Captación</p>
            <h2 className="card-title">Todos los leads</h2>
          </div>
          <span className="count-pill">{leads.length}</span>
        </div>
        {leads.length === 0 ? (
          <EmptyState title="Sin leads" body="Los leads del formulario aparecerán aquí cuando lleguen." />
        ) : (
          <LeadTable
            leads={leads}
            activeCaseLeadIds={caseLeadIds}
            busyLeadId={busyLeadId}
            onSelect={onSelectLead}
            onConvert={onConvertLead}
          />
        )}
      </section>

      <section className="panel-card split-right">
        {selectedLead ? (
          <LeadDetail
            lead={selectedLead}
            alreadyCase={caseLeadIds.has(selectedLead.id) || selectedLead.estado === 'Convertido a caso'}
            onConvert={onConvertLead}
            busy={busyLeadId === selectedLead.id}
          />
        ) : (
          <EmptyState title="Selecciona un lead" body="Haz clic en un lead para ver su ficha y convertirlo en caso." />
        )}
      </section>
    </div>
  )
}

function CasesView({
  cases, selectedCase, savingCase, analyzingCaseId, onSelectCase, onSaveCase, onGenerateAnalysis,
}: {
  cases: CaseItem[]
  selectedCase: CaseItem | null
  savingCase: boolean
  analyzingCaseId: string | null
  onSelectCase: (id: string) => void
  onSaveCase: (caseId: string, fields: Record<string, string>) => Promise<void>
  onGenerateAnalysis: (caseId: string) => Promise<void>
}) {
  return (
    <div className="split-layout">
      <section className="panel-card split-left">
        <div className="card-header">
          <div>
            <p className="eyebrow">Motor</p>
            <h2 className="card-title">Casos activos</h2>
          </div>
          <span className="count-pill">{cases.length}</span>
        </div>
        {cases.length === 0 ? (
          <EmptyState title="Sin casos activos" body="Convierte un lead en caso para que aparezca aquí." />
        ) : (
          <div className="case-list">
            {cases.map((c) => (
              <button
                key={c.id}
                className={`case-row ${selectedCase?.id === c.id ? 'case-row--active' : ''}`}
                onClick={() => onSelectCase(c.id)}
              >
                <div className="case-row-top">
                  <div>
                    <p className="case-row-company">{c.company}</p>
                    <p className="case-row-id">{c.id}</p>
                  </div>
                  <PhaseBadge phase={c.current_phase} />
                </div>
                <p className="case-row-detail">
                  {c.sector || '—'} · {c.commercial_status || '—'}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="panel-card split-right">
        {selectedCase ? (
          <CaseDetail
            item={selectedCase}
            savingCase={savingCase}
            analyzing={analyzingCaseId === selectedCase.id}
            onSave={(fields) => onSaveCase(selectedCase.id, fields)}
            onGenerateAnalysis={() => onGenerateAnalysis(selectedCase.id)}
          />
        ) : (
          <EmptyState title="Selecciona un caso" body="Haz clic en un caso para trabajar su ficha." />
        )}
      </section>
    </div>
  )
}

function AgentsView({
  agents, phaseCounts,
}: {
  agents: typeof fallbackAgents
  phaseCounts: Array<{ phase: CasePhase; count: number; agent: string; output: string; description: string }>
}) {
  return (
    <div className="agent-grid-layout">
      {agents.map((agent) => (
        <article key={agent.id} className="panel-card agent-card">
          <div className="agent-card-header">
            <div>
              <PhaseBadge phase={agent.phase} />
              <h3 className="agent-card-name">{agent.phase}</h3>
            </div>
            <span className="count-pill">
              {phaseCounts.find((p) => p.phase === agent.phase)?.count ?? 0}
            </span>
          </div>
          <p className="agent-card-mission">{agent.mission}</p>
          <div className="agent-card-row">
            <span className="field-label">Output esperado</span>
            <p className="field-value">{agent.output}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

// ── Case detail ───────────────────────────────────────────────────────────────

function CaseDetail({
  item, savingCase, analyzing, onSave, onGenerateAnalysis,
}: {
  item: CaseItem
  savingCase: boolean
  analyzing: boolean
  onSave: (fields: Record<string, string>) => Promise<void>
  onGenerateAnalysis: () => Promise<void>
}) {
  const currentIndex = PHASE_BAR.indexOf(item.current_phase)

  const copyDiagnosis = async () => {
    if (!item.diagnosis) return
    try { await navigator.clipboard.writeText(item.diagnosis) } catch { /* silencioso */ }
  }

  const downloadDiagnosis = () => {
    if (!item.diagnosis) return
    const blob = new Blob([item.diagnosis], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `briefing-${item.company.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="detail-scroll">
      {/* Cabecera */}
      <div className="card-header">
        <div>
          <p className="eyebrow">Caso activo</p>
          <h2 className="card-title">{item.company} · <span className="case-id">{item.id}</span></h2>
        </div>
        <select
          className="phase-select"
          value={item.current_phase}
          onChange={(e) => void onSave({ current_phase: e.target.value })}
          disabled={savingCase}
        >
          {ALL_PHASES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Barra de progreso */}
      <div className="phase-bar">
        {PHASE_BAR.map((phase, i) => (
          <div
            key={phase}
            className={`phase-step ${i < currentIndex ? 'phase-step--done' : i === currentIndex ? 'phase-step--current' : 'phase-step--pending'}`}
            title={phase}
          >
            <div className="phase-step-dot" />
            <span className="phase-step-label">{phase}</span>
          </div>
        ))}
      </div>

      {/* Datos base */}
      <div className="field-grid">
        <FieldPair label="Sector" value={item.sector ?? '—'} />
        <FieldPair label="Origen" value={item.origin ?? '—'} />
        <FieldPair label="Estado comercial" value={item.commercial_status ?? '—'} />
      </div>

      {item.website && (
        <a
          className="btn-ghost link-btn"
          href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
          target="_blank"
          rel="noreferrer"
        >
          Abrir web del cliente ↗
        </a>
      )}

      {item.request && (
        <div className="detail-block">
          <span className="field-label">Necesidad detectada</span>
          <p className="field-value">{item.request}</p>
        </div>
      )}

      {/* Zona de análisis IA */}
      <div className="analysis-zone">
        <div className="analysis-zone-header">
          <div>
            <p className="eyebrow">Diagnóstico automático</p>
            <h3 className="case-section-title">Análisis global del negocio</h3>
            {item.analysis_generated_at && (
              <p className="analysis-meta">Generado el {formatDate(item.analysis_generated_at)}</p>
            )}
          </div>
          <button
            className="btn-primary"
            disabled={analyzing || savingCase}
            onClick={() => void onGenerateAnalysis()}
          >
            {analyzing
              ? 'Generando…'
              : item.analysis_generated_at
                ? 'Regenerar análisis'
                : 'Generar análisis global'}
          </button>
        </div>

        {!item.analysis_generated_at && !analyzing && (
          <div className="analysis-status analysis-status--idle">
            <p>El análisis se generará con IA a partir de los datos del caso (sector, web, problema, notas).</p>
          </div>
        )}

        {analyzing && (
          <div className="analysis-status analysis-status--generating">
            <div className="loading-spinner" />
            <p>Analizando el negocio… puede tardar entre 10 y 30 segundos.</p>
          </div>
        )}

        {item.analysis_generated_at && !analyzing && (
          <div className="analysis-status analysis-status--done">
            <p>Briefing listo. El contenido completo está en la sección Diagnóstico a continuación.</p>
            <div className="analysis-actions">
              <button className="btn-ghost" onClick={() => void copyDiagnosis()}>
                Copiar briefing
              </button>
              <button className="btn-ghost" onClick={downloadDiagnosis}>
                Descargar .md
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Diagnóstico */}
      <CaseSection
        key={`diag-${item.id}-${item.updated_at ?? ''}`}
        eyebrow="Fase 2"
        title="Diagnóstico del negocio"
        onSave={onSave}
        savingCase={savingCase}
        fields={[
          { key: 'diagnosis',     label: 'Diagnóstico',               type: 'textarea', value: item.diagnosis },
          { key: 'opportunities', label: 'Oportunidades detectadas',   type: 'textarea', value: item.opportunities },
          { key: 'sources',       label: 'Fuentes y enlaces',          type: 'text',     value: item.sources },
        ]}
      />

      {/* Solución */}
      <CaseSection
        key={`sol-${item.id}-${item.updated_at ?? ''}`}
        eyebrow="Fase 3"
        title="Solución propuesta"
        onSave={onSave}
        savingCase={savingCase}
        fields={[
          { key: 'proposed_solution', label: 'Solución propuesta',       type: 'textarea', value: item.proposed_solution },
          { key: 'included_modules',  label: 'Módulos incluidos',         type: 'textarea', value: item.included_modules },
          { key: 'estimated_price',   label: 'Precio estimado',           type: 'text',     value: item.estimated_price },
          { key: 'difficulty',        label: 'Dificultad',                type: 'text',     value: item.difficulty },
          { key: 'tools_needed',      label: 'Herramientas necesarias',   type: 'text',     value: item.tools_needed },
        ]}
      />

      {/* Demo */}
      <CaseSection
        key={`demo-${item.id}-${item.updated_at ?? ''}`}
        eyebrow="Fase 4"
        title="Demo funcional"
        onSave={onSave}
        savingCase={savingCase}
        fields={[
          { key: 'demo_url',         label: 'Enlace a la demo',   type: 'text',     value: item.demo_url },
          { key: 'demo_status',      label: 'Estado de la demo',  type: 'select',   value: item.demo_status,
            options: ['pendiente', 'en creación', 'lista'] },
          { key: 'demo_tool',        label: 'Herramienta usada',  type: 'text',     value: item.demo_tool },
          { key: 'demo_description', label: 'Descripción',        type: 'textarea', value: item.demo_description },
          { key: 'demo_prompt',      label: 'Prompt utilizado',   type: 'textarea', value: item.demo_prompt },
          { key: 'demo_notes',       label: 'Notas de la demo',   type: 'textarea', value: item.demo_notes },
        ]}
      />

      {/* Propuesta */}
      <CaseSection
        key={`prop-${item.id}-${item.updated_at ?? ''}`}
        eyebrow="Fase 5"
        title="Propuesta comercial"
        onSave={onSave}
        savingCase={savingCase}
        fields={[
          { key: 'commercial_proposal', label: 'Propuesta escrita',       type: 'textarea', value: item.commercial_proposal },
          { key: 'whatsapp_message',    label: 'Mensaje WhatsApp',         type: 'textarea', value: item.whatsapp_message },
          { key: 'proposal_status',     label: 'Estado de la propuesta',   type: 'select',   value: item.proposal_status,
            options: ['pendiente', 'enviada', 'aceptada', 'rechazada'] },
        ]}
      />

      {/* Seguimiento */}
      <CaseSection
        key={`seg-${item.id}-${item.updated_at ?? ''}`}
        eyebrow="Fase 6–8"
        title="Contacto y seguimiento"
        onSave={onSave}
        savingCase={savingCase}
        fields={[
          { key: 'commercial_status',  label: 'Estado comercial',     type: 'select', value: item.commercial_status,
            options: ['Nuevo', 'Contactado', 'Interesado', 'Reunión agendada', 'Propuesta enviada', 'Ganado', 'Perdido', 'Dormido'] },
          { key: 'last_contact_at',    label: 'Último contacto (fecha)', type: 'date',     value: item.last_contact_at },
          { key: 'next_action',        label: 'Siguiente acción',     type: 'text',     value: item.next_action },
          { key: 'client_response',    label: 'Respuesta del cliente', type: 'textarea', value: item.client_response },
        ]}
      />

      {/* Notas e historial */}
      <CaseSection
        key={`notas-${item.id}-${item.updated_at ?? ''}`}
        eyebrow="Internos"
        title="Notas e historial"
        onSave={onSave}
        savingCase={savingCase}
        fields={[
          { key: 'notes',   label: 'Notas internas', type: 'textarea', value: item.notes },
          { key: 'history', label: 'Historial',       type: 'textarea', value: item.history },
        ]}
      />
    </div>
  )
}

// ── CaseSection ───────────────────────────────────────────────────────────────

interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'select' | 'date'
  value: string | null
  options?: string[]
}

function CaseSection({
  eyebrow, title, fields, onSave, savingCase,
}: {
  eyebrow: string
  title: string
  fields: FieldDef[]
  onSave: (fields: Record<string, string>) => Promise<void>
  savingCase: boolean
}) {
  const initial = () => Object.fromEntries(fields.map((f) => [f.key, f.value ?? '']))
  const [draft, setDraft] = useState<Record<string, string>>(initial)
  const [saving, setSaving] = useState(false)

  const isDirty = fields.some((f) => (f.value ?? '') !== draft[f.key])

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(draft) } finally { setSaving(false) }
  }

  const set = (key: string, val: string) => setDraft((d) => ({ ...d, [key]: val }))

  return (
    <div className="case-section">
      <div className="case-section-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3 className="case-section-title">{title}</h3>
        </div>
        <button
          className="btn-primary"
          disabled={saving || savingCase || !isDirty}
          onClick={() => void handleSave()}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <div className="section-fields">
        {fields.map((f) => (
          <div key={f.key} className={`field-edit ${f.type === 'textarea' ? 'field-edit--full' : ''}`}>
            <label className="field-label" htmlFor={f.key}>{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                id={f.key}
                className="field-textarea"
                value={draft[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                rows={4}
              />
            ) : f.type === 'select' ? (
              <select
                id={f.key}
                className="field-select"
                value={draft[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
              >
                <option value="">— seleccionar —</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : f.type === 'date' ? (
              <input
                id={f.key}
                type="date"
                className="field-input"
                value={draft[f.key] ? draft[f.key].slice(0, 10) : ''}
                onChange={(e) => set(f.key, e.target.value)}
              />
            ) : (
              <input
                id={f.key}
                type="text"
                className="field-input"
                value={draft[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────────────────────

function LeadTable({
  leads, activeCaseLeadIds, busyLeadId, onSelect, onConvert,
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
            <th>Negocio</th>
            <th>Contacto</th>
            <th>Sector</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const isCase = activeCaseLeadIds.has(lead.id) || lead.estado === 'Convertido a caso'
            const isBusy = busyLeadId === lead.id
            return (
              <tr key={lead.id} onClick={() => onSelect(lead.id)} className="table-row">
                <td>
                  <span className="td-primary">{lead.nombre_negocio || 'Sin nombre'}</span>
                  <span className="td-secondary">#{lead.id}</span>
                </td>
                <td>{lead.nombre_contacto || lead.email || '—'}</td>
                <td>{lead.tipo_negocio || '—'}</td>
                <td>{lead.fecha ? formatDate(lead.fecha) : '—'}</td>
                <td>
                  <span className={`status-badge ${isCase ? 'status-badge--motor' : 'status-badge--pending'}`}>
                    {isCase ? 'En motor' : 'Pendiente'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-table-action"
                    disabled={isCase || isBusy}
                    onClick={(e) => { e.stopPropagation(); if (!isCase) onConvert(lead.id) }}
                  >
                    {isCase ? 'Caso activo' : isBusy ? 'Convirtiendo…' : 'Convertir'}
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

function LeadDetail({
  lead, alreadyCase, onConvert, busy,
}: {
  lead: LeadItem
  alreadyCase: boolean
  onConvert: (id: number) => void
  busy: boolean
}) {
  return (
    <div className="detail-scroll">
      <div className="card-header">
        <div>
          <p className="eyebrow">Ficha del lead</p>
          <h2 className="card-title">{lead.nombre_negocio || 'Sin nombre'} · #{lead.id}</h2>
        </div>
        <span className={`status-badge ${alreadyCase ? 'status-badge--motor' : 'status-badge--pending'}`}>
          {alreadyCase ? 'En motor' : 'Pendiente'}
        </span>
      </div>

      <div className="field-grid">
        <FieldPair label="Contacto"       value={lead.nombre_contacto ?? '—'} />
        <FieldPair label="Sector"         value={lead.tipo_negocio ?? '—'} />
        <FieldPair label="Email"          value={lead.email ?? '—'} />
        <FieldPair label="WhatsApp"       value={lead.whatsapp ?? '—'} />
        <FieldPair label="Web"            value={lead.website ?? '—'} />
        <FieldPair label="Instagram"      value={lead.instagram ?? '—'} />
        <FieldPair label="Fecha entrada"  value={lead.fecha ? formatDate(lead.fecha) : '—'} />
        <FieldPair label="GDPR"           value={lead.gdpr_aceptado ? 'Aceptado' : 'No'} />
      </div>

      <div className="detail-block">
        <span className="field-label">Problema detectado</span>
        <p className="field-value">{lead.problema || 'Sin descripción.'}</p>
      </div>

      {lead.notas && (
        <div className="detail-block">
          <span className="field-label">Notas</span>
          <p className="field-value">{lead.notas}</p>
        </div>
      )}

      <div className="action-zone">
        <button
          className="btn-primary"
          disabled={alreadyCase || busy}
          onClick={() => onConvert(lead.id)}
        >
          {alreadyCase ? 'Este lead ya es un caso activo' : busy ? 'Convirtiendo…' : 'Convertir en caso'}
        </button>
      </div>
    </div>
  )
}

// ── Primitives ────────────────────────────────────────────────────────────────

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
    </article>
  )
}

function PhaseBadge({ phase }: { phase: CasePhase }) {
  return <span className={`phase-badge ${PHASE_COLOR[phase] ?? 'badge-gray'}`}>{phase}</span>
}

function FieldPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="field-pair">
      <span className="field-label">{label}</span>
      <p className="field-value">{value || '—'}</p>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <p className="eyebrow">Sin datos</p>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-body">{body}</p>
    </div>
  )
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

export default App
