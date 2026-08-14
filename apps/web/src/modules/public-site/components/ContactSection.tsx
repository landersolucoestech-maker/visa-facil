export function ContactSection() {
  return (
    <section className="section contact" id="diagnostico">
      <div className="container contact__card reveal">
        <div className="contact__copy">
          <span className="kicker kicker--light">Análise inicial</span>
          <h2>Conte seu objetivo. Nós organizamos o primeiro passo.</h2>
          <p>Preencha os dados para receber um direcionamento inicial sobre serviço, documentos e próximos passos.</p>
          <div className="contact__assurances"><span>✓ Sem compromisso</span><span>✓ Dados tratados com confidencialidade</span><span>✓ Retorno por canal autorizado</span></div>
        </div>
        <form className="contact__form" data-form="">
          <div className="field"><label htmlFor="nome">Nome completo</label><input id="nome" name="nome" type="text" placeholder="Seu nome" required /></div>
          <div className="field"><label htmlFor="telefone">WhatsApp</label><input id="telefone" name="telefone" type="tel" placeholder="(00) 00000-0000" required /></div>
          <div className="field"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" placeholder="voce@email.com" required /></div>
          <div className="field"><label htmlFor="servico">Objetivo principal</label><select id="servico" name="servico" required><option value="">Selecione</option><option>Visto americano</option><option>Visto canadense</option><option>Visto australiano</option><option>Europa e Schengen</option><option>Renovação de visto</option><option>Outro objetivo</option></select></div>
          <div className="field field--full"><label htmlFor="mensagem">Conte brevemente seu caso</label><textarea id="mensagem" name="mensagem" rows={4} placeholder="Destino, objetivo, prazo e informações relevantes"></textarea></div>
          <label className="consent field--full"><input type="checkbox" required /><span>Autorizo o contato e declaro que li a política de privacidade.</span></label>
          <button className="btn btn--coral btn--large field--full" type="submit">Enviar para análise <span>→</span></button>
          <p className="form-feedback field--full" data-form-feedback=""></p>
        </form>
      </div>
    </section>
  );
}
