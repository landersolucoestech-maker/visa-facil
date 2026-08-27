import { AUTHENTICATION_ENABLED, getAuthSession } from '../auth/auth';
import { Card } from './settingsShared';
import './settings.css';
import './settings-responsive.css';
import './settings-layout.css';

function BellIcon(){return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 21h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}

export function ProfileApp(){
 const session=AUTHENTICATION_ENABLED?getAuthSession():null;
 const name=session?.name||'Administrador';
 const email=session?.email||'Indisponível enquanto a autenticação estiver desativada';
 return <div className="crm-shell settings-shell"><div className="crm-workspace">
  <header className="crm-topbar">
   <div><small>VISA FÁCIL · CRM · PERFIL</small><h1>Perfil</h1><p>Informações da conta atualmente utilizada no ambiente interno.</p></div>
   <div className="crm-topbar-actions">
    <button className="settings-notification-btn" type="button" aria-label="Notificações" disabled title="Notificações serão exibidas pelo controle global"><BellIcon/></button>
   </div>
  </header>
  <main className="settings-content"><section className="settings-surface">
   <Card title="Perfil da conta" description="Dados de identificação da conta" icon="♙">
    <div className="settings-form-grid">
     <label className="settings-field"><span>Nome</span><input value={name} readOnly/></label>
     <label className="settings-field"><span>E-mail</span><input value={email} readOnly/></label>
     <label className="settings-field"><span>Tipo de acesso</span><input value="Administrador" readOnly/></label>
     <label className="settings-field"><span>Autenticação</span><input value={AUTHENTICATION_ENABLED?'Ativa':'Desativada'} readOnly/></label>
    </div>
    {!AUTHENTICATION_ENABLED&&<div className="settings-info-box">A autenticação permanece desativada neste ambiente. O perfil exibe apenas a identidade operacional disponível e não simula edição ou persistência de credenciais.</div>}
   </Card>
  </section></main>
 </div></div>;
}

export default ProfileApp;
