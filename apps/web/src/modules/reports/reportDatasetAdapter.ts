import type { CrmRecord } from '../crm/types';
import type { TaskPriority, TaskRecord, TaskStatus } from '../tasks/mocks/tasksMockProvider';
import type { AgendaEvent, AgendaStatus } from '../agenda/mocks/agendaMockProvider';
import type { FinanceRecord, FinanceStatus, FinanceType } from '../finance/types';
import { getAttendanceConversationKind, type AttendanceConversation, type CustomerConversationStatus } from '../attendance/attendanceDomain';
import {
  getAgendaSessionEvents,
  getAttendanceSessionConversations,
  getCrmSessionRecords,
  getFinanceSessionRecords,
  getTaskSessionRecords,
  saveAgendaSessionEvents,
  saveAttendanceSessionConversations,
  saveCrmSessionRecords,
  saveFinanceSessionRecords,
  saveTaskSessionRecords,
} from '../../shared/operationalSessionStore';

export type ReportDatasetId='contacts'|'leads'|'attendance'|'tasks'|'agenda'|'finance';
export type ReportRow=Record<string,string>;
export type ImportResult={imported:number;updated:number;total:number};

const CONTACT_COLUMNS=['Nome','E-mail','Telefone','CPF','RG','Passaporte','Serviço','Destino'] as const;
const LEAD_COLUMNS=['Nome','E-mail','Telefone','Origem','Status','Serviço','Tipo de visto','Destino'] as const;
const ATTENDANCE_COLUMNS=['Cliente','Canal','Protocolo','Status','Fila','Responsável','Última mensagem'] as const;
const TASK_COLUMNS=['Tarefa','Vínculo','Responsável','Prioridade','Prazo','Status'] as const;
const AGENDA_COLUMNS=['Evento','Tipo','Data','Horário','Status','Responsável','Vínculo'] as const;
const FINANCE_COLUMNS=['Descrição','Tipo','Categoria','Valor','Data','Vencimento','Status'] as const;

export const REPORT_DATASET_COLUMNS:Record<ReportDatasetId,readonly string[]>={
  contacts:CONTACT_COLUMNS,
  leads:LEAD_COLUMNS,
  attendance:ATTENDANCE_COLUMNS,
  tasks:TASK_COLUMNS,
  agenda:AGENDA_COLUMNS,
  finance:FINANCE_COLUMNS,
};

const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const TIME_RE=/^([01]\d|2[0-3]):[0-5]\d$/;
const LEAD_STATUSES=new Set(['Novo','Em contato','Qualificado','Não qualificado','Convertido','Perdido']);
const CUSTOMER_STATUSES=new Set<CustomerConversationStatus>(['Aguardando atendimento','Em atendimento','Aguardando cliente','Resolvida','Arquivada']);
const TASK_STATUSES=new Set<TaskStatus>(['Pendente','Em andamento','Concluída']);
const TASK_PRIORITIES=new Set<TaskPriority>(['Baixa','Média','Alta']);
const AGENDA_STATUSES=new Set<AgendaStatus>(['Confirmado','Pendente','Realizado','Cancelado']);
const FINANCE_TYPES=new Set<FinanceType>(['Receita','Despesa']);
const FINANCE_STATUSES=new Set<FinanceStatus>(['Recebido','A receber','Pago','A pagar']);

type CustomerPriority='Baixa'|'Normal'|'Alta'|'Urgente';

