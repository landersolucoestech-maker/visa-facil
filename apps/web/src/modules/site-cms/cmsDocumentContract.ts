import type { CmsDocument, CmsMediaItem, CmsPage, CmsRepeaterItem, CmsSectionInstance, CmsSeo, CmsSettings, CmsStatus, CmsValue } from './types';

const CMS_DOCUMENT_VERSION=1;
const VALID_PAGE_STATUSES=new Set<CmsStatus>(['draft','published','scheduled','hidden']);
const VALID_MEDIA_KINDS=new Set<CmsMediaItem['kind']>(['image','document']);
const KNOWN_PAGE_SECTION_TYPES=new Set(['hero','services-intro','services','experience','pain-points','process','difference','faq','contact']);
const KNOWN_GLOBAL_SECTION_TYPES=new Set(['header','footer']);
const VALID_PUBLIC_FORM_FIELD_TYPES=new Set(['text','tel','email','select','textarea']);
const VALID_PUBLIC_FORM_FIELD_NAME=/^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const RESERVED_PUBLIC_FORM_FIELD_NAMES=new Set(['consent']);

export class CmsPublicationError extends Error{
 readonly issues:string[];
 constructor(issues:string[]){super(`Publicação bloqueada: ${issues[0]||'o documento do CMS é inválido.'}`);this.name='CmsPublicationError';this.issues=issues}
}

function isRecord(value:unknown):value is Record<string,unknown>{return Boolean(value)&&typeof value==='object'&&!Array.isArray(value)}
function isString(value:unknown):value is string{return typeof value==='string'}
function isBoolean(value:unknown):value is boolean{return typeof value==='boolean'}
function isNumber(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value)}
function isDateTimeString(value:unknown):value is string{return isString(value)&&value.trim().length>0&&Number.isFinite(new Date(value).getTime())}
function isRepeaterItem(value:unknown):value is CmsRepeaterItem{return isRecord(value)&&Object.values(value).every(item=>isString(item)||isBoolean(item))}
function isCmsValue(value:unknown):value is CmsValue{return isString(value)||isBoolean(value)||(Array.isArray(value)&&value.every(isRepeaterItem))}
function isSeo(value:unknown):value is CmsSeo{return isRecord(value)&&isString(value.title)&&isString(value.description)&&isString(value.ogImage)&&isString(value.canonicalUrl)&&isBoolean(value.noIndex)}
function isSection(value:unknown):value is CmsSectionInstance{return isRecord(value)&&isString(value.id)&&value.id.trim().length>0&&isString(value.type)&&value.type.trim().length>0&&isString(value.label)&&isBoolean(value.visible)&&isNumber(value.order)&&Number.isInteger(value.order)&&value.order>=0&&isRecord(value.values)&&Object.values(value.values).every(isCmsValue)}
function isPage(value:unknown):value is CmsPage{return isRecord(value)&&isString(value.id)&&value.id.trim().length>0&&isString(value.name)&&isString(value.slug)&&typeof value.status==='string'&&VALID_PAGE_STATUSES.has(value.status as CmsStatus)&&isString(value.scheduledAt)&&isDateTimeString(value.updatedAt)&&isSeo(value.seo)&&Array.isArray(value.sections)&&value.sections.every(isSection)}
function isMedia(value:unknown):value is CmsMediaItem{return isRecord(value)&&isString(value.id)&&value.id.trim().length>0&&isString(value.name)&&isString(value.url)&&isString(value.alt)&&typeof value.kind==='string'&&VALID_MEDIA_KINDS.has(value.kind as CmsMediaItem['kind'])&&isDateTimeString(value.createdAt)}
function isSettings(value:unknown):value is CmsSettings{return isRecord(value)&&isString(value.siteName)&&isString(value.siteUrl)&&isString(value.locale)&&isString(value.defaultOgImage)&&isString(value.organizationName)}
function hasUniqueIds<T extends {id:string}>(items:T[]){return new Set(items.map(item=>item.id)).size===items.length}
function hasUniqueOrders<T extends {order:number}>(items:T[]){return new Set(items.map(item=>item.order)).size===items.length}

