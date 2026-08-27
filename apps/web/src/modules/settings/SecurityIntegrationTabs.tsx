import { useEffect, useMemo, useState } from 'react';
import { ApiClientError, isBackendConfigured } from '../../shared/apiClient';
import { CAPABILITY_LABELS, GOOGLE_PRODUCTS, INTEGRATION_REGISTRY, META_PRODUCTS, integrationById, type IntegrationConnectionState, type IntegrationId, type IntegrationRuntimeStatus, type MetaProductConnectionState, type OfficialAuthorizationProvider } from '../integrations/integrationContract';
import { connectIntegration, disconnectIntegration, getIntegrationStatuses, reconnectIntegration, syncIntegration } from '../integrations/integrationApi';
import { officialAuthorizationUrl } from '../integrations/officialAuthorization';
import { Card } from './settingsShared';
import { AUTHENTICATION_ENABLED } from '../auth/auth';

const STATUS_LABEL:Record<IntegrationConnectionState,string>={unconfigured:'Não configurado',disconnected:'Desconectado',connecting:'Conectando',connected:'Conectado',degraded:'Degradado',error:'Erro'};
const PROVIDER_STATUS_LABEL:Record<IntegrationConnectionState,string>={unconfigured:'Não configurado',disconnected:'Configuração incompleta',connecting:'Configuração incompleta',connected:'Conectado',degraded:'Atenção necessária',error:'Erro de autorização'};
const PRODUCT_STATUS_LABEL:Record<MetaProductConnectionState,string>={unconfigured:'Não configurado',disconnected:'Não conectado',connected:'Conectado',unavailable:'Indisponível',degraded:'Atenção necessária',error:'Erro'};
const ICONS:Record<IntegrationId,string>={whatsapp:'WA','telephony-sms':'SMS',autentique:'A',nfse:'NF',meta:'M',google:'G',tiktok:'TT'};
const AUTH_PROVIDER_LABEL:Record<OfficialAuthorizationProvider,string>={meta:'Meta',google:'Google',tiktok:'TikTok'};

type IntegrationServicePresentation={name:string;description:string;resources:string[]};
type IntegrationPresentation={kicker?:string;paragraphs:string[];resources?:string[];services?:IntegrationServicePresentation[]};

