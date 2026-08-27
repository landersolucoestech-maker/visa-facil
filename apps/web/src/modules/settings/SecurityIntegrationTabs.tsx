import { useEffect, useMemo, useState } from 'react';
import { ApiClientError, isBackendConfigured } from '../../shared/apiClient';
import { CAPABILITY_LABELS, INTEGRATION_REGISTRY, META_PRODUCTS, integrationById, type IntegrationConnectionState, type IntegrationId, type IntegrationRuntimeStatus, type MetaProductConnectionState, type OfficialAuthorizationProvider } from '../integrations/integrationContract';
import { connectIntegration, disconnectIntegration, getIntegrationStatuses, reconnectIntegration, syncIntegration } from '../integrations/integrationApi';
import { Card } from './settingsShared';
import { AUTHENTICATION_ENABLED } from '../auth/auth';

const STATUS_LABEL:Record<IntegrationConnectionState,string>={unconfigured:'Não configurado',disconnected:'Desconectado',connecting:'Conectando',connected:'Conectado',degraded:'Degradado',error:'Erro'};
const META_STATUS_LABEL:Record<IntegrationConnectionState,string>={unconfigured:'Não configurado',disconnected:'Configuração incompleta',connecting:'Configuração incompleta',connected:'Conectado',degraded:'Atenção necessária',error:'Erro de autorização'};
const META_PRODUCT_STATUS_LABEL:Record<MetaProductConnectionState,string>={unconfigured:'Não configurado',disconnected:'Não conectado',connected:'Conectado',unavailable:'Indisponível',degraded:'Atenção necessária',error:'Erro'};
const ICONS:Record<IntegrationId,string>={whatsapp:'WA','telephony-sms':'SMS',autentique:'A',nfse:'NF',meta:'M',youtube:'YT',tiktok:'TT','google-ads':'GA','google-calendar':'GC'};
const AUTH_HOSTS:Record<OfficialAuthorizationProvider,readonly string[]>={
 meta:['www.facebook.com','business.facebook.com'],
 google:['accounts.google.com'],
 tiktok:['www.tiktok.com'],
};
const AUTH_PROVIDER_LABEL:Record<OfficialAuthorizationProvider,string>={meta:'Meta',google:'Google',tiktok:'TikTok'};

