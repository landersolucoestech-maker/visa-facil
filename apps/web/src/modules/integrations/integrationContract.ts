export type IntegrationId='whatsapp'|'telephony-sms'|'autentique'|'nfse'|'meta'|'google'|'tiktok';
export type IntegrationCategory='Comunicação'|'Documentos'|'Fiscal'|'Social, Conteúdo & Publicidade';
export type IntegrationAuthMode='oauth2'|'api-key'|'provider-token'|'certificate'|'hybrid';
export type IntegrationCapability='messaging'|'customer-service'|'account-read'|'sms'|'voice'|'phone-numbers'|'delivery-status'|'documents'|'electronic-signature'|'fiscal-documents'|'content-publishing'|'content-management'|'comments-moderation'|'ads'|'analytics'|'calendar-sync';
export type IntegrationConnectionState='unconfigured'|'disconnected'|'connecting'|'connected'|'degraded'|'error';
export type OfficialAuthorizationProvider='meta'|'google'|'tiktok';
export type MetaProductId='facebook'|'instagram'|'messenger'|'meta-ads';
export type GoogleProductId='youtube'|'google-ads'|'google-calendar';
export type ProviderProductConnectionState='unconfigured'|'disconnected'|'connected'|'unavailable'|'degraded'|'error';
export type MetaProductConnectionState=ProviderProductConnectionState;
export type GoogleProductConnectionState=ProviderProductConnectionState;
export type MetaAssetKind='facebook-page'|'instagram-account'|'business-portfolio'|'ad-account'|'other';

export type IntegrationDefinition={
  id:IntegrationId;
  name:string;
  category:IntegrationCategory;
  description:string;
  authMode:IntegrationAuthMode;
  officialAuthorizationProvider?:OfficialAuthorizationProvider;
  capabilities:IntegrationCapability[];
  serverOnlySecrets:string[];
  externalRequirements:string[];
  apiFamilies?:string[];
  oauthScopes?:string[];
  webhookSupported:boolean;
};

export type MetaProductDefinition={
  id:MetaProductId;
  name:string;
  capabilities:IntegrationCapability[];
  assetKinds:MetaAssetKind[];
};

export type GoogleProductDefinition={
  id:GoogleProductId;
  name:string;
  capabilities:IntegrationCapability[];
};

export type MetaProductRuntimeStatus={
  id:MetaProductId;
  state:MetaProductConnectionState;
  assetIds?:string[];
  grantedScopes?:string[];
  authorizedCapabilities?:IntegrationCapability[];
  errorCode?:string;
  errorMessage?:string;
};

export type GoogleProductRuntimeStatus={
  id:GoogleProductId;
  state:GoogleProductConnectionState;
  grantedScopes?:string[];
  authorizedCapabilities?:IntegrationCapability[];
  errorCode?:string;
  errorMessage?:string;
};

export type MetaAssetRuntimeStatus={
  id:string;
  kind:MetaAssetKind;
  label?:string;
  productIds?:MetaProductId[];
  grantedScopes?:string[];
  authorizedCapabilities?:IntegrationCapability[];
};

export type IntegrationRuntimeStatus={
  id:IntegrationId;
  state:IntegrationConnectionState;
  accountId?:string;
  accountLabel?:string;
  grantedScopes?:string[];
  authorizedCapabilities?:IntegrationCapability[];
  connectedAt?:string;
  expiresAt?:string;
  lastCheckedAt?:string;
  lastSyncAt?:string;
  errorCode?:string;
  errorMessage?:string;
  metaProducts?:MetaProductRuntimeStatus[];
  metaAssets?:MetaAssetRuntimeStatus[];
  googleProducts?:GoogleProductRuntimeStatus[];
};

/**
 * The Meta provider is one technical integration. Facebook, Instagram,
 * Messenger and Meta Ads remain separate functional products/channels under
 * that provider and may expose different authorized assets/capabilities.
 * Shared Meta App credentials, OAuth, tokens, Graph API infrastructure,
 * webhook configuration and provider-level connection state must never be
 * duplicated per product.
 */
export const META_PRODUCTS:MetaProductDefinition[]=[
  {id:'facebook',name:'Facebook',capabilities:['account-read','content-publishing','content-management','comments-moderation','ads','analytics'],assetKinds:['facebook-page','business-portfolio','ad-account','other']},
  {id:'instagram',name:'Instagram',capabilities:['messaging','customer-service','account-read','content-publishing','content-management','comments-moderation','ads','analytics'],assetKinds:['instagram-account','business-portfolio','ad-account','other']},
  {id:'messenger',name:'Messenger',capabilities:['messaging','customer-service'],assetKinds:['facebook-page','business-portfolio','other']},
  {id:'meta-ads',name:'Meta Ads',capabilities:['ads','analytics'],assetKinds:['business-portfolio','ad-account','facebook-page','instagram-account','other']},
];

