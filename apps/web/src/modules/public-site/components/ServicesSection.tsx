export function ServicesSection() {
  return (
    <>
      <section className="section intro" id="servicos">
        <div className="container intro__grid">
          <div className="section-heading reveal">
            <span className="kicker">O que fazemos</span>
            <h2>Uma assessoria completa para transformar planos em possibilidades reais.</h2>
          </div>
          <div className="intro__copy reveal reveal--delay">
            <p>Um processo de visto envolve perfil, formulários, documentos, prazos e entrevista. Por isso, cada serviço é organizado de forma personalizada, com atenção aos detalhes e acompanhamento próximo.</p>
            <a className="text-link" href="#diagnostico">Descobrir por onde começar <span>↗</span></a>
          </div>
        </div>
      </section>
      <section className="section services" id="vistos">
        <div className="container">
          <div className="services__grid">
            <article className="service-card service-card--featured reveal" id="eua">
              <div className="service-card__image"><img src="https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=1200&q=86" alt="Nova York, Estados Unidos" /><span className="service-card__number">01</span></div>
              <div className="service-card__body"><span className="service-card__label">Estados Unidos</span><h3>Visto americano</h3><p>Análise de perfil, preenchimento do DS-160, organização documental, agendamento e preparação individual para entrevista.</p><ul><li>Turismo e negócios</li><li>Renovação de visto</li><li>Reaplicação após negativa</li></ul><a href="#diagnostico">Ver como funciona <span>→</span></a></div>
            </article>
            <article className="service-card reveal" id="canada">
              <div className="service-card__image"><img src="https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=900&q=86" alt="Toronto, Canadá" /><span className="service-card__number">02</span></div>
              <div className="service-card__body"><span className="service-card__label">Canadá</span><h3>Visto canadense</h3><p>Orientação para formulários, documentos, biometria e eventuais solicitações adicionais da autoridade canadense.</p><a href="#diagnostico">Analisar meu caso <span>→</span></a></div>
            </article>
            <article className="service-card reveal reveal--delay" id="australia">
              <div className="service-card__image"><img src="https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=900&q=86" alt="Sydney, Austrália" /><span className="service-card__number">03</span></div>
              <div className="service-card__body"><span className="service-card__label">Austrália</span><h3>Visto australiano</h3><p>Planejamento da solicitação, revisão das evidências e acompanhamento documental conforme a categoria aplicável.</p><a href="#diagnostico">Analisar meu caso <span>→</span></a></div>
            </article>
            <article className="service-card reveal" id="europa-schengen">
              <div className="service-card__image"><img src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=86" alt="Paris, França" /><span className="service-card__number">04</span></div>
              <div className="service-card__body"><span className="service-card__label">Europa</span><h3>Vistos e autorizações</h3><p>Suporte para destinos e categorias que exigem visto, autorização, seguro ou comprovação documental específica.</p><a href="#diagnostico">Analisar meu destino <span>→</span></a></div>
            </article>
          </div>
          <div className="support-services reveal">
            <article><span className="support-services__icon">↻</span><div><h4>Renovação de visto</h4><p>Atualização do processo conforme histórico, perfil e regras vigentes.</p></div></article>
            <article><span className="support-services__icon">◎</span><div><h4>Preparação para entrevista</h4><p>Simulação individual, coerência e comunicação clara — sem respostas decoradas.</p></div></article>
            <article><span className="support-services__icon">✓</span><div><h4>Revisão de formulários</h4><p>Conferência técnica para reduzir erros, omissões e inconsistências.</p></div></article>
          </div>
        </div>
      </section>
    </>
  );
}
