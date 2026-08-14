import { useState } from 'react';

export function SettingsPage() {
  const [compact, setCompact] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [taskAlerts, setTaskAlerts] = useState(true);
  return <section className="management-page settings-page" aria-labelledby="settings-title">
    <div className="management-page__heading"><span className="management-eyebrow">Preferências</span><h1 id="settings-title">Configurações</h1><p>Preferências visuais e operacionais disponíveis somente nesta sessão frontend.</p></div>
    <div className="settings-grid">
      <article><div><strong>Interface compacta</strong><span>Reduzir espaçamentos em tabelas e formulários.</span></div><button type="button" className={compact?'settings-toggle is-on':'settings-toggle'} onClick={()=>setCompact(v=>!v)} aria-pressed={compact}><i /></button></article>
      <article><div><strong>Alertas por e-mail</strong><span>Preferência visual para notificações futuras.</span></div><button type="button" className={emailAlerts?'settings-toggle is-on':'settings-toggle'} onClick={()=>setEmailAlerts(v=>!v)} aria-pressed={emailAlerts}><i /></button></article>
      <article><div><strong>Alertas de tarefas</strong><span>Preferência visual para lembretes operacionais.</span></div><button type="button" className={taskAlerts?'settings-toggle is-on':'settings-toggle'} onClick={()=>setTaskAlerts(v=>!v)} aria-pressed={taskAlerts}><i /></button></article>
    </div>
    <div className="management-session-note">As preferências não são persistidas após recarregar a página enquanto o backend permanecer fora do escopo.</div>
  </section>;
}
