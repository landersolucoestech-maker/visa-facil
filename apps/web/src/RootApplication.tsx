import type { ReactNode } from 'react';
import { CrmSidebar } from './components/CrmSidebar';
import { AgendaApp } from './modules/agenda/AgendaApp';
import { AttendanceApp } from './modules/attendance/AttendanceApp';
import { CrmApp } from './modules/crm/CrmApp';
import { FinanceTransactionsApp } from './modules/finance/FinanceTransactionsApp';
import { FinanceInvoicesApp } from './modules/finance/FinanceInvoicesApp';
import { FinancePLApp } from './modules/finance/FinancePLApp';
import { FinancialCategoriesApp } from './modules/finance/FinancialCategoriesApp';
import { FinancialRulesApp } from './modules/finance/FinancialRulesApp';
import { MarketingApp } from './modules/marketing/MarketingApp';
import { PublicSitePage } from './modules/public-site/pages/PublicSitePage';
import { ReportsApp } from './modules/reports/ReportsApp';
import { SettingsApp } from './modules/settings/SettingsApp';
import { TasksApp } from './modules/tasks/TasksApp';

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

function normalizePath(pathname: string) {
  const base = basePath();
  const path = base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
  return path.replace(/\/+$/, '') || '/';
}

function withSharedSidebar(page: ReactNode) {
  return <div className="crm-global-shell">
    <CrmSidebar />
    <div className="crm-global-page">{page}</div>
  </div>;
}

export function RootApplication() {
  let path = normalizePath(window.location.pathname);

  if (path === '/crm/marketing/ia-criativa') {
    window.history.replaceState(null, '', `${basePath()}/crm/marketing` || '/crm/marketing');
    path = '/crm/marketing';
  }

  if (path === '/crm/atendimentos') return withSharedSidebar(<AttendanceApp />);
  if (path === '/crm/tarefas') return withSharedSidebar(<TasksApp />);
  if (path === '/crm/agenda') return withSharedSidebar(<AgendaApp />);
  if (path === '/crm/categorias-financeiras') return withSharedSidebar(<FinancialCategoriesApp />);
  if (path === '/crm/regras-financeiras') return withSharedSidebar(<FinancialRulesApp />);
  if (path === '/crm/financeiro/invoices') return withSharedSidebar(<FinanceInvoicesApp />);
  if (path === '/crm/financeiro/pl') return withSharedSidebar(<FinancePLApp />);
  if (path === '/crm/financeiro' || path === '/crm/financeiro/transacoes') return withSharedSidebar(<FinanceTransactionsApp />);
  if (path === '/crm/marketing' || path.startsWith('/crm/marketing/')) return withSharedSidebar(<MarketingApp />);
  if (path === '/crm/relatorios') return withSharedSidebar(<ReportsApp />);
  if (path === '/crm/configuracoes') return withSharedSidebar(<SettingsApp />);
  if (path === '/crm' || path.startsWith('/crm/')) return withSharedSidebar(<CrmApp />);

  return <PublicSitePage />;
}
