import React from 'react';
import ReactDOM from 'react-dom/client';
import { RootApplication } from './RootApplication';
import './modules/public-site/styles/visa-facil.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApplication />
  </React.StrictMode>,
);
