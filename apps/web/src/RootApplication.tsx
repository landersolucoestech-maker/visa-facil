import type { ReactNode } from 'react';
import { CrmSidebar } from './components/CrmSidebar';
import { AgendaApp } from './modules/agenda/AgendaApp';
import { AttendanceApp } from './modules/attendance/AttendanceApp';
import { CrmApp } from './modules/crm/CrmApp';
import { FinanceApp } from './modules/finance/FinanceApp';
import { FinancialCategoriesApp } from './modules/finance/FinancialCategoriesApp';
import { FinancialRulesApp } from './modules/finance/FinancialRulesApp';
import { MarketingApp } from './modules/marketing/MarketingApp';
import { PublicSitePage } from './modules/public-site/pages/PublicSitePage';
import { ReportsApp } from './modules/reports/ReportsApp';
import { TasksApp } from './modules/tasks/TasksApp';

function normalizePath(pathname: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
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
  const path = normalizePath(window.location.pathname);
  if (path === '/crm/atendimentos') return withSharedSidebar(<AttendanceApp />);
  if (path === '/crm/tarefas') return withSharedSidebar(<TasksApp />);
  if (path === '/crm/agenda') return withSharedSidebar(<AgendaApp />);
  if (path === '/crm/categorias-financeiras') return withSharedSidebar(<FinancialCategoriesApp />);
  if (path === '/crm/regras-financeiras') return withSharedSidebar(<FinancialRulesApp />);
  if (path === '/crm/financeiro') return withSharedSidebar(<FinanceApp />);
  if (path === '/crm/marketing' || path.startsWith('/crm/marketing/')) return withSharedSidebar(<MarketingApp />);
  if (path === '/crm/relatorios') return withSharedSidebar(<ReportsApp />);
  if (path === '/crm' || path.startsWith('/crm/')) return withSharedSidebar(<CrmApp />);
  return <PublicSitePage />;
}
