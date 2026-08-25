import React from 'react';
import ReactDOM from 'react-dom/client';
import { RootApplication } from './RootApplication';
import './modules/public-site/styles/01-base.css';
import './modules/public-site/styles/02-sections-responsive.css';
import './modules/public-site/styles/03-hero-v3.css';
import './modules/public-site/content/cms-preview.css';
import './modules/crm/crm.css';
import './modules/marketing/marketing-overrides.css';
import './modules/marketing/marketing-year-reference.css';
import './modules/finance/invoice-document.css';
import './modules/finance/finance-fiscal-invoice.css';
import './styles/ui-system.css';
import './styles/crm-dashboard-kpis.css';
import './styles/crm-dashboard-cards.css';
import './styles/product-refinement.css';
import './styles/sidebar-v2.css';
import './styles/sidebar-color-fix.css';
import './styles/crm-relationship-refinement.css';
import './styles/visachat-refinement.css';
import './styles/tasks-refinement.css';
import './styles/agenda-refinement.css';
import './styles/finance-transactions-refinement.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApplication />
  </React.StrictMode>,
);
