export function FaqSection() {
  return (
    <section className="section faq" id="duvidas">
      <div className="container faq__grid">
        <div className="faq__heading reveal">
          <span className="kicker">Dúvidas frequentes</span>
          <h2>Informação clara antes de qualquer contratação.</h2>
          <p>As respostas abaixo são gerais. A orientação adequada depende do destino, da categoria e do perfil individual.</p>
          <a className="btn btn--dark" href="#diagnostico">Falar com a equipe</a>
        </div>
        <div className="accordion reveal reveal--delay">
          <article className="accordion__item is-open"><button type="button"><span>A assessoria garante a aprovação do visto?</span><i>+</i></button><div className="accordion__content"><p>Não. A equipe pode organizar informações, revisar documentos e preparar o cliente, mas a decisão pertence exclusivamente à autoridade competente.</p></div></article>
          <article className="accordion__item"><button type="button"><span>Posso contratar o serviço após uma negativa?</span><i>+</i></button><div className="accordion__content"><p>Sim. O primeiro passo é avaliar o histórico, as informações apresentadas e as mudanças ocorridas desde a solicitação anterior.</p></div></article>
          <article className="accordion__item"><button type="button"><span>Todo o atendimento pode ser feito online?</span><i>+</i></button><div className="accordion__content"><p>A assessoria pode ser conduzida online. Biometria, entrevista, apresentação de documentos ou outras etapas podem exigir comparecimento presencial.</p></div></article>
          <article className="accordion__item"><button type="button"><span>Em quanto tempo o processo fica pronto?</span><i>+</i></button><div className="accordion__content"><p>O prazo varia conforme destino, categoria, agenda, análise oficial e solicitações adicionais. A equipe fornece um cronograma estimado para cada caso.</p></div></article>
        </div>
      </div>
    </section>
  );
}
