import { useEffect, useState } from 'react';
import { LOCAL_PERSISTENCE_ERROR_EVENT, type LocalPersistenceErrorDetail } from '../shared/operationalSessionStore';
import './global-persistence-notice.css';

export function GlobalPersistenceNotice(){
 const [message,setMessage]=useState('');
 useEffect(()=>{
  const onError=(event:Event)=>{
   const detail=(event as CustomEvent<LocalPersistenceErrorDetail>).detail;
   setMessage(detail?.message||'Não foi possível salvar as alterações neste navegador.');
  };
  window.addEventListener(LOCAL_PERSISTENCE_ERROR_EVENT,onError);
  return()=>window.removeEventListener(LOCAL_PERSISTENCE_ERROR_EVENT,onError);
 },[]);
 if(!message)return null;
 return <div className="global-persistence-notice" role="alert"><div><strong>Alterações não salvas</strong><span>{message} Libere espaço no navegador ou tente novamente antes de sair desta página.</span></div><button type="button" onClick={()=>setMessage('')} aria-label="Fechar aviso de persistência">×</button></div>;
}

export default GlobalPersistenceNotice;
