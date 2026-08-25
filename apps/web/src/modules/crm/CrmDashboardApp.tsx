import { useMemo } from 'react';
import { getCrmInitialRecords } from './mocks/mockDataProvider';
import { getFinanceInitialRecords } from '../finance/mocks/financeMockProvider';

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const RECENT_ACTIVITIES = [
  { name: 'André', activity: 'Novo lead via WhatsApp', time: 'há 8 min' },
  { name: 'Juliana', activity: 'Alterada para qualificado', time: 'há 24 min' },
  { name: 'Camila', activity: 'Follow-up realizado', time: 'há 1 h' },
  { name: 'Mariana', activity: 'Contato atualizado', time: 'há 2 h' },
];

const TODAY_AGENDA = [
  { time: '09:30', label: 'Entrevista', meta: 'Cliente · Confirmado' },
  { time: '14:00', label: 'Reunião', meta: 'Lead · Pendente' },
  { time: '16:30', label: 'Follow-up', meta: 'Cliente · Confirmado' },
];

const LEAD_ORIGINS = [
  { source: 'WhatsApp', count: 4 },
  { source: 'Instagram', count: 3 },
  { source: 'Indicação', count: 2 },
  { source: 'Website', count: 1 },
];

const PENDING_ITEMS = [
  { count: 2, label: 'Follow-ups', detail: 'para concluir hoje', priority: 'Alta' },
  { count: 1, label: 'Lead aguardando resposta', detail: 'sem retorno', priority: 'Média' },
  { count: 3, label: 'Tarefas', detail: 'em aberto', priority: 'Normal' },
  { count: 1, label: 'Atendimento não lido', detail: 'requer atenção', priority: 'Alta' },
];

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

function href(path: string) {
  return `${basePath()}${path}` || path;
}

function KpiCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'blue' | 'red' | 'navy' }) {
  return (
    <article className={`crm-kpi-card crm-dashboard-kpi crm-dashboard-kpi--${tone}`} data-dashboard-kpi={label}>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

export function CrmDashboardApp() {
  const crmRecords = useMemo(() => getCrmInitialRecords(), []);
  const financeRecords = useMemo(() => getFinanceInitialRecords(), []);

  const contacts = crmRecords.filter((record) => record.kind === 'contact').length;
  const leads = crmRecords.filter((record) => record.kind === 'lead').length;
  const clients = crmRecords.filter((record) => record.kind === 'contact' && record.relationship === 'Cliente').length;

  const revenue = financeRecords
    .filter((record) => record.type === 'Receita' && record.status === 'Recebido')
    .reduce((total, record) => total + record.amount, 0);
  const expenses = financeRecords
    .filter((record) => record.type === 'Despesa' && record.status === 'Pago')
    .reduce((total, record) => total + record.amount, 0);
  const result = revenue - expenses;

  const maxOrigin = Math.max(...LEAD_ORIGINS.map((item) => item.count), 1);
  const originTotal = LEAD_ORIGINS.reduce((total, item) => total + item.count, 0);
  const pendingTotal = PENDING_ITEMS.reduce((total, item) => total + item.count, 0);

  return (
    <div className="crm-shell">
      <div className="crm-workspace">
        <header className="crm-topbar crm-dashboard-topbar">
          <div>
            <h1>DASHBOARD</h1>
            <p>Visão geral da operação</p>
          </div>
          <div className="crm-topbar-actions">
            <button type="button" aria-label="Alertas">⌁</button>
            <div className="crm-user-menu">
              <button className="crm-user" type="button" aria-haspopup="menu">
                <span>VF</span>
                <div><strong>Administrador</strong><small>Protótipo frontend</small></div>
                <span className="crm-user-caret" aria-hidden="true">⌄</span>
              </button>
              <div className="crm-user-dropdown" role="menu">
                <button type="button" role="menuitem">Perfil</button>
                <a role="menuitem" href={href('/crm/configuracoes')}>Configurações</a>
                <button type="button" role="menuitem" className="is-danger">Logout</button>
              </div>
            </div>
          </div>
        </header>

        <main className="crm-content crm-dashboard-content">
          <section className="crm-kpi-grid" aria-label="Indicadores do Dashboard" data-dashboard-kpi-count="6">
            <KpiCard label="Contatos" value={String(contacts)} detail="cadastrados" tone="blue" />
            <KpiCard label="Leads" value={String(leads)} detail="em acompanhamento" tone="red" />
            <KpiCard label="Clientes" value={String(clients)} detail="cadastrados" tone="navy" />
            <KpiCard label="Receitas" value={money(revenue)} detail="recebidas" tone="blue" />
            <KpiCard label="Despesas" value={money(expenses)} detail="pagas" tone="red" />
            <KpiCard label="Resultado" value={money(result)} detail="receitas − despesas" tone="navy" />
          </section>

          <section className="crm-dashboard-grid crm-dashboard-overview-grid">
            <article className="crm-panel crm-dashboard-summary-card crm-dashboard-activity-card">
              <div className="crm-dashboard-card-heading">
                <div><h2>ATIVIDADES RECENTES</h2><p>Movimentações mais recentes do CRM</p></div>
                <a href={href('/crm/relacionamento')}>Ver todas</a>
              </div>
              <ul className="crm-dashboard-activity-list">
                {RECENT_ACTIVITIES.map((item) => (
                  <li key={item.name}>
                    <span className="crm-dashboard-activity-marker" aria-hidden="true" />
                    <div className="crm-dashboard-activity-copy">
                      <strong>{item.name}</strong>
                      <span>{item.activity}</span>
                    </div>
                    <time>{item.time}</time>
                  </li>
                ))}
              </ul>
            </article>

            <article className="crm-panel crm-dashboard-summary-card crm-dashboard-agenda-card">
              <div className="crm-dashboard-card-heading">
                <div><h2>AGENDA</h2><p>Compromissos de hoje</p></div>
                <a href={href('/crm/agenda')}>Abrir agenda</a>
              </div>
              <div className="crm-dashboard-section-meta">
                <span>Hoje</span>
                <strong>{TODAY_AGENDA.length} compromissos</strong>
              </div>
              <div className="crm-dashboard-agenda-list">
                {TODAY_AGENDA.map((item) => (
                  <div className="crm-dashboard-agenda-row" key={`${item.time}-${item.label}`}>
                    <time>{item.time}</time>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.meta}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="crm-dashboard-grid crm-dashboard-overview-grid">
            <article className="crm-panel crm-dashboard-summary-card crm-dashboard-origin-card">
              <div className="crm-dashboard-card-heading">
                <div><h2>ORIGEM DOS LEADS</h2><p>Distribuição por canal de aquisição</p></div>
                <span className="crm-dashboard-card-total">{originTotal} leads</span>
              </div>
              <div className="crm-dashboard-origin-chart" role="img" aria-label="Gráfico horizontal de origem dos leads">
                {LEAD_ORIGINS.map((item) => (
                  <div className="crm-dashboard-origin-row" key={item.source}>
                    <div className="crm-dashboard-origin-label"><span>{item.source}</span><strong>{item.count}</strong></div>
                    <div className="crm-dashboard-origin-track">
                      <span style={{ width: `${(item.count / maxOrigin) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="crm-panel crm-dashboard-summary-card crm-dashboard-pending-card">
              <div className="crm-dashboard-card-heading">
                <div><h2>PENDÊNCIAS</h2><p>Itens que precisam de atenção</p></div>
                <span className="crm-dashboard-card-total">{pendingTotal} abertas</span>
              </div>
              <div className="crm-dashboard-pending-list">
                {PENDING_ITEMS.map((item) => (
                  <div className="crm-dashboard-pending-item" key={item.label}>
                    <strong className="crm-dashboard-pending-number">{item.count}</strong>
                    <div><strong>{item.label}</strong><small>{item.detail}</small></div>
                    <span className={`crm-dashboard-priority is-${item.priority.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}>{item.priority}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

export default CrmDashboardApp;
