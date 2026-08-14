export function PainPointsSection() {
  return (
    <section className="section pain-points">
      <div className="container">
        <div className="section-heading section-heading--center reveal">
          <span className="kicker">Por que planejar</span>
          <h2>Erros pequenos podem criar problemas grandes.</h2>
          <p>Formulários, documentos e entrevistas precisam contar a mesma história. Nosso trabalho é organizar essa coerência antes que o processo seja enviado.</p>
        </div>
        <div className="pain-points__grid">
          <article className="reveal"><span>01</span><h3>Informações inconsistentes</h3><p>Datas, trabalho, renda, vínculos e objetivo da viagem precisam ser compatíveis entre si.</p></article>
          <article className="reveal reveal--delay"><span>02</span><h3>Documentação insuficiente</h3><p>Não basta reunir papéis: é necessário entender o que cada documento demonstra dentro do caso.</p></article>
          <article className="reveal"><span>03</span><h3>Entrevista sem preparação</h3><p>Ansiedade e respostas decoradas podem prejudicar a clareza de uma história legítima.</p></article>
          <article className="reveal reveal--delay"><span>04</span><h3>Decisões sem cronograma</h3><p>Taxas, biometria, agenda consular e viagem precisam respeitar uma sequência realista.</p></article>
        </div>
      </div>
    </section>
  );
}
