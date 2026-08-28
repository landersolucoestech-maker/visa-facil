import React from 'react';
import ReactDOM from 'react-dom/client';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { RootApplication } from './RootApplication';
import './styles/app-baseline.css';
import './styles/tasks-search-fix.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <RootApplication />
    </GlobalErrorBoundary>
  </React.StrictMode>,
);
