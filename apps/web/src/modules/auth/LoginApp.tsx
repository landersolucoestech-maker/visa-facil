import { useState, type FormEvent } from 'react';
import { AUTHENTICATION_ENABLED, signIn } from './auth';
import './auth.css';

function basePath(){const base=import.meta.env.BASE_URL.replace(/\/$/,'');return base||''}
function go(path:string){window.location.href=`${basePath()}${path}`||path}

function BrandMark(){return <span className="auth-brand-mark" aria-hidden="true"><i/><b/></span>}

export function LoginApp({previewOnly=false}:{previewOnly?:boolean}={}){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [remember,setRemember]=useState(true);
  const [showPassword,setShowPassword]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const authDisabled=!AUTHENTICATION_ENABLED;
  const inputDisabled=authDisabled&&!previewOnly;

  async function submit(event:FormEvent){
    event.preventDefault();
    if(authDisabled){setError('A autenticação está desativada neste ambiente. Esta tela está disponível apenas para visualização.');return}
    setBusy(true);setError('');
    try{await signIn(email,password,remember);go('/workspaces')}
    catch(reason){setError(reason instanceof Error?reason.message:'Não foi possível entrar.')}
    finally{setBusy(false)}
  }

  return <main className="auth-page">
    <section className="auth-visual" aria-label="VISA FÁCIL">
      <div className="auth-visual-orb auth-visual-orb--one"/><div className="auth-visual-orb auth-visual-orb--two"/>
      <a className="auth-brand" href={`${basePath()}/`}><BrandMark/><span><strong>VISA FÁCIL</strong><small>Plataforma interna</small></span></a>
      <div className="auth-visual-copy">
        <span className="auth-eyebrow">ACESSO ADMINISTRATIVO</span>
        <h1>Um único acesso.<br/><em>Todos os workspaces.</em></h1>
      </div>
      <small className="auth-visual-footer">VISA FÁCIL · Gestão centralizada</small>
    </section>
    <section className="auth-panel">
      <div className="auth-card">
        <div className="auth-mobile-brand"><BrandMark/><strong>VISA FÁCIL</strong></div>
        <span className="auth-eyebrow">{previewOnly?'PRÉVIA DA AUTENTICAÇÃO':authDisabled?'AUTENTICAÇÃO DESATIVADA':'BEM-VINDO'}</span><h2>{previewOnly?'Acesse sua conta':authDisabled?'Acesso por credenciais indisponível':'Acesse sua conta'}</h2><p className="auth-lead">{previewOnly?'Visualização da tela de login. Os campos podem ser preenchidos para revisão da interface, mas nenhuma credencial é enviada ou validada.':authDisabled?'Nenhum provedor de autenticação real está conectado neste ambiente.':'Use suas credenciais para continuar para a seleção de workspace.'}</p>
        <form onSubmit={submit}>
          <label><span>E-mail</span><input autoFocus={!inputDisabled} disabled={inputDisabled} type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seuemail@visafacil.com.br" required/></label>
          <label><span>Senha</span><div className="auth-password"><input disabled={inputDisabled} type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/><button type="button" disabled={inputDisabled} onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Ocultar':'Mostrar'}</button></div></label>
          <div className="auth-options"><label className="auth-check"><input disabled={inputDisabled} type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Manter conectado</span></label>{!authDisabled&&<button type="button" className="auth-link" onClick={()=>setError('Recuperação de senha ainda não está disponível.')}>Esqueci minha senha</button>}</div>
          {error&&<div className="auth-error" role="alert">{error}</div>}
          <button className="auth-submit" type="submit" disabled={busy||authDisabled}>{authDisabled?'Autenticação desativada':busy?'Entrando...':'Entrar'}</button>
        </form>
        <div className="auth-prototype-note"><b>{previewOnly?'Prévia visual:':'Ambiente atual:'}</b> autenticação desativada. Nenhuma credencial é validada ou sessão é criada até que um provedor real seja implementado e a autenticação seja explicitamente habilitada.</div>
        <a className="auth-back" href={`${basePath()}/`}>← Voltar ao site público</a>
      </div>
    </section>
  </main>
}

export default LoginApp;
