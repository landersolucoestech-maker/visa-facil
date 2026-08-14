import { PublicSitePage } from './modules/public-site/pages/PublicSitePage';
import { ManagementApp } from './modules/management/ManagementApp';

function normalizeBasePath(pathname: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!base || base === '/') return pathname;
  if (pathname === base) return '/';
  return pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : pathname;
}

export function RootApplication() {
  const path = normalizeBasePath(window.location.pathname);

  if (path === '/app' || path.startsWith('/app/')) {
    return <ManagementApp />;
  }

  return <PublicSitePage />;
}
