import { CrmApp } from './modules/crm/CrmApp';
import { PublicSitePage } from './modules/public-site/pages/PublicSitePage';

function normalizePath(pathname: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
  return path.replace(/\/+$/, '') || '/';
}

export function RootApplication() {
  const path = normalizePath(window.location.pathname);
  if (path === '/crm' || path.startsWith('/crm/')) return <CrmApp />;
  return <PublicSitePage />;
}
