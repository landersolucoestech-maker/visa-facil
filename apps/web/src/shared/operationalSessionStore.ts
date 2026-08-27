import { isCrmRecord, getCrmInitialRecords } from '../modules/crm/mocks/mockDataProvider';
import type { CrmRecord } from '../modules/crm/types';
import { isTaskRecord, getTaskInitialRecords, type TaskRecord } from '../modules/tasks/mocks/tasksMockProvider';
import { isAgendaEvent, getAgendaInitialEvents, type AgendaEvent } from '../modules/agenda/mocks/agendaMockProvider';
import { isFinanceRecord, getFinanceInitialRecords, type FinanceRecord } from '../modules/finance/mocks/financeMockProvider';
import { getAttendanceInitialConversations } from '../modules/attendance/mocks/attendanceMockProvider';
import {
  getAttendanceConversationKind,
  isAttendanceConversation,
  normalizeAttendanceConversation,
  sortAttendanceConversations,
  type AttendanceConversation,
} from '../modules/attendance/attendanceDomain';
import { getSettingsUserMocks } from '../modules/settings/mocks/settingsMockProvider';
import { readSessionRecords } from './sessionRecords';
import { safeWriteSessionRecords as writeSessionRecordsSafely } from './sessionPersistence';

export { LOCAL_PERSISTENCE_ERROR_EVENT, type LocalPersistenceErrorDetail } from './sessionPersistence';

const KEYS={
 crm:'visa-facil.session.crm.v2',
 tasks:'visa-facil.session.tasks.v3',
 agenda:'visa-facil.session.agenda.v2',
 finance:'visa-facil.session.finance.v2',
 attendance:'visa-facil.session.attendance.v2',
} as const;
const LEGACY_TASK_KEY='visa-facil.session.tasks.v2';

export type OperationalTeamMember={id:string;name:string;email:string;role:string};

export function getOperationalTeamMembers():OperationalTeamMember[]{
 return getSettingsUserMocks()
  .filter(user=>user.status==='Ativo')
  .map(({id,name,email,role})=>({id,name,email,role}));
}

export function getCrmSessionRecords(){return readSessionRecords<CrmRecord>(KEYS.crm,getCrmInitialRecords,isCrmRecord)}
export function saveCrmSessionRecords(records:CrmRecord[]){return writeSessionRecordsSafely(KEYS.crm,records,isCrmRecord)}

function migrateTaskSeedRevision(){
 if(typeof sessionStorage==='undefined'||sessionStorage.getItem(KEYS.tasks)!==null)return;
 try{
  const raw=sessionStorage.getItem(LEGACY_TASK_KEY);
  if(raw===null)return;
  const parsed:unknown=JSON.parse(raw);
  const seen=new Set<string>();
  const legacy=Array.isArray(parsed)?parsed.filter(isTaskRecord).filter(record=>{if(seen.has(record.id))return false;seen.add(record.id);return true}):[];
  const seeds=getTaskInitialRecords();
  const merged=[...legacy,...seeds.filter(record=>!seen.has(record.id))];
  sessionStorage.setItem(KEYS.tasks,JSON.stringify(merged));
 }catch{}
}
export function getTaskSessionRecords(){migrateTaskSeedRevision();return readSessionRecords<TaskRecord>(KEYS.tasks,getTaskInitialRecords,isTaskRecord)}
export function saveTaskSessionRecords(records:TaskRecord[]){return writeSessionRecordsSafely(KEYS.tasks,records,isTaskRecord)}

export function getAgendaSessionEvents(){return readSessionRecords<AgendaEvent>(KEYS.agenda,getAgendaInitialEvents,isAgendaEvent)}
export function saveAgendaSessionEvents(records:AgendaEvent[]){return writeSessionRecordsSafely(KEYS.agenda,records,isAgendaEvent)}

export function getFinanceSessionRecords(){return readSessionRecords<FinanceRecord>(KEYS.finance,getFinanceInitialRecords,isFinanceRecord)}
export function saveFinanceSessionRecords(records:FinanceRecord[]){return writeSessionRecordsSafely(KEYS.finance,records,isFinanceRecord)}

