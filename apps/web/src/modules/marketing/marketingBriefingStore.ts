import { readSessionRecords } from '../../shared/sessionRecords';
import { safeWriteSessionRecords as writeSessionRecordsSafely } from '../../shared/sessionPersistence';
import { getMarketingMockBriefings } from './mocks/marketingMockProvider';
import type { Platform } from './marketingSessionStore';

export type MarketingBriefingStatus='Rascunho'|'Em elaboração'|'Em revisão'|'Aprovado'|'Arquivado';
export type MarketingBriefing={
 id:string;
 title:string;
 objective:string;
 audience:string;
 channels:Platform[];
 owner:string;
 ownerUserId?:string;
 dueDate:string;
 status:MarketingBriefingStatus;
 keyMessage:string;
 deliverables:string;
 notes:string;
 createdAt:string;
 updatedAt:string;
};

const KEY='visa-facil.session.marketing.briefings.v2';
const LEGACY_KEY='visa-facil.session.marketing.briefings.v1';
const STATUSES=new Set<MarketingBriefingStatus>(['Rascunho','Em elaboração','Em revisão','Aprovado','Arquivado']);
const CHANNELS=new Set<Platform>(['Instagram','Facebook','TikTok','YouTube','X','Threads']);
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
export function isMarketingBriefing(value:unknown):value is MarketingBriefing{
 if(!isRecord(value)||typeof value.id!=='string'||!value.id.trim()||typeof value.title!=='string'||!value.title.trim())return false;
 if(typeof value.objective!=='string'||typeof value.audience!=='string'||typeof value.owner!=='string'||(value.ownerUserId!==undefined&&typeof value.ownerUserId!=='string'))return false;
 if(!Array.isArray(value.channels)||!value.channels.every(channel=>typeof channel==='string'&&CHANNELS.has(channel as Platform))||new Set(value.channels).size!==value.channels.length)return false;
 if(typeof value.dueDate!=='string'||(value.dueDate!==''&&!DATE_RE.test(value.dueDate)))return false;
 if(typeof value.status!=='string'||!STATUSES.has(value.status as MarketingBriefingStatus))return false;
 if(typeof value.keyMessage!=='string'||typeof value.deliverables!=='string'||typeof value.notes!=='string')return false;
 if(typeof value.createdAt!=='string'||!Number.isFinite(Date.parse(value.createdAt))||typeof value.updatedAt!=='string'||!Number.isFinite(Date.parse(value.updatedAt)))return false;
 if(value.status!=='Rascunho'&&(!value.objective.trim()||!value.ownerUserId))return false;
 return true;
}
function initialBriefings():MarketingBriefing[]{return getMarketingMockBriefings().filter(isMarketingBriefing)}
function migrateLegacyBriefings(){
 if(typeof sessionStorage==='undefined'||sessionStorage.getItem(KEY)!==null)return;
 try{
  const raw=sessionStorage.getItem(LEGACY_KEY);
  if(raw===null)return;
  const parsed:unknown=JSON.parse(raw);
  const legacy=Array.isArray(parsed)?parsed.filter(isMarketingBriefing):[];
  const seeds=initialBriefings();
  const known=new Set(legacy.map(record=>record.id));
  sessionStorage.setItem(KEY,JSON.stringify([...legacy,...seeds.filter(record=>!known.has(record.id))]));
 }catch{}
}
export function getMarketingSessionBriefings(){migrateLegacyBriefings();return readSessionRecords<MarketingBriefing>(KEY,initialBriefings,isMarketingBriefing)}
export function saveMarketingSessionBriefings(records:MarketingBriefing[]){return writeSessionRecordsSafely(KEY,records,isMarketingBriefing)}
