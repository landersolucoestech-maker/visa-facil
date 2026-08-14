import { PublicSitePage } from './modules/public-site/pages/PublicSitePage';
import { ManagementReservedPage } from './modules/management/pages/ManagementReservedPage';

export function RootApplication() {
  const path = window.location.pathname;

  if (path === '/app' || path.startsWith('/app/')) {
    return <ManagementReservedPage />;
  }

  return <PublicSitePage />;
}