function normalize(value:string){return value.trim().toLocaleLowerCase('pt-BR')}
function text(row:ReportRow,key:string){return (row[key]??'').trim()}
function required(row:ReportRow,key:string,rowNumber:number){
  const value=text(row,key);
  if(!value)throw new Error(`Linha ${rowNumber}: “${key}” é obrigatório.`);
  return value;
}
function validDate(value:string){return DATE_RE.test(value)&&Number.isFinite(Date.parse(`${value}T12:00:00`))}
function nowIso(){return new Date().toISOString()}
function newId(prefix:string){return `${prefix}-${crypto.randomUUID()}`}
function linkedValue(type:string,name:string){return name?`${type}: ${name}`:type}
function parseLink(value:string):{type:'Contato'|'Lead';name:string}{
  const match=value.match(/^\s*(Contato|Lead)\s*[:·-]\s*(.*)$/i);
  if(match)return{type:normalize(match[1])==='lead'?'Lead':'Contato',name:match[2].trim()};
  return{type:'Contato',name:value.trim()};
}
function formatTimeRange(start:string,end:string){if(start&&end)return`${start}–${end}`;return start||end}
function parseTimeRange(value:string,rowNumber:number){
  const trimmed=value.trim();
  if(!trimmed)return{startTime:'',endTime:''};
  const parts=trimmed.split(/\s*(?:–|—|-)\s*/).filter(Boolean);
  const startTime=parts[0]??'';
  const endTime=parts[1]??'';
  if(startTime&&!TIME_RE.test(startTime))throw new Error(`Linha ${rowNumber}: horário inicial inválido.`);
  if(endTime&&!TIME_RE.test(endTime))throw new Error(`Linha ${rowNumber}: horário final inválido.`);
  if(startTime&&endTime&&endTime<=startTime)throw new Error(`Linha ${rowNumber}: o horário final deve ser posterior ao inicial.`);
  return{startTime,endTime};
}
function parseAmount(value:string,rowNumber:number){
  const raw=value.replace(/R\$\s?/gi,'').trim();
  let normalized=raw;
  if(raw.includes(',')&&raw.includes('.'))normalized=raw.replace(/\./g,'').replace(',','.');
  else if(raw.includes(','))normalized=raw.replace(',','.');
  const amount=Number(normalized);
  if(!Number.isFinite(amount)||amount<=0)throw new Error(`Linha ${rowNumber}: valor financeiro inválido.`);
  return amount;
}
function financeStatus(type:FinanceType,value:string,rowNumber:number):FinanceStatus{
  const fallback:FinanceStatus=type==='Receita'?'A receber':'A pagar';
  if(!value)return fallback;
  if(!FINANCE_STATUSES.has(value as FinanceStatus))throw new Error(`Linha ${rowNumber}: status financeiro inválido.`);
  const status=value as FinanceStatus;
  const compatible=type==='Receita'?status==='Recebido'||status==='A receber':status==='Pago'||status==='A pagar';
  if(!compatible)throw new Error(`Linha ${rowNumber}: status “${status}” incompatível com ${type}.`);
  return status;
}
function assertPersisted<T>(expected:T[],actual:T[],label:string){
  if(JSON.stringify(expected)!==JSON.stringify(actual))throw new Error(`Não foi possível persistir a importação de ${label} neste navegador.`);
}

export function getReportRows(id:ReportDatasetId):ReportRow[]{
  if(id==='contacts')return getCrmSessionRecords().filter(record=>record.kind==='contact').map(record=>({
    'Nome':record.fullName,
    'E-mail':record.email,
    'Telefone':record.phone,
    'CPF':record.cpf,
    'RG':record.rg,
    'Passaporte':record.passportNumber,
    'Serviço':record.interest??'',
    'Destino':record.destination??'',
  }));
  if(id==='leads')return getCrmSessionRecords().filter(record=>record.kind==='lead').map(record=>({
    'Nome':record.fullName,
    'E-mail':record.email,
    'Telefone':record.phone,
    'Origem':record.source??'',
    'Status':record.leadStatus??'',
    'Serviço':record.interest??'',
    'Tipo de visto':record.visaType??'',
    'Destino':record.destination??'',
  }));
  if(id==='attendance')return getAttendanceSessionConversations()
    .filter(record=>getAttendanceConversationKind(record)==='customer')
    .map(record=>({
      'Cliente':record.customer,
      'Canal':record.channel,
      'Protocolo':record.protocol,
      'Status':record.status,
      'Fila':record.queue,
      'Responsável':record.assignee,
      'Última mensagem':record.lastMessage,
    }));
  if(id==='tasks')return getTaskSessionRecords().map(record=>({
    'Tarefa':record.title,
    'Vínculo':linkedValue(record.relatedType,record.relatedName),
    'Responsável':record.owner,
    'Prioridade':record.priority,
    'Prazo':record.dueDate,
    'Status':record.status,
  }));
  if(id==='agenda')return getAgendaSessionEvents().map(record=>({
    'Evento':record.title,
    'Tipo':record.type,
    'Data':record.date,
    'Horário':formatTimeRange(record.startTime,record.endTime),
    'Status':record.status,
    'Responsável':record.owner,
    'Vínculo':linkedValue(record.relatedType==='Cliente'?'Contato':record.relatedType,record.relatedName),
  }));
  return getFinanceSessionRecords().map(record=>({
    'Descrição':record.description,
    'Tipo':record.type,
    'Categoria':record.category,
    'Valor':record.amount.toFixed(2).replace('.',','),
    'Data':record.date,
    'Vencimento':record.dueDate,
    'Status':record.status,
  }));
}

