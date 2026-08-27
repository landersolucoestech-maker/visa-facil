import { getMarketingMockFixture, type MarketingMockCampaign, type MarketingMockContent } from './mocks/marketingMockProvider';
import { readSessionRecords } from '../../shared/sessionRecords';
import { safeWriteSessionRecords as writeSessionRecordsSafely } from '../../shared/sessionPersistence';

export type Platform='Instagram'|'Facebook'|'TikTok'|'YouTube'|'X'|'Threads';
export type PaidPlatform='Meta Ads'|'Google Ads'|'TikTok Ads';
export type ContentItem={id:string;date:string;time:string;title:string;channels:Platform[];primaryChannel:Platform;type:string;status:string;owner:string;ownerUserId?:string;copy:string;mediaName?:string};
export type Campaign={
 id:string;
 name:string;
 owner:string;
 ownerUserId?:string;
 objective:string;
 result:string;
 status:string;
 paidPlatforms:PaidPlatform[];
 budget:number;
 dailyBudget:number;
 spent:number;
 leads:number;
 conversions:number;
 startDate:string;
 endDate:string;
 audience:string;
 location:string;
 ageRange:string;
 gender:string;
 languages:string;
 interests:string;
 destinationUrl:string;
 internalDescription:string;
 placements:string[];
 creativeName:string;
 creativeFileName:string;
 headline:string;
 primaryCopy:string;
 cta:string;
 bidStrategy:string;
};

const CONTENT_KEY='visa-facil.session.marketing.contents.v2';
const CAMPAIGN_KEY='visa-facil.session.marketing.campaigns.v2';
const PUBLISH_PLATFORMS=new Set<Platform>(['Instagram','Facebook','TikTok','YouTube','X','Threads']);
const PAID_PLATFORMS=new Set<PaidPlatform>(['Meta Ads','Google Ads','TikTok Ads']);
const CONTENT_STATUSES=new Set(['Agendado','Produção','Revisão','Publicado']);
const CAMPAIGN_STATUSES=new Set(['Rascunho','Agendada','Ativa','Pausada']);
const CAMPAIGN_OBJECTIVES=new Set(['Alcance','Tráfego','Engajamento','Conversões']);
const CONTENT_FORMATS:Record<Platform,Set<string>>={
 Instagram:new Set(['Feed','Carrossel','Stories','Reels']),
 Facebook:new Set(['Feed','Carrossel','Stories','Reels']),
 TikTok:new Set(['Reels','Stories']),
 YouTube:new Set(['Vídeo','Shorts','Post']),
 X:new Set(['Post','Carrossel','Reels','Shorts','Stories']),
 Threads:new Set(['Post','Carrossel']),
};
const RESULTS_BY_OBJECTIVE:Record<string,string[]>={
 Alcance:['Impressões','Pessoas alcançadas'],
 Tráfego:['Cliques no site','Visitas à landing page'],
 Engajamento:['Interações','Mensagens'],
 Conversões:['Leads','Cadastros','WhatsApp','Vendas'],
};
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const TIME_RE=/^([01]\d|2[0-3]):[0-5]\d$/;

