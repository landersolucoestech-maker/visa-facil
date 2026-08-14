import heroVisaFacil from '../assets/hero-visa-facil.webp';

export function HeroSection() {
  return (
    <section className="hero" aria-label="Destaques VISA FÁCIL">
      <div className="hero-slider hero-slider--background" data-hero-slider="" aria-label="Destaques e campanhas">
        <article className="hero-slide is-active" data-hero-slide="">
          <img src={heroVisaFacil} alt="Estátua da Liberdade, skyline de Nova York e bandeira dos Estados Unidos" />
        </article>
        <article className="hero-slide" data-hero-slide="">
          <img src="https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=1800&q=90" alt="Nova York, Estados Unidos" />
        </article>
        <article className="hero-slide" data-hero-slide="">
          <img src="https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=1800&q=90" alt="Toronto, Canadá" />
        </article>
        <button type="button" className="hero-slider__side hero-slider__side--prev" aria-label="Banner anterior" data-hero-prev="">‹</button>
        <button type="button" className="hero-slider__side hero-slider__side--next" aria-label="Próximo banner" data-hero-next="">›</button>
        <div className="hero-slider__dots" aria-label="Selecionar banner">
          <button className="hero-slider__dot is-active" type="button" aria-label="Mostrar banner 1" data-hero-dot="0" />
          <button className="hero-slider__dot" type="button" aria-label="Mostrar banner 2" data-hero-dot="1" />
          <button className="hero-slider__dot" type="button" aria-label="Mostrar banner 3" data-hero-dot="2" />
        </div>
      </div>

      <div className="container hero__grid">
        <div className="hero__content reveal">
          <h1>O caminho mais fácil<br />para o seu visto<br /><em>começa aqui.</em></h1>
          <div className="hero__trust">
            <div><span className="check">✓</span><b>Atendimento online</b></div>
            <div><span className="check">✓</span><b>Suporte em português</b></div>
            <div><span className="check">✓</span><b>Processo personalizado</b></div>
          </div>
          <div className="hero__mini-benefits" aria-label="Diferenciais do atendimento">
            <div><span>★</span><b>Atendimento nacional</b></div>
            <div><span>◎</span><b>Estratégia individual</b></div>
            <div><span>↗</span><b>Jornada conectada</b></div>
            <div><span>◯</span><b>Comunicação clara</b></div>
          </div>
          <div className="hero__actions">
            <a className="btn btn--primary btn--large" href="#diagnostico">Analisar meu perfil</a>
            <a className="btn btn--outline btn--large" href="#servicos">Conhecer os serviços</a>
          </div>
        </div>
      </div>

      <div className="container confidence-strip reveal">
        <div><b>Atendimento nacional</b><span>Onde você estiver</span></div>
        <div><b>Estratégia individual</b><span>Sem pacote genérico</span></div>
        <div><b>Jornada conectada</b><span>Do visto à próxima etapa</span></div>
        <div><b>Comunicação clara</b><span>Orientação em português</span></div>
      </div>
    </section>
  );
}
