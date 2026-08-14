export function PublicHeader() {
  return (
    <>
      <div className="announcement">
        <div className="container announcement__inner">
          <span>Atendimento online para todo o Brasil</span>
          <a href="#diagnostico">
            Faça uma análise inicial gratuita
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
      <header className="header" id="inicio">
        <div className="container header__inner">
          <a className="logo" href="#inicio" aria-label="VISA FÁCIL, página inicial">
            <svg className="logo__mark" viewBox="0 0 64 64" aria-hidden="true">
              <path d="M7 8h17l8 39L20 56 7 8Z" fill="#FFFFFF"></path>
              <path d="M29 19c7-6 15-9 26-10-1 6-4 11-9 15-6 4-11 6-17 8v-13Z" fill="#B22234"></path>
              <path d="M31 31c7-5 14-7 24-8-2 6-5 10-10 13-5 3-10 5-14 7V31Z" fill="#E31B23"></path>
              <path d="M32 43c6-4 13-6 21-7-2 6-6 10-10 13-4 3-8 5-11 6V43Z" fill="#B22234"></path>
              <path d="m18 19 1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6L18 19Z" fill="#0D1B3D"></path>
            </svg>
            <span className="logo__text">
              <strong>VISA FÁCIL</strong>
              <small>seu visto, sem complicação</small>
            </span>
          </a>
          <nav className="nav" aria-label="Navegação principal" data-nav="">
            <a href="#eua">EUA</a>
            <a href="#canada">Canadá</a>
            <div className="nav__dropdown">
              <button type="button" className="nav__trigger">
                Vistos
                <span>⌄</span>
              </button>
              <div className="nav__menu">
                <a href="#australia">
                  <b>Austrália</b>
                  <small>Planejamento e evidências</small>
                </a>
                <a href="#europa-schengen">
                  <b>Europa e Schengen</b>
                  <small>Autorizações e requisitos</small>
                </a>
              </div>
            </div>
            <a href="#processo">Como Funciona</a>
            <a href="#duvidas">Dúvidas</a>
          </nav>
          <div className="header__actions">
            <a className="btn btn--small btn--primary" href="#diagnostico">Analisar meu perfil</a>
            <button className="menu-button" type="button" aria-label="Abrir menu" aria-expanded="false" data-menu-button="">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
