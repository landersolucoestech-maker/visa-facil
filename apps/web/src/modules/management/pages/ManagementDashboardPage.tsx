import type { Client, DocumentItem, ServiceInteraction, VisaProcess } from '../domain';

type ManagementDashboardPageProps = {
  clients: Client[];
  processes: VisaProcess[];
  documents: DocumentItem[];
  interactions: ServiceInteraction[];
};

const modules = [
  { href: '/app/clientes', index: '01', title: 'Clientes', copy: 'Cadastro, consulta e visão consolidada por cliente.' },
  { href: '/app/processos', index: '02', title: 'Processos', copy: 'Organização das solicitações e acompanhamento das etapas.' },
  { href: '/app/documentos', index: '03', title: 'Documentos', copy: 'Checklists e pendências documentais por processo.' },
  { href: '/app/atendimentos', index: '04', title: 'Atendimentos', copy: 'Histórico de contatos e acompanhamento operacional.' },
];

export function ManagementDashboardPage({ clients, processes, documents, interactions }: ManagementDashboardPageProps) {
  const metrics = [
    { label: 'Clientes ativos', value: String(clients.filter((client) => client.status === 'active').length), note: `${clients.length} cliente(s) na sessão` },
    { label: 'Processos em andamento', value: String(processes.filter((process) => !['completed', 'cancelled'].includes(process.stage)).length), note: `${processes.length} processo(s) na sessão` },
    { label: 'Pendências documentais', value: String(documents.filter((document) => document.required && !document.received).length), note: `${documents.length} item(ns) no checklist` },
    { label: 'Atendimentos registrados', value: String(interactions.length), note: 'Somente sessão atual' },
  ];

  return (
    <section className="management-page" aria-labelledby="management-dashboard-title">
      <div className="management-page__heading management-page__heading--row">
        <div><span className="management-eyebrow">Visão geral</span><h1 id="management-dashboard-title">Central de operação</h1><p>Visão operacional baseada nos registros criados durante a sessão atual da interface.</p></div>
        <span className="management-status">Fundação funcional</span>
      </div>
      <div className="management-session-note">Os números abaixo não são dados de produção. Eles refletem apenas registros temporários criados nesta sessão, sem backend.</div>
      <div className="management-metrics" aria-label="Indicadores operacionais">{metrics.map((metric) => <article className="management-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}</div>
      <div className="management-section-heading"><div><span className="management-eyebrow">Módulos</span><h2>Fluxo operacional</h2></div><span>Cliente → Processo → Documentos → Atendimento</span></div>
      <div className="management-modules">{modules.map((module) => <a className="management-module-card" href={module.href} key={module.href}><span className="management-module-card__index">{module.index}</span><div><h3>{module.title}</h3><p>{module.copy}</p></div><span className="management-module-card__arrow" aria-hidden="true">→</span></a>)}</div>
      <div className="management-foundation-note"><div><span className="management-eyebrow">Arquitetura desta fase</span><h2>Contratos definidos antes do backend</h2></div><p>Clientes, processos, checklists e atendimentos já compartilham um modelo de domínio no frontend. Persistência, autenticação, permissões e arquivos permanecem fora até a fundação ser validada.</p></div>
    </section>
  );
}
