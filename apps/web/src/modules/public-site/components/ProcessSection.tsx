export function ProcessSection() {
  return (
    <section className="section method" id="processo">
      <div className="container method__grid">
        <div className="method__heading reveal">
          <span className="kicker">Como funciona</span>
          <h2>Um processo claro, do primeiro contato ao próximo passo.</h2>
          <p>Você sabe o que acontece, o que precisa entregar e quais decisões não dependem da assessoria.</p>
          <a className="text-link text-link--light" href="#diagnostico">Começar agora <span>↗</span></a>
        </div>
        <div className="method__steps">
          <article className="reveal"><span>01</span><div><h3>Análise de perfil</h3><p>Entendemos objetivo, histórico, contexto e riscos antes de sugerir o caminho.</p></div></article>
          <article className="reveal"><span>02</span><div><h3>Plano e documentos</h3><p>Definimos checklist, formulários, evidências, responsabilidades e cronograma.</p></div></article>
          <article className="reveal"><span>03</span><div><h3>Solicitação e agenda</h3><p>Orientamos protocolo, taxas, biometria, consulado e etapas aplicáveis.</p></div></article>
          <article className="reveal"><span>04</span><div><h3>Preparação e acompanhamento</h3><p>Revisamos o conjunto e acompanhamos o escopo contratado até a conclusão.</p></div></article>
        </div>
      </div>
    </section>
  );
}
