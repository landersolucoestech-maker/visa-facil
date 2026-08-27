export type IntegrationId='whatsapp'|'autentique'|'nfse'|'instagram'|'facebook'|'youtube'|'tiktok'|'google-ads'|'google-calendar';
export type IntegrationCategory='Comunicação'|'Documentos'|'Fiscal'|'Social & Conteúdo'|'Publicidade'|'Produtividade';
export type IntegrationAuthMode='oauth2'|'api-key'|'provider-token'|'certificate'|'hybrid';
export type IntegrationCapability='messaging'|'documents'|'electronic-signature'|'fiscal-documents'|'content-publishing'|'content-management'|'ads'|'analytics'|'calendar-sync';
export type IntegrationConnectionState='unconfigured'|'disconnected'|'connecting'|'connected'|'degraded'|'error';

export type IntegrationDefinition={
  id:IntegrationId;
  name:string;
  category:IntegrationCategory;
  description:string;
  authMode:IntegrationAuthMode;
  capabilities:IntegrationCapability[];
  serverOnlySecrets:string[];
  externalRequirements:string[];
  oauthScopes?:string[];
  webhookSupported:boolean;
};

export type IntegrationRuntimeStatus={
  id:IntegrationId;
  state:IntegrationConnectionState;
  accountLabel?:string;
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
 */
export const INTEGRATION_REGISTRY:IntegrationDefinition[]=[
  {id:'whatsapp',name:'WhatsApp',category:'Comunicação',description:'Mensagens, contatos e atendimentos do WhatsApp centralizados no VisaChat.',authMode:'provider-token',capabilities:['messaging'],serverOnlySecrets:['META_APP_SECRET','META_WEBHOOK_VERIFY_TOKEN','WHATSAPP_ACCESS_TOKEN'],externalRequirements:['Meta Business verificado quando exigido','WhatsApp Business Account (WABA)','Phone Number ID','Webhook HTTPS público'],oauthScopes:['whatsapp_business_messaging','whatsapp_business_management'],webhookSupported:true},
  {id:'autentique',name:'Autentique',category:'Documentos',description:'Criação, envio, acompanhamento e assinatura eletrônica de documentos e contratos.',authMode:'api-key',capabilities:['documents','electronic-signature'],serverOnlySecrets:['AUTENTIQUE_API_TOKEN','AUTENTIQUE_WEBHOOK_SECRET'],externalRequirements:['Conta Autentique','Token de API','Organization ID quando aplicável','Webhook HTTPS público'],webhookSupported:true},
  {id:'nfse',name:'NFS-e / Nota Fiscal de Serviço',category:'Fiscal',description:'Emissão, consulta, cancelamento e acompanhamento de NFS-e por adapter fiscal.',authMode:'certificate',capabilities:['fiscal-documents'],serverOnlySecrets:['NFSE_CERTIFICATE_SECRET','NFSE_CERTIFICATE_PASSWORD'],externalRequirements:['CNPJ e inscrição municipal','Definição do provedor/município ou Sistema Nacional NFS-e','Certificado digital e ambiente de homologação quando exigidos'],webhookSupported:false},
  {id:'instagram',name:'Instagram',category:'Social & Conteúdo',description:'Mensagens quando suportadas, publicação/gestão de conteúdo e recursos publicitários via ecossistema Meta.',authMode:'oauth2',capabilities:['messaging','content-publishing','content-management','ads','analytics'],serverOnlySecrets:['META_APP_SECRET'],externalRequirements:['Meta App','Conta profissional do Instagram','Assets empresariais exigidos pela Meta','OAuth Redirect URI e webhook HTTPS','App Review para permissões necessárias'],webhookSupported:true},
  {id:'facebook',name:'Facebook',category:'Social & Conteúdo',description:'Messenger, conteúdo e operação de campanhas/publicidade via APIs da Meta.',authMode:'oauth2',capabilities:['messaging','content-publishing','content-management','ads','analytics'],serverOnlySecrets:['META_APP_SECRET'],externalRequirements:['Meta App','Facebook Page','Business Manager quando aplicável','OAuth Redirect URI e webhook HTTPS','App Review para permissões necessárias'],webhookSupported:true},
  {id:'youtube',name:'YouTube',category:'Social & Conteúdo',description:'Publicação e gerenciamento de conteúdo, leitura de canal e métricas autorizadas.',authMode:'oauth2',capabilities:['content-publishing','content-management','analytics','ads'],serverOnlySecrets:['GOOGLE_CLIENT_SECRET'],externalRequirements:['Google Cloud Project','YouTube Data API habilitada','OAuth Client ID','OAuth Redirect URI','Canal autorizado'],oauthScopes:['https://www.googleapis.com/auth/youtube.readonly','https://www.googleapis.com/auth/youtube.upload'],webhookSupported:false},
  {id:'tiktok',name:'TikTok',category:'Social & Conteúdo',description:'Publicação/gestão de conteúdo e preparação para recursos de publicidade e comunicação suportados.',authMode:'oauth2',capabilities:['content-publishing','content-management','ads','analytics','messaging'],serverOnlySecrets:['TIKTOK_CLIENT_SECRET'],externalRequirements:['TikTok Developer App','Client Key','OAuth Redirect URI','Scopes aprovados','Auditoria do app para publicação pública quando exigida','Acesso separado ao TikTok for Business/Marketing API para anúncios'],oauthScopes:['user.info.basic','video.list','video.upload','video.publish'],webhookSupported:false},
  {id:'google-ads',name:'Google Ads',category:'Publicidade',description:'Criação, configuração, consulta de métricas e gerenciamento de campanhas Google Ads.',authMode:'oauth2',capabilities:['ads','analytics'],serverOnlySecrets:['GOOGLE_CLIENT_SECRET','GOOGLE_ADS_DEVELOPER_TOKEN'],externalRequirements:['Google Cloud Project','OAuth Client ID','OAuth Redirect URI','Google Ads Manager/Customer ID','Developer Token aprovado'],oauthScopes:['https://www.googleapis.com/auth/adwords'],webhookSupported:false},
  {id:'google-calendar',name:'Google Calendar',category:'Produtividade',description:'Sincronização de compromissos e eventos com suporte a fluxo bidirecional quando o backend estiver conectado.',authMode:'oauth2',capabilities:['calendar-sync'],serverOnlySecrets:['GOOGLE_CLIENT_SECRET'],externalRequirements:['Google Cloud Project','Google Calendar API habilitada','OAuth Client ID','OAuth Redirect URI','Webhook HTTPS público para notificações push'],oauthScopes:['https://www.googleapis.com/auth/calendar.events'],webhookSupported:true},
];

const IDS=new Set<IntegrationId>(INTEGRATION_REGISTRY.map(item=>item.id));
const STATES=new Set<IntegrationConnectionState>(['unconfigured','disconnected','connecting','connected','degraded','error']);
function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function optionalString(value:unknown){return value===undefined||typeof value==='string'}
export function isIntegrationId(value:unknown):value is IntegrationId{return typeof value==='string'&&IDS.has(value as IntegrationId)}
export function isIntegrationRuntimeStatus(value:unknown):value is IntegrationRuntimeStatus{
  if(!isRecord(value)||!isIntegrationId(value.id)||typeof value.state!=='string'||!STATES.has(value.state as IntegrationConnectionState))return false;
  return optionalString(value.accountLabel)&&optionalString(value.lastCheckedAt)&&optionalString(value.lastSyncAt)&&optionalString(value.errorCode)&&optionalString(value.errorMessage);
}
export function integrationById(id:IntegrationId){return INTEGRATION_REGISTRY.find(item=>item.id===id)!}
