import { useState, type FormEvent } from 'react';
import { signIn } from './auth';
import './auth.css';

function basePath(){const base=import.meta.env.BASE_URL.replace(/\/$/,'');return base||''}
function go(path:string){window.location.href=`${basePath()}${path}`||path}

function BrandMark(){return <span className="auth-brand-mark" aria-hidden="true"><i/><b/></span>}

export function LoginApp(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [remember,setRemember]=useState(true);
  const [showPassword,setShowPassword]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function submit(event:FormEvent){
    event.preventDefault();setBusy(true);setError('');
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
        <p>Entre para administrar a operação comercial e o site institucional do VISA FÁCIL em ambientes separados e conectados.</p>
        <div className="auth-visual-points"><span>CRM</span><span>Site / Website</span><span>Mais workspaces no futuro</span></div>
      </div>
      <small className="auth-visual-footer">VISA FÁCIL · Gestão centralizada</small>
    </section>
    <section className="auth-panel">
      <div className="auth-card">
        <div className="auth-mobile-brand"><BrandMark/><strong>VISA FÁCIL</strong></div>
        <span className="auth-eyebrow">BEM-VINDO</span><h2>Acesse sua conta</h2><p className="auth-lead">Use suas credenciais para continuar para a seleção de workspace.</p>
        <form onSubmit={submit}>
          <label><span>E-mail</span><input autoFocus type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seuemail@visafacil.com.br" required/></label>
          <label><span>Senha</span><div className="auth-password"><input type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Ocultar':'Mostrar'}</button></div></label>
          <div className="auth-options"><label className="auth-check"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Manter conectado</span></label><button type="button" className="auth-link" onClick={()=>setError('Recuperação de senha será conectada ao provedor de autenticação definitivo.')}>Esqueci minha senha</button></div>
          {error&&<div className="auth-error" role="alert">{error}</div>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy?'Entrando...':'Entrar'}</button>
        </form>
        <div className="auth-prototype-note"><b>Ambiente atual:</b> o fluxo e a sessão já estão ativos; o provedor de credenciais ainda é um adapter frontend e deverá ser trocado por autenticação de backend antes de produção.</div>
        <a className="auth-back" href={`${basePath()}/`}>← Voltar ao site público</a>
      </div>
    </section>
  </main>
}

export default LoginApp;
