import { getMarketingMockFixture, type MarketingMockCampaign, type MarketingMockContent } from './mocks/marketingMockProvider';
import { readSessionRecords, writeSessionRecords } from '../../shared/sessionRecords';

export type Platform='Instagram'|'Facebook'|'TikTok'|'YouTube'|'X'|'Threads';
export type PaidPlatform='Meta Ads'|'Google Ads'|'YouTube Ads'|'TikTok Ads';
export type ContentItem={id:string;date:string;time:string;title:string;channels:Platform[];primaryChannel:Platform;type:string;status:string;owner:string;copy:string;mediaName?:string};
export type Campaign={
 id:string;
 name:string;
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

const CONTENT_KEY='visa-facil.session.marketing.contents.v1';
const CAMPAIGN_KEY='visa-facil.session.marketing.campaigns.v1';
const PUBLISH_PLATFORMS=new Set<Platform>(['Instagram','Facebook','TikTok','YouTube','X','Threads']);
const PAID_PLATFORMS=new Set<PaidPlatform>(['Meta Ads','Google Ads','YouTube Ads','TikTok Ads']);
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const TIME_RE=/^([01]\d|2[0-3]):[0-5]\d$/;
const RESULT_BY_OBJECTIVE:Record<string,string>={Alcance:'Impressões',Tráfego:'Cliques no site',Engajamento:'Interações',Conversões:'Leads'};

function isObject(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function isStringArray(value:unknown):value is string[]{return Array.isArray(value)&&value.every(item=>typeof item==='string')}
function unique(values:string[]){return new Set(values).size===values.length}
function defaultResult(objective:unknown){return typeof objective==='string'?(RESULT_BY_OBJECTIVE[objective]??'Leads'):'Leads'}

export function isMarketingContent(value:unknown):value is ContentItem{
 if(!isObject(value)||typeof value.id!=='string'||!value.id.trim()||typeof value.date!=='string'||!DATE_RE.test(value.date)||typeof value.time!=='string'||!TIME_RE.test(value.time)||typeof value.title!=='string'||!value.title.trim())return false;
 if(!Array.isArray(value.channels)||value.channels.length===0||!value.channels.every(channel=>typeof channel==='string'&&PUBLISH_PLATFORMS.has(channel as Platform))||!unique(value.channels as string[]))return false;
 if(typeof value.primaryChannel!=='string'||!PUBLISH_PLATFORMS.has(value.primaryChannel as Platform)||!(value.channels as string[]).includes(value.primaryChannel))return false;
 return typeof value.type==='string'&&value.type.trim().length>0&&typeof value.status==='string'&&value.status.trim().length>0&&typeof value.owner==='string'&&typeof value.copy==='string'&&(value.mediaName===undefined||typeof value.mediaName==='string');
}

export function isMarketingCampaign(value:unknown):value is Campaign{
 if(!isObject(value)||typeof value.id!=='string'||!value.id.trim()||typeof value.name!=='string'||typeof value.objective!=='string'||typeof value.result!=='string'||typeof value.status!=='string')return false;
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
 if(channel==='Google Ads')return'Google Ads';
 if(channel==='YouTube')return'YouTube Ads';
 if(channel==='TikTok')return'TikTok Ads';
 return'Meta Ads';
}
function seedContent(content:MarketingMockContent):ContentItem{return{id:content.id,date:content.date,time:content.time,title:content.title,channels:[content.channel],primaryChannel:content.channel,type:content.type,status:content.status,owner:content.owner,copy:content.copy}}
function seedCampaign(campaign:MarketingMockCampaign):Campaign{return{id:campaign.id,name:campaign.name,objective:campaign.objective,result:defaultResult(campaign.objective),status:campaign.status,paidPlatforms:[paidPlatform(campaign.channel)],budget:campaign.budget,dailyBudget:Math.round(campaign.budget/30),spent:campaign.spent,leads:campaign.leads,conversions:campaign.conversions,startDate:campaign.startDate,endDate:campaign.endDate,audience:'Brasileiros interessados em assessoria de vistos',location:'Brasil',ageRange:'25–34',gender:'Todos',languages:'Português',interests:'Viagens, Estados Unidos, turismo, intercâmbio, negócios',destinationUrl:'https://visafacil.com.br',internalDescription:'',placements:['Feed','Stories'],creativeName:'Criativo principal',creativeFileName:'',headline:campaign.name,primaryCopy:campaign.objective,cta:'Saiba mais',bidStrategy:'Menor custo'}}
function fixture(){return getMarketingMockFixture()}

function upgradeStoredCampaign(value:unknown):unknown{
 if(!isObject(value))return value;
 return {
  ...value,
  result:typeof value.result==='string'?value.result:defaultResult(value.objective),
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
function migrateStoredCampaigns(){
 if(typeof sessionStorage==='undefined')return;
 try{
  const raw=sessionStorage.getItem(CAMPAIGN_KEY);
  if(!raw)return;
  const parsed:unknown=JSON.parse(raw);
  if(!Array.isArray(parsed))return;
  const upgraded=parsed.map(upgradeStoredCampaign);
  if(upgraded.every(isMarketingCampaign)&&new Set(upgraded.map(item=>item.id)).size===upgraded.length)sessionStorage.setItem(CAMPAIGN_KEY,JSON.stringify(upgraded));
 }catch{}
}

export function getMarketingSessionContents(){return readSessionRecords<ContentItem>(CONTENT_KEY,()=>fixture().contents.map(seedContent),isMarketingContent)}
export function saveMarketingSessionContents(records:ContentItem[]){return writeSessionRecords<ContentItem>(CONTENT_KEY,records,isMarketingContent)}
export function getMarketingSessionCampaigns(){migrateStoredCampaigns();return readSessionRecords<Campaign>(CAMPAIGN_KEY,()=>fixture().campaigns.map(seedCampaign),isMarketingCampaign)}
export function saveMarketingSessionCampaigns(records:Campaign[]){return writeSessionRecords<Campaign>(CAMPAIGN_KEY,records,isMarketingCampaign)}
