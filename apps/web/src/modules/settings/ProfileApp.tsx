import { AUTHENTICATION_ENABLED, getAuthSession } from '../auth/auth';
import { Card } from './settingsShared';
import './settings.css';
import './settings-responsive.css';
import './settings-layout-fix.css';

export function ProfileApp(){
 const session=AUTHENTICATION_ENABLED?getAuthSession():null;
 const name=session?.name||'Administrador';
 const email=session?.email||'Indisponível enquanto a autenticação estiver desativada';
 return <div className="crm-shell settings-shell"><div className="crm-workspace">
  <header className="crm-topbar"><div><small>VISA FÁCIL · CRM · PERFIL</small><h1>Perfil</h1><p>Informações da conta atualmente utilizada no ambiente interno.</p></div></header>
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
