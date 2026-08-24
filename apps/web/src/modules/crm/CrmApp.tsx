import { useMemo } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/crm', icon: '⌂' },
  { label: 'Contatos', href: '/crm/contatos', icon: '◎' },
  { label: 'Leads', href: '/crm/leads', icon: '◉' },
  { label: 'Oportunidades', href: '/crm/oportunidades', icon: '◇' },
  { label: 'Atendimentos', href: '/crm/atendimentos', icon: '◌' },
  { label: 'Tarefas', href: '/crm/tarefas', icon: '✓' },
  { label: 'Agenda', href: '/crm/agenda', icon: '□' },
  { label: 'Financeiro', href: '/crm/financeiro', icon: '$' },
  { label: 'Relatórios', href: '/crm/relatorios', icon: '▥' },
  { label: 'Configurações', href: '/crm/configuracoes', icon: '⚙' },
];

const KPI_ITEMS = [
  { label: 'Contatos', value: '0', detail: 'cadastrados', tone: 'blue' },
  { label: 'Leads', value: '0', detail: 'em acompanhamento', tone: 'red' },
  { label: 'Clientes', value: '0', detail: 'ativos', tone: 'navy' },
  { label: 'Oportunidades', value: '0', detail: 'em aberto', tone: 'red' },
  { label: 'Conversas', value: '0', detail: 'não lidas', tone: 'navy' },
  { label: 'Tarefas', value: '0', detail: 'pendentes', tone: 'blue' },
];

function getBasePath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base || '';
}

function normalizePath(pathname: string) {
  const base = getBasePath();
  const path = base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
  return path.replace(/\/+$/, '') || '/crm';
}

function browserHref(path: string) {
  return `${getBasePath()}${path}` || path;
}

function BrandMark() {
  return <span className="crm-brand-mark" aria-hidden="true"><i /><b /></span>;
}

function FlagCard() {
  return <div className="crm-flag" aria-hidden="true"><span className="crm-flag__blue">✦ ✦ ✦<br /> ✦ ✦</span><span className="crm-flag__stripes" /></div>;
}

function Dashboard() {
  return <>
    <section className="crm-kpi-grid" aria-label="Indicadores do CRM">
      {KPI_ITEMS.map((item) => <article key={item.label} className="crm-kpi-card">
        <span className={`crm-kpi-card__icon crm-kpi-card__icon--${item.tone}`}>●</span>
        <div><small>{item.label}</small><strong>{item.value}</strong><p>{item.detail}</p></div>
      </article>)}
    </section>

    <section className="crm-dashboard-grid crm-dashboard-grid--top">
      <article className="crm-panel"><div className="crm-panel__heading"><h2>Leads por status</h2></div><div className="crm-donut-wrap"><div className="crm-donut">0</div><ul><li><span className="dot dot--blue" />Novo <b>0</b></li><li><span className="dot dot--red" />Em contato <b>0</b></li><li><span className="dot dot--navy" />Qualificado <b>0</b></li><li><span className="dot dot--soft" />Convertido <b>0</b></li></ul></div></article>
      <article className="crm-panel"><div className="crm-panel__heading"><h2>Origem dos leads</h2></div><div className="crm-bars"><div><span>Website</span><i /><b>0</b></div><div><span>WhatsApp</span><i /><b>0</b></div><div><span>Instagram</span><i /><b>0</b></div><div><span>Facebook</span><i /><b>0</b></div></div></article>
      <article className="crm-panel"><div className="crm-panel__heading"><h2>Financeiro (Resumo)</h2><button type="button">Ver módulo</button></div><div className="crm-finance-summary"><div><small>Receitas</small><strong>R$ 0,00</strong></div><div><small>Despesas</small><strong>R$ 0,00</strong></div></div><div className="crm-result"><small>Resultado</small><strong>R$ 0,00</strong><p>Valores demonstrativos do protótipo</p></div></article>
    </section>

    <section className="crm-dashboard-grid crm-dashboard-grid--bottom">
      <article className="crm-panel crm-empty-panel"><div className="crm-panel__heading"><h2>Atendimentos recentes</h2><button type="button">Ver todos</button></div><p>Nenhum atendimento registrado.</p></article>
      <article className="crm-panel crm-empty-panel"><div className="crm-panel__heading"><h2>Tarefas pendentes</h2><button type="button">Ver todas</button></div><p>Nenhuma tarefa pendente.</p></article>
      <article className="crm-panel crm-empty-panel"><div className="crm-panel__heading"><h2>Conversas</h2><button type="button">Abrir central</button></div><p>Nenhuma conversa iniciada.</p></article>
    </section>
  </>;
}

function Placeholder({ title }: { title: string }) {
  return <section className="crm-placeholder"><span>PROTÓTIPO</span><h2>{title}</h2><p>Estrutura visual criada. O conteúdo deste módulo será definido na próxima etapa.</p></section>;
}

export function CrmApp() {
  const path = normalizePath(window.location.pathname);
  const active = useMemo(() => NAV_ITEMS.find((item) => path === item.href) ?? NAV_ITEMS[0], [path]);
  const isDashboard = path === '/crm';

  return <div className="crm-shell">
    <aside className="crm-sidebar">
      <a className="crm-brand" href={browserHref('/crm')}><BrandMark /><span><strong>VISA FÁCIL</strong><small>CRM · Relacionamento</small></span></a>
      <div className="crm-sidebar-accent"><i /><i /><i /></div>
      <span className="crm-sidebar-label">OPERAÇÃO</span>
      <nav>{NAV_ITEMS.map((item) => <a key={item.href} className={path === item.href ? 'is-active' : ''} href={browserHref(item.href)}><span>{item.icon}</span>{item.label}</a>)}</nav>
      <div className="crm-sidebar-footer"><FlagCard /><a href={browserHref('/')}>← Voltar ao site</a><small>Protótipo · branch dev</small></div>
    </aside>

    <div className="crm-workspace">
      <header className="crm-topbar"><div><small>VISA FÁCIL · CRM</small><h1>{active.label}</h1><p>{isDashboard ? 'Visão geral do relacionamento e da operação comercial.' : `Gestão de ${active.label.toLowerCase()} no CRM Visa Fácil.`}</p></div><div className="crm-topbar-actions"><button type="button" aria-label="Alertas">⌁</button><div className="crm-user"><span>VF</span><div><strong>Administrador</strong><small>Protótipo frontend</small></div></div></div></header>
      <main className="crm-content">{isDashboard ? <Dashboard /> : <Placeholder title={active.label} />}</main>
    </div>
  </div>;
}
