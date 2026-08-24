import { useState } from 'react';
import './crm-sidebar.css';

type MarketingSection = 'overview' | 'campaigns' | 'calendar' | 'metrics' | 'creative-ai';

const MAIN_ITEMS = [
  { label: 'Dashboard', href: '/crm', icon: '⌂' },
  { label: 'CRM', href: '/crm/relacionamento', icon: '◎' },
  { label: 'Atendimentos', href: '/crm/atendimentos', icon: '◌' },
  { label: 'Tarefas', href: '/crm/tarefas', icon: '✓' },
  { label: 'Agenda', href: '/crm/agenda', icon: '□' },
  { label: 'Financeiro', href: '/crm/financeiro', icon: '$' },
];

const MARKETING_ITEMS: Array<{ label: string; href: string; section: MarketingSection }> = [
  { label: 'Visão Geral', href: '/crm/marketing', section: 'overview' },
  { label: 'Campanhas', href: '/crm/marketing/campanhas', section: 'campaigns' },
  { label: 'Calendário', href: '/crm/marketing/calendario', section: 'calendar' },
  { label: 'Métricas', href: '/crm/marketing/metricas', section: 'metrics' },
  { label: 'IA Criativa', href: '/crm/marketing/ia-criativa', section: 'creative-ai' },
];

const AFTER_ITEMS = [
  { label: 'Relatórios', href: '/crm/relatorios', icon: '▥' },
  { label: 'Configurações', href: '/crm/configuracoes', icon: '⚙' },
];

function basePath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base || '';
}

function href(path: string) {
  return `${basePath()}${path}` || path;
}

function currentPath() {
  const base = basePath();
  const pathname = window.location.pathname;
  const normalized = base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
  return normalized.replace(/\/+$/, '') || '/';
}

function marketingSection(path: string): MarketingSection {
  if (path.endsWith('/campanhas')) return 'campaigns';
  if (path.endsWith('/calendario')) return 'calendar';
  if (path.endsWith('/metricas')) return 'metrics';
  if (path.endsWith('/ia-criativa')) return 'creative-ai';
  return 'overview';
}

function isActive(path: string, itemHref: string) {
  if (itemHref === '/crm') return path === '/crm';
  if (itemHref === '/crm/financeiro') {
    return path === '/crm/financeiro' || path === '/crm/categorias-financeiras' || path === '/crm/regras-financeiras';
  }
  return path === itemHref || path.startsWith(`${itemHref}/`);
}

function BrandMark() {
  return <span className="crm-brand-mark" aria-hidden="true"><i /><b /></span>;
}

function FlagCard() {
  return <div className="crm-flag" aria-hidden="true"><span className="crm-flag__blue">✦ ✦ ✦<br /> ✦ ✦</span><span className="crm-flag__stripes" /></div>;
}

export function CrmSidebar() {
  const path = currentPath();
  const isMarketing = path === '/crm/marketing' || path.startsWith('/crm/marketing/');
  const [marketingOpen, setMarketingOpen] = useState(isMarketing);
  const section = marketingSection(path);

  return <aside className="crm-sidebar crm-sidebar--shared">
    <a className="crm-brand" href={href('/crm')}>
      <BrandMark />
      <span><strong>VISA FÁCIL</strong><small>CRM · Relacionamento</small></span>
    </a>
    <div className="crm-sidebar-accent"><i /><i /><i /></div>
    <span className="crm-sidebar-label">OPERAÇÃO</span>
    <nav>
      {MAIN_ITEMS.map(item => <a key={item.href} className={isActive(path, item.href) ? 'is-active' : ''} href={href(item.href)}><span>{item.icon}</span>{item.label}</a>)}
      <div className={`crm-sidebar-marketing ${isMarketing ? 'is-active' : ''}`}>
        <button type="button" className={`crm-sidebar-marketing__parent ${isMarketing ? 'is-active' : ''}`} onClick={() => setMarketingOpen(value => !value)} aria-expanded={marketingOpen}>
          <span>◈</span><b>Marketing</b><i>{marketingOpen ? '⌃' : '⌄'}</i>
        </button>
        {marketingOpen && <div className="crm-sidebar-subnav">
          {MARKETING_ITEMS.map(item => <a key={item.href} className={isMarketing && section === item.section ? 'is-active' : ''} href={href(item.href)}>{item.label}</a>)}
        </div>}
      </div>
      {AFTER_ITEMS.map(item => <a key={item.href} className={isActive(path, item.href) ? 'is-active' : ''} href={href(item.href)}><span>{item.icon}</span>{item.label}</a>)}
    </nav>
    <div className="crm-sidebar-footer">
      <FlagCard />
      <a href={href('/')}>← Voltar ao site</a>
      <small>Protótipo · branch dev</small>
    </div>
  </aside>;
}

export default CrmSidebar;