function isObject(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function isStringArray(value:unknown):value is string[]{return Array.isArray(value)&&value.every(item=>typeof item==='string')}
function unique(values:string[]){return new Set(values).size===values.length}
function normalizeObjective(value:unknown){if(value==='Geração de leads')return'Conversões';return typeof value==='string'&&CAMPAIGN_OBJECTIVES.has(value)?value:'Conversões'}
function defaultResult(objective:unknown){const canonical=normalizeObjective(objective);return RESULTS_BY_OBJECTIVE[canonical]?.[0]??'Leads'}
function normalizeResult(objective:unknown,value:unknown){const canonical=normalizeObjective(objective);return typeof value==='string'&&RESULTS_BY_OBJECTIVE[canonical]?.includes(value)?value:defaultResult(canonical)}
function normalizePaidPlatform(value:unknown):PaidPlatform|undefined{
 if(value==='YouTube Ads'||value==='YouTube')return'Google Ads';
 return typeof value==='string'&&PAID_PLATFORMS.has(value as PaidPlatform)?value as PaidPlatform:undefined;
}

export function isMarketingContent(value:unknown):value is ContentItem{
 if(!isObject(value)||typeof value.id!=='string'||!value.id.trim()||typeof value.date!=='string'||!DATE_RE.test(value.date)||typeof value.time!=='string'||!TIME_RE.test(value.time)||typeof value.title!=='string'||!value.title.trim())return false;
 if(!Array.isArray(value.channels)||value.channels.length===0||!value.channels.every(channel=>typeof channel==='string'&&PUBLISH_PLATFORMS.has(channel as Platform))||!unique(value.channels as string[]))return false;
 if(typeof value.primaryChannel!=='string'||!PUBLISH_PLATFORMS.has(value.primaryChannel as Platform)||!(value.channels as string[]).includes(value.primaryChannel))return false;
 if(typeof value.type!=='string'||!CONTENT_FORMATS[value.primaryChannel as Platform].has(value.type))return false;
 return typeof value.status==='string'&&CONTENT_STATUSES.has(value.status)&&typeof value.owner==='string'&&(value.ownerUserId===undefined||typeof value.ownerUserId==='string')&&typeof value.copy==='string'&&(value.mediaName===undefined||typeof value.mediaName==='string');
}

export function isMarketingCampaign(value:unknown):value is Campaign{
 if(!isObject(value)||typeof value.id!=='string'||!value.id.trim()||typeof value.name!=='string'||typeof value.owner!=='string'||(value.ownerUserId!==undefined&&typeof value.ownerUserId!=='string')||typeof value.objective!=='string'||!CAMPAIGN_OBJECTIVES.has(value.objective)||typeof value.result!=='string'||!RESULTS_BY_OBJECTIVE[value.objective]?.includes(value.result)||typeof value.status!=='string'||!CAMPAIGN_STATUSES.has(value.status))return false;
 if(!Array.isArray(value.paidPlatforms)||!value.paidPlatforms.every(platform=>typeof platform==='string'&&PAID_PLATFORMS.has(platform as PaidPlatform))||!unique(value.paidPlatforms as string[]))return false;
 for(const key of ['budget','dailyBudget','spent'] as const){const number=value[key];if(typeof number!=='number'||!Number.isFinite(number)||number<0)return false}
 for(const key of ['leads','conversions'] as const){const number=value[key];if(typeof number!=='number'||!Number.isInteger(number)||number<0)return false}
 if((value.spent as number)>(value.budget as number)||(value.conversions as number)>(value.leads as number))return false;
 if(typeof value.startDate!=='string'||typeof value.endDate!=='string'||!DATE_RE.test(value.startDate)||!DATE_RE.test(value.endDate)||value.endDate<value.startDate)return false;
 for(const key of ['audience','location','ageRange','gender','languages','interests','destinationUrl','internalDescription','creativeName','creativeFileName','headline','primaryCopy','cta','bidStrategy'] as const)if(typeof value[key]!=='string')return false;
 if(!isStringArray(value.placements)||!unique(value.placements))return false;
 if(value.status!=='Rascunho'&&(!(value.name as string).trim()||(value.budget as number)<=0||(value.paidPlatforms as unknown[]).length===0||!(value.result as string).trim()))return false;
 return true;
}

function paidPlatform(channel:MarketingMockCampaign['channel']):PaidPlatform{
 if(channel==='Google Ads'||channel==='YouTube')return'Google Ads';
 if(channel==='TikTok')return'TikTok Ads';
 return'Meta Ads';
}
function seedContent(content:MarketingMockContent):ContentItem{return{id:content.id,date:content.date,time:content.time,title:content.title,channels:[content.channel],primaryChannel:content.channel,type:content.type,status:content.status,owner:content.owner,copy:content.copy}}
function seedCampaign(campaign:MarketingMockCampaign):Campaign{const objective=normalizeObjective(campaign.objective);return{id:campaign.id,name:campaign.name,owner:'',objective,result:normalizeResult(objective,undefined),status:campaign.status,paidPlatforms:[paidPlatform(campaign.channel)],budget:campaign.budget,dailyBudget:Math.round(campaign.budget/30),spent:campaign.spent,leads:campaign.leads,conversions:campaign.conversions,startDate:campaign.startDate,endDate:campaign.endDate,audience:'Brasileiros interessados em assessoria de vistos',location:'Brasil',ageRange:'25–34',gender:'Todos',languages:'Português',interests:'Viagens, Estados Unidos, turismo, intercâmbio, negócios',destinationUrl:'https://visafacil.com.br',internalDescription:'',placements:['Feed','Stories'],creativeName:'Criativo principal',creativeFileName:'',headline:campaign.name,primaryCopy:objective,cta:'Saiba mais',bidStrategy:'Menor custo'}}
function fixture(){return getMarketingMockFixture()}

function upgradeStoredContent(value:unknown):unknown{
 if(!isObject(value))return value;
 const primaryChannel=typeof value.primaryChannel==='string'?value.primaryChannel:'';
 const type=primaryChannel==='Facebook'&&value.type==='Post'?'Feed':value.type;
 return {...value,type,ownerUserId:typeof value.ownerUserId==='string'?value.ownerUserId:undefined};
}
function upgradeStoredCampaign(value:unknown):unknown{
 if(!isObject(value))return value;
 const objective=normalizeObjective(value.objective);
 const rawPlatforms=Array.isArray(value.paidPlatforms)?value.paidPlatforms:[];
 const paidPlatforms=Array.from(new Set(rawPlatforms.map(normalizePaidPlatform).filter((platform):platform is PaidPlatform=>Boolean(platform))));
 return {
  ...value,
  owner:typeof value.owner==='string'?value.owner:'',
  ownerUserId:typeof value.ownerUserId==='string'?value.ownerUserId:undefined,
  objective,
  result:normalizeResult(objective,value.result),
  paidPlatforms,
  location:typeof value.location==='string'?value.location:'Brasil',
  gender:typeof value.gender==='string'?value.gender:'Todos',
  languages:typeof value.languages==='string'?value.languages:'Português',
  interests:typeof value.interests==='string'?value.interests:'Viagens, Estados Unidos, turismo, intercâmbio, negócios',
  internalDescription:typeof value.internalDescription==='string'?value.internalDescription:'',
  creativeName:typeof value.creativeName==='string'?value.creativeName:'Criativo principal',
  creativeFileName:typeof value.creativeFileName==='string'?value.creativeFileName:'',
  bidStrategy:typeof value.bidStrategy==='string'?value.bidStrategy:'Menor custo',
 };
}
function migrateStoredRecords(key:string,upgrade:(value:unknown)=>unknown,validate:(value:unknown)=>value is ContentItem|Campaign){
 if(typeof sessionStorage==='undefined')return;
 try{
  const raw=sessionStorage.getItem(key);
  if(!raw)return;
  const parsed:unknown=JSON.parse(raw);
  if(!Array.isArray(parsed))return;
  const upgraded=parsed.map(upgrade);
  if(upgraded.every(validate)&&new Set(upgraded.map(item=>item.id)).size===upgraded.length)sessionStorage.setItem(key,JSON.stringify(upgraded));
 }catch{}
}

export function getMarketingSessionContents(){migrateStoredRecords(CONTENT_KEY,upgradeStoredContent,isMarketingContent);return readSessionRecords<ContentItem>(CONTENT_KEY,()=>fixture().contents.map(seedContent),isMarketingContent)}
export function saveMarketingSessionContents(records:ContentItem[]){return writeSessionRecordsSafely<ContentItem>(CONTENT_KEY,records,isMarketingContent)}
export function getMarketingSessionCampaigns(){migrateStoredRecords(CAMPAIGN_KEY,upgradeStoredCampaign,isMarketingCampaign);return readSessionRecords<Campaign>(CAMPAIGN_KEY,()=>fixture().campaigns.map(seedCampaign),isMarketingCampaign)}
export function saveMarketingSessionCampaigns(records:Campaign[]){return writeSessionRecordsSafely<Campaign>(CAMPAIGN_KEY,records,isMarketingCampaign)}
