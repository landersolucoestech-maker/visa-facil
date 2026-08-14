import { useEffect, useState } from 'react';

export function SettingsPage() {
  const [compact, setCompact] = useState(false);
  const [showFlag, setShowFlag] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [taskAlerts, setTaskAlerts] = useState(true);

  useEffect(() => {
    document.body.classList.toggle('management-compact', compact);
    document.body.classList.toggle('management-hide-flag', !showFlag);
    document.body.classList.toggle('management-reduced-motion', reducedMotion);
    return () => {
      document.body.classList.remove('management-compact', 'management-hide-flag', 'management-reduced-motion');
    };
  }, [compact, reducedMotion, showFlag]);

  return <section className="management-page settings-page" aria-labelledby="settings-title">
    <div className="management-page__heading management-page__heading--row"><div><span className="management-eyebrow">Preferências</span><h1 id="settings-title">Configurações</h1><p>Ajustes de interface que funcionam imediatamente nesta sessão e visão transparente das integrações ainda não conectadas.</p></div><span className="management-status">Somente frontend</span></div>

    <div className="settings-brand-card"><div><span className="management-eyebrow">Identidade ativa</span><h2>Visa Fácil · Estados Unidos</h2><p>Navy, vermelho, branco e azul permanecem como identidade oficial do sistema interno.</p></div><div className="settings-palette" aria-label="Paleta visual"><i className="is-navy"/><i className="is-red"/><i className="is-white"/><i className="is-blue"/></div></div>

    <div className="settings-layout">
      <section className="settings-section"><div className="settings-section__heading"><span className="management-eyebrow">Interface</span><h2>Aparência do sistema</h2><p>Estes controles alteram o frontend imediatamente e voltam ao padrão quando a página é recarregada.</p></div><div className="settings-grid">
        <article><div><strong>Interface compacta</strong><span>Reduz espaçamentos de conteúdo, tabelas e formulários.</span></div><button type="button" className={compact?'settings-toggle is-on':'settings-toggle'} onClick={()=>setCompact(v=>!v)} aria-pressed={compact}><i /></button></article>
        <article><div><strong>Bandeira na sidebar</strong><span>Mostrar o detalhe visual inspirado na bandeira dos EUA.</span></div><button type="button" className={showFlag?'settings-toggle is-on':'settings-toggle'} onClick={()=>setShowFlag(v=>!v)} aria-pressed={showFlag}><i /></button></article>
        <article><div><strong>Reduzir movimentos</strong><span>Desativa transições e animações do sistema nesta sessão.</span></div><button type="button" className={reducedMotion?'settings-toggle is-on':'settings-toggle'} onClick={()=>setReducedMotion(v=>!v)} aria-pressed={reducedMotion}><i /></button></article>
      </div></section>

      <section className="settings-section"><div className="settings-section__heading"><span className="management-eyebrow">Preferências futuras</span><h2>Notificações</h2><p>Os controles podem ser preparados visualmente, mas nenhum e-mail ou lembrete é enviado sem backend.</p></div><div className="settings-grid">
        <article><div><strong>Alertas por e-mail</strong><span>Preferência visual para notificações futuras.</span></div><button type="button" className={emailAlerts?'settings-toggle is-on':'settings-toggle'} onClick={()=>setEmailAlerts(v=>!v)} aria-pressed={emailAlerts}><i /></button></article>
        <article><div><strong>Alertas de tarefas</strong><span>Preferência visual para lembretes operacionais futuros.</span></div><button type="button" className={taskAlerts?'settings-toggle is-on':'settings-toggle'} onClick={()=>setTaskAlerts(v=>!v)} aria-pressed={taskAlerts}><i /></button></article>
      </div></section>
    </div>

    <section className="settings-integrations"><div className="settings-section__heading"><span className="management-eyebrow">Integrações</span><h2>Prontas para futura conexão</h2><p>Nenhuma integração abaixo é simulada. Os cards apenas reservam o espaço e o estado visual correto para quando a camada técnica for autorizada.</p></div><div className="settings-integration-grid"><article><span className="settings-integration-icon">WA</span><div><strong>WhatsApp</strong><small>Canal futuro do VisaChat</small></div><b>Não conectado</b></article><article><span className="settings-integration-icon">EM</span><div><strong>E-mail</strong><small>Notificações e histórico</small></div><b>Não conectado</b></article><article><span className="settings-integration-icon">CL</span><div><strong>Calendário</strong><small>Agenda e compromissos</small></div><b>Não conectado</b></article></div></section>

    <div className="management-session-note">As preferências não são persistidas após recarregar a página. Integrações, notificações reais e armazenamento continuam fora do escopo enquanto o desenvolvimento permanecer somente frontend.</div>
  </section>;
}