const PRESENTATION:Record<IntegrationId,IntegrationPresentation>={
 whatsapp:{
  paragraphs:['Integração oficial com a WhatsApp Business Platform, centralizando mensagens, atendimento e gerenciamento de conversas diretamente no VisaChat.'],
  resources:['Mensagens','Atendimento','Gerenciamento de conversas','Informações da conta'],
 },
 'telephony-sms':{
  paragraphs:[
   'Camada de integração agnóstica para conexão com operadoras de telefonia e provedores de comunicação via internet, permitindo centralizar recursos de SMS, voz e números telefônicos no CRM e no VisaChat.',
   'A arquitetura deverá permitir a conexão futura com operadoras como Vivo, TIM, Claro e outros provedores compatíveis, além de plataformas IP como Twilio, Dialpad, RingCentral e similares, sempre por meio das APIs oficiais disponíveis.',
  ],
  resources:['SMS','Voz','Linhas e números','Recebimento e envio de mensagens','Roteamento','Atendimento','Histórico de comunicação'],
 },
 autentique:{
  paragraphs:['Integração oficial para criação, envio, acompanhamento e assinatura eletrônica de documentos e contratos diretamente pelo sistema.'],
  resources:['Documentos','Assinatura eletrônica','Envio para assinatura','Acompanhamento de status','Histórico de assinaturas'],
 },
 nfse:{
  paragraphs:['Integração fiscal através de uma camada de adapters, permitindo conectar diferentes provedores, municípios e serviços compatíveis para emissão e gerenciamento de Notas Fiscais de Serviço eletrônicas.'],
  resources:['Emissão de NFS-e','Consulta','Cancelamento','Acompanhamento de status','Documentos fiscais','Histórico fiscal'],
 },
 meta:{
  kicker:'Facebook · Instagram · Messenger · Meta Ads',
  paragraphs:[
   'Integração oficial com o ecossistema Meta, utilizando uma única estrutura de autorização para disponibilizar os recursos permitidos de Facebook, Instagram, Messenger e Meta Ads.',
   'A conexão deverá centralizar atendimento, mensagens, gestão de conteúdo, interações sociais, publicidade e métricas conforme as permissões concedidas e os recursos disponibilizados pelas APIs oficiais da Meta.',
  ],
  resources:['Mensagens','Atendimento','Informações da conta','Páginas e perfis','Publicação','Gestão de conteúdo','Comentários e moderação','Campanhas e anúncios','Métricas e analytics'],
 },
 google:{
  kicker:'YouTube · Google Ads · Google Calendar',
  paragraphs:[
   'Integração oficial com o ecossistema Google, utilizando uma estrutura centralizada de autenticação e autorização para habilitar os serviços Google disponíveis no sistema conforme as permissões concedidas pelo usuário.',
   'A conexão poderá habilitar individualmente ou em conjunto os seguintes serviços:',
  ],
  services:[
   {
    name:'YouTube',
    description:'Gerenciamento de canais e conteúdos do YouTube, incluindo informações da conta, vídeos, uploads, publicações, comentários, moderação e métricas disponibilizadas pelas APIs oficiais.',
    resources:['Informações da conta','Canais','Vídeos','Upload e publicação','Gestão de conteúdo','Comentários e moderação','Métricas e analytics'],
   },
   {
    name:'Google Ads',
    description:'Criação, configuração, gerenciamento, consulta e acompanhamento de campanhas publicitárias no ecossistema Google, incluindo publicidade relacionada ao YouTube quando suportada pelas APIs e pelo tipo de campanha utilizado.',
    resources:['Contas de anúncios','Campanhas','Grupos de anúncios','Anúncios','Segmentação','Orçamento','Métricas','Conversões','Analytics','Inventário de YouTube quando aplicável'],
   },
   {
    name:'Google Calendar',
    description:'Sincronização de compromissos, eventos e agendas com suporte a comunicação bidirecional quando autorizada e suportada pela integração.',
    resources:['Calendários','Eventos','Compromissos','Criação e atualização de eventos','Sincronização de agenda','Sincronização bidirecional'],
   },
  ],
 },
 tiktok:{
  paragraphs:[
   'Integração oficial com o ecossistema TikTok, permitindo habilitar recursos de conta, conteúdo, métricas e publicidade conforme a disponibilidade das APIs, o tipo de conta e as permissões aprovadas pela plataforma.',
   'A integração deverá utilizar exclusivamente recursos oficialmente disponibilizados e autorizados pelo TikTok.',
  ],
  resources:['Informações da conta','Publicação','Gestão de conteúdo','Métricas e analytics','Campanhas e anúncios quando autorizados'],
 },
};

function statusClass(state:IntegrationConnectionState){return `settings-status is-${state.replace(/\s+/g,'-')}`}
function statusLabel(id:IntegrationId,state:IntegrationConnectionState){return id==='meta'||id==='google'?PROVIDER_STATUS_LABEL[state]:STATUS_LABEL[state]}
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