function importCrm(kind:'contact'|'lead',rows:ReportRow[]):ImportResult{
  const current=getCrmSessionRecords();
  const next=[...current];
  let imported=0;
  let updated=0;

  rows.forEach((row,index)=>{
    const rowNumber=index+2;
    const fullName=required(row,'Nome',rowNumber);
    const email=required(row,'E-mail',rowNumber);
    const emailKey=normalize(email);
    const existingIndex=next.findIndex(record=>normalize(record.email)===emailKey);
    const previous=existingIndex>=0?next[existingIndex]:undefined;

    if(previous&&previous.kind!==kind)throw new Error(`Linha ${rowNumber}: o e-mail “${email}” já pertence a ${previous.kind==='lead'?'um lead':'um contato'}.`);

    const timestamp=nowIso();
    let base:CrmRecord;

    if(kind==='contact'){
      base={
        id:previous?.id??newId('contact'),
        kind,
        fullName,
        cpf:text(row,'CPF'),
        rg:text(row,'RG'),
        passportNumber:text(row,'Passaporte'),
        email,
        phone:text(row,'Telefone'),
        whatsapp:previous?.whatsapp??'',
        city:previous?.city??'',
        state:previous?.state??'',
        country:previous?.country??'Brasil',
        notes:previous?.notes??'',
        createdAt:previous?.createdAt??timestamp,
        updatedAt:timestamp,
        relationship:previous?.relationship??'Cliente',
        contactStatus:previous?.contactStatus??'Ativo',
        source:previous?.source??'',
        owner:previous?.owner??'',
        ownerUserId:previous?.ownerUserId??'',
        interest:text(row,'Serviço'),
        destination:text(row,'Destino'),
        visaType:previous?.visaType??'',
      };
    }else{
      const requestedStatus=text(row,'Status')||previous?.leadStatus||'Novo';
      if(!LEAD_STATUSES.has(requestedStatus))throw new Error(`Linha ${rowNumber}: status de lead inválido.`);
      const convertedContactId=previous?.convertedContactId;
      if(convertedContactId&&text(row,'Status')&&requestedStatus!=='Convertido'){
        throw new Error(`Linha ${rowNumber}: lead convertido não pode ter o status alterado por importação.`);
      }
      if(!convertedContactId&&requestedStatus==='Convertido'){
        throw new Error(`Linha ${rowNumber}: “Convertido” só pode ser criado pelo fluxo de conversão do CRM.`);
      }
      base={
        id:previous?.id??newId('lead'),
        kind,
        fullName,
        cpf:previous?.cpf??'',
        rg:previous?.rg??'',
        passportNumber:previous?.passportNumber??'',
        email,
        phone:text(row,'Telefone'),
        whatsapp:previous?.whatsapp??'',
        city:previous?.city??'',
        state:previous?.state??'',
        country:previous?.country??'Brasil',
        notes:previous?.notes??'',
        createdAt:previous?.createdAt??timestamp,
        updatedAt:timestamp,
        source:text(row,'Origem')||previous?.source||'Website',
        owner:previous?.owner??'',
        ownerUserId:previous?.ownerUserId??'',
        interest:text(row,'Serviço'),
        destination:text(row,'Destino'),
        visaType:text(row,'Tipo de visto'),
        leadStatus:convertedContactId?'Convertido':requestedStatus,
        temperature:previous?.temperature??'Morno',
        nextAction:previous?.nextAction??'',
        nextActionDate:previous?.nextActionDate??'',
        convertedContactId,
        convertedAt:previous?.convertedAt,
      };
    }

    if(existingIndex>=0){
      next[existingIndex]={...next[existingIndex],...base};
      updated+=1;
    }else{
      next.push(base);
      imported+=1;
    }
  });

  const saved=saveCrmSessionRecords(next);
  assertPersisted(saved,getCrmSessionRecords(),kind==='contact'?'contatos':'leads');
  return{imported,updated,total:rows.length};
}

