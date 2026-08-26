import { lazy, Suspense, type ReactNode } from 'react';
import { AccountMenu, type AccountMenuSurface } from './components/AccountMenu';
import { GlobalRouteLoader } from './components/GlobalRouteLoader';
import { AUTHENTICATION_ENABLED, getAuthSession, isInternalPath } from './modules/auth/auth';
import { PublicSitePage } from './modules/public-site/pages/PublicSitePage';
import './styles/crm-content-layout.css';

const CrmSidebar = lazy(() => import('./components/CrmSidebar'));
const LoginApp = lazy(() => import('./modules/auth/LoginApp'));
const AgendaApp = lazy(async () => {
  const module = await import('./modules/agenda/AgendaApp');
  await import('./styles/agenda-refinement.css');
  return { default: module.AgendaApp };
});
const AttendanceApp = lazy(async () => {
  const module = await import('./modules/attendance/AttendanceApp');
  await import('./styles/visachat-refinement.css');
  return { default: module.AttendanceApp };
});
const ContractsApp = lazy(() => import('./modules/contracts/ContractsApp'));
const CrmApp = lazy(async () => {
  const module = await import('./modules/crm/CrmApp');
  await import('./styles/crm-relationship-refinement.css');
  return { default: module.default };
});
const CrmDashboardApp = lazy(async () => {
  const module = await import('./modules/crm/CrmDashboardApp');
  await import('./styles/crm-dashboard-cards.css');
  return { default: module.default };
});
const FinanceTransactionsApp = lazy(async () => {
  const module = await import('./modules/finance/FinanceTransactionsApp');
  await import('./styles/finance-transactions-refinement.css');
  return { default: module.default };
});
const FinanceInvoicesApp = lazy(async () => {
  const module = await import('./modules/finance/FinanceInvoicesApp');
  await import('./modules/finance/invoice-document.css');
  await import('./modules/finance/finance-fiscal-invoice.css');
  await import('./styles/invoices-refinement.css');
  await import('./styles/invoices-kpi-cards.css');
  await import('./styles/invoices-header-layout.css');
  return { default: module.default };
});
const FinancePLApp = lazy(async () => {
  const module = await import('./modules/finance/FinancePLApp');
  await import('./styles/accounting-refinement.css');
  return { default: module.default };
});
const FinancialCategoriesApp = lazy(() => import('./modules/finance/FinancialCategoriesApp').then(module => ({ default: module.FinancialCategoriesApp })));
const FinancialRulesApp = lazy(() => import('./modules/finance/FinancialRulesApp').then(module => ({ default: module.FinancialRulesApp })));
const MarketingApp = lazy(async () => {
  const module = await import('./modules/marketing/MarketingApp');
  await import('./modules/marketing/marketing-overrides.css');
  await import('./modules/marketing/marketing-year-reference.css');
  await import('./styles/marketing-refinement.css');
  await import('./styles/marketing-overview-refinement.css');
  await import('./styles/marketing-campaigns-refinement.css');
  return { default: module.default };
});
const ReportsApp = lazy(async () => {
  const module = await import('./modules/reports/ReportsApp');
  await import('./styles/reports-refinement.css');
  return { default: module.default };
});
const SettingsApp = lazy(async () => {
  const module = await import('./modules/settings/SettingsApp');
  await import('./styles/settings-refinement.css');
  await import('./styles/settings-tabs-refinement.css');
  return { default: module.default };
});
const ProfileApp = lazy(async () => {
  const module = await import('./modules/settings/ProfileApp');
  await import('./styles/settings-refinement.css');
  return { default: module.default };
});
const SiteCmsApp = lazy(async () => {
  const module = await import('./modules/site-cms/SiteCmsApp');
  await import('./styles/ui-system.css');
  await import('./styles/product-refinement.css');
  return { default: module.default };
});
const TasksApp = lazy(async () => {
  const module = await import('./modules/tasks/TasksApp');
  await import('./styles/tasks-refinement.css');
  return { default: module.TasksApp };
});
const WorkspaceSelectorApp = lazy(() => import('./modules/workspaces/WorkspaceSelectorApp'));

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

function normalizePath(pathname: string) {
  const base = basePath();
  const path = base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
  return path.replace(/\/+$/, '') || '/';
}

function replacePath(path:string){window.history.replaceState(null,'',`${basePath()}${path}`||path)}

function internal(page:ReactNode, accountSurface?:AccountMenuSurface){
  return <><Suspense fallback={<GlobalRouteLoader/>}>{page}</Suspense>{accountSurface&&<AccountMenu surface={accountSurface}/>}</>;
}
function withSharedSidebar(page: ReactNode) {
  return internal(<div className="crm-global-shell"><CrmSidebar /><div className="crm-global-page">{page}</div></div>,'crm');
}

export function RootApplication() {
  let path = normalizePath(window.location.pathname);
  const session = AUTHENTICATION_ENABLED ? getAuthSession() : null;

  if(path==='/login'){
    if(!AUTHENTICATION_ENABLED){replacePath('/workspaces');return internal(<WorkspaceSelectorApp/>,'workspace')}
    if(session){replacePath('/workspaces');return internal(<WorkspaceSelectorApp/>,'workspace')}
    return internal(<LoginApp/>);
  }

  if(AUTHENTICATION_ENABLED&&isInternalPath(path)&&!session){replacePath('/login');return internal(<LoginApp/>)}
  if(path==='/workspaces')return internal(<WorkspaceSelectorApp/>,'workspace');
  if(path==='/site-admin'||path.startsWith('/site-admin/'))return internal(<SiteCmsApp/>,'cms');
  if(path==='/preview')return <PublicSitePage preview/>;

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

  return <PublicSitePage/>;
}
