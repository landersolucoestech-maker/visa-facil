import { readSessionRecords, writeSessionRecords } from '../../shared/sessionRecords';
import type { ContractAuditEvent, ContractRecord, ContractSigner, ContractTemplate, ContractVariableDefinition, ContractVersion } from './contractTypes';
import { makePlaceholder } from './contractTemplateEngine';

const KEYS={
 contracts:'visa-facil.session.contracts.v3',
 templates:'visa-facil.session.contract-templates.v3',
 variables:'visa-facil.session.contract-variables.v2',
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
function stableId(seed:string){return `builtin-${seed}`}
function variable(seed:string,group:string,field:string,label:string,type:ContractVariableDefinition['type']='text',required=false,description=''):ContractVariableDefinition{const stamp='2026-08-25T00:00:00.000Z';return{id:stableId(seed),group,field,placeholder:makePlaceholder(group,field),label,type,required,description,createdAt:stamp,updatedAt:stamp}}

function defaultVariables():ContractVariableDefinition[]{return[
 variable('empresa-nome','EMPRESA','NOME_FANTASIA','Nome fantasia da empresa','text',true),
 variable('cliente-nome','CLIENTE','NOME','Nome completo do cliente','text',true),
 variable('cliente-cpf','CLIENTE','CPF','CPF do cliente','cpf'),
 variable('cliente-rg','CLIENTE','RG','RG do cliente'),
 variable('cliente-passaporte','CLIENTE','PASSAPORTE','Número do passaporte','passport'),
 variable('cliente-email','CLIENTE','EMAIL','E-mail do cliente','email'),
 variable('cliente-telefone','CLIENTE','TELEFONE','Telefone do cliente'),
 variable('cliente-whatsapp','CLIENTE','WHATSAPP','WhatsApp do cliente'),
 variable('cliente-cidade','CLIENTE','CIDADE','Cidade do cliente'),
 variable('cliente-estado','CLIENTE','ESTADO','Estado do cliente'),
 variable('cliente-pais','CLIENTE','PAIS','País do cliente'),
 variable('processo-destino','PROCESSO','DESTINO','País de destino','text',true),
 variable('processo-visto','PROCESSO','TIPO_VISTO','Tipo de visto','text',true),
 variable('processo-servico','PROCESSO','SERVICO','Descrição do serviço','textarea',true),
 variable('contrato-titulo','CONTRATO','TITULO','Título do contrato','text',true),
 variable('contrato-valor','CONTRATO','VALOR','Valor do contrato','currency'),
 variable('contrato-inicio','CONTRATO','DATA_INICIO','Data de início','date',true),
 variable('contrato-fim','CONTRATO','DATA_FIM','Data de término','date'),
 variable('contrato-observacoes','CONTRATO','OBSERVACOES','Observações','textarea'),
]}

function defaultTemplates():ContractTemplate[]{const stamp='2026-08-25T00:00:00.000Z';return[{
 id:stableId('template-assessoria'),
 name:'Contrato de Assessoria de Visto',
 description:'Modelo-base adaptável para prestação de assessoria em processo de visto.',
 active:true,
 content:`CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSESSORIA\n\nCONTRATADA: {{EMPRESA.NOME_FANTASIA}}.\nCONTRATANTE: {{CLIENTE.NOME}}, CPF {{CLIENTE.CPF}}, documento de viagem {{CLIENTE.PASSAPORTE}}, e-mail {{CLIENTE.EMAIL}}.\n\nOBJETO\nA CONTRATADA prestará os seguintes serviços: {{PROCESSO.SERVICO}}, relacionados ao processo de {{PROCESSO.TIPO_VISTO}} com destino a {{PROCESSO.DESTINO}}.\n\nVALOR E VIGÊNCIA\nValor contratado: {{CONTRATO.VALOR}}. Início: {{CONTRATO.DATA_INICIO}}. Término previsto: {{CONTRATO.DATA_FIM}}.\n\nOBSERVAÇÕES\n{{CONTRATO.OBSERVACOES}}\n\nAs condições específicas, responsabilidades, limites do serviço e demais cláusulas devem ser revisadas e ajustadas antes do envio para assinatura.`,
 createdAt:stamp,
 updatedAt:stamp,
}]}

export function getContractRecords(){return readSessionRecords<ContractRecord>(KEYS.contracts,()=>[],isContractRecord)}
export function saveContractRecords(records:ContractRecord[]){return writeSessionRecords(KEYS.contracts,records,isContractRecord)}
export function getContractTemplates(){return readSessionRecords<ContractTemplate>(KEYS.templates,defaultTemplates,isContractTemplate)}
export function saveContractTemplates(records:ContractTemplate[]){return writeSessionRecords(KEYS.templates,records,isContractTemplate)}
export function getContractVariables(){return readSessionRecords<ContractVariableDefinition>(KEYS.variables,defaultVariables,isContractVariable)}
export function saveContractVariables(records:ContractVariableDefinition[]){return writeSessionRecords(KEYS.variables,records,isContractVariable)}

export function createAudit(type:ContractAuditEvent['type'],label:string,detail?:string):ContractAuditEvent{return{id:crypto.randomUUID(),type,label,detail,createdAt:now()}}
export function createVersion(label:string,content:string,note:string):ContractVersion{return{id:crypto.randomUUID(),label,content,note,createdAt:now()}}