function ProviderProducts({status}:{status:IntegrationRuntimeStatus}){
 if(status.id==='meta'&&status.metaProducts?.length){
  return <div className="settings-provider-products" aria-label="Produtos conectados ao provider Meta">{META_PRODUCTS.map(product=>{const productStatus=status.metaProducts?.find(value=>value.id===product.id);return <div className="settings-provider-product" key={product.id}><span>{product.name}</span><b>{productStatus?PRODUCT_STATUS_LABEL[productStatus.state]:'Não informado pelo backend'}</b>{productStatus?.assetIds?.length?<small>{productStatus.assetIds.length} ativo{productStatus.assetIds.length===1?'':'s'} vinculado{productStatus.assetIds.length===1?'':'s'}</small>:null}</div>})}</div>;
 }
 if(status.id==='google'&&status.googleProducts?.length){
  return <div className="settings-provider-products" aria-label="Serviços conectados ao provider Google">{GOOGLE_PRODUCTS.map(product=>{const productStatus=status.googleProducts?.find(value=>value.id===product.id);return <div className="settings-provider-product" key={product.id}><span>{product.name}</span><b>{productStatus?PRODUCT_STATUS_LABEL[productStatus.state]:'Não informado pelo backend'}</b></div>})}</div>;
 }
 return null;
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
   if((action==='connect'||action==='reconnect')&&definition.authMode==='oauth2'){
    const redirect=definition.officialAuthorizationProvider&&response.authorizationUrl?officialAuthorizationUrl(definition.officialAuthorizationProvider,response.authorizationUrl):null;
    if(!redirect)throw new Error('OFFICIAL_AUTHORIZATION_REQUIRED');
    window.location.assign(redirect);
    return;
   }
   setStatuses(current=>current.map(item=>item.id===id?response.integration:item));
  }catch(value){
   if(value instanceof Error&&value.message==='OFFICIAL_AUTHORIZATION_REQUIRED')setError(`A conexão com ${definition.name} foi bloqueada porque o backend não retornou uma URL HTTPS do provedor oficial.`);
   else setError(value instanceof ApiClientError?value.message:'A operação da integração falhou.');
  }finally{setBusy(undefined)}
 };
 return <Card title="Integrações" description="Conectores externos configuráveis pela operação" icon="↗">
  {error&&<p className="settings-security-notice" role="alert">{error}</p>}
  {categories.map(category=><div className="settings-integration-category" key={category}><div className="settings-integration-category-title"><span>◈</span><strong>{category}</strong></div>{INTEGRATION_REGISTRY.filter(item=>item.category===category).map(item=>{const status=statusFor(item.id);const working=busy===item.id;const linked=status.state==='connected'||status.state==='degraded'||Boolean(status.accountId||status.accountLabel);const authorized=status.authorizedCapabilities?.map(capability=>CAPABILITY_LABELS[capability]);const presentation=PRESENTATION[item.id];return <div className="settings-integration-row" key={item.id}><div className="settings-integration-logo">{ICONS[item.id]}</div><div className="settings-integration-copy"><strong>{item.name}</strong>{presentation.kicker&&<span className="settings-integration-kicker">{presentation.kicker}</span>}<div className="settings-integration-paragraphs">{presentation.paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>{presentation.services?.length?<div className="settings-integration-services">{presentation.services.map(service=><section className="settings-integration-service" key={service.name}><h4>{service.name}</h4><p>{service.description}</p><small className="settings-integration-resources"><b>Recursos previstos:</b> {service.resources.join(' · ')}</small></section>)}</div>:null}{item.officialAuthorizationProvider&&<small><b>Autorização:</b> fluxo oficial {AUTH_PROVIDER_LABEL[item.officialAuthorizationProvider]} via OAuth</small>}{presentation.resources?.length?<small className="settings-integration-resources"><b>Recursos previstos:</b> {presentation.resources.join(' · ')}</small>:null}<ProviderProducts status={status}/>{status.id==='meta'&&status.metaAssets?.length?<small>Ativos autorizados informados pelo backend: {status.metaAssets.length}</small>:null}{status.accountLabel&&<small>Conta vinculada: {status.accountLabel}</small>}{status.accountId&&<small>ID da conta: {status.accountId}</small>}{linked?<small><b>Recursos autorizados:</b> {authorized?.length?authorized.join(' · '):'não informados pelo backend'}</small>:null}{item.authMode==='oauth2'&&linked&&<small>Permissões concedidas: {status.grantedScopes?.length?status.grantedScopes.join(' · '):'não informadas pelo backend'}</small>}{status.lastSyncAt&&<small>Última sincronização: {formatDateTime(status.lastSyncAt)}</small>}{status.expiresAt&&<small>Autorização válida até: {formatDateTime(status.expiresAt)}</small>}{status.errorMessage&&<small role="alert">{status.errorMessage}</small>}</div><div className="settings-integration-actions"><span className={statusClass(status.state)}>{statusLabel(item.id,status.state)}</span>{linked?<><button className="settings-btn settings-btn-outline" type="button" disabled={!backendConfigured||working} onClick={()=>void run(item.id,'sync')}>{working?'Processando…':'Sincronizar'}</button>{item.authMode==='oauth2'&&<button className="settings-btn settings-btn-outline" type="button" disabled={!backendConfigured||working} onClick={()=>void run(item.id,'reconnect')}>Reconectar</button>}<button className="settings-btn settings-btn-outline" type="button" disabled={!backendConfigured||working} onClick={()=>void run(item.id,'disconnect')}>Desconectar</button></>:<button className="settings-btn settings-btn-outline" type="button" disabled={!backendConfigured||working} onClick={()=>void run(item.id,'connect')}>{working?'Processando…':backendConfigured?(item.authMode==='oauth2'?`Conectar ${item.name}`:`Configurar ${item.name}`):'Backend necessário'}</button>}</div></div>})}</div>)}
 </Card>;
}
