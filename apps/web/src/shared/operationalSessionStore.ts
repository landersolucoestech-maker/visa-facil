import { isCrmRecord, getCrmInitialRecords } from '../modules/crm/mocks/mockDataProvider';
import type { CrmRecord } from '../modules/crm/types';
import { isTaskRecord, getTaskInitialRecords, type TaskRecord } from '../modules/tasks/mocks/tasksMockProvider';
import { isAgendaEvent, getAgendaInitialEvents, type AgendaEvent } from '../modules/agenda/mocks/agendaMockProvider';
import { isFinanceRecord, getFinanceInitialRecords, type FinanceRecord } from '../modules/finance/mocks/financeMockProvider';
import { getAttendanceConversationKind, isAttendanceConversation, getAttendanceInitialConversations, type AttendanceConversation } from '../modules/attendance/mocks/attendanceMockProvider';
import { readSessionRecords, writeSessionRecords } from './sessionRecords';

const KEYS={
 crm:'visa-facil.session.crm.v2',
 tasks:'visa-facil.session.tasks.v2',
 agenda:'visa-facil.session.agenda.v2',
 finance:'visa-facil.session.finance.v2',
 attendance:'visa-facil.session.attendance.v2',
} as const;

export function getCrmSessionRecords(){return readSessionRecords<CrmRecord>(KEYS.crm,getCrmInitialRecords,isCrmRecord)}
export function saveCrmSessionRecords(records:CrmRecord[]){return writeSessionRecords(KEYS.crm,records,isCrmRecord)}

export function getTaskSessionRecords(){return readSessionRecords<TaskRecord>(KEYS.tasks,getTaskInitialRecords,isTaskRecord)}
export function saveTaskSessionRecords(records:TaskRecord[]){return writeSessionRecords(KEYS.tasks,records,isTaskRecord)}

export function getAgendaSessionEvents(){return readSessionRecords<AgendaEvent>(KEYS.agenda,getAgendaInitialEvents,isAgendaEvent)}
export function saveAgendaSessionEvents(records:AgendaEvent[]){return writeSessionRecords(KEYS.agenda,records,isAgendaEvent)}

export function getFinanceSessionRecords(){return readSessionRecords<FinanceRecord>(KEYS.finance,getFinanceInitialRecords,isFinanceRecord)}
export function saveFinanceSessionRecords(records:FinanceRecord[]){return writeSessionRecords(KEYS.finance,records,isFinanceRecord)}

export function getAttendanceSessionConversations(){
 const records=readSessionRecords<AttendanceConversation>(KEYS.attendance,getAttendanceInitialConversations,isAttendanceConversation);
 const teamSeeds=getAttendanceInitialConversations().filter(item=>getAttendanceConversationKind(item)==='team');
 const knownIds=new Set(records.map(item=>item.id));
 return [...records,...teamSeeds.filter(item=>!knownIds.has(item.id))];
}
export function saveAttendanceSessionConversations(records:AttendanceConversation[]){return writeSessionRecords(KEYS.attendance,records,isAttendanceConversation)}