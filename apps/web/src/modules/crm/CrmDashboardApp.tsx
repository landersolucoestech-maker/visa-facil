import { useMemo } from 'react';
import { getCrmInitialRecords } from './mocks/mockDataProvider';
import { getFinanceInitialRecords } from '../finance/mocks/financeMockProvider';

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const RECENT_ACTIVITIES = [
  { name: 'André', activity: 'Novo lead via WhatsApp' },
  { name: 'Juliana', activity: 'Alterada para qualificado' },
  { name: 'Camila', activity: 'Follow-up realizado' },
  { name: 'Mariana', activity: 'Contato atualizado' },
];

const TODAY_AGENDA = [
  { time: '09:30', label: 'Entrevista' },
  { time: '14:00', label: 'Reunião' },
  { time: '16:30', label: 'Follow-up' },
];

const LEAD_ORIGINS = [
  { source: 'WhatsApp', count: 4 },
  { source: 'Instagram', count: 3 },
  { source: 'Indicação', count: 2 },
  { source: 'Website', count: 1 },
];

const PENDING_ITEMS = [
  { count: 2, label: 'follow-ups' },
  { count: 1, label: 'lead aguardando resposta' },
  { count: 3, label: 'tarefas' },
  { count: 1, label: 'atendimento não lido' },
];

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

function href(path: string) {
  return `${basePath()}${path}` || path;
}

function KpiCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'blue' | 'red' | 'navy' }) {
  return (
    <article className="crm-kpi-card" data-dashboard-kpi={label}>
      <span className={`crm-kpi-card__icon crm-kpi-card__icon--${tone}`}>●</span>
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
            <article className="crm-panel crm-dashboard-summary-card">
              <div className="crm-panel__heading"><h2>ATIVIDADES RECENTES</h2></div>
              <ul className="crm-dashboard-simple-list crm-dashboard-activity-preview">
                {RECENT_ACTIVITIES.map((item) => (
                  <li key={item.name}>
                    <strong>{item.name}</strong>
                    <span>· {item.activity}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="crm-panel crm-dashboard-summary-card">
              <div className="crm-panel__heading"><h2>AGENDA</h2></div>
              <div className="crm-dashboard-agenda-preview">
                <strong className="crm-dashboard-agenda-day">Hoje</strong>
                <ul className="crm-dashboard-simple-list crm-dashboard-time-list">
                  {TODAY_AGENDA.map((item) => (
                    <li key={`${item.time}-${item.label}`}>
                      <strong>{item.time}</strong>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </section>

          <section className="crm-dashboard-grid crm-dashboard-overview-grid">
            <article className="crm-panel crm-dashboard-summary-card">
              <div className="crm-panel__heading"><h2>ORIGEM DOS LEADS</h2></div>
              <ul className="crm-dashboard-simple-list crm-dashboard-origin-list">
                {LEAD_ORIGINS.map((item) => (
                  <li key={item.source}>
                    <span>{item.source}</span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
              </ul>
            </article>

            <article className="crm-panel crm-dashboard-summary-card">
              <div className="crm-panel__heading"><h2>PENDÊNCIAS</h2></div>
              <ul className="crm-dashboard-simple-list crm-dashboard-pending-list">
                {PENDING_ITEMS.map((item) => (
                  <li key={item.label}>
                    <strong>{item.count}</strong>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

export default CrmDashboardApp;
