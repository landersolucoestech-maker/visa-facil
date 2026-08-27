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
import { readSessionRecords, SessionRecordPersistenceError, writeSessionRecords, type SessionRecord } from './sessionRecords';

const KEYS={
 crm:'visa-facil.session.crm.v2',
 tasks:'visa-facil.session.tasks.v2',
 agenda:'visa-facil.session.agenda.v2',
 finance:'visa-facil.session.finance.v2',
 attendance:'visa-facil.session.attendance.v2',
} as const;

export const LOCAL_PERSISTENCE_ERROR_EVENT='visa-local-persistence-error';
export type LocalPersistenceErrorDetail={key:string;message:string};
export type OperationalTeamMember={id:string;name:string;email:string;role:string};

function reportPersistenceError(error:unknown,key:string){
 const detail:LocalPersistenceErrorDetail={
  key,
  message:error instanceof SessionRecordPersistenceError
   ? error.message
   : `Não foi possível persistir os dados locais de ${key}.`,
 };
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent<LocalPersistenceErrorDetail>(LOCAL_PERSISTENCE_ERROR_EVENT,{detail}));
}

function safeWrite<T extends SessionRecord>(key:string,records:T[],validate:(value:unknown)=>value is T):T[]{
 try{return writeSessionRecords(key,records,validate)}
 catch(error){reportPersistenceError(error,key);return structuredClone(records)}
}

export function getOperationalTeamMembers():OperationalTeamMember[]{
 return getSettingsUserMocks()
  .filter(user=>user.status==='Ativo')
  .map(({id,name,email,role})=>({id,name,email,role}));
}

export function getCrmSessionRecords(){return readSessionRecords<CrmRecord>(KEYS.crm,getCrmInitialRecords,isCrmRecord)}
export function saveCrmSessionRecords(records:CrmRecord[]){return safeWrite(KEYS.crm,records,isCrmRecord)}

export function getTaskSessionRecords(){return readSessionRecords<TaskRecord>(KEYS.tasks,getTaskInitialRecords,isTaskRecord)}
export function saveTaskSessionRecords(records:TaskRecord[]){return safeWrite(KEYS.tasks,records,isTaskRecord)}

export function getAgendaSessionEvents(){return readSessionRecords<AgendaEvent>(KEYS.agenda,getAgendaInitialEvents,isAgendaEvent)}
export function saveAgendaSessionEvents(records:AgendaEvent[]){return safeWrite(KEYS.agenda,records,isAgendaEvent)}

export function getFinanceSessionRecords(){return readSessionRecords<FinanceRecord>(KEYS.finance,getFinanceInitialRecords,isFinanceRecord)}
export function saveFinanceSessionRecords(records:FinanceRecord[]){return safeWrite(KEYS.finance,records,isFinanceRecord)}

export function getAttendanceSessionConversations(){
 const seeds=getAttendanceInitialConversations();
 const records=readSessionRecords<AttendanceConversation>(KEYS.attendance,()=>seeds,isAttendanceConversation);
 const seedById=new Map(seeds.map(item=>[item.id,item]));
 const teamSeeds=seeds.filter(item=>getAttendanceConversationKind(item)==='team');
 const knownIds=new Set(records.map(item=>item.id));
 const merged=[...records,...teamSeeds.filter(item=>!knownIds.has(item.id))];
 return sortAttendanceConversations(merged.map(item=>normalizeAttendanceConversation(item,seedById.get(item.id))));
}
export function saveAttendanceSessionConversations(records:AttendanceConversation[]){
 return safeWrite(KEYS.attendance,sortAttendanceConversations(records),isAttendanceConversation);
}
