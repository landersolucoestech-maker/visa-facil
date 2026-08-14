const metrics = [
  { label: 'Clientes ativos', value: '—', note: 'Aguardando fonte de dados' },
  { label: 'Processos em andamento', value: '—', note: 'Aguardando fonte de dados' },
  { label: 'Pendências documentais', value: '—', note: 'Aguardando fonte de dados' },
  { label: 'Atendimentos abertos', value: '—', note: 'Aguardando fonte de dados' },
];

const modules = [
  { href: '/app/clientes', index: '01', title: 'Clientes', copy: 'Cadastro, consulta e visão consolidada por cliente.' },
  { href: '/app/processos', index: '02', title: 'Processos', copy: 'Organização das solicitações e acompanhamento das etapas.' },
  { href: '/app/documentos', index: '03', title: 'Documentos', copy: 'Checklists, arquivos e pendências documentais.' },
  { href: '/app/atendimentos', index: '04', title: 'Atendimentos', copy: 'Histórico de contatos e acompanhamento operacional.' },
];

export function ManagementDashboardPage() {
  return (
    <section className="management-page" aria-labelledby="management-dashboard-title">
      <div className="management-page__heading management-page__heading--row">
        <div>
          <span className="management-eyebrow">Visão geral</span>
          <h1 id="management-dashboard-title">Central de operação</h1>
          <p>Fundação do sistema interno. Os indicadores permanecem sem valores fictícios até a conexão com dados reais.</p>
        </div>
        <span className="management-status">Fundação ativa</span>
      </div>

      <div className="management-metrics" aria-label="Indicadores operacionais">
        {metrics.map((metric) => (
          <article className="management-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </div>

      <div className="management-section-heading">
        <div><span className="management-eyebrow">Módulos</span><h2>Estrutura inicial do sistema</h2></div>
        <span>Sem backend nesta fase</span>
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

      <div className="management-foundation-note">
        <div><span className="management-eyebrow">Próxima camada</span><h2>Dados, autenticação e regras de negócio</h2></div>
        <p>A interface já está separada por domínio. A próxima fase deve definir entidades, permissões e contratos da API antes de ligar qualquer dado real.</p>
      </div>
    </section>
  );
}
