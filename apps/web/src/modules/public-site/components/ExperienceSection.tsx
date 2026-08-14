export function ExperienceSection() {
  return (
    <section className="section spain" id="espanha">
      <div className="container spain__grid">
        <div className="spain__visual reveal">
          <div className="spain__photo"><img src="https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=1200&q=88" alt="Destino internacional" /></div>
          <div className="spain__stamp"><span>VF</span><b>VISA FÁCIL</b><small>Seu visto, sem complicação</small></div>
          <div className="spain__mini-photo"><img src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=600&q=85" alt="Viagem internacional" /></div>
        </div>
        <div className="spain__content reveal reveal--delay">
          <span className="kicker kicker--light">Experiência internacional</span>
          <h2>Mais do que solicitar um visto: preparar cada etapa com segurança.</h2>
          <p>Uma solicitação bem preparada exige coerência entre objetivo, documentos, histórico, formulários e cronograma. A VISA FÁCIL organiza essas informações e acompanha o cliente durante o escopo contratado.</p>
          <div className="spain__steps">
            <article><span>01</span><div><b>Diagnóstico do perfil</b><small>Objetivo, histórico, contexto, prazos e pontos de atenção.</small></div></article>
            <article><span>02</span><div><b>Organização documental</b><small>Checklist, formulários, evidências e conferência das informações.</small></div></article>
            <article><span>03</span><div><b>Agendamentos e etapas</b><small>Orientação sobre taxas, biometria, entrevista e procedimentos aplicáveis.</small></div></article>
            <article><span>04</span><div><b>Preparação final</b><small>Revisão do conjunto e preparação para os próximos passos do processo.</small></div></article>
          </div>
          <a className="btn btn--coral btn--large" href="#diagnostico">Analisar meu perfil <span>→</span></a>
          <p className="legal-note">A decisão final sobre qualquer visto pertence exclusivamente às autoridades competentes e depende da análise individual de cada solicitação.</p>
        </div>
      </div>
    </section>
  );
}
