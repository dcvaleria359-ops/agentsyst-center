import { useMemo, useState } from 'react'
import './App.css'
import {
  agents,
  architectureQueue,
  cases,
  deliveryQueue,
  diagnosisQueue,
  kpis,
  libraryAssets,
  navigation,
  productionQueue,
  timeline,
  validationQueue,
} from './data'
import type { AgentItem, CaseItem, DeliveryItem, NavigationKey } from './types'

const phaseOrder = ['Intake', 'Diagnóstico', 'Arquitectura', 'Diseño', 'Producción', 'Validación', 'Demo / Entrega'] as const

function App() {
  const [activeView, setActiveView] = useState<NavigationKey>('resumen')
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id ?? '')
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id ?? '')
  const [selectedDeliveryCaseId, setSelectedDeliveryCaseId] = useState<string>(deliveryQueue[0]?.caseId ?? '')

  const jumpToCase = (caseId: string) => {
    setSelectedCaseId(caseId)
    setActiveView('casos')
  }

  const jumpToAgentByName = (agentName: string) => {
    const agent = agents.find((item) => item.name === agentName)
    if (agent) {
      setSelectedAgentId(agent.id)
      setActiveView('agentes')
    }
  }

  const jumpToDelivery = (caseId: string) => {
    const delivery = deliveryQueue.find((item) => item.caseId === caseId)
    if (delivery) {
      setSelectedDeliveryCaseId(caseId)
      setActiveView('entrega')
    }
  }

  const currentLabel = useMemo(
    () => navigation.find((item) => item.key === activeView)?.label ?? 'Resumen',
    [activeView],
  )

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) ?? cases[0],
    [selectedCaseId],
  )

  const selectedAgent = useMemo(
    () => agents.find((item) => item.id === selectedAgentId) ?? agents[0],
    [selectedAgentId],
  )

  const selectedDelivery = useMemo(
    () => deliveryQueue.find((item) => item.caseId === selectedDeliveryCaseId) ?? deliveryQueue[0],
    [selectedDeliveryCaseId],
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">⚡</div>
          <div className="brand-block">
            <p className="eyebrow">AGENTSYST</p>
            <h1>Motor interno</h1>
            <p className="muted">Cockpit operativo para casos, agentes internos, producción y entrega.</p>
          </div>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeView === item.key ? 'active' : ''}`}
              onClick={() => setActiveView(item.key)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="eyebrow">Meta</p>
          <h3>Operativo el lunes</h3>
          <p className="muted">Caso, fase, agente actual, output esperado y siguiente handoff visibles sin fricción.</p>
        </div>
      </aside>

      <main className="main-layout">
        <header className="topbar">
          <div>
            <p className="eyebrow">Motor AGENTSYST</p>
            <h2>{currentLabel}</h2>
          </div>
          <div className="topbar-actions">
            <input className="search" placeholder="Buscar caso, agente, entrega o activo..." />
            <button className="primary-btn">Nuevo caso</button>
          </div>
        </header>

        <section className="content-grid">
          <div className="content-main">
            {activeView === 'resumen' && <SummaryView />}
            {activeView === 'casos' && (
              <CasesView
                selectedCase={selectedCase}
                onSelectCase={setSelectedCaseId}
                onJumpToAgent={jumpToAgentByName}
                onJumpToDelivery={jumpToDelivery}
              />
            )}
            {activeView === 'diagnostico' && <DiagnosisView />}
            {activeView === 'arquitectura' && <ArchitectureView />}
            {activeView === 'produccion' && <ProductionView />}
            {activeView === 'validacion' && <ValidationView />}
            {activeView === 'entrega' && (
              <DeliveryView
                selectedDelivery={selectedDelivery}
                onSelectDelivery={setSelectedDeliveryCaseId}
                onJumpToCase={jumpToCase}
                onJumpToAgent={jumpToAgentByName}
              />
            )}
            {activeView === 'biblioteca' && <LibraryView />}
            {activeView === 'agentes' && (
              <AgentsView
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgentId}
                onJumpToCase={jumpToCase}
              />
            )}
          </div>

          <aside className="activity-panel">
            <div className="panel-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Actividad reciente</p>
                  <h3>Timeline operativa</h3>
                </div>
              </div>
              <div className="timeline-list">
                {timeline.map((event) => (
                  <div key={event.id} className="timeline-item">
                    <span className={`dot ${event.tone}`}></span>
                    <div>
                      <strong>{event.title}</strong>
                      <p>{event.description}</p>
                      <small>{event.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

function SummaryView() {
  return (
    <div className="stack-lg">
      <section className="kpi-grid">
        {kpis.map((card) => (
          <article key={card.label} className="kpi-card">
            <p>{card.label}</p>
            <h3>{card.value}</h3>
            <span className={`delta ${card.tone}`}>{card.delta}</span>
          </article>
        ))}
      </section>

      <section className="panel-card stack-md">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Pipeline</p>
            <h3>Casos por fase</h3>
          </div>
        </div>
        <PipelineBoard />
      </section>

      <section className="panel-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Focos del día</p>
            <h3>Prioridades del motor</h3>
          </div>
        </div>
        <div className="priority-grid">
          <div className="mini-card">
            <strong>Casos</strong>
            <p>Entrar leads validados y dejar clara su fase, prioridad y tipo de proyecto.</p>
          </div>
          <div className="mini-card">
            <strong>Agentes</strong>
            <p>Reflejar qué agente interno tiene cada caso y cuál es el siguiente handoff.</p>
          </div>
          <div className="mini-card">
            <strong>Entrega</strong>
            <p>Llegar al lunes con visión clara de bloqueos, demos y outputs pendientes.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function CasesView({
  selectedCase,
  onSelectCase,
  onJumpToAgent,
  onJumpToDelivery,
}: {
  selectedCase?: CaseItem
  onSelectCase: (caseId: string) => void
  onJumpToAgent: (agentName: string) => void
  onJumpToDelivery: (caseId: string) => void
}) {
  return (
    <div className="stack-lg">
      <section className="panel-card stack-md">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Vista</p>
            <h3>Pipeline operativo</h3>
          </div>
        </div>
        <PipelineBoard />
      </section>
      <DataTable
        title="Casos activos del motor"
        columns={['Caso', 'Empresa', 'Vertical', 'Proyecto', 'Fase', 'Agente actual', 'Siguiente agente', 'Prioridad', 'Estado']}
        rows={cases.map((item) => [item.id, item.company, item.vertical, item.projectType, item.currentPhase, item.currentAgent, item.nextAgent, item.priority, item.status])}
      />
      <DetailSelector
        label="Ficha de caso"
        value={selectedCase?.id ?? ''}
        options={cases.map((item) => ({ value: item.id, label: `${item.id} · ${item.company}` }))}
        onChange={onSelectCase}
      />
      {selectedCase && <CaseDetailCard item={selectedCase} onJumpToAgent={onJumpToAgent} onJumpToDelivery={onJumpToDelivery} />}
    </div>
  )
}

function DiagnosisView() {
  return (
    <DataTable
      title="Cola de diagnóstico"
      columns={['Caso', 'Empresa', 'Agente', 'Problema detectado', 'Oportunidad', 'Complejidad', 'Estado informe', 'Siguiente decisión']}
      rows={diagnosisQueue.map((item) => [item.caseId, item.company, item.diagnosisAgent, item.detectedProblem, item.opportunity, item.complexity, item.reportStatus, item.nextDecision])}
    />
  )
}

function ArchitectureView() {
  return (
    <DataTable
      title="Diseño de arquitectura"
      columns={['Caso', 'Empresa', 'Solución', 'Canales', 'Agentes requeridos', 'Outputs obligatorios', 'Estado', 'Siguiente paso']}
      rows={architectureQueue.map((item) => [item.caseId, item.company, item.solutionType, item.channels, item.requiredAgents, item.mandatoryOutputs, item.architectureStatus, item.nextStep])}
    />
  )
}

function ProductionView() {
  return (
    <DataTable
      title="Ramas de producción"
      columns={['Caso', 'Empresa', 'Rama', 'Agente responsable', 'Output esperado', 'Estado', 'Bloqueo', 'Dependencia', 'Deadline']}
      rows={productionQueue.map((item) => [item.caseId, item.company, item.workstream, item.ownerAgent, item.expectedOutput, item.status, item.blocker, item.dependency, item.deadline])}
    />
  )
}

function ValidationView() {
  return (
    <DataTable
      title="QA y validación"
      columns={['Caso', 'Empresa', 'Pieza', 'Revisor', 'Estado QA', 'Incidencia', 'Acción requerida']}
      rows={validationQueue.map((item) => [item.caseId, item.company, item.asset, item.reviewer, item.qaStatus, item.issue, item.requiredAction])}
    />
  )
}

function DeliveryView({
  selectedDelivery,
  onSelectDelivery,
  onJumpToCase,
  onJumpToAgent,
}: {
  selectedDelivery?: DeliveryItem
  onSelectDelivery: (caseId: string) => void
  onJumpToCase: (caseId: string) => void
  onJumpToAgent: (agentName: string) => void
}) {
  return (
    <div className="stack-lg">
      <DataTable
        title="Demo / entrega"
        columns={['Caso', 'Empresa', 'Tipo de entrega', 'Estado', 'Faltantes', 'Responsable', 'Fecha objetivo']}
        rows={deliveryQueue.map((item) => [item.caseId, item.company, item.deliveryType, item.demoStatus, item.missingItems, item.owner, item.targetDate])}
      />
      <DetailSelector
        label="Ficha de entrega"
        value={selectedDelivery?.caseId ?? ''}
        options={deliveryQueue.map((item) => ({ value: item.caseId, label: `${item.caseId} · ${item.company}` }))}
        onChange={onSelectDelivery}
      />
      {selectedDelivery && <DeliveryDetailCard item={selectedDelivery} onJumpToCase={onJumpToCase} onJumpToAgent={onJumpToAgent} />}
    </div>
  )
}

function LibraryView() {
  return (
    <DataTable
      title="Biblioteca operativa"
      columns={['Activo', 'Tipo', 'Dominio', 'Uso', 'Actualizado', 'Owner']}
      rows={libraryAssets.map((asset) => [asset.title, asset.type, asset.domain, asset.usage, asset.updatedAt, asset.owner])}
    />
  )
}

function AgentsView({
  selectedAgent,
  onSelectAgent,
  onJumpToCase,
}: {
  selectedAgent?: AgentItem
  onSelectAgent: (agentId: string) => void
  onJumpToCase: (caseId: string) => void
}) {
  return (
    <div className="stack-lg">
      <DataTable
        title="Agentes internos AGENTSYST"
        columns={['Agente', 'Misión', 'Fase', 'Input', 'Output', 'Estado', 'Handoff siguiente']}
        rows={agents.map((agent) => [agent.name, agent.mission, agent.phase, agent.input, agent.output, agent.status, agent.handoffTo])}
      />
      <DetailSelector
        label="Ficha de agente"
        value={selectedAgent?.id ?? ''}
        options={agents.map((item) => ({ value: item.id, label: item.name }))}
        onChange={onSelectAgent}
      />
      {selectedAgent && <AgentDetailCard item={selectedAgent} onJumpToCase={onJumpToCase} />}
    </div>
  )
}

function PipelineBoard() {
  return (
    <div className="pipeline-grid">
      {phaseOrder.map((phase) => {
        const phaseCases = cases.filter((item) => item.currentPhase === phase)
        return (
          <div key={phase} className="phase-column">
            <div className="phase-head">
              <strong>{phase}</strong>
              <span className="count-badge">{phaseCases.length}</span>
            </div>
            <div className="phase-stack">
              {phaseCases.length === 0 && <p className="muted">Sin casos</p>}
              {phaseCases.map((item) => (
                <article key={item.id} className="mini-card phase-card">
                  <div className="phase-card-top">
                    <strong>{item.id}</strong>
                    <StatusBadge kind={item.status} />
                  </div>
                  <p className="phase-company">{item.company}</p>
                  <p className="muted">{item.projectType}</p>
                  <div className="phase-meta">
                    <PriorityBadge priority={item.priority} />
                    <span className="agent-chip">{item.currentAgent}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DetailSelector({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <section className="panel-card stack-md">
      <div className="panel-head compact-head">
        <div>
          <p className="eyebrow">Detalle</p>
          <h3>{label}</h3>
        </div>
        <select className="select-input" value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  )
}

function CaseDetailCard({
  item,
  onJumpToAgent,
  onJumpToDelivery,
}: {
  item: CaseItem
  onJumpToAgent: (agentName: string) => void
  onJumpToDelivery: (caseId: string) => void
}) {
  const hasDelivery = deliveryQueue.some((delivery) => delivery.caseId === item.id)

  return (
    <section className="panel-card stack-md">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Ficha de caso</p>
          <h3>{item.id} · {item.company}</h3>
        </div>
        <div className="badge-row">
          <PriorityBadge priority={item.priority} />
          <StatusBadge kind={item.status} />
        </div>
      </div>
      <div className="action-row">
        <button className="secondary-btn" onClick={() => onJumpToAgent(item.currentAgent)}>Ver agente actual</button>
        <button className="secondary-btn" onClick={() => onJumpToAgent(item.nextAgent)}>Ver siguiente agente</button>
        <button className="secondary-btn" onClick={() => hasDelivery && onJumpToDelivery(item.id)} disabled={!hasDelivery}>Ver entrega</button>
      </div>
      <div className="detail-grid">
        <DetailBlock title="Cabecera" items={[
          ['Vertical', item.vertical],
          ['Proyecto', item.projectType],
          ['Prioridad', item.priority],
          ['Estado', item.status],
          ['Fase actual', item.currentPhase],
        ]} />
        <DetailBlock title="Orquestación" items={[
          ['Agente actual', item.currentAgent],
          ['Siguiente agente', item.nextAgent],
          ['Output esperado', item.expectedOutput],
          ['Deadline', item.targetDate],
          ['Bloqueo', item.blocker],
        ]} />
        <DetailBlock title="Contexto" items={[
          ['Origen', item.origin],
          ['Necesidad', item.need],
          ['Diagnóstico', item.diagnosisSummary],
          ['Nota estratégica', item.strategyNote],
        ]} />
        <DetailBlock title="Producción" items={[
          ['Ramas activas', item.activeWorkstreams.join(' · ')],
          ['Piezas en curso', item.expectedOutput],
          ['Dependencias', item.dependencies.join(' · ')],
          ['Soporte Dev', item.devSupport],
        ]} />
        <DetailBlock title="Entrega" items={[
          ['Tipo', item.deliveryType],
          ['Estado', item.deliveryStatus],
          ['Faltantes', item.missingItems.join(' · ')],
          ['Fecha objetivo', item.targetDate],
        ]} />
      </div>
      <div className="detail-grid detail-grid-two">
        <ChecklistCard items={item.checklist} />
        <HistoryCard items={item.history} />
      </div>
    </section>
  )
}

function AgentDetailCard({ item, onJumpToCase }: { item: AgentItem; onJumpToCase: (caseId: string) => void }) {
  const activeCases = cases.filter((caseItem) => caseItem.currentAgent === item.name)
  const waitingCases = cases.filter((caseItem) => caseItem.nextAgent === item.name)

  return (
    <section className="panel-card stack-md">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Ficha de agente</p>
          <h3>{item.name}</h3>
        </div>
        <StatusBadge kind={item.status} />
      </div>
      <div className="detail-grid detail-grid-two">
        <DetailBlock title="Identidad" items={[
          ['Fase', item.phase],
          ['Estado', item.status],
        ]} />
        <DetailBlock title="Función" items={[
          ['Misión', item.mission],
          ['Cuándo entra', `En fase ${item.phase}`],
          ['Qué decide', 'Produce su output mínimo y habilita el siguiente handoff'],
        ]} />
        <DetailBlock title="Operativa" items={[
          ['Input', item.input],
          ['Output', item.output],
          ['Handoff', item.handoffTo],
          ['Bloqueos típicos', 'Input incompleto / dependencia pendiente / validación faltante'],
        ]} />
        <DetailBlock title="Carga" items={[
          ['Casos activos', `${activeCases.length}`],
          ['Casos en espera', `${waitingCases.length}`],
          ['Completados', 'N/D en esta V1'],
        ]} />
      </div>
      <LinkedCasesCard title="Casos activos del agente" casesList={activeCases} onJumpToCase={onJumpToCase} emptyLabel="No tiene casos activos ahora." />
      <LinkedCasesCard title="Casos esperando este agente" casesList={waitingCases} onJumpToCase={onJumpToCase} emptyLabel="Ningún caso está en cola para este agente." />
    </section>
  )
}

function DeliveryDetailCard({
  item,
  onJumpToCase,
  onJumpToAgent,
}: {
  item: DeliveryItem
  onJumpToCase: (caseId: string) => void
  onJumpToAgent: (agentName: string) => void
}) {
  const linkedCase = cases.find((caseItem) => caseItem.id === item.caseId)

  return (
    <section className="panel-card stack-md">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Ficha de demo / entrega</p>
          <h3>{item.caseId} · {item.company}</h3>
        </div>
        <StatusBadge kind={item.demoStatus} />
      </div>
      <div className="action-row">
        <button className="secondary-btn" onClick={() => onJumpToCase(item.caseId)}>Ver caso</button>
        <button className="secondary-btn" onClick={() => linkedCase && onJumpToAgent(linkedCase.currentAgent)} disabled={!linkedCase}>Ver agente actual</button>
      </div>
      <div className="detail-grid detail-grid-two">
        <DetailBlock title="Cabecera" items={[
          ['Tipo de entrega', item.deliveryType],
          ['Responsable', item.owner],
          ['Fecha objetivo', item.targetDate],
        ]} />
        <DetailBlock title="Estado" items={[
          ['Demo-ready', item.demoStatus],
          ['Faltantes', item.missingItems],
          ['Riesgo', item.demoStatus.includes('Bloqueada') ? 'Alto' : 'Controlado'],
          ['Decisión pendiente', 'Validar cierre o corregir activos'],
        ]} />
        <DetailBlock title="Assets" items={[
          ['Landing', 'Si aplica según caso'],
          ['Agente conversacional', 'Incluido si el sistema lo requiere'],
          ['Backend', 'Validar si existe dependencia técnica'],
          ['Panel / documentación', 'Añadir según demo final'],
        ]} />
        <DetailBlock title="Validación" items={[
          ['QA completada', 'Pendiente en esta V1'],
          ['Incidencias abiertas', item.missingItems],
          ['Aprobador final', 'Vera / Val'],
        ]} />
      </div>
      <ReadinessCard items={item.readiness} />
    </section>
  )
}

function LinkedCasesCard({
  title,
  casesList,
  onJumpToCase,
  emptyLabel,
}: {
  title: string
  casesList: CaseItem[]
  onJumpToCase: (caseId: string) => void
  emptyLabel: string
}) {
  return (
    <section className="panel-card stack-md">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Relación</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="linked-list">
        {casesList.length === 0 && <p className="muted">{emptyLabel}</p>}
        {casesList.map((caseItem) => (
          <button key={caseItem.id} className="linked-item" onClick={() => onJumpToCase(caseItem.id)}>
            <strong>{caseItem.id}</strong>
            <span>{caseItem.company}</span>
            <small>{caseItem.currentPhase}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

function DetailBlock({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <article className="mini-card detail-block">
      <strong>{title}</strong>
      <div className="detail-list">
        {items.map(([label, value]) => (
          <div key={`${title}-${label}`} className="detail-row">
            <span>{label}</span>
            <p>{value}</p>
          </div>
        ))}
      </div>
    </article>
  )
}

function ChecklistCard({ items }: { items: { label: string; done: boolean }[] }) {
  return (
    <article className="mini-card detail-block">
      <strong>Checklist operativa</strong>
      <div className="detail-list">
        {items.map((item) => (
          <div key={item.label} className="check-row">
            <span className={`check-dot ${item.done ? 'done' : 'pending'}`}></span>
            <p>{item.label}</p>
          </div>
        ))}
      </div>
    </article>
  )
}

function HistoryCard({ items }: { items: { label: string; time: string; tone: 'info' | 'success' | 'warning' }[] }) {
  return (
    <article className="mini-card detail-block">
      <strong>Historial corto</strong>
      <div className="detail-list">
        {items.map((item) => (
          <div key={`${item.label}-${item.time}`} className="history-row">
            <span className={`dot ${item.tone}`}></span>
            <div>
              <p>{item.label}</p>
              <small>{item.time}</small>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function ReadinessCard({ items }: { items: { label: string; status: string }[] }) {
  return (
    <section className="panel-card stack-md">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Readiness</p>
          <h3>Checklist de entrega</h3>
        </div>
      </div>
      <div className="readiness-grid">
        {items.map((item) => (
          <article key={item.label} className="mini-card detail-block">
            <strong>{item.label}</strong>
            <StatusBadge kind={item.status} />
          </article>
        ))}
      </div>
    </section>
  )
}

function StatusBadge({ kind }: { kind: string }) {
  const tone = getTone(kind)
  return <span className={`status-badge ${tone}`}>{kind}</span>
}

function PriorityBadge({ priority }: { priority: string }) {
  const tone = priority === 'Alta' ? 'warning' : priority === 'Media' ? 'neutral' : 'success'
  return <span className={`status-badge ${tone}`}>{priority}</span>
}

function getTone(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('bloque')) return 'warning'
  if (normalized.includes('alta')) return 'warning'
  if (normalized.includes('activo')) return 'success'
  if (normalized.includes('ready')) return 'success'
  if (normalized.includes('complet')) return 'success'
  if (normalized.includes('disponible')) return 'neutral'
  return 'neutral'
}

function DataTable({
  title,
  columns,
  rows,
}: {
  title: string
  columns: string[]
  rows: string[][]
}) {
  return (
    <section className="panel-card stack-md">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Vista</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${title}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${title}-${index}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default App