/**
 * Google is also one technical OAuth provider. YouTube, Google Ads and Google
 * Calendar are service products under the same Google authorization boundary.
 * Each product can expose independent scopes/capabilities while the OAuth
 * client, token lifecycle and provider-level connection state remain shared.
 */
export const GOOGLE_PRODUCTS:GoogleProductDefinition[]=[
  {id:'youtube',name:'YouTube',capabilities:['account-read','content-publishing','content-management','comments-moderation','analytics']},
  {id:'google-ads',name:'Google Ads',capabilities:['ads','analytics']},
  {id:'google-calendar',name:'Google Calendar',capabilities:['calendar-sync']},
];

/**
 * Frontend-manageable integrations only.
 * Server-owned providers such as the transactional-email provider are
 * intentionally absent from this browser contract and must be configured
 * exclusively in backend/runtime infrastructure.
 *
 * OAuth providers below MUST authenticate on the provider's official UI.
 * The browser may receive only connection metadata from our backend; access
 * and refresh tokens remain server-side and are never part of this contract.
 */
export const INTEGRATION_REGISTRY:IntegrationDefinition[]=[
  {id:'whatsapp',name:'WhatsApp',category:'Comunicação',description:'Integração oficial com a WhatsApp Business Platform, centralizando mensagens, atendimento e gerenciamento de conversas diretamente no VisaChat.',authMode:'oauth2',officialAuthorizationProvider:'meta',capabilities:['messaging','customer-service','account-read'],serverOnlySecrets:['META_APP_SECRET','META_WEBHOOK_VERIFY_TOKEN'],externalRequirements:['Meta App','Meta Business quando exigido','WhatsApp Business Account (WABA)','Phone Number ID','OAuth/Embedded Signup oficial da Meta','Webhook HTTPS público'],apiFamilies:['WhatsApp Business Platform','Meta Graph API','Meta Webhooks'],oauthScopes:['whatsapp_business_messaging','whatsapp_business_management'],webhookSupported:true},
  {id:'telephony-sms',name:'Telefonia e SMS',category:'Comunicação',description:'Camada de integração agnóstica para conexão com operadoras de telefonia e provedores de comunicação via internet, permitindo centralizar recursos de SMS, voz e números telefônicos no CRM e no VisaChat.',authMode:'hybrid',capabilities:['messaging','customer-service','sms','voice','phone-numbers','delivery-status'],serverOnlySecrets:[],externalRequirements:['Seleção de um provider adapter compatível','Conta/contrato do provedor escolhido','Credenciais ou autorização mantidas somente no backend','Linha, número virtual ou sender provisionado quando aplicável','Webhook/gateway do provedor quando houver eventos de entrada/status'],apiFamilies:['CommunicationProviderAdapter','Provider-specific telephony/SMS API or carrier gateway'],webhookSupported:true},
  {id:'autentique',name:'Autentique',category:'Documentos',description:'Integração oficial para criação, envio, acompanhamento e assinatura eletrônica de documentos e contratos diretamente pelo sistema.',authMode:'api-key',capabilities:['documents','electronic-signature'],serverOnlySecrets:['AUTENTIQUE_API_TOKEN','AUTENTIQUE_WEBHOOK_SECRET'],externalRequirements:['Conta Autentique','Token de API','Organization ID quando aplicável','Webhook HTTPS público'],webhookSupported:true},
  {id:'nfse',name:'NFS-e / Nota Fiscal de Serviço',category:'Fiscal',description:'Integração fiscal através de uma camada de adapters, permitindo conectar diferentes provedores, municípios e serviços compatíveis para emissão e gerenciamento de Notas Fiscais de Serviço eletrônicas.',authMode:'certificate',capabilities:['fiscal-documents'],serverOnlySecrets:['NFSE_CERTIFICATE_SECRET','NFSE_CERTIFICATE_PASSWORD'],externalRequirements:['CNPJ e inscrição municipal','Definição do provedor/município ou Sistema Nacional NFS-e','Certificado digital e ambiente de homologação quando exigidos'],webhookSupported:false},
  {id:'meta',name:'Meta',category:'Social, Conteúdo & Publicidade',description:'Integração oficial com o ecossistema Meta, utilizando uma única estrutura de autorização para disponibilizar os recursos permitidos de Facebook, Instagram, Messenger e Meta Ads.',authMode:'oauth2',officialAuthorizationProvider:'meta',capabilities:['messaging','customer-service','account-read','content-publishing','content-management','comments-moderation','ads','analytics'],serverOnlySecrets:['META_APP_SECRET','META_WEBHOOK_VERIFY_TOKEN'],externalRequirements:['Meta App ID','Meta App Secret mantido somente no backend','OAuth Redirect URI oficial','Business Portfolio / Business Manager quando aplicável','Páginas do Facebook autorizadas','Contas profissionais do Instagram vinculadas','Contas de anúncios quando aplicável','Permissões, scopes e App Review exigidos pelos recursos habilitados','Webhook HTTPS público'],apiFamilies:['Meta Graph API','Facebook Pages API','Messenger Platform','Instagram Graph API','Instagram Messaging API quando suportada','Meta Marketing API','Meta Webhooks'],webhookSupported:true},
  {id:'google',name:'Google',category:'Social, Conteúdo & Publicidade',description:'Integração oficial com o ecossistema Google, utilizando uma estrutura centralizada de autenticação e autorização para habilitar os serviços Google disponíveis no sistema conforme as permissões concedidas pelo usuário.',authMode:'oauth2',officialAuthorizationProvider:'google',capabilities:['account-read','content-publishing','content-management','comments-moderation','ads','analytics','calendar-sync'],serverOnlySecrets:['GOOGLE_CLIENT_SECRET','GOOGLE_ADS_DEVELOPER_TOKEN'],externalRequirements:['Google Cloud Project','OAuth Client ID','OAuth Redirect URI oficial','YouTube Data API e YouTube Analytics API quando utilizadas','Google Ads Customer/Manager ID e Developer Token quando aplicável','Google Calendar API quando utilizada','Permissões/scopes exigidos pelos serviços habilitados','Webhook HTTPS público quando Google Calendar usar notificações push'],apiFamilies:['YouTube Data API','YouTube Analytics API','Google Ads API','Google Calendar API'],oauthScopes:['https://www.googleapis.com/auth/youtube.readonly','https://www.googleapis.com/auth/youtube.upload','https://www.googleapis.com/auth/adwords','https://www.googleapis.com/auth/calendar.events'],webhookSupported:true},
  {id:'tiktok',name:'TikTok',category:'Social, Conteúdo & Publicidade',description:'Integração oficial com o ecossistema TikTok, permitindo habilitar recursos de conta, conteúdo, métricas e publicidade conforme a disponibilidade das APIs, o tipo de conta e as permissões aprovadas pela plataforma.',authMode:'oauth2',officialAuthorizationProvider:'tiktok',capabilities:['account-read','content-publishing','content-management','ads','analytics'],serverOnlySecrets:['TIKTOK_CLIENT_SECRET'],externalRequirements:['TikTok Developer App','Client Key','OAuth Redirect URI oficial','Scopes aprovados','Auditoria do app quando exigida','Acesso separado ao TikTok for Business/Marketing API para anúncios'],apiFamilies:['TikTok Login Kit','Content Posting API','Display API','TikTok for Business/Marketing API quando autorizado'],oauthScopes:['user.info.basic','video.list','video.upload','video.publish'],webhookSupported:false},
];

