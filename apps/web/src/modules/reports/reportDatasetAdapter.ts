import type { CrmRecord } from '../crm/types';
import type { TaskPriority, TaskRecord, TaskStatus, RelatedType } from '../tasks/mocks/tasksMockProvider';
import type { AgendaEvent, AgendaStatus } from '../agenda/mocks/agendaMockProvider';
import type { FinanceRecord, FinanceStatus, FinanceType } from '../finance/types';
import { activeFinanceCategories } from '../finance/financeConfigStore';
import { getAttendanceConversationKind, type AttendanceConversation, type AttendanceMessage } from '../attendance/attendanceDomain';
import {
  getAgendaSessionEvents,
  getAttendanceSessionConversations,
  getCrmSessionRecords,
  getFinanceSessionRecords,
  getOperationalTeamMembers,
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

const CONTACT_COLUMNS=[
  'Nome completo','CPF','RG','Número do passaporte','Interesse / Serviço','Destino de interesse','Tipo de visto / Interesse','Relacionamento',
  'E-mail','Telefone','WhatsApp','Cidade','Estado','País','Status','Origem do contato','Responsável','Observações',
] as const;
const LEAD_COLUMNS=[
  'Nome completo','CPF','RG','Número do passaporte','Interesse / Serviço','Destino de interesse','Tipo de visto / Interesse','Origem',
  'E-mail','Telefone','WhatsApp','Cidade','Estado','País','Status do lead','Temperatura','Responsável','Próxima ação','Data da próxima ação','Observações',
] as const;
const ATTENDANCE_COLUMNS=['Nome do contato / lead','Canal','Telefone / usuário','Mensagem inicial'] as const;
const TASK_COLUMNS=['Título','Responsável','Tipo de vínculo','Contato / Lead relacionado','Prioridade','Status','Data','Horário','Lembrete','Descrição'] as const;
const AGENDA_COLUMNS=['Título','Tipo','Status','Data','Início','Fim','Local','Cidade','Tipo de vínculo','Contato / Lead / Cliente','Responsável','Observações'] as const;
const FINANCE_COLUMNS=['Descrição','Tipo','Categoria','Valor','Status','Data','Vencimento','Forma de pagamento','Cliente / contato relacionado','Observações'] as const;

export const REPORT_DATASET_COLUMNS:Record<ReportDatasetId,readonly string[]>={
  contacts:CONTACT_COLUMNS,
  leads:LEAD_COLUMNS,
  attendance:ATTENDANCE_COLUMNS,
  tasks:TASK_COLUMNS,
  agenda:AGENDA_COLUMNS,
  finance:FINANCE_COLUMNS,
};

const SERVICE_OPTIONS=['Assessoria para visto de turismo','Renovação de visto','Visto de estudante','Visto de trabalho','Visto de negócios','Outro'] as const;
const DESTINATION_OPTIONS=['Estados Unidos','Canadá','Outro'] as const;
const VISA_TYPE_OPTIONS=['B1/B2','F-1','J-1','H-1B','L-1','O-1','EB','Outro'] as const;
const SOURCE_OPTIONS=['Website','WhatsApp','Instagram','Facebook','Indicação','Google','Outro'] as const;
const RELATIONSHIP_OPTIONS=['Cliente','Parceiro','Outro'] as const;
const CONTACT_STATUS_OPTIONS=['Ativo','Inativo'] as const;
const LEAD_STATUS_OPTIONS=['Novo','Em contato','Qualificado','Não qualificado','Convertido','Perdido'] as const;
const LEAD_CREATE_STATUS_OPTIONS=['Novo','Em contato','Qualificado','Não qualificado','Perdido'] as const;
const TEMPERATURE_OPTIONS=['Frio','Morno','Quente'] as const;
const ATTENDANCE_CHANNELS=['WhatsApp','Instagram','Facebook','Website','E-mail'] as const;
const TASK_STATUSES=['Pendente','Em andamento','Concluída'] as const;
const TASK_PRIORITIES=['Baixa','Média','Alta'] as const;
const TASK_RELATED_TYPES=['Contato','Lead'] as const;
const TASK_REMINDERS=['Sem lembrete','15 minutos antes','30 minutos antes','1 hora antes','1 dia antes'] as const;
const AGENDA_TYPES=['Entrevista consular','Reunião','Follow-up','Prazo documental','Ligação','Outro'] as const;
const AGENDA_STATUSES=['Confirmado','Pendente','Realizado','Cancelado'] as const;
const AGENDA_RELATED_TYPES=['Cliente','Contato','Lead'] as const;
const FINANCE_TYPES=['Receita','Despesa'] as const;
const FINANCE_STATUSES=['Recebido','A receber','Pago','A pagar'] as const;
const PAYMENT_METHODS=['Pix','Cartão','Boleto','Transferência','Dinheiro','OFX'] as const;
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const TIME_RE=/^([01]\d|2[0-3]):[0-5]\d$/;

function normalize(value:string){return value.trim().toLocaleLowerCase('pt-BR')}
function normalizeDigits(value:string){return value.replace(/\D/g,'')}
function normalizePassport(value:string){return value.replace(/\s+/g,'').toLocaleUpperCase('pt-BR')}
function text(row:ReportRow,key:string){return String(row[key]??'').trim()}
function required(row:ReportRow,key:string,rowNumber:number){const value=text(row,key);if(!value)throw new Error(`Linha ${rowNumber}: “${key}” é obrigatório.`);return value}
function validDate(value:string){return DATE_RE.test(value)&&Number.isFinite(Date.parse(`${value}T12:00:00`))}
function nowIso(){return new Date().toISOString()}
function newId(prefix:string){return `${prefix}-${crypto.randomUUID()}`}
function timeNow(){return new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function assertPersisted<T>(expected:T[],actual:T[],label:string){if(JSON.stringify(expected)!==JSON.stringify(actual))throw new Error(`Não foi possível persistir a importação de ${label} neste navegador.`)}

function canonicalOption<const T extends readonly string[]>(value:string,options:T,fallback:T[number],label:string,rowNumber:number):T[number]{
 const clean=value.trim();if(!clean)return fallback;const canonical=options.find(option=>normalize(option)===normalize(clean));if(!canonical)throw new Error(`Linha ${rowNumber}: “${label}” possui valor inválido: ${clean}.`);return canonical;
}
function optionalOption<const T extends readonly string[]>(value:string,options:T,label:string,rowNumber:number){const clean=value.trim();if(!clean)return'';const canonical=options.find(option=>normalize(option)===normalize(clean));if(!canonical)throw new Error(`Linha ${rowNumber}: “${label}” possui valor inválido: ${clean}.`);return canonical}
function excelDate(value:string,label:string,rowNumber:number,requiredValue=false){
 const clean=value.trim();if(!clean){if(requiredValue)throw new Error(`Linha ${rowNumber}: “${label}” é obrigatório.`);return''}
 if(validDate(clean))return clean;
 const serial=Number(clean.replace(',','.'));if(Number.isFinite(serial)&&serial>=1&&serial<100000){const date=new Date(Date.UTC(1899,11,30)+Math.floor(serial)*86400000);return`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`}
 throw new Error(`Linha ${rowNumber}: “${label}” deve ser uma data válida.`);
}
function excelTime(value:string,label:string,rowNumber:number){
 const clean=value.trim();if(!clean)return'';if(TIME_RE.test(clean))return clean;
 const serial=Number(clean.replace(',','.'));if(Number.isFinite(serial)&&serial>=0&&serial<1){const minutes=Math.round(serial*1440)%1440;return`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`}
 throw new Error(`Linha ${rowNumber}: “${label}” deve ser um horário válido.`);
}
function parseAmount(value:string,rowNumber:number){const raw=value.replace(/R\$\s?/gi,'').trim();let normalized=raw;if(raw.includes(',')&&raw.includes('.'))normalized=raw.replace(/\./g,'').replace(',','.');else if(raw.includes(','))normalized=raw.replace(',','.');const amount=Number(normalized);if(!Number.isFinite(amount)||amount<=0)throw new Error(`Linha ${rowNumber}: “Valor” deve ser maior que zero.`);return amount}
function financeStatus(type:FinanceType,value:string,rowNumber:number):FinanceStatus{const fallback:FinanceStatus=type==='Receita'?'A receber':'A pagar';const status=canonicalOption(value,FINANCE_STATUSES,fallback,'Status',rowNumber) as FinanceStatus;const compatible=type==='Receita'?status==='Recebido'||status==='A receber':status==='Pago'||status==='A pagar';if(!compatible)throw new Error(`Linha ${rowNumber}: status “${status}” incompatível com ${type}.`);return status}
function financeCategory(type:FinanceType,value:string,previous:FinanceRecord|undefined,rowNumber:number){const active=activeFinanceCategories(type).map(item=>item.name);const clean=value.trim();if(!clean){if(previous?.type===type&&previous.category)return previous.category;const fallback=active[0];if(!fallback)throw new Error(`Linha ${rowNumber}: não existe categoria ativa para ${type}.`);return fallback}if(active.some(item=>normalize(item)===normalize(clean)))return active.find(item=>normalize(item)===normalize(clean))!;if(previous?.type===type&&normalize(previous.category)===normalize(clean))return previous.category;throw new Error(`Linha ${rowNumber}: categoria “${clean}” não está ativa para ${type}.`)}
function ownerSelection(value:string,rowNumber:number){const clean=value.trim();if(!clean)return{owner:'',ownerUserId:''};const matches=getOperationalTeamMembers().filter(member=>normalize(member.name)===normalize(clean)||normalize(member.email)===normalize(clean));if(matches.length!==1)throw new Error(`Linha ${rowNumber}: responsável “${clean}” não corresponde a um único usuário ativo.`);return{owner:matches[0].name,ownerUserId:matches[0].id}}
function crmRelationSelection(value:string,type:'Contato'|'Lead'|'Cliente',rowNumber:number,label:string){
 const clean=value.trim();if(!clean)return{relatedName:'',relatedRecordId:''};
 const candidates=getCrmSessionRecords().filter(record=>type==='Lead'?record.kind==='lead':type==='Cliente'?record.kind==='contact'&&record.relationship==='Cliente':record.kind==='contact');
 const matches=candidates.filter(record=>normalize(record.fullName)===normalize(clean)||normalize(record.email)===normalize(clean));
 if(matches.length!==1)throw new Error(`Linha ${rowNumber}: “${label}” (${clean}) não corresponde a um único registro ${type.toLowerCase()} no CRM.`);
 return{relatedName:matches[0].fullName,relatedRecordId:matches[0].id};
}
function financeRelationSelection(value:string,rowNumber:number){
 const clean=value.trim();if(!clean)return{relatedName:'',relatedRecordId:''};
 const matches=getCrmSessionRecords().filter(record=>record.kind==='contact'&&(normalize(record.fullName)===normalize(clean)||normalize(record.email)===normalize(clean)));
 if(matches.length!==1)throw new Error(`Linha ${rowNumber}: “Cliente / contato relacionado” (${clean}) não corresponde a um único contato/cliente no CRM.`);
 return{relatedName:matches[0].fullName,relatedRecordId:matches[0].id};
}
function crmIdentity(record:Pick<CrmRecord,'email'|'cpf'|'passportNumber'|'whatsapp'>){return{email:normalize(record.email),cpf:normalizeDigits(record.cpf),passport:normalizePassport(record.passportNumber),whatsapp:normalizeDigits(record.whatsapp)}}
function sameCrmIdentity(left:Pick<CrmRecord,'email'|'cpf'|'passportNumber'|'whatsapp'>,right:Pick<CrmRecord,'email'|'cpf'|'passportNumber'|'whatsapp'>){const a=crmIdentity(left);const b=crmIdentity(right);return Boolean((a.email&&a.email===b.email)||(a.cpf&&a.cpf===b.cpf)||(a.passport&&a.passport===b.passport)||(a.whatsapp&&a.whatsapp===b.whatsapp))}

export function getReportRows(id:ReportDatasetId):ReportRow[]{
 if(id==='contacts')return getCrmSessionRecords().filter(record=>record.kind==='contact').map(record=>({
  'Nome completo':record.fullName,'CPF':record.cpf,'RG':record.rg,'Número do passaporte':record.passportNumber,'Interesse / Serviço':record.interest??'','Destino de interesse':record.destination??'','Tipo de visto / Interesse':record.visaType??'','Relacionamento':record.relationship??'',
  'E-mail':record.email,'Telefone':record.phone,'WhatsApp':record.whatsapp,'Cidade':record.city,'Estado':record.state,'País':record.country,'Status':record.contactStatus??'','Origem do contato':record.source??'','Responsável':record.owner??'','Observações':record.notes,
 }));
 if(id==='leads')return getCrmSessionRecords().filter(record=>record.kind==='lead').map(record=>({
  'Nome completo':record.fullName,'CPF':record.cpf,'RG':record.rg,'Número do passaporte':record.passportNumber,'Interesse / Serviço':record.interest??'','Destino de interesse':record.destination??'','Tipo de visto / Interesse':record.visaType??'','Origem':record.source??'',
  'E-mail':record.email,'Telefone':record.phone,'WhatsApp':record.whatsapp,'Cidade':record.city,'Estado':record.state,'País':record.country,'Status do lead':record.leadStatus??'','Temperatura':record.temperature??'','Responsável':record.owner??'','Próxima ação':record.nextAction??'','Data da próxima ação':record.nextActionDate??'','Observações':record.notes,
 }));
 if(id==='attendance')return getAttendanceSessionConversations().filter(record=>getAttendanceConversationKind(record)==='customer').map(record=>({'Nome do contato / lead':record.customer,'Canal':record.channel,'Telefone / usuário':record.handle,'Mensagem inicial':record.messages[0]?.body??''}));
 if(id==='tasks')return getTaskSessionRecords().map(record=>({'Título':record.title,'Responsável':record.owner,'Tipo de vínculo':record.relatedType,'Contato / Lead relacionado':record.relatedName,'Prioridade':record.priority,'Status':record.status,'Data':record.dueDate,'Horário':record.dueTime,'Lembrete':record.reminder,'Descrição':record.description}));
 if(id==='agenda')return getAgendaSessionEvents().map(record=>({'Título':record.title,'Tipo':record.type,'Status':record.status,'Data':record.date,'Início':record.startTime,'Fim':record.endTime,'Local':record.location,'Cidade':record.city,'Tipo de vínculo':record.relatedType,'Contato / Lead / Cliente':record.relatedName,'Responsável':record.owner,'Observações':record.notes}));
 return getFinanceSessionRecords().map(record=>({'Descrição':record.description,'Tipo':record.type,'Categoria':record.category,'Valor':record.amount.toFixed(2).replace('.',','),'Status':record.status,'Data':record.date,'Vencimento':record.dueDate,'Forma de pagamento':record.paymentMethod,'Cliente / contato relacionado':record.relatedName,'Observações':record.notes}));
}

function importCrm(kind:'contact'|'lead',rows:ReportRow[]):ImportResult{
 const current=getCrmSessionRecords();const next=[...current];let imported=0;let updated=0;
 rows.forEach((row,index)=>{
  const rowNumber=index+2;const fullName=required(row,'Nome completo',rowNumber);const email=required(row,'E-mail',rowNumber);
  const identityCandidate={email,cpf:text(row,'CPF'),passportNumber:text(row,'Número do passaporte'),whatsapp:text(row,'WhatsApp')};
  const matches=next.map((record,recordIndex)=>({record,recordIndex})).filter(({record})=>sameCrmIdentity(identityCandidate,record));
  if(matches.length>1)throw new Error(`Linha ${rowNumber}: os identificadores informados correspondem a mais de um registro no CRM.`);
  const existingIndex=matches[0]?.recordIndex??-1;const previous=existingIndex>=0?next[existingIndex]:undefined;
  if(previous&&previous.kind!==kind)throw new Error(`Linha ${rowNumber}: os dados informados já pertencem a ${previous.kind==='lead'?'um lead':'um contato'}.`);
  const service=optionalOption(text(row,'Interesse / Serviço'),SERVICE_OPTIONS,'Interesse / Serviço',rowNumber);
  const destination=optionalOption(text(row,'Destino de interesse'),DESTINATION_OPTIONS,'Destino de interesse',rowNumber);
  const visaType=optionalOption(text(row,'Tipo de visto / Interesse'),VISA_TYPE_OPTIONS,'Tipo de visto / Interesse',rowNumber);
  const owner=ownerSelection(text(row,'Responsável'),rowNumber);const timestamp=nowIso();
  let base:CrmRecord;
  if(kind==='contact'){
   base={...(previous??{}),id:previous?.id??newId('contact'),kind,fullName,cpf:text(row,'CPF'),rg:text(row,'RG'),passportNumber:text(row,'Número do passaporte'),email,phone:text(row,'Telefone'),whatsapp:text(row,'WhatsApp'),city:text(row,'Cidade'),state:text(row,'Estado'),country:text(row,'País')||'Brasil',notes:text(row,'Observações'),createdAt:previous?.createdAt??timestamp,updatedAt:timestamp,relationship:canonicalOption(text(row,'Relacionamento'),RELATIONSHIP_OPTIONS,'Cliente','Relacionamento',rowNumber),contactStatus:canonicalOption(text(row,'Status'),CONTACT_STATUS_OPTIONS,'Ativo','Status',rowNumber),source:canonicalOption(text(row,'Origem do contato'),SOURCE_OPTIONS,'Website','Origem do contato',rowNumber),owner:owner.owner,ownerUserId:owner.ownerUserId,interest:service,destination,visaType};
  }else{
   const requestedStatus=canonicalOption(text(row,'Status do lead'),LEAD_STATUS_OPTIONS,'Novo','Status do lead',rowNumber);
   const convertedContactId=previous?.convertedContactId;
   if(convertedContactId&&text(row,'Status do lead')&&requestedStatus!=='Convertido')throw new Error(`Linha ${rowNumber}: lead convertido não pode ter o status alterado por importação.`);
   if(!convertedContactId&&requestedStatus==='Convertido')throw new Error(`Linha ${rowNumber}: “Convertido” só pode ser criado pelo fluxo de conversão do CRM.`);
   if(!convertedContactId&&!LEAD_CREATE_STATUS_OPTIONS.includes(requestedStatus as typeof LEAD_CREATE_STATUS_OPTIONS[number]))throw new Error(`Linha ${rowNumber}: status de lead inválido para criação.`);
   const nextActionDate=excelDate(text(row,'Data da próxima ação'),'Data da próxima ação',rowNumber,false);
   base={...(previous??{}),id:previous?.id??newId('lead'),kind,fullName,cpf:text(row,'CPF'),rg:text(row,'RG'),passportNumber:text(row,'Número do passaporte'),email,phone:text(row,'Telefone'),whatsapp:text(row,'WhatsApp'),city:text(row,'Cidade'),state:text(row,'Estado'),country:text(row,'País')||'Brasil',notes:text(row,'Observações'),createdAt:previous?.createdAt??timestamp,updatedAt:timestamp,source:canonicalOption(text(row,'Origem'),SOURCE_OPTIONS,'Website','Origem',rowNumber),owner:owner.owner,ownerUserId:owner.ownerUserId,interest:service,destination,visaType,leadStatus:convertedContactId?'Convertido':requestedStatus,temperature:canonicalOption(text(row,'Temperatura'),TEMPERATURE_OPTIONS,'Morno','Temperatura',rowNumber),nextAction:text(row,'Próxima ação'),nextActionDate,convertedContactId,convertedAt:previous?.convertedAt};
  }
  if(existingIndex>=0){next[existingIndex]=base;updated+=1}else{next.push(base);imported+=1}
 });
 const saved=saveCrmSessionRecords(next);assertPersisted(saved,getCrmSessionRecords(),kind==='contact'?'contatos':'leads');return{imported,updated,total:rows.length};
}

function importAttendance(rows:ReportRow[]):ImportResult{
 const current=getAttendanceSessionConversations();const next=[...current];let imported=0;let updated=0;const members=getOperationalTeamMembers();const currentMember=members.find(member=>member.role==='Administrador')??members[0];const currentAuthor=currentMember?.name??'Administrador';
 rows.forEach((row,index)=>{
  const rowNumber=index+2;const customer=required(row,'Nome do contato / lead',rowNumber);const handle=required(row,'Telefone / usuário',rowNumber);const channel=canonicalOption(text(row,'Canal'),ATTENDANCE_CHANNELS,'WhatsApp','Canal',rowNumber);const initialBody=text(row,'Mensagem inicial');
  const existingIndex=next.findIndex(record=>getAttendanceConversationKind(record)==='customer'&&normalize(record.handle)===normalize(handle)&&normalize(record.channel)===normalize(channel));const previous=existingIndex>=0?next[existingIndex]:undefined;const now=timeNow();const timestamp=nowIso();
  if(previous&&previous.kind!=='team'){
   const updatedConversation:AttendanceConversation={...previous,kind:'customer',customer,handle,channel,updatedAt:timestamp};
   next[existingIndex]=updatedConversation;updated+=1;return;
  }
  const initialMessage:AttendanceMessage[]=initialBody?[{id:crypto.randomUUID(),sender:'agent',author:currentAuthor,body:initialBody,time:now,visibility:'external',deliveryStatus:'local'}]:[];
  const record:AttendanceConversation={id:newId('attendance'),kind:'customer',customer,handle,email:'',channel,status:'Em atendimento',assignee:currentAuthor,queue:'Atendimento',protocol:`VF-${Date.now().toString(36).toUpperCase()}-${index+1}`,tags:[],priority:'Normal',lastMessage:initialBody||'Conversa iniciada',lastMessageAt:now,updatedAt:timestamp,unread:0,crmType:'Contato',service:'',destination:'',visaType:'',messages:initialMessage};next.push(record);imported+=1;
 });
 const saved=saveAttendanceSessionConversations(next);assertPersisted(saved,getAttendanceSessionConversations(),'atendimentos');return{imported,updated,total:rows.length};
}

function importTasks(rows:ReportRow[]):ImportResult{
 const current=getTaskSessionRecords();const next=[...current];let imported=0;let updated=0;
 rows.forEach((row,index)=>{
  const rowNumber=index+2;const title=required(row,'Título',rowNumber);const relatedType=canonicalOption(text(row,'Tipo de vínculo'),TASK_RELATED_TYPES,'Contato','Tipo de vínculo',rowNumber) as RelatedType;const relation=crmRelationSelection(text(row,'Contato / Lead relacionado'),relatedType,rowNumber,'Contato / Lead relacionado');const priority=canonicalOption(text(row,'Prioridade'),TASK_PRIORITIES,'Média','Prioridade',rowNumber) as TaskPriority;const status=canonicalOption(text(row,'Status'),TASK_STATUSES,'Pendente','Status',rowNumber) as TaskStatus;const dueDate=excelDate(text(row,'Data'),'Data',rowNumber,false);const dueTime=dueDate?excelTime(text(row,'Horário'),'Horário',rowNumber):'';const reminder=dueDate?canonicalOption(text(row,'Lembrete'),TASK_REMINDERS,'Sem lembrete','Lembrete',rowNumber):'Sem lembrete';if(!dueDate&&(text(row,'Horário')||text(row,'Lembrete')))throw new Error(`Linha ${rowNumber}: Horário e Lembrete exigem uma Data.`);const owner=ownerSelection(text(row,'Responsável'),rowNumber);const description=text(row,'Descrição');
  const existingIndex=next.findIndex(record=>normalize(record.title)===normalize(title)&&record.relatedType===relatedType&&normalize(record.relatedName)===normalize(relation.relatedName)&&record.dueDate===dueDate&&record.dueTime===dueTime);const previous=existingIndex>=0?next[existingIndex]:undefined;const timestamp=nowIso();const record:TaskRecord={id:previous?.id??newId('task'),title,description,relatedType,relatedName:relation.relatedName,relatedRecordId:relation.relatedRecordId,owner:owner.owner,ownerUserId:owner.ownerUserId,priority,status,dueDate,dueTime,reminder,createdAt:previous?.createdAt??timestamp,updatedAt:timestamp};if(existingIndex>=0){next[existingIndex]=record;updated+=1}else{next.push(record);imported+=1}
 });
 const saved=saveTaskSessionRecords(next);assertPersisted(saved,getTaskSessionRecords(),'tarefas');return{imported,updated,total:rows.length};
}

function importAgenda(rows:ReportRow[]):ImportResult{
 const current=getAgendaSessionEvents();const next=[...current];let imported=0;let updated=0;
 rows.forEach((row,index)=>{
  const rowNumber=index+2;const title=required(row,'Título',rowNumber);const type=canonicalOption(text(row,'Tipo'),AGENDA_TYPES,'Reunião','Tipo',rowNumber);const status=canonicalOption(text(row,'Status'),AGENDA_STATUSES,'Pendente','Status',rowNumber) as AgendaStatus;const date=excelDate(text(row,'Data'),'Data',rowNumber,true);const startTime=excelTime(text(row,'Início'),'Início',rowNumber);const endTime=excelTime(text(row,'Fim'),'Fim',rowNumber);if(startTime&&endTime&&endTime<=startTime)throw new Error(`Linha ${rowNumber}: o horário final deve ser posterior ao horário inicial.`);const relatedType=canonicalOption(text(row,'Tipo de vínculo'),AGENDA_RELATED_TYPES,'Cliente','Tipo de vínculo',rowNumber) as AgendaEvent['relatedType'];const relation=crmRelationSelection(text(row,'Contato / Lead / Cliente'),relatedType,rowNumber,'Contato / Lead / Cliente');const owner=ownerSelection(text(row,'Responsável'),rowNumber);
  const existingIndex=next.findIndex(record=>normalize(record.title)===normalize(title)&&record.date===date&&record.startTime===startTime);const previous=existingIndex>=0?next[existingIndex]:undefined;const record:AgendaEvent={id:previous?.id??newId('agenda'),title,type,status,date,startTime,endTime,location:text(row,'Local'),city:text(row,'Cidade'),relatedType,relatedName:relation.relatedName,relatedRecordId:relation.relatedRecordId,owner:owner.owner,ownerUserId:owner.ownerUserId,notes:text(row,'Observações')};if(existingIndex>=0){next[existingIndex]=record;updated+=1}else{next.push(record);imported+=1}
 });
 const saved=saveAgendaSessionEvents(next);assertPersisted(saved,getAgendaSessionEvents(),'agenda');return{imported,updated,total:rows.length};
}

function importFinance(rows:ReportRow[]):ImportResult{
 const current=getFinanceSessionRecords();const next=[...current];let imported=0;let updated=0;
 rows.forEach((row,index)=>{
  const rowNumber=index+2;const description=required(row,'Descrição',rowNumber);const type=canonicalOption(text(row,'Tipo'),FINANCE_TYPES,'Receita','Tipo',rowNumber) as FinanceType;const amount=parseAmount(required(row,'Valor',rowNumber),rowNumber);const date=excelDate(text(row,'Data'),'Data',rowNumber,true);const dueDate=excelDate(text(row,'Vencimento'),'Vencimento',rowNumber,false);if(dueDate&&dueDate<date)throw new Error(`Linha ${rowNumber}: o vencimento não pode ser anterior à data da transação.`);const existingIndex=next.findIndex(record=>normalize(record.description)===normalize(description)&&record.type===type&&record.date===date&&record.amount===amount);const previous=existingIndex>=0?next[existingIndex]:undefined;const category=financeCategory(type,text(row,'Categoria'),previous,rowNumber);const status=financeStatus(type,text(row,'Status'),rowNumber);const paymentMethod=canonicalOption(text(row,'Forma de pagamento'),PAYMENT_METHODS,'Pix','Forma de pagamento',rowNumber);const relation=financeRelationSelection(text(row,'Cliente / contato relacionado'),rowNumber);const record:FinanceRecord={id:previous?.id??newId('finance'),description,type,category,amount,date,dueDate,status,paymentMethod,relatedName:relation.relatedName,relatedRecordId:relation.relatedRecordId,notes:text(row,'Observações')};if(existingIndex>=0){next[existingIndex]=record;updated+=1}else{next.push(record);imported+=1}
 });
 const saved=saveFinanceSessionRecords(next);assertPersisted(saved,getFinanceSessionRecords(),'transações financeiras');return{imported,updated,total:rows.length};
}

export function importReportRows(id:ReportDatasetId,rows:ReportRow[]):ImportResult{
 if(rows.length===0)throw new Error('O arquivo XLSX não possui linhas de dados para importar.');
 if(id==='contacts')return importCrm('contact',rows);
 if(id==='leads')return importCrm('lead',rows);
 if(id==='attendance')return importAttendance(rows);
 if(id==='tasks')return importTasks(rows);
 if(id==='agenda')return importAgenda(rows);
 return importFinance(rows);
}
