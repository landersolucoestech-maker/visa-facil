import './global-route-loader.css';

function VisaFacilMark() {
  return <svg viewBox="0 0 64 64" aria-hidden="true">
    <path d="M7 8h17l8 39L20 56 7 8Z" fill="#FFFFFF" />
    <path d="M29 19c7-6 15-9 26-10-1 6-4 11-9 15-6 4-11 6-17 8v-13Z" fill="#B22234" />
    <path d="M31 31c7-5 14-7 24-8-2 6-5 10-10 13-5 3-10 5-14 7V31Z" fill="#E31B23" />
    <path d="M32 43c6-4 13-6 21-7-2 6-6 10-10 13-4 3-8 5-11 6V43Z" fill="#B22234" />
    <path d="m18 19 1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6L18 19Z" fill="#0D1B3D" />
  </svg>;
}

export function GlobalRouteLoader() {
  return <div className="global-route-loader" role="status" aria-live="polite" aria-label="Carregando módulo">
    <div className="global-route-loader__content">
      <div className="global-route-loader__brand" aria-hidden="true">
        <span className="global-route-loader__mark"><VisaFacilMark /></span>
        <span className="global-route-loader__wordmark"><strong>VISA FÁCIL</strong><small>seu visto, sem complicação</small></span>
      </div>
      <div className="global-route-loader__progress" role="progressbar" aria-label="Carregando" aria-valuetext="Carregando">
        <span />
      </div>
      <span className="global-route-loader__sr-only">Carregando módulo</span>
    </div>
  </div>;
}

export default GlobalRouteLoader;
