import { useEffect, useMemo, useState } from 'react';
import { ApiClientError, isBackendConfigured } from '../../shared/apiClient';
import { INTEGRATION_REGISTRY, type IntegrationConnectionState, type IntegrationId, type IntegrationRuntimeStatus } from '../integrations/integrationContract';
import { connectIntegration, disconnectIntegration, getIntegrationStatuses, syncIntegration } from '../integrations/integrationApi';
import { Card } from './settingsShared';
import { AUTHENTICATION_ENABLED } from '../auth/auth';

const STATUS_LABEL:Record<IntegrationConnectionState,string>={unconfigured:'Não configurado',disconnected:'Desconectado',connecting:'Conectando',connected:'Conectado',degraded:'Degradado',error:'Erro'};
const ICONS:Record<IntegrationId,string>={whatsapp:'WA',resend:'R',autentique:'A',nfse:'NF',instagram:'IG',facebook:'FB',youtube:'YT',tiktok:'TT','google-ads':'GA','google-calendar':'GC'};

function statusClass(state:IntegrationConnectionState){return `settings-status is-${state.replace(/\s+/g,'-')}`}
function safeAuthorizationRedirect(value:string){try{const url=new URL(value,window.location.origin);if(url.protocol==='https:'||(import.meta.env.DEV&&url.protocol==='http:'))window.location.assign(url.toString())}catch{ /* invalid authorization URL returned by backend */ }}

export function SecurityTab(){
 return <Card title="Segurança da Conta" description="Estado das proteções de acesso deste ambiente" icon="◈">
  <div className="settings-info-box">
   {AUTHENTICATION_ENABLED
    ? 'A autenticação está habilitada. As operações de segurança dependem do provedor configurado.'
    : 'A autenticação está desativada neste ambiente. Alteração de senha, 2FA, gestão de sessões e exclusão de conta permanecem indisponíveis até existir um provedor de autenticação real.'}
  </div>
  <div className="settings-security-block"><h3>Credenciais</h3><div className="settings-security-row"><div className="settings-security-row-icon">▯</div><div><strong>Senha e autenticação em duas etapas</strong><p>Requer um provedor de autenticação server-side.</p></div><button className="settings-btn settings-btn-outline" type="button" disabled>Indisponível</button></div></div>
  <div className="settings-divider"/>
  <div className="settings-security-block"><h3>Sessões</h3><div className="settings-security-row"><div className="settings-security-row-icon">▰</div><div><strong>Gerenciamento de sessões</strong><p>Não há sessão autenticada de backend para inspecionar ou revogar.</p></div><span className="settings-status is-indisponivel">Indisponível</span></div></div>
  <div className="settings-divider"/>
  <div className="settings-security-block"><h3 className="is-danger-text">Conta</h3><div className="settings-danger-row"><div><strong>Exclusão de conta</strong><p>Disponível somente quando identidade e autorização estiverem conectadas a um backend.</p></div><button className="settings-btn settings-btn-danger" type="button" disabled>Indisponível</button></div></div>
 </Card>;
}

export function IntegrationsTab(){
 const backendConfigured=isBackendConfigured();
 const [statuses,setStatuses]=useState<IntegrationRuntimeStatus[]>(()=>INTEGRATION_REGISTRY.map(item=>({id:item.id,state:'unconfigured'})));
 const [busy,setBusy]=useState<IntegrationId>();
 const [error,setError]=useState('');
 const categories=useMemo(()=>Array.from(new Set(INTEGRATION_REGISTRY.map(item=>item.category))),[]);
 const refresh=async(signal?:AbortSignal)=>{if(!backendConfigured)return;try{setStatuses(await getIntegrationStatuses(signal));setError('')}catch(value){if(signal?.aborted)return;setError(value instanceof ApiClientError?value.message:'Não foi possível consultar o estado das integrações.')}};
 useEffect(()=>{const controller=new AbortController();void refresh(controller.signal);return()=>controller.abort()},[]);
 const statusFor=(id:IntegrationId)=>statuses.find(item=>item.id===id)??{id,state:'unconfigured' as const};
 const run=async(id:IntegrationId,action:'connect'|'disconnect'|'sync')=>{
  if(!backendConfigured||busy)return;
  setBusy(id);setError('');
  try{
   const response=action==='connect'?await connectIntegration(id):action==='disconnect'?await disconnectIntegration(id):await syncIntegration(id);
   setStatuses(current=>current.map(item=>item.id===id?response.integration:item));
   if(response.authorizationUrl)safeAuthorizationRedirect(response.authorizationUrl);
  }catch(value){setError(value instanceof ApiClientError?value.message:'A operação da integração falhou.')}finally{setBusy(undefined)}
 };
 return <Card title="Integrações" description="Estado real dos conectores externos" icon="↗">
  <div className="settings-info-box">{backendConfigured?'Os estados abaixo são consultados na API backend. Credenciais e tokens permanecem fora do bundle do navegador.':'A API backend ainda não está configurada. Nenhuma integração é considerada conectada e nenhuma credencial deve ser inserida no frontend.'}</div>
  {error&&<p className="settings-security-notice" role="alert">{error}</p>}
  {categories.map(category=><div className="settings-integration-category" key={category}><div className="settings-integration-category-title"><span>◈</span><strong>{category}</strong></div>{INTEGRATION_REGISTRY.filter(item=>item.category===category).map(item=>{const status=statusFor(item.id);const working=busy===item.id;return <div className="settings-integration-row" key={item.id}><div className="settings-integration-logo">{ICONS[item.id]}</div><div className="settings-integration-copy"><strong>{item.name}</strong><p>{item.description}</p>{status.accountLabel&&<small>{status.accountLabel}</small>}{status.errorMessage&&<small role="alert">{status.errorMessage}</small>}</div><div className="settings-integration-actions"><span className={statusClass(status.state)}>{STATUS_LABEL[status.state]}</span>{status.state==='connected'?<><button className="settings-btn settings-btn-outline" type="button" disabled={!backendConfigured||working} onClick={()=>void run(item.id,'sync')}>{working?'Processando…':'Sincronizar'}</button><button className="settings-btn settings-btn-outline" type="button" disabled={!backendConfigured||working} onClick={()=>void run(item.id,'disconnect')}>Desconectar</button></>:<button className="settings-btn settings-btn-outline" type="button" disabled={!backendConfigured||working} onClick={()=>void run(item.id,'connect')}>{working?'Processando…':backendConfigured?'Conectar':'Backend necessário'}</button>}</div></div>})}</div>)}
 </Card>;
}
