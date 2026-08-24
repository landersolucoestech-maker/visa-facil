import React from 'react';
import ReactDOM from 'react-dom/client';
import { RootApplication } from './RootApplication';
import './modules/public-site/styles/01-base.css';
import './modules/public-site/styles/02-sections-responsive.css';
import './modules/public-site/styles/03-hero-v3.css';
import './modules/crm/crm.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApplication />
  </React.StrictMode>,
);