function importAttendance(rows:ReportRow[]):ImportResult{
  const current=getAttendanceSessionConversations();
  const next=[...current];
  let imported=0;
  let updated=0;

  rows.forEach((row,index)=>{
    const rowNumber=index+2;
    const customer=required(row,'Cliente',rowNumber);
    const channel=required(row,'Canal',rowNumber);
    if(channel==='Equipe')throw new Error(`Linha ${rowNumber}: atendimentos de equipe não podem ser importados como atendimento de cliente.`);
    const protocol=required(row,'Protocolo',rowNumber);
    const rawStatus=text(row,'Status')||'Aguardando atendimento';
    if(!CUSTOMER_STATUSES.has(rawStatus as CustomerConversationStatus))throw new Error(`Linha ${rowNumber}: status de atendimento inválido.`);
    const existingIndex=next.findIndex(record=>getAttendanceConversationKind(record)==='customer'&&normalize(record.protocol)===normalize(protocol));
    const previous=existingIndex>=0?next[existingIndex]:undefined;
    const previousPriority=(previous as (AttendanceConversation&{priority?:CustomerPriority})|undefined)?.priority??'Normal';
    const timestamp=nowIso();
    const record:AttendanceConversation={
      id:previous?.id??newId('attendance'),
      kind:'customer',
      customer,
      handle:previous?.handle??'',
      email:previous?.email??'',
      channel,
      status:rawStatus as CustomerConversationStatus,
      assignee:text(row,'Responsável'),
      queue:text(row,'Fila'),
      protocol,
      tags:previous?.tags??[],
      lastMessage:text(row,'Última mensagem'),
      lastMessageAt:timestamp,
      updatedAt:timestamp,
      unread:previous?.unread??0,
      crmType:previous?.crmType??'',
      service:previous?.service??'',
      destination:previous?.destination??'',
      visaType:previous?.visaType??'',
      messages:previous?.messages??[],
      priority:previousPriority,
    };
    if(existingIndex>=0){next[existingIndex]=record;updated+=1}else{next.push(record);imported+=1}
  });

  const saved=saveAttendanceSessionConversations(next);
  assertPersisted(saved,getAttendanceSessionConversations(),'atendimentos');
  return{imported,updated,total:rows.length};
}

function importTasks(rows:ReportRow[]):ImportResult{
  const current=getTaskSessionRecords();
  const next=[...current];
  let imported=0;
  let updated=0;

  rows.forEach((row,index)=>{
    const rowNumber=index+2;
    const title=required(row,'Tarefa',rowNumber);
    const link=parseLink(text(row,'Vínculo'));
    const priority=text(row,'Prioridade')||'Média';
    const status=text(row,'Status')||'Pendente';
    const dueDate=text(row,'Prazo');
    if(!TASK_PRIORITIES.has(priority as TaskPriority))throw new Error(`Linha ${rowNumber}: prioridade de tarefa inválida.`);
    if(!TASK_STATUSES.has(status as TaskStatus))throw new Error(`Linha ${rowNumber}: status de tarefa inválido.`);
    if(dueDate&&!validDate(dueDate))throw new Error(`Linha ${rowNumber}: prazo inválido.`);
    const owner=text(row,'Responsável');
    const existingIndex=next.findIndex(record=>normalize(record.title)===normalize(title)&&record.dueDate===dueDate&&normalize(record.relatedName)===normalize(link.name));
    const previous=existingIndex>=0?next[existingIndex]:undefined;
    const timestamp=nowIso();
    const record:TaskRecord={
      id:previous?.id??newId('task'),
      title,
      description:previous?.description??'',
      relatedType:link.type,
      relatedName:link.name,
      owner,
      priority:priority as TaskPriority,
      status:status as TaskStatus,
      dueDate,
      dueTime:previous?.dueTime??'',
      reminder:dueDate?(previous?.reminder??'Sem lembrete'):'Sem lembrete',
      createdAt:previous?.createdAt??timestamp,
      updatedAt:timestamp,
    };
    if(existingIndex>=0){next[existingIndex]=record;updated+=1}else{next.push(record);imported+=1}
  });

  const saved=saveTaskSessionRecords(next);
  assertPersisted(saved,getTaskSessionRecords(),'tarefas');
  return{imported,updated,total:rows.length};
}