function normalizeIdentity(value:string){return value.trim().toLocaleLowerCase('pt-BR')}
function normalizeDigits(value:string){return value.replace(/\D/g,'')}
function attendanceCrmMatch(conversation:AttendanceConversation,crmRecords:CrmRecord[]){
 if(conversation.kind==='team')return undefined;
 if(conversation.crmRecordId){
  const linked=crmRecords.find(record=>record.id===conversation.crmRecordId);
  if(linked)return linked;
 }
 const name=normalizeIdentity(conversation.customer);
 const email=normalizeIdentity(conversation.email);
 const handleDigits=normalizeDigits(conversation.handle);
 const matches=crmRecords.filter(record=>normalizeIdentity(record.fullName)===name||(email&&normalizeIdentity(record.email)===email)||(handleDigits&&(normalizeDigits(record.whatsapp)===handleDigits||normalizeDigits(record.phone)===handleDigits)));
 return matches.length===1?matches[0]:undefined;
}
function attendanceAssigneeMatch(conversation:AttendanceConversation,members:OperationalTeamMember[]){
 if(conversation.assigneeUserId){
  const linked=members.find(member=>member.id===conversation.assigneeUserId);
  if(linked)return linked;
 }
 const matches=members.filter(member=>normalizeIdentity(member.name)===normalizeIdentity(conversation.assignee)||normalizeIdentity(member.email)===normalizeIdentity(conversation.assignee));
 return matches.length===1?matches[0]:undefined;
}
function canonicalizeAttendanceRecords(records:AttendanceConversation[],existingIds:Set<string>){
 const crmRecords=getCrmSessionRecords();
 const members=getOperationalTeamMembers();
 return records.map(conversation=>{
  const assignee=attendanceAssigneeMatch(conversation,members);
  if(conversation.kind==='team')return assignee?{...conversation,assignee:assignee.name,assigneeUserId:assignee.id}:conversation;
  const crmRecord=attendanceCrmMatch(conversation,crmRecords);
  if(!crmRecord&&!existingIds.has(conversation.id))throw new Error(`Não foi possível vincular a nova conversa “${conversation.customer}” a um único Contato ou Lead do CRM.`);
  return {
   ...conversation,
   ...(assignee?{assignee:assignee.name,assigneeUserId:assignee.id}:{}),
   ...(crmRecord?{
    crmRecordId:crmRecord.id,
    customer:crmRecord.fullName,
    email:crmRecord.email,
    crmType:crmRecord.kind==='lead'?'Lead':crmRecord.relationship==='Cliente'?'Cliente':'Contato',
    service:crmRecord.interest??'',
    destination:crmRecord.destination??'',
    visaType:crmRecord.visaType??'',
   }:{}),
  };
 });
}

export function getAttendanceSessionConversations(){
 const seeds=getAttendanceInitialConversations();
 const records=readSessionRecords<AttendanceConversation>(KEYS.attendance,()=>seeds,isAttendanceConversation);
 const seedById=new Map(seeds.map(item=>[item.id,item]));
 const teamSeeds=seeds.filter(item=>getAttendanceConversationKind(item)==='team');
 const knownIds=new Set(records.map(item=>item.id));
 const merged=[...records,...teamSeeds.filter(item=>!knownIds.has(item.id))];
 return sortAttendanceConversations(canonicalizeAttendanceRecords(merged,new Set(merged.map(item=>item.id))).map(item=>normalizeAttendanceConversation(item,seedById.get(item.id))));
}
export function saveAttendanceSessionConversations(records:AttendanceConversation[]){
 const existing=getAttendanceSessionConversations();
 const canonical=canonicalizeAttendanceRecords(records,new Set(existing.map(item=>item.id)));
 return writeSessionRecordsSafely(KEYS.attendance,sortAttendanceConversations(canonical),isAttendanceConversation);
}
