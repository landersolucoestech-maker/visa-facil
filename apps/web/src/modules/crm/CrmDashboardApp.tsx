import { useMemo } from 'react';
import { getCrmInitialRecords } from './mocks/mockDataProvider';
import { getFinanceInitialRecords } from '../finance/mocks/financeMockProvider';

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

function href(path: string) {
  return `${basePath()}${path}` || path;
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

  const kpis = [
    { label: 'Contatos', value: String(contacts), detail: 'cadastrados', tone: 'blue' },
    { label: 'Leads', value: String(leads), detail: 'em acompanhamento', tone: 'red' },
    { label: 'Clientes', value: String(clients), detail: 'cadastrados', tone: 'navy' },
    { label: 'Receitas', value: money(revenue), detail: 'recebidas', tone: 'blue' },
    { label: 'Despesas', value: money(expenses), detail: 'pagas', tone: 'red' },
    { label: 'Resultado', value: money(result), detail: 'receitas − despesas', tone: 'navy' },
  ] as const;

  const leadCounts = {
    Novo: crmRecords.filter((record) => record.kind === 'lead' && record.leadStatus === 'Novo').length,
    'Em contato': crmRecords.filter((record) => record.kind === 'lead' && record.leadStatus === 'Em contato').length,
    Qualificado: crmRecords.filter((record) => record.kind === 'lead' && record.leadStatus === 'Qualificado').length,
    Convertido: crmRecords.filter((record) => record.kind === 'lead' && record.leadStatus === 'Convertido').length,
  };

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
          <section className="crm-kpi-grid" aria-label="Indicadores do Dashboard">
            {kpis.map((item) => (
              <article key={item.label} className="crm-kpi-card" data-dashboard-kpi={item.label}>
                <span className={`crm-kpi-card__icon crm-kpi-card__icon--${item.tone}`}>●</span>
                <div>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="crm-dashboard-grid crm-dashboard-grid--top">
            <article className="crm-panel">
              <div className="crm-panel__heading"><h2>Leads por status</h2></div>
              <div className="crm-donut-wrap">
                <div className="crm-donut">{leads}</div>
                <ul>
                  <li><span className="dot dot--blue" />Novo <b>{leadCounts.Novo}</b></li>
                  <li><span className="dot dot--red" />Em contato <b>{leadCounts['Em contato']}</b></li>
                  <li><span className="dot dot--navy" />Qualificado <b>{leadCounts.Qualificado}</b></li>
                  <li><span className="dot dot--soft" />Convertido <b>{leadCounts.Convertido}</b></li>
                </ul>
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

            <article className="crm-panel">
              <div className="crm-panel__heading"><h2>Financeiro (Resumo)</h2><a href={href('/crm/financeiro/transacoes')}>Ver módulo</a></div>
              <div className="crm-finance-summary">
                <div><small>Receitas</small><strong>{money(revenue)}</strong></div>
                <div><small>Despesas</small><strong>{money(expenses)}</strong></div>
              </div>
              <div className="crm-result"><small>Resultado</small><strong>{money(result)}</strong><p>Receitas recebidas menos despesas pagas</p></div>
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
