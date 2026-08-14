import type { Client } from '../../clients/types/client';
import type { VisaProcess } from '../../processes/types/process';
import type { DocumentItem } from '../../documents/types/document';
import type { ServiceInteraction } from '../../interactions/types/interaction';

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
  { href: '/app/tarefas', index: '05', title: 'Tarefas', copy: 'Pendências, prazos e prioridades da operação.' },
  { href: '/app/financeiro', index: '06', title: 'Financeiro', copy: 'Receitas e despesas vinculadas à operação e aos processos.' },
];

const flowSteps = ['Entrada', 'Diagnóstico', 'Documentos', 'Formulários', 'Agendamento', 'Conclusão'];

export function ManagementDashboardPage({ clients, processes, documents, interactions }: ManagementDashboardPageProps) {
  const metrics = [
    { label: 'Clientes ativos', value: String(clients.filter((client) => client.status === 'active').length), note: `${clients.length} cliente(s) na sessão`, tone: 'blue' },
    { label: 'Processos em andamento', value: String(processes.filter((process) => !['completed', 'cancelled'].includes(process.stage)).length), note: `${processes.length} processo(s) na sessão`, tone: 'navy' },
    { label: 'Pendências documentais', value: String(documents.filter((document) => document.required && !document.received).length), note: `${documents.length} item(ns) no checklist`, tone: 'red' },
    { label: 'Atendimentos registrados', value: String(interactions.length), note: 'Somente sessão atual', tone: 'gold' },
  ];

  return (
    <section className="management-page management-dashboard" aria-labelledby="management-dashboard-title">
      <div className="management-dashboard-hero">
        <div className="management-dashboard-hero__content">
          <span className="management-eyebrow">Visão geral</span>
          <h1 id="management-dashboard-title">Central de operação</h1>
          <p>Acompanhe o fluxo da Visa Fácil em uma única visão e acesse rapidamente cada área da operação.</p>
          <div className="management-dashboard-actions">
            <a className="management-primary-button" href="/app/clientes">Cadastrar cliente</a>
            <a className="management-secondary-button" href="/app/processos">Abrir processos</a>
          </div>
        </div>
        <div className="management-dashboard-hero__panel" aria-label="Status do ambiente">
          <span>Ambiente</span>
          <strong>Frontend em validação</strong>
          <p>Dados temporários da sessão. Nenhuma informação é persistida ou enviada a servidor.</p>
        </div>
      </div>

      <div className="management-metrics" aria-label="Indicadores operacionais">
        {metrics.map((metric) => (
          <article className={`management-metric management-metric--${metric.tone}`} key={metric.label}>
            <div className="management-metric__top"><span>{metric.label}</span><i aria-hidden="true" /></div>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </div>

      <div className="management-dashboard-grid">
        <section className="management-dashboard-card management-dashboard-card--modules" aria-labelledby="dashboard-modules-title">
          <div className="management-section-heading">
            <div><span className="management-eyebrow">Módulos</span><h2 id="dashboard-modules-title">Áreas do sistema</h2></div>
            <span>6 módulos operacionais</span>
          </div>
          <div className="management-modules">
            {modules.map((module) => (
              <a className="management-module-card" href={module.href} key={module.href}>
                <span className="management-module-card__index">{module.index}</span>
                <div><h3>{module.title}</h3><p>{module.copy}</p></div>
                <span className="management-module-card__arrow" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </section>

        <aside className="management-dashboard-stack">
          <section className="management-dashboard-card" aria-labelledby="flow-title">
            <div className="management-section-heading management-section-heading--compact">
              <div><span className="management-eyebrow">Jornada</span><h2 id="flow-title">Fluxo do processo</h2></div>
            </div>
            <ol className="management-flow-list">
              {flowSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></li>)}
            </ol>
          </section>

          <section className="management-dashboard-card management-dashboard-card--dark">
            <span className="management-eyebrow">Arquitetura</span>
            <h2>Frontend modular</h2>
            <p>Clientes, processos, documentos, atendimentos, tarefas e financeiro possuem módulos próprios. Management fica responsável apenas pelo shell, dashboard e orquestração.</p>
          </section>
        </aside>
      </div>
    </section>
  );
}