export const CAPABILITY_LABELS:Record<IntegrationCapability,string>={
  messaging:'Mensagens',
  'customer-service':'Atendimento',
  'account-read':'Informações da conta',
  sms:'SMS',
  voice:'Telefonia / voz',
  'phone-numbers':'Linhas e números',
  'delivery-status':'Status de entrega',
  documents:'Documentos',
  'electronic-signature':'Assinatura eletrônica',
  'fiscal-documents':'Documentos fiscais',
  'content-publishing':'Publicação',
  'content-management':'Gestão de conteúdo',
  'comments-moderation':'Comentários e moderação',
  ads:'Campanhas e anúncios',
  analytics:'Métricas e analytics',
  'calendar-sync':'Sincronização de agenda',
};

const IDS=new Set<IntegrationId>(INTEGRATION_REGISTRY.map(item=>item.id));
const STATES=new Set<IntegrationConnectionState>(['unconfigured','disconnected','connecting','connected','degraded','error']);
const CAPABILITIES=new Set<IntegrationCapability>(Object.keys(CAPABILITY_LABELS) as IntegrationCapability[]);
const META_PRODUCT_IDS=new Set<MetaProductId>(META_PRODUCTS.map(item=>item.id));
const GOOGLE_PRODUCT_IDS=new Set<GoogleProductId>(GOOGLE_PRODUCTS.map(item=>item.id));
const PRODUCT_STATES=new Set<ProviderProductConnectionState>(['unconfigured','disconnected','connected','unavailable','degraded','error']);
const META_ASSET_KINDS=new Set<MetaAssetKind>(['facebook-page','instagram-account','business-portfolio','ad-account','other']);
function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function optionalString(value:unknown){return value===undefined||typeof value==='string'}
function optionalStringArray(value:unknown){return value===undefined||(Array.isArray(value)&&value.every(item=>typeof item==='string'))}
function optionalCapabilityArray(value:unknown){return value===undefined||(Array.isArray(value)&&value.every(item=>typeof item==='string'&&CAPABILITIES.has(item as IntegrationCapability)))}
function optionalMetaProductIds(value:unknown){return value===undefined||(Array.isArray(value)&&value.every(item=>typeof item==='string'&&META_PRODUCT_IDS.has(item as MetaProductId))&&new Set(value).size===value.length)}
function isMetaProductRuntimeStatus(value:unknown):value is MetaProductRuntimeStatus{
  return isRecord(value)&&typeof value.id==='string'&&META_PRODUCT_IDS.has(value.id as MetaProductId)&&typeof value.state==='string'&&PRODUCT_STATES.has(value.state as ProviderProductConnectionState)&&optionalStringArray(value.assetIds)&&optionalStringArray(value.grantedScopes)&&optionalCapabilityArray(value.authorizedCapabilities)&&optionalString(value.errorCode)&&optionalString(value.errorMessage);
}
function isGoogleProductRuntimeStatus(value:unknown):value is GoogleProductRuntimeStatus{
  return isRecord(value)&&typeof value.id==='string'&&GOOGLE_PRODUCT_IDS.has(value.id as GoogleProductId)&&typeof value.state==='string'&&PRODUCT_STATES.has(value.state as ProviderProductConnectionState)&&optionalStringArray(value.grantedScopes)&&optionalCapabilityArray(value.authorizedCapabilities)&&optionalString(value.errorCode)&&optionalString(value.errorMessage);
}
function isMetaAssetRuntimeStatus(value:unknown):value is MetaAssetRuntimeStatus{
  return isRecord(value)&&typeof value.id==='string'&&value.id.trim().length>0&&typeof value.kind==='string'&&META_ASSET_KINDS.has(value.kind as MetaAssetKind)&&optionalString(value.label)&&optionalMetaProductIds(value.productIds)&&optionalStringArray(value.grantedScopes)&&optionalCapabilityArray(value.authorizedCapabilities);
}
function optionalMetaProducts(value:unknown){return value===undefined||(Array.isArray(value)&&value.every(isMetaProductRuntimeStatus)&&new Set(value.map(item=>(item as MetaProductRuntimeStatus).id)).size===value.length)}
function optionalGoogleProducts(value:unknown){return value===undefined||(Array.isArray(value)&&value.every(isGoogleProductRuntimeStatus)&&new Set(value.map(item=>(item as GoogleProductRuntimeStatus).id)).size===value.length)}
function optionalMetaAssets(value:unknown){return value===undefined||(Array.isArray(value)&&value.every(isMetaAssetRuntimeStatus)&&new Set(value.map(item=>(item as MetaAssetRuntimeStatus).id)).size===value.length)}
export function isIntegrationId(value:unknown):value is IntegrationId{return typeof value==='string'&&IDS.has(value as IntegrationId)}
export function isIntegrationRuntimeStatus(value:unknown):value is IntegrationRuntimeStatus{
  if(!isRecord(value)||!isIntegrationId(value.id)||typeof value.state!=='string'||!STATES.has(value.state as IntegrationConnectionState))return false;
  if(value.id!=='meta'&&(value.metaProducts!==undefined||value.metaAssets!==undefined))return false;
  if(value.id!=='google'&&value.googleProducts!==undefined)return false;
  return optionalString(value.accountId)&&optionalString(value.accountLabel)&&optionalStringArray(value.grantedScopes)&&optionalCapabilityArray(value.authorizedCapabilities)&&optionalString(value.connectedAt)&&optionalString(value.expiresAt)&&optionalString(value.lastCheckedAt)&&optionalString(value.lastSyncAt)&&optionalString(value.errorCode)&&optionalString(value.errorMessage)&&optionalMetaProducts(value.metaProducts)&&optionalMetaAssets(value.metaAssets)&&optionalGoogleProducts(value.googleProducts);
}
export function integrationById(id:IntegrationId){return INTEGRATION_REGISTRY.find(item=>item.id===id)!}
