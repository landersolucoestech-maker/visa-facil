import { ManagementShell } from './components/ManagementShell';
import { ManagementDashboardPage } from './pages/ManagementDashboardPage';

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <section className="management-page" aria-labelledby="management-page-title">
      <div className="management-page__heading">
        <span className="management-eyebrow">Módulo reservado</span>
        <h1 id="management-page-title">{title}</h1>
        <p>{description}</p>
      </div>
      <div className="management-empty-state">
        <strong>Estrutura preparada.</strong>
        <span>Este módulo receberá regras de negócio, dados e permissões nas próximas etapas.</span>
      </div>
    </section>
  );
}

export function ManagementApp() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/app';

  let content = <ManagementDashboardPage />;

  if (path === '/app/clientes') {
    content = <PlaceholderPage title="Clientes" description="Base para cadastro, consulta e acompanhamento dos clientes da Visa Fácil." />;
  } else if (path === '/app/processos') {
    content = <PlaceholderPage title="Processos" description="Base para organizar solicitações de visto e acompanhar suas etapas." />;
  } else if (path === '/app/documentos') {
    content = <PlaceholderPage title="Documentos" description="Base para checklists, pendências e organização documental." />;
  } else if (path === '/app/atendimentos') {
    content = <PlaceholderPage title="Atendimentos" description="Base para histórico de contato e acompanhamento do cliente." />;
  }

  return <ManagementShell>{content}</ManagementShell>;
}
