export function PublicFooter() {
  return (
    <>
      <footer className="footer">
        <div className="container footer__top">
          <div className="footer__brand">
            <a className="logo logo--light" href="#inicio">
              <svg className="logo__mark" viewBox="0 0 64 64" aria-hidden="true">
                <path d="M7 8h17l8 39L20 56 7 8Z" fill="#FFFFFF"></path>
                <path d="M29 19c7-6 15-9 26-10-1 6-4 11-9 15-6 4-11 6-17 8v-13Z" fill="#B22234"></path>
                <path d="M31 31c7-5 14-7 24-8-2 6-5 10-10 13-5 3-10 5-14 7V31Z" fill="#E31B23"></path>
                <path d="M32 43c6-4 13-6 21-7-2 6-6 10-10 13-4 3-8 5-11 6V43Z" fill="#B22234"></path>
                <path d="m18 19 1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6L18 19Z" fill="#0D1B3D"></path>
              </svg>
              <span className="logo__text"><strong>VISA FÁCIL</strong><small>seu visto, sem complicação</small></span>
            </a>
            <p>Assessoria especializada para vistos internacionais, com atendimento em português, processo personalizado e orientação clara em cada etapa.</p>
            <div className="footer__social"><a href="#" aria-label="Instagram">ig</a><a href="#" aria-label="Facebook">f</a><a href="#" aria-label="TikTok">tk</a></div>
          </div>
          <div className="footer__column"><h4>Serviços</h4><a href="#eua">Visto americano</a><a href="#canada">Visto canadense</a><a href="#australia">Visto australiano</a><a href="#europa-schengen">Europa e Schengen</a></div>
          <div className="footer__column"><h4>Informações</h4><a href="#processo">Como funciona</a><a href="#duvidas">Dúvidas frequentes</a><a href="#diagnostico">Contato</a><a href="#">Política de privacidade</a><a href="#">Termos de uso</a></div>
          <div className="footer__column"><h4>Atendimento</h4><span>WhatsApp: preencher</span><span>E-mail: preencher</span><span>Segunda a sexta</span><span>Horário: preencher</span></div>
        </div>
        <div className="container footer__bottom"><span>© 2026 VISA FÁCIL. Todos os direitos reservados.</span><span>Não somos órgão consular e não garantimos decisões de autoridades públicas.</span></div>
      </footer>
      <a className="floating-contact" href="#diagnostico" aria-label="Iniciar atendimento"><span>✦</span><b>Falar com a equipe</b></a>
    </>
  );
}