function importAgenda(rows:ReportRow[]):ImportResult{
  const current=getAgendaSessionEvents();
  const next=[...current];
  let imported=0;
  let updated=0;

  rows.forEach((row,index)=>{
    const rowNumber=index+2;
    const title=required(row,'Evento',rowNumber);
    const date=required(row,'Data',rowNumber);
    if(!validDate(date))throw new Error(`Linha ${rowNumber}: data de agenda inválida.`);
    const status=text(row,'Status')||'Pendente';
    if(!AGENDA_STATUSES.has(status as AgendaStatus))throw new Error(`Linha ${rowNumber}: status de agenda inválido.`);
    const link=parseLink(text(row,'Vínculo'));
    const times=parseTimeRange(text(row,'Horário'),rowNumber);
    const existingIndex=next.findIndex(record=>normalize(record.title)===normalize(title)&&record.date===date&&record.startTime===times.startTime);
    const previous=existingIndex>=0?next[existingIndex]:undefined;
    const record:AgendaEvent={
      id:previous?.id??newId('agenda'),
      title,
      type:text(row,'Tipo'),
      status:status as AgendaStatus,
      date,
      startTime:times.startTime,
      endTime:times.endTime,
      location:previous?.location??'',
      city:previous?.city??'',
      relatedType:link.type,
      relatedName:link.name,
      owner:text(row,'Responsável'),
      notes:previous?.notes??'',
    };
    if(existingIndex>=0){next[existingIndex]=record;updated+=1}else{next.push(record);imported+=1}
  });

  const saved=saveAgendaSessionEvents(next);
  assertPersisted(saved,getAgendaSessionEvents(),'agenda');
  return{imported,updated,total:rows.length};
}

function importFinance(rows:ReportRow[]):ImportResult{
  const current=getFinanceSessionRecords();
  const next=[...current];
  let imported=0;
  let updated=0;

  rows.forEach((row,index)=>{
    const rowNumber=index+2;
    const description=required(row,'Descrição',rowNumber);
    const type=required(row,'Tipo',rowNumber);
    if(!FINANCE_TYPES.has(type as FinanceType))throw new Error(`Linha ${rowNumber}: tipo financeiro inválido.`);
    const category=required(row,'Categoria',rowNumber);
    const amount=parseAmount(required(row,'Valor',rowNumber),rowNumber);
    const date=required(row,'Data',rowNumber);
    if(!validDate(date))throw new Error(`Linha ${rowNumber}: data financeira inválida.`);
    const dueDate=text(row,'Vencimento');
    if(dueDate&&!validDate(dueDate))throw new Error(`Linha ${rowNumber}: vencimento inválido.`);
    const canonicalType=type as FinanceType;
    const status=financeStatus(canonicalType,text(row,'Status'),rowNumber);
    const existingIndex=next.findIndex(record=>normalize(record.description)===normalize(description)&&record.type===canonicalType&&record.date===date&&record.amount===amount);
    const previous=existingIndex>=0?next[existingIndex]:undefined;
    const record:FinanceRecord={
      id:previous?.id??newId('finance'),
      description,
      type:canonicalType,
      category,
      amount,
      date,
      dueDate,
      status,
      paymentMethod:previous?.paymentMethod??'',
      relatedName:previous?.relatedName??'',
      notes:previous?.notes??'',
    };
    if(existingIndex>=0){next[existingIndex]=record;updated+=1}else{next.push(record);imported+=1}
  });

  const saved=saveFinanceSessionRecords(next);
  assertPersisted(saved,getFinanceSessionRecords(),'transações financeiras');
  return{imported,updated,total:rows.length};
}

export function importReportRows(id:ReportDatasetId,rows:ReportRow[]):ImportResult{
  if(rows.length===0)throw new Error('O arquivo não possui linhas de dados para importar.');
  if(id==='contacts')return importCrm('contact',rows);
  if(id==='leads')return importCrm('lead',rows);
  if(id==='attendance')return importAttendance(rows);
  if(id==='tasks')return importTasks(rows);
  if(id==='agenda')return importAgenda(rows);
  return importFinance(rows);
}
