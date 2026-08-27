import { lazy, Suspense, type ReactNode } from 'react';
import { AccountMenu, type AccountMenuSurface } from './components/AccountMenu';
import { GlobalNotificationFallback } from './components/GlobalNotificationFallback';
import { GlobalPersistenceNotice } from './components/GlobalPersistenceNotice';
import { GlobalRouteLoader } from './components/GlobalRouteLoader';
import { AUTHENTICATION_ENABLED, getAuthSession, isInternalPath } from './modules/auth/auth';
import './styles/crm-content-layout.css';
import './styles/crm-ui-standard.css';
import './styles/crm-ui-enforcement.css';
import './styles/tableview-surface.css';

const CrmSidebar = lazy(() => import('./components/CrmSidebar'));
const LoginApp = lazy(() => import('./modules/auth/LoginApp'));
const PublicSitePage = lazy(async () => {
  const module = await import('./modules/public-site/pages/PublicSitePage');
  await import('./modules/public-site/styles/01-base.css');
  await import('./modules/public-site/styles/02-sections-responsive.css');
  await import('./modules/public-site/styles/03-hero-v3.css');
  await import('./modules/public-site/content/cms-preview.css');
  return { default: module.PublicSitePage };
});
const AgendaApp = lazy(() => import('./modules/agenda/AgendaApp'));
const AttendanceApp = lazy(async () => {
  const module = await import('./modules/attendance/AttendanceApp');
  await import('./modules/attendance/visachat-refinement.css');
  await import('./modules/attendance/attendanceTeamChat.css');
  return { default: module.AttendanceApp };
});
const ContractsApp = lazy(() => import('./modules/contracts/ContractsApp'));
const CrmApp = lazy(async () => {
  const module = await import('./modules/crm/CrmApp');
  await import('./modules/crm/crm.css');
  await import('./modules/crm/crm-relationship-refinement.css');
  return { default: module.default };
});
const CrmDashboardApp = lazy(async () => {
  const module = await import('./modules/crm/CrmDashboardApp');
  await import('./modules/crm/crm.css');
  await import('./modules/crm/crm-dashboard-cards.css');
  return { default: module.default };
});
const FinanceTransactionsApp = lazy(() => import('./modules/finance/FinanceTransactionsApp'));
const FinanceInvoicesApp = lazy(async () => {
  const module = await import('./modules/finance/FinanceInvoicesApp');
  await import('./modules/finance/invoice-document.css');
  await import('./modules/finance/finance-fiscal-invoice.css');
  await import('./modules/finance/invoices-chrome.css');
  return { default: module.default };
});
const FinancePLApp = lazy(() => import('./modules/finance/FinancePLApp'));
const FinancialCategoriesApp = lazy(() => import('./modules/finance/FinancialCategoriesApp').then(module => ({ default: module.FinancialCategoriesApp })));
const FinancialRulesApp = lazy(() => import('./modules/finance/FinancialRulesApp').then(module => ({ default: module.FinancialRulesApp })));
const MarketingApp = lazy(async () => {
  const module = await import('./modules/marketing/MarketingApp');
  await import('./modules/marketing/marketing-actions.css');
  await import('./modules/marketing/marketing-year-reference.css');
  await import('./modules/marketing/marketing-refinement.css');
  await import('./modules/marketing/marketing-overview-refinement.css');
  return { default: module.default };
});
const MarketingBriefingsApp = lazy(async () => {
  const module = await import('./modules/marketing/MarketingBriefingsApp');
  await import('./modules/marketing/marketing-actions.css');
  return { default: module.default };
});
const ReportsApp = lazy(() => import('./modules/reports/ReportsApp'));
const SettingsApp = lazy(() => import('./modules/settings/SettingsApp'));
const ProfileApp = lazy(() => import('./modules/settings/ProfileApp'));
const SiteCmsApp = lazy(async () => {
  const module = await import('./modules/site-cms/SiteCmsApp');
  await import('./styles/sidebar-v2.css');
  return { default: module.default };
});
const TasksApp = lazy(() => import('./modules/tasks/TasksApp').then(module => ({ default: module.TasksApp })));
const WorkspaceSelectorApp = lazy(() => import('./modules/workspaces/WorkspaceSelectorApp'));

function basePath() {
  const base=import.meta.env.BASE_URL.replace(/\/$/, '');
  return base==='/'?'':base;
}

