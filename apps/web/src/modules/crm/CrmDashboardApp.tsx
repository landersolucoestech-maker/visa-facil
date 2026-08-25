import { useMemo } from 'react';
import { getCrmInitialRecords } from './mocks/mockDataProvider';
import { getFinanceInitialRecords } from '../finance/mocks/financeMockProvider';
import { getAgendaInitialEvents } from '../agenda/mocks/agendaMockProvider';

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

function href(path: string) {
  return `${basePath()}${path}` || path;
}

function formatShortDate(value: string) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
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
  const agendaEvents = useMemo(() => getAgendaInitialEvents(), []);

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

  const recentActivities = [...crmRecords]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 4);

  const upcomingAgenda = [...agendaEvents]
    .filter((event) => event.status !== 'Cancelado' && event.status !== 'Realizado')
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
    .slice(0, 3);

  const leadOrigins = ['Website', 'WhatsApp', 'Instagram', 'Facebook'].map((source) => ({
    source,
    count: crmRecords.filter((record) => record.kind === 'lead' && record.source === source).length,
  }));

  return (
    <div className="crm-shell">
      <div className="crm-workspace">
        <header className="crm-topbar">
          <div>
            <small>VISA FÁCIL · CRM</small>
            <h1>Dashboard</h1>
            <p>Visão geral do relacionamento e da operação comercial.</p>
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

        <main className="crm-content">
          <section className="crm-kpi-grid" aria-label="Indicadores do Dashboard" data-dashboard-kpi-count="6">
            <KpiCard label="Contatos" value={String(contacts)} detail="cadastrados" tone="blue" />
            <KpiCard label="Leads" value={String(leads)} detail="em acompanhamento" tone="red" />
            <KpiCard label="Clientes" value={String(clients)} detail="cadastrados" tone="navy" />
            <KpiCard label="Receitas" value={money(revenue)} detail="recebidas" tone="blue" />
            <KpiCard label="Despesas" value={money(expenses)} detail="pagas" tone="red" />
            <KpiCard label="Resultado" value={money(result)} detail="receitas − despesas" tone="navy" />
          </section>

          <section className="crm-dashboard-grid crm-dashboard-grid--top">
            <article className="crm-panel crm-dashboard-activity-card">
              <div className="crm-panel__heading">
                <h2>Atividades recentes</h2>
                <a href={href('/crm/relacionamento')}>Ver CRM</a>
              </div>
              <div className="crm-dashboard-activity-list">
                {recentActivities.length ? recentActivities.map((record) => (
                  <div className="crm-dashboard-activity-item" key={record.id}>
                    <span className={`crm-dashboard-activity-dot is-${record.kind}`} aria-hidden="true" />
                    <div>
                      <strong>{record.fullName || 'Contato sem nome'}</strong>
                      <small>{record.kind === 'lead' ? 'Lead atualizado' : 'Contato atualizado'} · {record.source || 'CRM'}</small>
                    </div>
                    <time>{new Date(record.updatedAt || record.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</time>
                  </div>
                )) : <p className="crm-dashboard-card-empty">Nenhuma atividade registrada.</p>}
              </div>
            </article>

            <article className="crm-panel crm-dashboard-agenda-card">
              <div className="crm-panel__heading">
                <h2>Agenda</h2>
                <a href={href('/crm/agenda')}>Abrir agenda</a>
              </div>
              <div className="crm-dashboard-agenda-list">
                {upcomingAgenda.length ? upcomingAgenda.map((event) => (
                  <div className="crm-dashboard-agenda-item" key={event.id}>
                    <div className="crm-dashboard-agenda-date">
                      <strong>{formatShortDate(event.date)}</strong>
                      <small>{event.startTime}</small>
                    </div>
                    <div>
                      <strong>{event.title}</strong>
                      <small>{event.location || event.type} · {event.status}</small>
                    </div>
                  </div>
                )) : <p className="crm-dashboard-card-empty">Nenhum compromisso agendado.</p>}
              </div>
            </article>

            <article className="crm-panel">
              <div className="crm-panel__heading"><h2>Origem dos leads</h2></div>
              <div className="crm-bars">
                {leadOrigins.map((origin) => (
                  <div key={origin.source}><span>{origin.source}</span><i /><b>{origin.count}</b></div>
                ))}
              </div>
            </article>
          </section>

          <section className="crm-dashboard-grid crm-dashboard-grid--bottom">
            <article className="crm-panel crm-empty-panel"><div className="crm-panel__heading"><h2>Atendimentos recentes</h2><a href={href('/crm/atendimentos')}>Ver todos</a></div><p>Nenhum atendimento registrado.</p></article>
            <article className="crm-panel crm-empty-panel"><div className="crm-panel__heading"><h2>Tarefas pendentes</h2><a href={href('/crm/tarefas')}>Ver todas</a></div><p>Nenhuma tarefa pendente.</p></article>
            <article className="crm-panel crm-empty-panel"><div className="crm-panel__heading"><h2>Conversas</h2><a href={href('/crm/atendimentos')}>Abrir central</a></div><p>Nenhuma conversa iniciada.</p></article>
          </section>
        </main>
      </div>
    </div>
  );
}

export default CrmDashboardApp;
