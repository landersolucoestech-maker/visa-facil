import type { FinanceType } from '../finance/types';
import { getFinanceCategories, getFinanceRules, saveFinanceCategories, saveFinanceRules, type FinanceCategory, type FinanceRule } from '../finance/financeConfigStore';
import { getContractTemplates, getContractVariables, saveContractTemplates, saveContractVariables } from '../contracts/contractSessionStore';
import { makePlaceholder, normalizePlaceholderPart } from '../contracts/contractTemplateEngine';
import type { ContractTemplate, ContractVariableDefinition, ContractVariableType } from '../contracts/contractTypes';
import type { ImportResult, ReportRow } from './reportDatasetAdapter';

export type ConfigurationReportDatasetId='financeCategories'|'financeRules'|'contractTemplates'|'contractVariables';

const FINANCE_CATEGORY_COLUMNS=['Nome','Tipo','Status'] as const;
const FINANCE_RULE_COLUMNS=['Descrição contém','Tipo','Categoria','Status'] as const;
const CONTRACT_TEMPLATE_COLUMNS=['Nome','Descrição','Conteúdo do documento','Template ativo e disponível no wizard'] as const;
const CONTRACT_VARIABLE_COLUMNS=['Nome amigável','Tipo','Grupo','Campo','Descrição','Obrigatória para revisão'] as const;

export const CONFIGURATION_REPORT_DATASET_COLUMNS:Record<ConfigurationReportDatasetId,readonly string[]>={
 financeCategories:FINANCE_CATEGORY_COLUMNS,
 financeRules:FINANCE_RULE_COLUMNS,
 contractTemplates:CONTRACT_TEMPLATE_COLUMNS,
 contractVariables:CONTRACT_VARIABLE_COLUMNS,
};

const CONFIGURATION_IDS=new Set<ConfigurationReportDatasetId>(['financeCategories','financeRules','contractTemplates','contractVariables']);
const FINANCE_TYPES=['Receita','Despesa'] as const;
const VARIABLE_TYPE_LABELS:Record<ContractVariableType,string>={text:'Texto',textarea:'Texto longo',number:'Número',date:'Data',currency:'Moeda',email:'E-mail',cpf:'CPF',passport:'Passaporte'};

function normalize(value:string){return value.trim().toLocaleLowerCase('pt-BR')}
function text(row:ReportRow,key:string){return String(row[key]??'').trim()}
function required(row:ReportRow,key:string,rowNumber:number){const value=text(row,key);if(!value)throw new Error(`Linha ${rowNumber}: “${key}” é obrigatório.`);return value}
function nowIso(){return new Date().toISOString()}
function assertPersisted<T>(expected:T[],actual:T[],label:string){if(JSON.stringify(expected)!==JSON.stringify(actual))throw new Error(`Não foi possível persistir a importação de ${label} neste navegador.`)}
function uniqueRowKey(seen:Set<string>,key:string,rowNumber:number,label:string){if(seen.has(key))throw new Error(`Linha ${rowNumber}: ${label} duplicado no mesmo XLSX.`);seen.add(key)}
function financeType(value:string,rowNumber:number):FinanceType{const match=FINANCE_TYPES.find(item=>normalize(item)===normalize(value));if(!match)throw new Error(`Linha ${rowNumber}: “Tipo” deve ser Receita ou Despesa.`);return match}
function financeStatus(value:string,rowNumber:number){const clean=normalize(value);if(clean==='ativa')return true;if(clean==='inativa')return false;throw new Error(`Linha ${rowNumber}: “Status” deve ser Ativa ou Inativa.`)}
function yesNo(value:string,label:string,rowNumber:number){const clean=normalize(value);if(['sim','true','1','ativo','ativa'].includes(clean))return true;if(['não','nao','false','0','inativo','inativa'].includes(clean))return false;throw new Error(`Linha ${rowNumber}: “${label}” deve ser Sim ou Não.`)}
function variableType(value:string,rowNumber:number):ContractVariableType{const clean=normalize(value);const match=(Object.entries(VARIABLE_TYPE_LABELS) as Array<[ContractVariableType,string]>).find(([key,label])=>normalize(label)===clean||normalize(key)===clean);if(!match)throw new Error(`Linha ${rowNumber}: “Tipo” da variável é inválido.`);return match[0]}