function normalizePath(pathname: string) {
  const base = basePath();
  const path = !base
    ? pathname
    : pathname===base
      ? '/'
      : pathname.startsWith(`${base}/`)
        ? pathname.slice(base.length) || '/'
        : pathname;
  return path.replace(/\/+$/, '') || '/';
}

function replacePath(path:string){window.history.replaceState(null,'',`${basePath()}${path}`||path)}

function internal(page:ReactNode, accountSurface?:AccountMenuSurface){
  return <><Suspense fallback={<GlobalRouteLoader/>}>{page}</Suspense><GlobalPersistenceNotice/>{accountSurface==='crm'&&<GlobalNotificationFallback/>}{accountSurface&&<AccountMenu surface={accountSurface}/>}</>;
}
function withSharedSidebar(page: ReactNode) {
  return internal(<div className="crm-global-shell"><CrmSidebar /><div className="crm-global-page">{page}</div></div>,'crm');
}
function publicSite(preview=false){
  return <Suspense fallback={<GlobalRouteLoader/>}><PublicSitePage preview={preview}/></Suspense>;
}

export function RootApplication() {
  let path = normalizePath(window.location.pathname);
  const session = AUTHENTICATION_ENABLED ? getAuthSession() : null;

  if(path==='/login-preview')return internal(<LoginApp previewOnly/>);

  if(path==='/login'){
    if(!AUTHENTICATION_ENABLED){replacePath('/workspaces');return internal(<WorkspaceSelectorApp/>,'workspace')}
    if(session){replacePath('/workspaces');return internal(<WorkspaceSelectorApp/>,'workspace')}
    return internal(<LoginApp/>);
  }

  if(AUTHENTICATION_ENABLED&&isInternalPath(path)&&!session){replacePath('/login');return internal(<LoginApp/>)}
  if(path==='/workspaces')return internal(<WorkspaceSelectorApp/>,'workspace');
  if(path==='/site-admin'||path.startsWith('/site-admin/'))return internal(<SiteCmsApp/>,'cms');
  if(path==='/preview')return publicSite(true);

  if(path==='/crm/contatos'||path==='/crm/leads'){
    replacePath('/crm/relacionamento');
    path='/crm/relacionamento';
  }
  if(path==='/crm/marketing/ia-criativa'){
    replacePath('/crm/marketing');
    path='/crm/marketing';
  }
  if(path==='/crm/contratos/categorias'){
    replacePath('/crm/contratos/templates');
    path='/crm/contratos/templates';
  }

  if(path==='/crm/atendimentos')return withSharedSidebar(<AttendanceApp/>);
  if(path==='/crm/tarefas')return withSharedSidebar(<TasksApp/>);
  if(path==='/crm/agenda')return withSharedSidebar(<AgendaApp/>);
  if(path==='/crm/contratos'||path==='/crm/contratos/templates'||path==='/crm/contratos/variaveis')return withSharedSidebar(<ContractsApp/>);
  if(path==='/crm/categorias-financeiras')return withSharedSidebar(<FinancialCategoriesApp/>);
  if(path==='/crm/regras-financeiras')return withSharedSidebar(<FinancialRulesApp/>);
  if(path==='/crm/financeiro/invoices')return withSharedSidebar(<FinanceInvoicesApp/>);
  if(path==='/crm/financeiro/pl')return withSharedSidebar(<FinancePLApp/>);
  if(path==='/crm/financeiro'||path==='/crm/financeiro/transacoes')return withSharedSidebar(<FinanceTransactionsApp/>);
  if(path==='/crm/marketing/briefings')return withSharedSidebar(<MarketingBriefingsApp/>);
  if(path==='/crm/marketing/tarefas')return withSharedSidebar(<TasksApp fixedArea="Marketing"/>);
  if(path==='/crm/marketing'||path==='/crm/marketing/campanhas'||path==='/crm/marketing/calendario'||path==='/crm/marketing/metricas')return withSharedSidebar(<MarketingApp/>);
  if(path==='/crm/relatorios')return withSharedSidebar(<ReportsApp/>);
  if(path==='/crm/perfil')return withSharedSidebar(<ProfileApp/>);
  if(path==='/crm/configuracoes')return withSharedSidebar(<SettingsApp/>);
  if(path==='/crm')return withSharedSidebar(<CrmDashboardApp/>);
  if(path==='/crm/relacionamento')return withSharedSidebar(<CrmApp/>);

  if(path.startsWith('/crm/')){
    replacePath('/crm');
    return withSharedSidebar(<CrmDashboardApp/>);
  }

  return publicSite();
}
