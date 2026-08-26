import raw from '../../../mocks/contracts/contracts.dev.json';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';
import type { ContractTemplate, ContractVariableDefinition, ContractVariableType } from '../contractTypes';

const VARIABLE_TYPES = new Set<ContractVariableType>(['text','textarea','number','date','currency','email','cpf','passport']);
const PLACEHOLDER_RE=/^\{\{[A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*\}\}$/;

function isObject(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function isText(value:unknown):value is string{return typeof value==='string'}
function uniqueById<T extends {id:string}>(records:T[]){const seen=new Set<string>();return records.filter(record=>{if(seen.has(record.id))return false;seen.add(record.id);return true})}

function isTemplate(value:unknown):value is ContractTemplate{
 return isObject(value)
  && typeof value.id==='string'&&value.id.trim().length>0
  && typeof value.name==='string'&&value.name.trim().length>0
  && isText(value.description)
  && typeof value.content==='string'&&value.content.trim().length>0
  && typeof value.active==='boolean'
  && typeof value.createdAt==='string'&&Number.isFinite(Date.parse(value.createdAt))
  && typeof value.updatedAt==='string'&&Number.isFinite(Date.parse(value.updatedAt));
}

function isVariable(value:unknown):value is ContractVariableDefinition{
 return isObject(value)
  && typeof value.id==='string'&&value.id.trim().length>0
  && typeof value.group==='string'&&value.group.trim().length>0
  && typeof value.field==='string'&&value.field.trim().length>0
  && typeof value.placeholder==='string'&&PLACEHOLDER_RE.test(value.placeholder)
  && typeof value.label==='string'&&value.label.trim().length>0
  && typeof value.type==='string'&&VARIABLE_TYPES.has(value.type as ContractVariableType)
  && typeof value.required==='boolean'
  && isText(value.description)
  && typeof value.createdAt==='string'&&Number.isFinite(Date.parse(value.createdAt))
  && typeof value.updatedAt==='string'&&Number.isFinite(Date.parse(value.updatedAt));
}

function fixture(){const clone:unknown=structuredClone(raw);return isObject(clone)?clone:undefined}

export function getContractMockTemplates():ContractTemplate[]{
 if(!isMockDataEnabled())return[];
 const source=fixture();
 if(!source||!Array.isArray(source.templates))return[];
 return uniqueById(source.templates.filter(isTemplate));
}

export function getContractMockVariables():ContractVariableDefinition[]{
 if(!isMockDataEnabled())return[];
 const source=fixture();
 if(!source||!Array.isArray(source.variables))return[];
 return uniqueById(source.variables.filter(isVariable));
}
