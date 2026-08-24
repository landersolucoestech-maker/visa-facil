import { AgendaApp } from './modules/agenda/AgendaApp';
import { AttendanceApp } from './modules/attendance/AttendanceApp';
import { CrmApp } from './modules/crm/CrmApp';
import { PublicSitePage } from './modules/public-site/pages/PublicSitePage';
import { TasksApp } from './modules/tasks/TasksApp';

function normalizePath(pathname: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
  return path.replace(/\/+$/, '') || '/';
}

export function RootApplication() {
  const path = normalizePath(window.location.pathname);
  if (path === '/crm/atendimentos') return <AttendanceApp />;
  if (path === '/crm/tarefas') return <TasksApp />;
  if (path === '/crm/agenda') return <AgendaApp />;
  if (path === '/crm' || path.startsWith('/crm/')) return <CrmApp />;
  return <PublicSitePage />;
}