export function isCmsDocument(value:unknown):value is CmsDocument{
 if(!isRecord(value)||value.version!==CMS_DOCUMENT_VERSION||!isDateTimeString(value.updatedAt)||(value.publishedAt!==null&&!isDateTimeString(value.publishedAt))||!Array.isArray(value.pages)||!value.pages.every(isPage)||!Array.isArray(value.globals)||!value.globals.every(isSection)||!Array.isArray(value.media)||!value.media.every(isMedia)||!isSettings(value.settings))return false;
 return hasUniqueIds(value.pages)&&hasUniqueIds(value.globals)&&hasUniqueOrders(value.globals)&&hasUniqueIds(value.media)&&value.pages.every(page=>hasUniqueIds(page.sections)&&hasUniqueOrders(page.sections));
}

export function parseCmsDocument(raw:string|null):CmsDocument|null{
 if(!raw)return null;
 try{const value:unknown=JSON.parse(raw);return isCmsDocument(value)?value:null}catch{return null}
}

export function normalizeCmsPath(path:string){return path==='/'?'/':path.replace(/\/+$/,'')||'/'}

export function normalizeCmsSlug(value:string){
 const trimmed=value.trim();
 if(!trimmed||trimmed==='/')return'/';
 const path=trimmed.startsWith('/')?trimmed:`/${trimmed}`;
 const segments=path.split('/').filter(Boolean).map(segment=>segment.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')).filter(Boolean);
 return segments.length?`/${segments.join('/')}`:'/';
}

export function isValidCmsSchedule(value:string){
 if(!value.trim())return false;
 return Number.isFinite(new Date(value).getTime());
}

export function isSafeCmsExternalUrl(value:string){
 const trimmed=value.trim();
 if(!trimmed)return false;
 try{const parsed=new URL(trimmed);return parsed.protocol==='https:'||parsed.protocol==='http:'}catch{return false}
}

function cmsValueReferenceCount(value:CmsValue,url:string){
 if(typeof value==='string')return value===url?1:0;
 if(typeof value==='boolean')return 0;
 return value.reduce((total,item)=>total+Object.values(item).reduce((sum,entry)=>sum+(typeof entry==='string'&&entry===url?1:0),0),0);
}

export function cmsMediaReferenceCount(document:CmsDocument,url:string){
 if(!url)return 0;
 let count=document.settings.defaultOgImage===url?1:0;
 for(const page of document.pages){
  if(page.seo.ogImage===url)count+=1;
  for(const section of page.sections)for(const value of Object.values(section.values))count+=cmsValueReferenceCount(value,url);
 }
 for(const section of document.globals)for(const value of Object.values(section.values))count+=cmsValueReferenceCount(value,url);
 return count;
}

function appendOrderIssues(issues:string[],sections:CmsSectionInstance[],scope:string){
 const seen=new Set<number>();
 for(const section of sections){
  if(!Number.isInteger(section.order)||section.order<0)issues.push(`${scope} contém a seção “${section.label}” com ordem inválida.`);
  else if(seen.has(section.order))issues.push(`${scope} possui mais de uma seção na ordem ${section.order}.`);
  else seen.add(section.order);
 }
}

function appendPublicFormIssues(issues:string[],section:CmsSectionInstance,pageLabel:string){
 const formFields=section.values.formFields;
 if(!Array.isArray(formFields)){issues.push(`O formulário da página “${pageLabel}” precisa manter uma lista válida de campos.`);return}
 const seenNames=new Set<string>();
 for(const [index,item] of formFields.entries()){
  const position=index+1;
  const name=typeof item.name==='string'?item.name.trim():'';
  const nameKey=name.toLowerCase();
  const type=typeof item.type==='string'?item.type.trim().toLowerCase():'';
  if(!VALID_PUBLIC_FORM_FIELD_NAME.test(name)||RESERVED_PUBLIC_FORM_FIELD_NAMES.has(nameKey))issues.push(`O campo ${position} do formulário da página “${pageLabel}” possui nome técnico inválido ou reservado.`);
  else if(seenNames.has(nameKey))issues.push(`O formulário da página “${pageLabel}” possui o nome técnico duplicado “${name}”.`);
  else seenNames.add(nameKey);
  if(!VALID_PUBLIC_FORM_FIELD_TYPES.has(type))issues.push(`O campo “${name||position}” do formulário da página “${pageLabel}” usa um tipo não suportado.`);
  if(type==='select'){
   const options=typeof item.options==='string'?item.options.split('\n').map(value=>value.trim()).filter(Boolean):[];
   if(options.length===0)issues.push(`O campo de seleção “${name||position}” da página “${pageLabel}” precisa ter pelo menos uma opção.`);
  }
 }
}

export function cmsPublicationIssues(document:CmsDocument){
 const issues:string[]=[];
 const seenSlugs=new Map<string,string>();
 if(document.version!==CMS_DOCUMENT_VERSION)issues.push(`A versão do documento CMS deve ser ${CMS_DOCUMENT_VERSION}.`);
 if(!isDateTimeString(document.updatedAt))issues.push('A data de atualização do documento CMS é inválida.');
 if(document.publishedAt!==null&&!isDateTimeString(document.publishedAt))issues.push('A data da última publicação do CMS é inválida.');
 if(!document.settings.siteName.trim())issues.push('Informe o nome do site antes de publicar.');
 if(document.settings.siteUrl.trim()&&!isSafeCmsExternalUrl(document.settings.siteUrl))issues.push('A URL principal do site deve usar HTTP ou HTTPS.');
 if(!document.pages.some(page=>normalizeCmsSlug(page.slug)==='/'))issues.push('O site precisa manter uma página inicial no slug /.');
 for(const page of document.pages){
  const label=page.name.trim()||page.id;
  if(!page.name.trim())issues.push(`A página ${page.id} precisa de um nome.`);
  if(!isDateTimeString(page.updatedAt))issues.push(`A página “${label}” possui data de atualização inválida.`);
  const normalized=normalizeCmsSlug(page.slug);
  if(page.slug!==normalized)issues.push(`O slug da página “${label}” deve ser “${normalized}”.`);
  const slugKey=normalized.toLocaleLowerCase('pt-BR');
  const duplicate=seenSlugs.get(slugKey);
  if(duplicate)issues.push(`As páginas “${duplicate}” e “${label}” usam o mesmo slug “${normalized}”.`);else seenSlugs.set(slugKey,label);
  if(page.status==='scheduled'&&!isValidCmsSchedule(page.scheduledAt))issues.push(`A página “${label}” está agendada, mas não possui data e horário válidos.`);
  if(page.seo.canonicalUrl.trim()&&!isSafeCmsExternalUrl(page.seo.canonicalUrl))issues.push(`A Canonical URL da página “${label}” deve usar HTTP ou HTTPS.`);
  appendOrderIssues(issues,page.sections,`A página “${label}”`);
  const seenSectionTypes=new Set<string>();
  for(const section of page.sections){
   if(!KNOWN_PAGE_SECTION_TYPES.has(section.type))issues.push(`A página “${label}” contém um tipo de seção não suportado: “${section.type}”.`);
   if(seenSectionTypes.has(section.type))issues.push(`A página “${label}” possui mais de uma seção do tipo “${section.label}”.`);else seenSectionTypes.add(section.type);
   if(section.type==='contact')appendPublicFormIssues(issues,section,label);
  }
 }
 for(const media of document.media)if(!isDateTimeString(media.createdAt))issues.push(`A mídia “${media.name||media.id}” possui data de criação inválida.`);
 appendOrderIssues(issues,document.globals,'O conteúdo global');
 const seenGlobalTypes=new Set<string>();
 for(const section of document.globals){
  if(!KNOWN_GLOBAL_SECTION_TYPES.has(section.type))issues.push(`Existe um bloco global não suportado: “${section.type}”.`);
  if(seenGlobalTypes.has(section.type))issues.push(`Existe mais de um bloco global do tipo “${section.label}”.`);else seenGlobalTypes.add(section.type);
 }
 for(const required of KNOWN_GLOBAL_SECTION_TYPES)if(!seenGlobalTypes.has(required))issues.push(`O bloco global obrigatório “${required}” está ausente.`);
 return issues;
}

export function assertCmsPublishable(document:CmsDocument){
 const issues=cmsPublicationIssues(document);
 if(issues.length)throw new CmsPublicationError(issues);
}
