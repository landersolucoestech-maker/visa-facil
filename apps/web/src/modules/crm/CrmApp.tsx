import { useMemo, useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/crm', icon: '⌂' },
  { label: 'CRM', href: '/crm/relacionamento', icon: '◎' },
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

type CrmTab = 'contacts' | 'leads';

function getBasePath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base || '';
}

function normalizePath(pathname: string) {
  const base = getBasePath();
  const rawPath = base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
  const path = rawPath.replace(/\/+$/, '') || '/crm';
  if (path === '/crm/contatos' || path === '/crm/leads') return '/crm/relacionamento';
  return path;
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

function RelationshipCrm() {
  const [tab, setTab] = useState<CrmTab>('contacts');
  return <section className="crm-relationship">
    <div className="crm-relationship-summary">
      <article><span>Todos os contatos</span><strong>0</strong><small>Base completa</small></article>
      <article><span>Clientes</span><strong>0</strong><small>Relacionamentos ativos</small></article>
      <article><span>Leads</span><strong>0</strong><small>Em acompanhamento</small></article>
      <article><span>Convertidos</span><strong>0</strong><small>Leads convertidos</small></article>
    </div>

    <div className="crm-relationship-tabs" role="tablist" aria-label="CRM">
      <button type="button" role="tab" aria-selected={tab === 'contacts'} className={tab === 'contacts' ? 'is-active' : ''} onClick={() => setTab('contacts')}>Contatos</button>
      <button type="button" role="tab" aria-selected={tab === 'leads'} className={tab === 'leads' ? 'is-active' : ''} onClick={() => setTab('leads')}>Leads</button>
    </div>

    <article className="crm-relationship-card">
      <div className="crm-relationship-card__heading">
        <div><span>CRM</span><h2>{tab === 'contacts' ? 'Contatos' : 'Leads'}</h2><p>{tab === 'contacts' ? 'Pessoas e empresas relacionadas à operação, independentemente do estágio comercial.' : 'Contatos que ainda estão em etapa de prospecção e qualificação.'}</p></div>
        <button type="button">+ {tab === 'contacts' ? 'Novo contato' : 'Novo lead'}</button>
      </div>

      <div className="crm-relationship-filters">
        <label><span>Buscar</span><input type="search" placeholder={tab === 'contacts' ? 'Nome, e-mail ou telefone' : 'Nome, origem ou telefone'} /></label>
        <label><span>Status</span><select><option>Todos os status</option></select></label>
        <label><span>Origem</span><select><option>Todas as origens</option><option>Website</option><option>WhatsApp</option><option>Instagram</option><option>Facebook</option></select></label>
      </div>

      <div className="crm-relationship-table" role="table" aria-label={tab === 'contacts' ? 'Contatos' : 'Leads'}>
        <div className="crm-relationship-table__head" role="row"><span>Nome</span><span>{tab === 'contacts' ? 'Tipo' : 'Origem'}</span><span>Status</span><span>E-mail / telefone</span><span>Última interação</span><span>Ações</span></div>
        <div className="crm-relationship-empty"><strong>Nenhum {tab === 'contacts' ? 'contato' : 'lead'} cadastrado.</strong><p>Os registros aparecerão aqui conforme a operação for configurada.</p></div>
      </div>
    </article>
  </section>;
}

function Placeholder({ title }: { title: string }) {
  return <section className="crm-placeholder"><span>PROTÓTIPO</span><h2>{title}</h2><p>Estrutura visual criada. O conteúdo deste módulo será definido na próxima etapa.</p></section>;
}

export function CrmApp() {
  const path = normalizePath(window.location.pathname);
  const active = useMemo(() => NAV_ITEMS.find((item) => path === item.href) ?? NAV_ITEMS[0], [path]);
  const isDashboard = path === '/crm';
  const isRelationship = path === '/crm/relacionamento';

  return <div className="crm-shell">
    <aside className="crm-sidebar">
      <a className="crm-brand" href={browserHref('/crm')}><BrandMark /><span><strong>VISA FÁCIL</strong><small>CRM · Relacionamento</small></span></a>
      <div className="crm-sidebar-accent"><i /><i /><i /></div>
      <span className="crm-sidebar-label">OPERAÇÃO</span>
      <nav>{NAV_ITEMS.map((item) => <a key={item.href} className={path === item.href ? 'is-active' : ''} href={browserHref(item.href)}><span>{item.icon}</span>{item.label}</a>)}</nav>
      <div className="crm-sidebar-footer"><FlagCard /><a href={browserHref('/')}>← Voltar ao site</a><small>Protótipo · branch dev</small></div>
    </aside>

    <div className="crm-workspace">
      <header className="crm-topbar"><div><small>VISA FÁCIL · CRM</small><h1>{active.label}</h1><p>{isDashboard ? 'Visão geral do relacionamento e da operação comercial.' : isRelationship ? 'Contatos e leads centralizados em uma única área de relacionamento.' : `Gestão de ${active.label.toLowerCase()} no CRM Visa Fácil.`}</p></div><div className="crm-topbar-actions"><button type="button" aria-label="Alertas">⌁</button><div className="crm-user"><span>VF</span><div><strong>Administrador</strong><small>Protótipo frontend</small></div></div></div></header>
      <main className="crm-content">{isDashboard ? <Dashboard /> : isRelationship ? <RelationshipCrm /> : <Placeholder title={active.label} />}</main>
    </div>
  </div>;
}
