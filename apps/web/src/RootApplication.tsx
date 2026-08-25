import { lazy, Suspense, type ReactNode } from 'react';
import { getAuthSession, isInternalPath } from './modules/auth/auth';
import { PublicSitePage } from './modules/public-site/pages/PublicSitePage';

const CrmSidebar = lazy(() => import('./components/CrmSidebar'));
const LoginApp = lazy(() => import('./modules/auth/LoginApp'));
const AgendaApp = lazy(() => import('./modules/agenda/AgendaApp').then(module => ({ default: module.AgendaApp })));
const AttendanceApp = lazy(() => import('./modules/attendance/AttendanceApp').then(module => ({ default: module.AttendanceApp })));
const CrmApp = lazy(() => import('./modules/crm/CrmApp'));
const CrmDashboardApp = lazy(() => import('./modules/crm/CrmDashboardApp'));
const FinanceTransactionsApp = lazy(() => import('./modules/finance/FinanceTransactionsApp'));
const FinanceInvoicesApp = lazy(() => import('./modules/finance/FinanceInvoicesApp'));
const FinancePLApp = lazy(() => import('./modules/finance/FinancePLApp'));
const FinancialCategoriesApp = lazy(() => import('./modules/finance/FinancialCategoriesApp').then(module => ({ default: module.FinancialCategoriesApp })));
const FinancialRulesApp = lazy(() => import('./modules/finance/FinancialRulesApp').then(module => ({ default: module.FinancialRulesApp })));
const MarketingApp = lazy(() => import('./modules/marketing/MarketingApp'));
const ReportsApp = lazy(() => import('./modules/reports/ReportsApp'));
const SettingsApp = lazy(() => import('./modules/settings/SettingsApp'));
const SiteCmsApp = lazy(() => import('./modules/site-cms/SiteCmsApp'));
const TasksApp = lazy(() => import('./modules/tasks/TasksApp').then(module => ({ default: module.TasksApp })));
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

function InternalFallback(){return <div className="crm-route-loading" role="status">Carregando workspace…</div>}
function internal(page:ReactNode){return <Suspense fallback={<InternalFallback/>}>{page}</Suspense>}
function withSharedSidebar(page: ReactNode) {
  return internal(<div className="crm-global-shell"><CrmSidebar /><div className="crm-global-page">{page}</div></div>);
}

export function RootApplication() {
  let path = normalizePath(window.location.pathname);
  const session=getAuthSession();

  if(path==='/login'){
    if(session){replacePath('/workspaces');return internal(<WorkspaceSelectorApp/>)}
    return internal(<LoginApp/>);
  }

  if(isInternalPath(path)&&!session){replacePath('/login');return internal(<LoginApp/>)}
  if(path==='/workspaces')return internal(<WorkspaceSelectorApp/>);
  if(path==='/site-admin'||path.startsWith('/site-admin/'))return internal(<SiteCmsApp/>);
  if(path==='/preview')return <PublicSitePage preview/>;

  if(path==='/crm/contatos'||path==='/crm/leads'){
    replacePath('/crm/relacionamento');
    path='/crm/relacionamento';
  }
  if(path==='/crm/marketing/ia-criativa'){
    replacePath('/crm/marketing');
    path='/crm/marketing';
  }

  if(path==='/crm/atendimentos')return withSharedSidebar(<AttendanceApp/>);
  if(path==='/crm/tarefas')return withSharedSidebar(<TasksApp/>);
  if(path==='/crm/agenda')return withSharedSidebar(<AgendaApp/>);
  if(path==='/crm/categorias-financeiras')return withSharedSidebar(<FinancialCategoriesApp/>);
  if(path==='/crm/regras-financeiras')return withSharedSidebar(<FinancialRulesApp/>);
  if(path==='/crm/financeiro/invoices')return withSharedSidebar(<FinanceInvoicesApp/>);
  if(path==='/crm/financeiro/pl')return withSharedSidebar(<FinancePLApp/>);
  if(path==='/crm/financeiro'||path==='/crm/financeiro/transacoes')return withSharedSidebar(<FinanceTransactionsApp/>);
  if(path==='/crm/marketing'||path==='/crm/marketing/campanhas'||path==='/crm/marketing/calendario'||path==='/crm/marketing/metricas')return withSharedSidebar(<MarketingApp/>);
  if(path==='/crm/relatorios')return withSharedSidebar(<ReportsApp/>);
  if(path==='/crm/configuracoes')return withSharedSidebar(<SettingsApp/>);
  if(path==='/crm')return withSharedSidebar(<CrmDashboardApp/>);
  if(path==='/crm/relacionamento')return withSharedSidebar(<CrmApp/>);

  if(path.startsWith('/crm/')){
    replacePath('/crm');
    return withSharedSidebar(<CrmDashboardApp/>);
  }

  return <PublicSitePage/>;
}