export function isConfigurationReportDatasetId(id:string):id is ConfigurationReportDatasetId{return CONFIGURATION_IDS.has(id as ConfigurationReportDatasetId)}

export function getConfigurationReportRows(id:ConfigurationReportDatasetId):ReportRow[]{
 if(id==='financeCategories')return getFinanceCategories().map(item=>({'Nome':item.name,'Tipo':item.type,'Status':item.active?'Ativa':'Inativa'}));
 if(id==='financeRules')return getFinanceRules().map(item=>({'Descrição contém':item.contains,'Tipo':item.type,'Categoria':item.category,'Status':item.active?'Ativa':'Inativa'}));
 if(id==='contractTemplates')return getContractTemplates().map(item=>({'Nome':item.name,'Descrição':item.description,'Conteúdo do documento':item.content,'Template ativo e disponível no wizard':item.active?'Sim':'Não'}));
 return getContractVariables().map(item=>({'Nome amigável':item.label,'Tipo':VARIABLE_TYPE_LABELS[item.type],'Grupo':item.group,'Campo':item.field,'Descrição':item.description,'Obrigatória para revisão':item.required?'Sim':'Não'}));
}

function importFinanceCategories(rows:ReportRow[]):ImportResult{
 const current=getFinanceCategories();const next=[...current];const seen=new Set<string>();let imported=0;let updated=0;
 rows.forEach((row,index)=>{const rowNumber=index+2;const name=required(row,'Nome',rowNumber);const type=financeType(required(row,'Tipo',rowNumber),rowNumber);const active=financeStatus(required(row,'Status',rowNumber),rowNumber);const key=`${type}::${normalize(name)}`;uniqueRowKey(seen,key,rowNumber,'categoria financeira');const existingIndex=next.findIndex(item=>item.type===type&&normalize(item.name)===normalize(name));const previous=existingIndex>=0?next[existingIndex]:undefined;const record:FinanceCategory={id:previous?.id??crypto.randomUUID(),name:name.trim(),type,active};if(existingIndex>=0){next[existingIndex]=record;updated+=1}else{next.push(record);imported+=1}});
 saveFinanceCategories(next);assertPersisted(next,getFinanceCategories(),'categorias financeiras');return{imported,updated,total:rows.length};
}

function importFinanceRules(rows:ReportRow[]):ImportResult{
 const current=getFinanceRules();const next=[...current];const categories=getFinanceCategories();const seen=new Set<string>();let imported=0;let updated=0;
 rows.forEach((row,index)=>{const rowNumber=index+2;const contains=required(row,'Descrição contém',rowNumber);const type=financeType(required(row,'Tipo',rowNumber),rowNumber);const categoryName=required(row,'Categoria',rowNumber);const active=financeStatus(required(row,'Status',rowNumber),rowNumber);const key=`${type}::${normalize(contains)}`;uniqueRowKey(seen,key,rowNumber,'regra financeira');const existingIndex=next.findIndex(item=>item.type===type&&normalize(item.contains)===normalize(contains));const previous=existingIndex>=0?next[existingIndex]:undefined;const category=categories.find(item=>item.type===type&&normalize(item.name)===normalize(categoryName));if(!category)throw new Error(`Linha ${rowNumber}: a categoria “${categoryName}” não existe para ${type}.`);if(!category.active&&normalize(previous?.category??'')!==normalize(category.name))throw new Error(`Linha ${rowNumber}: a categoria “${category.name}” está inativa e não pode ser usada em uma nova regra.`);const record:FinanceRule={id:previous?.id??crypto.randomUUID(),contains:contains.trim(),category:category.name,type,active};if(existingIndex>=0){next[existingIndex]=record;updated+=1}else{next.push(record);imported+=1}});
 saveFinanceRules(next);assertPersisted(next,getFinanceRules(),'regras financeiras');return{imported,updated,total:rows.length};
}

