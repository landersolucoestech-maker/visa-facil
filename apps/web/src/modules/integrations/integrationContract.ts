export type IntegrationId='whatsapp'|'telephony-sms'|'autentique'|'nfse'|'instagram'|'facebook'|'youtube'|'tiktok'|'google-ads'|'google-calendar';
export type IntegrationCategory='Comunicação'|'Documentos'|'Fiscal'|'Social & Conteúdo'|'Publicidade'|'Produtividade';
export type IntegrationAuthMode='oauth2'|'api-key'|'provider-token'|'certificate'|'hybrid';
export type IntegrationCapability='messaging'|'customer-service'|'account-read'|'sms'|'voice'|'phone-numbers'|'delivery-status'|'documents'|'electronic-signature'|'fiscal-documents'|'content-publishing'|'content-management'|'comments-moderation'|'ads'|'analytics'|'calendar-sync';
export type IntegrationConnectionState='unconfigured'|'disconnected'|'connecting'|'connected'|'degraded'|'error';
export type OfficialAuthorizationProvider='meta'|'google'|'tiktok';

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
};

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
  {id:'whatsapp',name:'WhatsApp',category:'Comunicação',description:'Mensagens, atendimento e gerenciamento de conversas da WhatsApp Business Platform centralizados no VisaChat.',authMode:'oauth2',officialAuthorizationProvider:'meta',capabilities:['messaging','customer-service','account-read'],serverOnlySecrets:['META_APP_SECRET','META_WEBHOOK_VERIFY_TOKEN'],externalRequirements:['Meta App','Meta Business quando exigido','WhatsApp Business Account (WABA)','Phone Number ID','OAuth/Embedded Signup oficial da Meta','Webhook HTTPS público'],apiFamilies:['WhatsApp Business Platform','Meta Graph API','Meta Webhooks'],oauthScopes:['whatsapp_business_messaging','whatsapp_business_management'],webhookSupported:true},
  {id:'telephony-sms',name:'Telefonia e SMS',category:'Comunicação',description:'Camada agnóstica para futuras operadoras de telefonia e provedores IP, com SMS, linhas/números, roteamento e estados de entrega normalizados para CRM e VisaChat.',authMode:'hybrid',capabilities:['messaging','customer-service','sms','voice','phone-numbers','delivery-status'],serverOnlySecrets:[],externalRequirements:['Seleção de um provider adapter compatível','Conta/contrato do provedor escolhido','Credenciais ou autorização mantidas somente no backend','Linha, número virtual ou sender provisionado quando aplicável','Webhook/gateway do provedor quando houver eventos de entrada/status'],apiFamilies:['CommunicationProviderAdapter','Provider-specific telephony/SMS API or carrier gateway'],webhookSupported:true},
  {id:'autentique',name:'Autentique',category:'Documentos',description:'Criação, envio, acompanhamento e assinatura eletrônica de documentos e contratos.',authMode:'api-key',capabilities:['documents','electronic-signature'],serverOnlySecrets:['AUTENTIQUE_API_TOKEN','AUTENTIQUE_WEBHOOK_SECRET'],externalRequirements:['Conta Autentique','Token de API','Organization ID quando aplicável','Webhook HTTPS público'],webhookSupported:true},
  {id:'nfse',name:'NFS-e / Nota Fiscal de Serviço',category:'Fiscal',description:'Emissão, consulta, cancelamento e acompanhamento de NFS-e por adapter fiscal.',authMode:'certificate',capabilities:['fiscal-documents'],serverOnlySecrets:['NFSE_CERTIFICATE_SECRET','NFSE_CERTIFICATE_PASSWORD'],externalRequirements:['CNPJ e inscrição municipal','Definição do provedor/município ou Sistema Nacional NFS-e','Certificado digital e ambiente de homologação quando exigidos'],webhookSupported:false},
  {id:'instagram',name:'Instagram',category:'Social & Conteúdo',description:'Mensagens e atendimento quando autorizados, publicação e gestão de conteúdo, leitura de conta, métricas e campanhas suportadas pelo ecossistema oficial da Meta.',authMode:'oauth2',officialAuthorizationProvider:'meta',capabilities:['messaging','customer-service','account-read','content-publishing','content-management','comments-moderation','ads','analytics'],serverOnlySecrets:['META_APP_SECRET'],externalRequirements:['Meta App','Conta profissional do Instagram','Assets empresariais exigidos pela Meta','OAuth Redirect URI oficial','Webhooks HTTPS','App Review e permissões aprovadas quando exigidas','Conta de anúncios para recursos de mídia paga'],apiFamilies:['Instagram Graph API','Instagram Messaging API quando disponível para a conta','Meta Marketing API','Meta Webhooks'],webhookSupported:true},
  {id:'facebook',name:'Facebook',category:'Social & Conteúdo',description:'Messenger e atendimento, páginas e publicações, conteúdo, métricas e campanhas suportadas pelas APIs oficiais da Meta.',authMode:'oauth2',officialAuthorizationProvider:'meta',capabilities:['messaging','customer-service','account-read','content-publishing','content-management','comments-moderation','ads','analytics'],serverOnlySecrets:['META_APP_SECRET'],externalRequirements:['Meta App','Facebook Page','Business Manager quando aplicável','OAuth Redirect URI oficial','Webhooks HTTPS','App Review e permissões aprovadas quando exigidas','Conta de anúncios para recursos de mídia paga'],apiFamilies:['Facebook Graph API','Messenger Platform','Meta Marketing API','Meta Webhooks'],webhookSupported:true},
  {id:'youtube',name:'YouTube',category:'Social & Conteúdo',description:'Canal, vídeos, publicação, gerenciamento, comentários e métricas autorizadas. Campanhas de mídia paga no YouTube são gerenciadas pela integração oficial do Google Ads.',authMode:'oauth2',officialAuthorizationProvider:'google',capabilities:['account-read','content-publishing','content-management','comments-moderation','analytics'],serverOnlySecrets:['GOOGLE_CLIENT_SECRET'],externalRequirements:['Google Cloud Project','YouTube Data API habilitada','YouTube Analytics API quando usada','OAuth Client ID','OAuth Redirect URI oficial','Canal autorizado'],apiFamilies:['YouTube Data API','YouTube Analytics API'],oauthScopes:['https://www.googleapis.com/auth/youtube.readonly','https://www.googleapis.com/auth/youtube.upload'],webhookSupported:false},
  {id:'tiktok',name:'TikTok',category:'Social & Conteúdo',description:'Leitura de conta, publicação e gestão de conteúdo, métricas e recursos de mídia paga somente quando a conta e as APIs oficiais correspondentes estiverem aprovadas e autorizadas.',authMode:'oauth2',officialAuthorizationProvider:'tiktok',capabilities:['account-read','content-publishing','content-management','ads','analytics'],serverOnlySecrets:['TIKTOK_CLIENT_SECRET'],externalRequirements:['TikTok Developer App','Client Key','OAuth Redirect URI oficial','Scopes aprovados','Auditoria do app quando exigida','Acesso separado ao TikTok for Business/Marketing API para anúncios'],apiFamilies:['TikTok Login Kit','Content Posting API','Display API','TikTok for Business/Marketing API quando autorizado'],oauthScopes:['user.info.basic','video.list','video.upload','video.publish'],webhookSupported:false},
  {id:'google-ads',name:'Google Ads',category:'Publicidade',description:'Criação, configuração, consulta de métricas e gerenciamento de campanhas Google Ads, inclusive inventário de YouTube quando suportado.',authMode:'oauth2',officialAuthorizationProvider:'google',capabilities:['ads','analytics'],serverOnlySecrets:['GOOGLE_CLIENT_SECRET','GOOGLE_ADS_DEVELOPER_TOKEN'],externalRequirements:['Google Cloud Project','OAuth Client ID','OAuth Redirect URI oficial','Google Ads Manager/Customer ID','Developer Token aprovado'],apiFamilies:['Google Ads API'],oauthScopes:['https://www.googleapis.com/auth/adwords'],webhookSupported:false},
  {id:'google-calendar',name:'Google Calendar',category:'Produtividade',description:'Sincronização de compromissos e eventos com suporte a fluxo bidirecional quando o backend estiver conectado.',authMode:'oauth2',officialAuthorizationProvider:'google',capabilities:['calendar-sync'],serverOnlySecrets:['GOOGLE_CLIENT_SECRET'],externalRequirements:['Google Cloud Project','Google Calendar API habilitada','OAuth Client ID','OAuth Redirect URI oficial','Webhook HTTPS público para notificações push'],apiFamilies:['Google Calendar API'],oauthScopes:['https://www.googleapis.com/auth/calendar.events'],webhookSupported:true},
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
function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function optionalString(value:unknown){return value===undefined||typeof value==='string'}
function optionalStringArray(value:unknown){return value===undefined||(Array.isArray(value)&&value.every(item=>typeof item==='string'))}
function optionalCapabilityArray(value:unknown){return value===undefined||(Array.isArray(value)&&value.every(item=>typeof item==='string'&&CAPABILITIES.has(item as IntegrationCapability)))}
export function isIntegrationId(value:unknown):value is IntegrationId{return typeof value==='string'&&IDS.has(value as IntegrationId)}
export function isIntegrationRuntimeStatus(value:unknown):value is IntegrationRuntimeStatus{
  if(!isRecord(value)||!isIntegrationId(value.id)||typeof value.state!=='string'||!STATES.has(value.state as IntegrationConnectionState))return false;
  return optionalString(value.accountId)&&optionalString(value.accountLabel)&&optionalStringArray(value.grantedScopes)&&optionalCapabilityArray(value.authorizedCapabilities)&&optionalString(value.connectedAt)&&optionalString(value.expiresAt)&&optionalString(value.lastCheckedAt)&&optionalString(value.lastSyncAt)&&optionalString(value.errorCode)&&optionalString(value.errorMessage);
}
export function integrationById(id:IntegrationId){return INTEGRATION_REGISTRY.find(item=>item.id===id)!}
