import type { CrmRecord } from '../crm/types';
import type { ContractEditorDraft, ContractRecord, ContractTemplate } from './contractTypes';

const PLACEHOLDER_RE=/\{\{([A-Z][A-Z0-9_]*)\.([A-Z][A-Z0-9_]*)\}\}/g;
const EXACT_PLACEHOLDER_RE=/^\{\{([A-Z][A-Z0-9_]*)\.([A-Z][A-Z0-9_]*)\}\}$/;
const SYSTEM_PLACEHOLDERS=new Set([
 '{{EMPRESA.NOME_FANTASIA}}','{{CONTRATO.TITULO}}','{{CONTRATO.VALOR}}','{{CONTRATO.DATA_INICIO}}','{{CONTRATO.DATA_FIM}}','{{CONTRATO.OBSERVACOES}}',
 '{{PROCESSO.DESTINO}}','{{PROCESSO.TIPO_VISTO}}','{{PROCESSO.SERVICO}}','{{CLIENTE.NOME}}','{{CLIENTE.CPF}}','{{CLIENTE.RG}}','{{CLIENTE.PASSAPORTE}}','{{CLIENTE.EMAIL}}','{{CLIENTE.TELEFONE}}','{{CLIENTE.WHATSAPP}}','{{CLIENTE.CIDADE}}','{{CLIENTE.ESTADO}}','{{CLIENTE.PAIS}}',
]);

export function normalizePlaceholderPart(value:string){return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').toUpperCase()}
export function makePlaceholder(group:string,field:string){return `{{${normalizePlaceholderPart(group)}.${normalizePlaceholderPart(field)}}}`}
export function isContractPlaceholder(value:string){return EXACT_PLACEHOLDER_RE.test(value)}
export function isSystemContractPlaceholder(value:string){return SYSTEM_PLACEHOLDERS.has(value)}

export function extractTemplatePlaceholders(content:string){
 const found:string[]=[];
 const seen=new Set<string>();
 for(const match of content.matchAll(PLACEHOLDER_RE)){
  const token=match[0];
  if(!seen.has(token)){seen.add(token);found.push(token)}
 }
 return found;
}

export function resolveTemplateContent(content:string,values:Record<string,string>){
 return content.replace(PLACEHOLDER_RE,(token)=>values[token]?.trim()||token);
}

export function unresolvedTemplatePlaceholders(content:string){return extractTemplatePlaceholders(content)}

function money(value:number){return value>0?value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):''}
function date(value:string){if(!value)return'';const parsed=new Date(`${value}T12:00:00`);return Number.isNaN(parsed.getTime())?value:parsed.toLocaleDateString('pt-BR')}

export function systemVariableValues(draft:ContractEditorDraft,client?:CrmRecord){
 const values:Record<string,string>={
  '{{EMPRESA.NOME_FANTASIA}}':'Visa Fácil',
  '{{CONTRATO.TITULO}}':draft.title,
  '{{CONTRATO.VALOR}}':money(draft.value),
  '{{CONTRATO.DATA_INICIO}}':date(draft.startDate),
  '{{CONTRATO.DATA_FIM}}':date(draft.endDate),
  '{{CONTRATO.OBSERVACOES}}':draft.notes,
  '{{PROCESSO.DESTINO}}':draft.destination,
  '{{PROCESSO.TIPO_VISTO}}':draft.visaType,
  '{{PROCESSO.SERVICO}}':draft.serviceDescription,
 };
 if(client){
  values['{{CLIENTE.NOME}}']=client.fullName;
  values['{{CLIENTE.CPF}}']=client.cpf;
  values['{{CLIENTE.RG}}']=client.rg;
  values['{{CLIENTE.PASSAPORTE}}']=client.passportNumber;
  values['{{CLIENTE.EMAIL}}']=client.email;
  values['{{CLIENTE.TELEFONE}}']=client.phone;
  values['{{CLIENTE.WHATSAPP}}']=client.whatsapp;
  values['{{CLIENTE.CIDADE}}']=client.city;
  values['{{CLIENTE.ESTADO}}']=client.state;
  values['{{CLIENTE.PAIS}}']=client.country;
 }
 return values;
}

export function mergedVariableValues(draft:ContractEditorDraft,client?:CrmRecord){return{...draft.variableValues,...systemVariableValues(draft,client)}}
export function previewContractTemplate(template:ContractTemplate,draft:ContractEditorDraft,client?:CrmRecord){return resolveTemplateContent(template.content,mergedVariableValues(draft,client))}

export function nextVersionLabel(record?:ContractRecord){
 if(!record||record.versions.length===0)return'1.0';
 const last=record.versions[record.versions.length-1]?.label??'1.0';
 const [majorRaw,minorRaw]=last.split('.');
 const major=Number.parseInt(majorRaw??'1',10);
 const minor=Number.parseInt(minorRaw??'0',10);
 return `${Number.isFinite(major)?major:1}.${(Number.isFinite(minor)?minor:0)+1}`;
}
