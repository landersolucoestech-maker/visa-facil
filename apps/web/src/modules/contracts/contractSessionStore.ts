import { readSessionRecords, writeSessionRecords } from '../../shared/sessionRecords';
import type { ContractAuditEvent, ContractRecord, ContractSigner, ContractTemplate, ContractVariableDefinition, ContractVersion } from './contractTypes';
import { getContractMockTemplates, getContractMockVariables } from './mocks/contractsMockProvider';

const KEYS={
 contracts:'visa-facil.session.contracts.v3',
 templates:'visa-facil.session.contract-templates.v4',
 variables:'visa-facil.session.contract-variables.v3',
} as const;

function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function isString(value:unknown):value is string{return typeof value==='string'}
function isBoolean(value:unknown):value is boolean{return typeof value==='boolean'}
function isStringRecord(value:unknown):value is Record<string,string>{return isRecord(value)&&Object.values(value).every(isString)}
function uniqueIds(records:Array<{id:string}>){return new Set(records.map(item=>item.id)).size===records.length}

const CONTRACT_STATUSES=new Set(['draft','review','awaiting_signature','signed','active','expired','terminated','cancelled']);
const SIGNATURE_STATES=new Set(['not_sent','pending','partially_signed','signed','rejected','expired','cancelled']);
const SIGNER_STATES=new Set(['pending','signed','rejected','expired']);
const VARIABLE_TYPES=new Set(['text','textarea','number','date','currency','email','cpf','passport']);
const AUDIT_TYPES=new Set(['created','updated','status_changed','signature_sent','signature_event','cancelled']);

function isSigner(value:unknown):value is ContractSigner{return isRecord(value)&&isString(value.id)&&isString(value.name)&&isString(value.email)&&isString(value.role)&&isBoolean(value.required)&&typeof value.order==='number'&&typeof value.status==='string'&&SIGNER_STATES.has(value.status)&&(value.signedAt===undefined||isString(value.signedAt))}
function isVersion(value:unknown):value is ContractVersion{return isRecord(value)&&isString(value.id)&&isString(value.label)&&isString(value.content)&&isString(value.note)&&isString(value.createdAt)}
function isAudit(value:unknown):value is ContractAuditEvent{return isRecord(value)&&isString(value.id)&&typeof value.type==='string'&&AUDIT_TYPES.has(value.type)&&isString(value.label)&&(value.detail===undefined||isString(value.detail))&&isString(value.createdAt)}
function isParty(value:unknown){return isRecord(value)&&isString(value.id)&&typeof value.role==='string'&&['client','representative','witness','other'].includes(value.role)&&typeof value.source==='string'&&['crm','manual'].includes(value.source)&&(value.crmRecordId===undefined||isString(value.crmRecordId))&&['name','cpf','rg','passportNumber','email','phone'].every(key=>isString(value[key]))}

export function isContractRecord(value:unknown):value is ContractRecord{
 if(!isRecord(value)||!isString(value.id)||!isString(value.title)||!isString(value.templateId)||typeof value.status!=='string'||!CONTRACT_STATUSES.has(value.status))return false;
 if(value.clientId!==undefined&&!isString(value.clientId))return false;
 if(!['serviceDescription','destination','visaType','startDate','endDate','notes','templateSnapshot','documentContent','createdAt','updatedAt'].every(key=>isString(value[key])))return false;
 if(typeof value.value!=='number'||!Number.isFinite(value.value)||value.value<0)return false;
 if(!Array.isArray(value.parties)||!value.parties.every(isParty)||!uniqueIds(value.parties as Array<{id:string}>))return false;
 if(!Array.isArray(value.signers)||!value.signers.every(isSigner)||!uniqueIds(value.signers as ContractSigner[]))return false;
 if(!isStringRecord(value.variableValues))return false;
 if(!(value.signatureProvider===null||value.signatureProvider==='autentique')||typeof value.signatureState!=='string'||!SIGNATURE_STATES.has(value.signatureState))return false;
 if(value.externalDocumentId!==undefined&&!isString(value.externalDocumentId))return false;
 if(value.signedAt!==undefined&&!isString(value.signedAt))return false;
 if(!Array.isArray(value.versions)||!value.versions.every(isVersion)||!uniqueIds(value.versions as ContractVersion[]))return false;
 return Array.isArray(value.audit)&&value.audit.every(isAudit)&&uniqueIds(value.audit as ContractAuditEvent[]);
}

export function isContractTemplate(value:unknown):value is ContractTemplate{return isRecord(value)&&isString(value.id)&&isString(value.name)&&isString(value.description)&&isString(value.content)&&isBoolean(value.active)&&isString(value.createdAt)&&isString(value.updatedAt)}
export function isContractVariable(value:unknown):value is ContractVariableDefinition{return isRecord(value)&&isString(value.id)&&isString(value.group)&&isString(value.field)&&isString(value.placeholder)&&isString(value.label)&&typeof value.type==='string'&&VARIABLE_TYPES.has(value.type)&&isBoolean(value.required)&&isString(value.description)&&isString(value.createdAt)&&isString(value.updatedAt)}

function now(){return new Date().toISOString()}

export function getContractRecords(){return readSessionRecords<ContractRecord>(KEYS.contracts,()=>[],isContractRecord)}
export function saveContractRecords(records:ContractRecord[]){return writeSessionRecords(KEYS.contracts,records,isContractRecord)}
export function getContractTemplates(){return readSessionRecords<ContractTemplate>(KEYS.templates,getContractMockTemplates,isContractTemplate)}
export function saveContractTemplates(records:ContractTemplate[]){return writeSessionRecords(KEYS.templates,records,isContractTemplate)}
export function getContractVariables(){return readSessionRecords<ContractVariableDefinition>(KEYS.variables,getContractMockVariables,isContractVariable)}
export function saveContractVariables(records:ContractVariableDefinition[]){return writeSessionRecords(KEYS.variables,records,isContractVariable)}

export function createAudit(type:ContractAuditEvent['type'],label:string,detail?:string):ContractAuditEvent{return{id:crypto.randomUUID(),type,label,detail,createdAt:now()}}
export function createVersion(label:string,content:string,note:string):ContractVersion{return{id:crypto.randomUUID(),label,content,note,createdAt:now()}}
