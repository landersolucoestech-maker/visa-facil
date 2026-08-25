import type { CmsDocument, CmsSectionInstance, CmsValue } from './types';
import { DEFINITIONS as GLOBAL_DEFINITIONS } from './siteSchemaGlobal';
import { DEFINITIONS as CONVERSION_DEFINITIONS } from './siteSchemaConversion';
import { DEFINITIONS as EDITORIAL_DEFINITIONS } from './siteSchemaEditorial';

export const SECTION_DEFINITIONS={...GLOBAL_DEFINITIONS,...CONVERSION_DEFINITIONS,...EDITORIAL_DEFINITIONS};

export const PAGE_SECTION_TYPES=['hero','services-intro','services','experience','pain-points','process','difference','faq','contact'];
export const GLOBAL_SECTION_TYPES=['header','footer'];

function valuesFor(type:string):Record<string,CmsValue>{const definition=SECTION_DEFINITIONS[type];return Object.fromEntries(definition.fields.map(field=>[field.id,structuredClone(field.defaultValue)]))}
function instance(type:string,id=type,order=0):CmsSectionInstance{const definition=SECTION_DEFINITIONS[type];return{id,type,label:definition.label,visible:true,order,values:valuesFor(type)}}

export function createInitialCmsDocument():CmsDocument{
 const now=new Date().toISOString();
 return{version:1,updatedAt:now,publishedAt:now,pages:[{id:'home',name:'Home',slug:'/',status:'published',scheduledAt:'',updatedAt:now,seo:{title:'VISA FÁCIL | Assessoria para Vistos Internacionais',description:'Assessoria personalizada para vistos dos Estados Unidos, Canadá, Austrália, Europa e Schengen, com suporte em português e acompanhamento em todas as etapas.',ogImage:'',canonicalUrl:'',noIndex:false},sections:PAGE_SECTION_TYPES.map((type,index)=>instance(type,type,index))}],globals:GLOBAL_SECTION_TYPES.map((type,index)=>instance(type,`global-${type}`,index)),media:[],settings:{siteName:'VISA FÁCIL',siteUrl:'',locale:'pt-BR',defaultOgImage:'',organizationName:'VISA FÁCIL'}};
}

export function sectionDefinition(type:string){return SECTION_DEFINITIONS[type]}
export function createSectionFromType(type:string,order:number):CmsSectionInstance{return instance(type,`${type}-${crypto.randomUUID().slice(0,8)}`,order)}