function statusClass(state:IntegrationConnectionState){return `settings-status is-${state.replace(/\s+/g,'-')}`}
function statusLabel(id:IntegrationId,state:IntegrationConnectionState){return id==='meta'?META_STATUS_LABEL[state]:STATUS_LABEL[state]}
function safeAuthorizationRedirect(provider:OfficialAuthorizationProvider,value:string){
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'||!AUTH_HOSTS[provider].includes(url.hostname))return false;
  window.location.assign(url.toString());
  return true;
 }catch{return false}
}
function formatDateTime(value?:string){
 if(!value)return '';
 const date=new Date(value);
 return Number.isNaN(date.getTime())?value:date.toLocaleString('pt-BR');
}

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
 const run=async(id:IntegrationId,action:'connect'|'reconnect'|'disconnect'|'sync')=>{
  if(!backendConfigured||busy)return;
  const definition=integrationById(id);
  setBusy(id);setError('');
  try{
   const response=action==='connect'?await connectIntegration(id):action==='reconnect'?await reconnectIntegration(id):action==='disconnect'?await disconnectIntegration(id):await syncIntegration(id);
   setStatuses(current=>current.map(item=>item.id===id?response.integration:item));
   if((action==='connect'||action==='reconnect')&&definition.authMode==='oauth2'){
    if(!definition.officialAuthorizationProvider||!response.authorizationUrl||!safeAuthorizationRedirect(definition.officialAuthorizationProvider,response.authorizationUrl))throw new Error('OFFICIAL_AUTHORIZATION_REQUIRED');
   }
  }catch(value){
   if(value instanceof Error&&value.message==='OFFICIAL_AUTHORIZATION_REQUIRED')setError(`A conexão com ${definition.name} foi bloqueada porque o backend não retornou uma URL HTTPS do provedor oficial.`);
   else setError(value instanceof ApiClientError?value.message:'A operação da integração falhou.');
  }finally{setBusy(undefined)}
 };
 return <Card title="Integrações" description="Conectores externos configuráveis pela operação" icon="↗">
  <div className="settings-info-box">{backendConfigured?'Contas sociais e WhatsApp são autenticados exclusivamente nas telas oficiais dos respectivos provedores. Telefonia/SMS usa o adapter e o método de autorização exigidos pelo provedor selecionado. O sistema não solicita senhas, tokens ou chaves privadas no frontend; credenciais autorizadas permanecem no backend.':'A API backend ainda não está configurada. Nenhuma integração é considerada conectada e nenhuma credencial deve ser inserida no frontend.'}</div>
  {error&&<p className="settings-security-notice" role="alert">{error}</p>}
  {categories.map(category=><div className="settings-integration-category" key={category}><div className="settings-integration-category-title"><span>◈</span><strong>{category}</strong></div>{INTEGRATION_REGISTRY.filter(item=>item.category===category).map(item=>{const status=statusFor(item.id);const working=busy===item.id;const linked=status.state==='connected'||status.state==='degraded'||Boolean(status.accountId||status.accountLabel);const authorized=status.authorizedCapabilities?.map(capability=>CAPABILITY_LABELS[capability]);const planned=item.capabilities.map(capability=>CAPABILITY_LABELS[capability]);return <div className="settings-integration-row" key={item.id}><div className="settings-integration-logo">{ICONS[item.id]}</div><div className="settings-integration-copy"><strong>{item.id==='meta'?'Meta — Facebook, Instagram, Messenger e Ads':item.name}</strong><p>{item.description}</p>{item.officialAuthorizationProvider&&<small>Autorização: fluxo oficial {AUTH_PROVIDER_LABEL[item.officialAuthorizationProvider]}</small>}{item.id==='meta'&&<>{status.metaProducts?.length?<div className="settings-meta-products" aria-label="Produtos conectados ao provider Meta">{META_PRODUCTS.map(product=>{const productStatus=status.metaProducts?.find(value=>value.id===product.id);return <div className="settings-meta-product" key={product.id}><span>{product.name}</span><b>{productStatus?META_PRODUCT_STATUS_LABEL[productStatus.state]:'Não informado pelo backend'}</b>{productStatus?.assetIds?.length?<small>{productStatus.assetIds.length} ativo{productStatus.assetIds.length===1?'':'s'} vinculado{productStatus.assetIds.length===1?'':'s'}</small>:null}</div>})}</div>:null}{status.metaAssets?.length?<small>Ativos autorizados informados pelo backend: {status.metaAssets.length}</small>:null}</>}{status.accountLabel&&<small>Conta vinculada: {status.accountLabel}</small>}{status.accountId&&<small>ID da conta: {status.accountId}</small>}{linked?<small>Recursos autorizados: {authorized?.length?authorized.join(' · '):'não informados pelo backend'}</small>:item.id==='meta'||item.id==='telephony-sms'?null:<small>Recursos previstos: {planned.join(' · ')}</small>}{item.authMode==='oauth2'&&linked&&<small>Permissões concedidas: {status.grantedScopes?.length?status.grantedScopes.join(' · '):'não informadas pelo backend'}</small>}{status.lastSyncAt&&<small>Última sincronização: {formatDateTime(status.lastSyncAt)}</small>}{status.expiresAt&&<small>Autorização válida até: {formatDateTime(status.expiresAt)}</small>}{status.errorMessage&&<small role="alert">{status.errorMessage}</small>}</div><div className="settings-integration-actions"><span className={statusClass(status.state)}>{statusLabel(item.id,status.state)}</span>{linked?<><button className="settings-btn settings-btn-outline" type="button" disabled={!backendConfigured||working} onClick={()=>void run(item.id,'sync')}>{working?'Processando…':'Sincronizar'}</button>{item.authMode==='oauth2'&&<button className="settings-btn settings-btn-outline" type="button" disabled={!backendConfigured||working} onClick={()=>void run(item.id,'reconnect')}>Reconectar</button>}<button className="settings-btn settings-btn-outline" type="button" disabled={!backendConfigured||working} onClick={()=>void run(item.id,'disconnect')}>Desconectar</button></>:<button className="settings-btn settings-btn-outline" type="button" disabled={!backendConfigured||working} onClick={()=>void run(item.id,'connect')}>{working?'Processando…':backendConfigured?(item.authMode==='oauth2'?`Conectar ${item.name}`:`Configurar ${item.name}`):'Backend necessário'}</button>}</div></div>})}</div>)}
 </Card>;
}
