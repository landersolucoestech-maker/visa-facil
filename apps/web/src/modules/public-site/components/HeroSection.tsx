import heroVisaFacil from '../assets/hero-visa-facil.webp';

export function HeroSection() {
  return (
    <section className="hero" aria-label="Destaques VISA FÁCIL">
      <div className="hero-slider hero-slider--background" data-hero-slider="" aria-label="Destaques e campanhas">
        <article className="hero-slide is-active" data-hero-slide="">
          <img src={heroVisaFacil} alt="Estátua da Liberdade, skyline de Nova York e bandeira dos Estados Unidos" />
        </article>
        <article className="hero-slide" data-hero-slide="">
          <img src="https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=1800&q=90" alt="Nova York e a Estátua da Liberdade" />
        </article>
        <article className="hero-slide" data-hero-slide="">
          <img src="https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=1800&q=90" alt="Toronto, Canadá" />
        </article>
        <button className="hero-slider__side hero-slider__side--prev" type="button" aria-label="Destaque anterior" data-hero-prev="">‹</button>
        <button className="hero-slider__side hero-slider__side--next" type="button" aria-label="Próximo destaque" data-hero-next="">›</button>
        <div className="hero-slider__dots" aria-label="Selecionar destaque">
          <button className="hero-slider__dot is-active" type="button" aria-label="Mostrar destaque 1" data-hero-dot="0" />
          <button className="hero-slider__dot" type="button" aria-label="Mostrar destaque 2" data-hero-dot="1" />
          <button className="hero-slider__dot" type="button" aria-label="Mostrar destaque 3" data-hero-dot="2" />
        </div>
      </div>

      <div className="container hero__grid">
        <div className="hero__content">
          <h1>Seu sonho internacional começa com a <em>estratégia certa.</em></h1>
          <div className="hero__trust">
            <div><span className="check">✓</span> Atendimento online</div>
            <div><span className="check">✓</span> Suporte em português</div>
            <div><span className="check">✓</span> Processo personalizado</div>
          </div>
          <div className="hero__mini-benefits" aria-label="Diferenciais do atendimento">
            <div><span>01</span><b>Atendimento nacional</b></div>
            <div><span>02</span><b>Estratégia individual</b></div>
            <div><span>03</span><b>Jornada conectada</b></div>
            <div><span>04</span><b>Comunicação clara</b></div>
          </div>
          <div className="hero__actions">
            <a className="btn btn--large btn--primary" href="#diagnostico">Analisar meu perfil</a>
            <a className="btn btn--large btn--outline" href="#servicos">Conhecer os serviços</a>
          </div>
        </div>
      </div>
    </section>
  );
}
