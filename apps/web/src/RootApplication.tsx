import { PublicSitePage } from './modules/public-site/pages/PublicSitePage';
import { ManagementApp } from './modules/management/ManagementApp';

export function RootApplication() {
  const path = window.location.pathname;

  if (path === '/app' || path.startsWith('/app/')) {
    return <ManagementApp />;
  }

  return <PublicSitePage />;
}