function importContractTemplates(rows:ReportRow[]):ImportResult{
 const current=getContractTemplates();const next=[...current];const seen=new Set<string>();let imported=0;let updated=0;
 rows.forEach((row,index)=>{const rowNumber=index+2;const name=required(row,'Nome',rowNumber);const content=required(row,'Conteúdo do documento',rowNumber);const active=yesNo(required(row,'Template ativo e disponível no wizard',rowNumber),'Template ativo e disponível no wizard',rowNumber);const key=normalize(name);uniqueRowKey(seen,key,rowNumber,'template de contrato');const matches=next.map((item,itemIndex)=>({item,itemIndex})).filter(({item})=>normalize(item.name)===key);if(matches.length>1)throw new Error(`Linha ${rowNumber}: existem múltiplos templates com o nome “${name}”; a atualização seria ambígua.`);const existingIndex=matches[0]?.itemIndex??-1;const previous=existingIndex>=0?next[existingIndex]:undefined;const stamp=nowIso();const record:ContractTemplate={id:previous?.id??crypto.randomUUID(),name:name.trim(),description:text(row,'Descrição'),content,active,createdAt:previous?.createdAt??stamp,updatedAt:stamp};if(existingIndex>=0){next[existingIndex]=record;updated+=1}else{next.push(record);imported+=1}});
 saveContractTemplates(next);assertPersisted(next,getContractTemplates(),'templates de contratos');return{imported,updated,total:rows.length};
}

function importContractVariables(rows:ReportRow[]):ImportResult{
 const current=getContractVariables();const next=[...current];const seen=new Set<string>();let imported=0;let updated=0;
 rows.forEach((row,index)=>{const rowNumber=index+2;const label=required(row,'Nome amigável',rowNumber);const rawGroup=required(row,'Grupo',rowNumber);const rawField=required(row,'Campo',rowNumber);const group=normalizePlaceholderPart(rawGroup);const field=normalizePlaceholderPart(rawField);if(!group||!field)throw new Error(`Linha ${rowNumber}: Grupo e Campo precisam gerar um placeholder válido.`);const placeholder=makePlaceholder(group,field);uniqueRowKey(seen,placeholder,rowNumber,'placeholder de variável');const type=variableType(required(row,'Tipo',rowNumber),rowNumber);const requiredValue=yesNo(required(row,'Obrigatória para revisão',rowNumber),'Obrigatória para revisão',rowNumber);const existingIndex=next.findIndex(item=>item.placeholder===placeholder);const previous=existingIndex>=0?next[existingIndex]:undefined;const stamp=nowIso();const record:ContractVariableDefinition={id:previous?.id??crypto.randomUUID(),group,field,placeholder,label:label.trim(),type,required:requiredValue,description:text(row,'Descrição'),createdAt:previous?.createdAt??stamp,updatedAt:stamp};if(existingIndex>=0){next[existingIndex]=record;updated+=1}else{next.push(record);imported+=1}});
 saveContractVariables(next);assertPersisted(next,getContractVariables(),'variáveis de templates de contratos');return{imported,updated,total:rows.length};
}

export function importConfigurationReportRows(id:ConfigurationReportDatasetId,rows:ReportRow[]):ImportResult{
 if(rows.length===0)throw new Error('O arquivo XLSX não possui linhas de dados para importar.');
 if(id==='financeCategories')return importFinanceCategories(rows);
 if(id==='financeRules')return importFinanceRules(rows);
 if(id==='contractTemplates')return importContractTemplates(rows);
 return importContractVariables(rows);
}
