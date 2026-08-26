import { useState } from 'react';
import { AUTHENTICATION_ENABLED, signOut } from '../modules/auth/auth';
import { AppSidebarIcon, type AppSidebarIconName } from './AppSidebarIcon';
import '../modules/crm/crm.css';
import './crm-sidebar.css';
import './crm-workspace-switch.css';
import '../styles/sidebar-v2.css';
import '../styles/sidebar-color-fix.css';
import '../styles/crm-header-actions-unified.css';

type MarketingSection = 'overview' | 'campaigns' | 'calendar' | 'metrics';
type FinanceSection = 'transactions' | 'invoices' | 'pl';
type NavItem = {label:string;href:string;icon:AppSidebarIconName};

const MAIN_ITEMS:NavItem[] = [
  { label: 'Dashboard', href: '/crm', icon: 'dashboard' },
  { label: 'CRM', href: '/crm/relacionamento', icon: 'contacts' },
  { label: 'Agenda', href: '/crm/agenda', icon: 'calendar' },
  { label: 'Tarefas', href: '/crm/tarefas', icon: 'tasks' },
  { label: 'VisaChat', href: '/crm/atendimentos', icon: 'support' },
  { label: 'Contratos', href: '/crm/contratos', icon: 'contracts' },
];

const FINANCE_ITEMS:Array<{label:string;href:string;section:FinanceSection}>=[
  {label:'Transações',href:'/crm/financeiro/transacoes',section:'transactions'},
  {label:'Invoices',href:'/crm/financeiro/invoices',section:'invoices'},
  {label:'Contabilidade',href:'/crm/financeiro/pl',section:'pl'},
];

const MARKETING_ITEMS: Array<{ label: string; href: string; section: MarketingSection }> = [
  { label: 'Visão Geral', href: '/crm/marketing', section: 'overview' },
  { label: 'Campanhas', href: '/crm/marketing/campanhas', section: 'campaigns' },
  { label: 'Calendário', href: '/crm/marketing/calendario', section: 'calendar' },
  { label: 'Métricas', href: '/crm/marketing/metricas', section: 'metrics' },
];

const AFTER_ITEMS:NavItem[] = [
  { label: 'Relatórios', href: '/crm/relatorios', icon: 'reports' },
  { label: 'Configurações', href: '/crm/configuracoes', icon: 'settings' },
];

function basePath(){const base=import.meta.env.BASE_URL.replace(/\/$/,'');return base||''}
function href(path:string){return `${basePath()}${path}`||path}
function go(path:string){window.location.href=href(path)}
function currentPath(){const base=basePath();const pathname=window.location.pathname;const normalized=base&&pathname.startsWith(base)?pathname.slice(base.length)||'/':pathname;return normalized.replace(/\/+$/,'')||'/'}
function marketingSection(path:string):MarketingSection{if(path.endsWith('/campanhas'))return'campaigns';if(path.endsWith('/calendario'))return'calendar';if(path.endsWith('/metricas'))return'metrics';return'overview'}
function financeSection(path:string):FinanceSection{if(path.endsWith('/invoices'))return'invoices';if(path.endsWith('/pl'))return'pl';return'transactions'}
function isActive(path:string,itemHref:string){if(itemHref==='/crm')return path==='/crm';return path===itemHref||path.startsWith(`${itemHref}/`)}
function BrandMark(){return <span className="crm-brand-mark" aria-hidden="true"><i/><b/></span>}

function NavLink({item,active}:{item:NavItem;active:boolean}){
 return <a className={active?'is-active':''} href={href(item.href)}><AppSidebarIcon name={item.icon}/><span>{item.label}</span></a>
}

export function CrmSidebar(){
 const path=currentPath();
 const isFinance=path==='/crm/financeiro'||path.startsWith('/crm/financeiro/')||path==='/crm/categorias-financeiras'||path==='/crm/regras-financeiras';
 const isMarketing=path==='/crm/marketing'||path.startsWith('/crm/marketing/');
 const [financeOpen,setFinanceOpen]=useState(isFinance);
 const [marketingOpen,setMarketingOpen]=useState(isMarketing);
 const fSection=financeSection(path);const mSection=marketingSection(path);
 return <aside className="crm-sidebar crm-sidebar--shared">
  <div className="crm-sidebar-head">
   <a className="crm-brand" href={href('/crm')}><BrandMark/><span><strong>VISA FÁCIL</strong><small>CRM</small></span></a>
   <div className="crm-workspace-switch"><span>Ambiente</span><select value="crm" aria-label="Selecionar ambiente" onChange={e=>{if(e.target.value==='website')go('/site-admin');if(e.target.value==='selector')go('/workspaces')}}><option value="crm">CRM</option><option value="website">Gerenciador do site</option><option value="selector">Trocar workspace…</option></select></div>
  </div>
  <div className="crm-sidebar-body">
   <span className="crm-sidebar-label">Navegação</span>
   <nav>
    {MAIN_ITEMS.map(item=><NavLink key={item.href} item={item} active={isActive(path,item.href)}/>)}
    <div className={`crm-sidebar-group${isFinance?' is-active':''}`}>
     <button type="button" className={`crm-sidebar-group__trigger${isFinance?' is-active':''}`} onClick={()=>setFinanceOpen(v=>!v)} aria-expanded={financeOpen}><AppSidebarIcon name="finance"/><span>Financeiro</span><AppSidebarIcon name="chevron" className={financeOpen?'is-open':''}/></button>
     {financeOpen&&<div className="crm-sidebar-subnav">{FINANCE_ITEMS.map(item=><a key={item.href} className={isFinance&&fSection===item.section?'is-active':''} href={href(item.href)}><span>{item.label}</span></a>)}</div>}
    </div>
    <div className={`crm-sidebar-group${isMarketing?' is-active':''}`}>
     <button type="button" className={`crm-sidebar-group__trigger${isMarketing?' is-active':''}`} onClick={()=>setMarketingOpen(v=>!v)} aria-expanded={marketingOpen}><AppSidebarIcon name="marketing"/><span>Marketing</span><AppSidebarIcon name="chevron" className={marketingOpen?'is-open':''}/></button>
     {marketingOpen&&<div className="crm-sidebar-subnav">{MARKETING_ITEMS.map(item=><a key={item.href} className={isMarketing&&mSection===item.section?'is-active':''} href={href(item.href)}><span>{item.label}</span></a>)}</div>}
    </div>
    {AFTER_ITEMS.map(item=><NavLink key={item.href} item={item} active={isActive(path,item.href)}/>)}
   </nav>
  </div>
  <div className="crm-sidebar-footer">
   <a className="crm-sidebar-footer-link" href={href('/')}><AppSidebarIcon name="external"/><span>Site público</span></a>
   {AUTHENTICATION_ENABLED&&<button className="crm-sidebar-logout" onClick={()=>{signOut();go('/login')}}><AppSidebarIcon name="logout"/><span>Sair</span></button>}
  </div>
 </aside>
}
export default CrmSidebar;