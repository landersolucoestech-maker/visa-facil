import type { Client } from '../../clients/types/client';
import { DESTINATION_LABELS, PROCESS_STAGE_LABELS, type VisaProcess } from '../../processes/types/process';
import type { DocumentItem } from '../../documents/types/document';
import type { ServiceInteraction } from '../../interactions/types/interaction';
import type { ManagementTask } from '../../tasks/types/task';
import type { FinancialEntry } from '../../finance/types/finance';

type ManagementDashboardPageProps = {
  clients: Client[];
  processes: VisaProcess[];
  documents: DocumentItem[];
  interactions: ServiceInteraction[];
  tasks: ManagementTask[];
  financialEntries: FinancialEntry[];
};

const stageOrder: VisaProcess['stage'][] = ['diagnosis', 'documents', 'forms', 'scheduling', 'preparation', 'submitted', 'completed'];
const stageColors = ['#0D47A1', '#E31B23', '#3C5AA6', '#7EA6E8', '#8AA0BE', '#59A14F', '#CBD5E1'];
const destinationOrder: VisaProcess['destination'][] = ['usa', 'canada', 'australia', 'europe-schengen'];

function currency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function ManagementDashboardPage({ clients, processes, documents, interactions, tasks, financialEntries }: ManagementDashboardPageProps) {
  const openTasks = tasks.filter((task) => task.status === 'open');
  const incomes = financialEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amountCents, 0);
  const expenses = financialEntries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amountCents, 0);
  const profit = incomes - expenses;

  const metrics = [
    { label: 'Clientes', value: clients.length, note: `${clients.filter((client) => client.status === 'active').length} ativo(s)`, tone: 'blue', icon: '◎' },
    { label: 'Processos', value: processes.length, note: `${processes.filter((process) => !['completed', 'cancelled'].includes(process.stage)).length} em andamento`, tone: 'red', icon: '▣' },
    { label: 'Documentos', value: documents.length, note: `${documents.filter((item) => item.required && !item.received).length} pendência(s)`, tone: 'navy', icon: '▤' },
    { label: 'Atendimentos', value: interactions.length, note: 'sessão atual', tone: 'red', icon: '◉' },
    { label: 'Tarefas', value: openTasks.length, note: `${tasks.filter((task) => task.status === 'done').length} concluída(s)`, tone: 'blue', icon: '✓' },
  ];

  const stageCounts = stageOrder.map((stage) => ({ stage, count: processes.filter((process) => process.stage === stage).length }));
  const stageTotal = Math.max(processes.length, 1);
  let cursor = 0;
  const donutStops = stageCounts.map((item, index) => {
    const start = cursor;
    const end = cursor + (item.count / stageTotal) * 360;
    cursor = end;
    return `${stageColors[index]} ${start}deg ${end}deg`;
  });
  const donutStyle = processes.length > 0 ? `conic-gradient(${donutStops.join(', ')})` : 'conic-gradient(#e8edf4 0deg 360deg)';

  const destinationCounts = destinationOrder.map((destination) => ({ destination, count: processes.filter((process) => process.destination === destination).length }));
  const maxDestination = Math.max(...destinationCounts.map((item) => item.count), 1);
  const latestInteractions = [...interactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 5);
  const latestTasks = openTasks.slice(0, 5);

  return (
    <section className="management-page management-dashboard management-dashboard--approved" aria-labelledby="management-dashboard-title">
      <div className="approved-dashboard-heading">
        <div><h1 id="management-dashboard-title">Dashboard</h1><p>Visão geral do sistema</p></div>
        <span className="approved-dashboard-badge">Frontend · dev</span>
      </div>

      <div className="approved-kpis" aria-label="Indicadores operacionais">
        {metrics.map((metric) => <article className={`approved-kpi approved-kpi--${metric.tone}`} key={metric.label}><span className="approved-kpi__icon">{metric.icon}</span><div><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></div></article>)}
      </div>

      <div className="approved-dashboard-row approved-dashboard-row--charts">
        <section className="approved-panel">
          <h2>Processos por Status</h2>
          <div className="approved-status-layout">
            <div className="approved-donut" style={{ background: donutStyle }}><span>{processes.length}</span></div>
            <div className="approved-legend">{stageCounts.slice(0, 5).map((item, index) => <div key={item.stage}><i style={{ background: stageColors[index] }} /><span>{PROCESS_STAGE_LABELS[item.stage]}</span><strong>{item.count}</strong></div>)}</div>
          </div>
        </section>

        <section className="approved-panel">
          <h2>Processos por Destino</h2>
          <div className="approved-bars">{destinationCounts.map((item) => <div className="approved-bar-row" key={item.destination}><span>{DESTINATION_LABELS[item.destination]}</span><div><i style={{ width: `${(item.count / maxDestination) * 100}%` }} /></div><strong>{item.count}</strong></div>)}</div>
        </section>

        <section className="approved-panel approved-finance-panel">
          <div className="approved-panel-heading"><h2>Financeiro (Resumo)</h2><a href="/app/financeiro">Ver módulo</a></div>
          <div className="approved-finance-grid"><div><span>Receitas</span><strong>{currency(incomes)}</strong></div><div><span>Despesas</span><strong>{currency(expenses)}</strong></div></div>
          <div className="approved-profit"><span>Resultado</span><strong>{currency(profit)}</strong><small>Valores registrados na sessão atual</small></div>
        </section>
      </div>

      <div className="approved-dashboard-row approved-dashboard-row--bottom">
        <section className="approved-panel approved-table-panel">
          <div className="approved-panel-heading"><h2>Atendimentos Recentes</h2><a href="/app/atendimentos">Ver todos</a></div>
          {latestInteractions.length === 0 ? <div className="approved-panel-empty">Nenhum atendimento registrado nesta sessão.</div> : <div className="approved-mini-table"><div className="approved-mini-table__head"><span>Cliente</span><span>Assunto</span><span>Canal</span><span>Data</span></div>{latestInteractions.map((interaction) => { const client = clients.find((item) => item.id === interaction.clientId); return <div className="approved-mini-table__row" key={interaction.id}><span>{client?.fullName ?? 'Cliente'}</span><strong>{interaction.subject}</strong><span>{interaction.channel}</span><span>{new Date(interaction.occurredAt).toLocaleDateString('pt-BR')}</span></div>; })}</div>}
        </section>

        <section className="approved-panel approved-tasks-panel">
          <div className="approved-panel-heading"><h2>Tarefas Pendentes</h2><a href="/app/tarefas">Ver todas</a></div>
          {latestTasks.length === 0 ? <div className="approved-panel-empty">Nenhuma tarefa pendente nesta sessão.</div> : <div className="approved-task-list">{latestTasks.map((task) => { const client = clients.find((item) => item.id === task.clientId); return <article key={task.id}><i /><div><strong>{task.title}</strong><small>{client?.fullName ?? 'Sem cliente específico'}{task.dueDate ? ` · ${new Date(`${task.dueDate}T00:00:00`).toLocaleDateString('pt-BR')}` : ''}</small></div><span className={`approved-priority approved-priority--${task.priority}`}>{task.priority}</span></article>; })}</div>}
        </section>
      </div>

      <p className="approved-dashboard-footnote">Os indicadores refletem apenas os registros temporários da sessão atual. Nenhum dado é enviado a servidor nesta fase frontend.</p>
    </section>
  );
}
