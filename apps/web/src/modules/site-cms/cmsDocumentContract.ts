import type { CmsDocument, CmsMediaItem, CmsPage, CmsRepeaterItem, CmsSectionInstance, CmsSeo, CmsSettings, CmsStatus, CmsValue } from './types';

const VALID_PAGE_STATUSES=new Set<CmsStatus>(['draft','published','scheduled','hidden']);
const VALID_MEDIA_KINDS=new Set<CmsMediaItem['kind']>(['image','document']);
const KNOWN_PAGE_SECTION_TYPES=new Set(['hero','services-intro','services','experience','pain-points','process','difference','faq','contact']);
const KNOWN_GLOBAL_SECTION_TYPES=new Set(['header','footer']);

export class CmsPublicationError extends Error{
 readonly issues:string[];
 constructor(issues:string[]){super(`Publicação bloqueada: ${issues[0]||'o documento do CMS é inválido.'}`);this.name='CmsPublicationError';this.issues=issues}
}

function isRecord(value:unknown):value is Record<string,unknown>{return Boolean(value)&&typeof value==='object'&&!Array.isArray(value)}
function isString(value:unknown):value is string{return typeof value==='string'}
function isBoolean(value:unknown):value is boolean{return typeof value==='boolean'}
function isNumber(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value)}
function isRepeaterItem(value:unknown):value is CmsRepeaterItem{return isRecord(value)&&Object.values(value).every(item=>isString(item)||isBoolean(item))}
function isCmsValue(value:unknown):value is CmsValue{return isString(value)||isBoolean(value)||(Array.isArray(value)&&value.every(isRepeaterItem))}
function isSeo(value:unknown):value is CmsSeo{return isRecord(value)&&isString(value.title)&&isString(value.description)&&isString(value.ogImage)&&isString(value.canonicalUrl)&&isBoolean(value.noIndex)}
function isSection(value:unknown):value is CmsSectionInstance{return isRecord(value)&&isString(value.id)&&value.id.trim().length>0&&isString(value.type)&&value.type.trim().length>0&&isString(value.label)&&isBoolean(value.visible)&&isNumber(value.order)&&Number.isInteger(value.order)&&isRecord(value.values)&&Object.values(value.values).every(isCmsValue)}
function isPage(value:unknown):value is CmsPage{return isRecord(value)&&isString(value.id)&&value.id.trim().length>0&&isString(value.name)&&isString(value.slug)&&typeof value.status==='string'&&VALID_PAGE_STATUSES.has(value.status as CmsStatus)&&isString(value.scheduledAt)&&isString(value.updatedAt)&&isSeo(value.seo)&&Array.isArray(value.sections)&&value.sections.every(isSection)}
function isMedia(value:unknown):value is CmsMediaItem{return isRecord(value)&&isString(value.id)&&value.id.trim().length>0&&isString(value.name)&&isString(value.url)&&isString(value.alt)&&typeof value.kind==='string'&&VALID_MEDIA_KINDS.has(value.kind as CmsMediaItem['kind'])&&isString(value.createdAt)}
function isSettings(value:unknown):value is CmsSettings{return isRecord(value)&&isString(value.siteName)&&isString(value.siteUrl)&&isString(value.locale)&&isString(value.defaultOgImage)&&isString(value.organizationName)}
function hasUniqueIds<T extends {id:string}>(items:T[]){return new Set(items.map(item=>item.id)).size===items.length}

export function isCmsDocument(value:unknown):value is CmsDocument{
 if(!isRecord(value)||!isNumber(value.version)||!Number.isInteger(value.version)||value.version<1||!isString(value.updatedAt)||(value.publishedAt!==null&&!isString(value.publishedAt))||!Array.isArray(value.pages)||!value.pages.every(isPage)||!Array.isArray(value.globals)||!value.globals.every(isSection)||!Array.isArray(value.media)||!value.media.every(isMedia)||!isSettings(value.settings))return false;
 return hasUniqueIds(value.pages)&&hasUniqueIds(value.globals)&&hasUniqueIds(value.media)&&value.pages.every(page=>hasUniqueIds(page.sections));
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

export function cmsPublicationIssues(document:CmsDocument){
 const issues:string[]=[];
 const seenSlugs=new Map<string,string>();
 if(!document.settings.siteName.trim())issues.push('Informe o nome do site antes de publicar.');
 if(document.settings.siteUrl.trim()&&!isSafeCmsExternalUrl(document.settings.siteUrl))issues.push('A URL principal do site deve usar HTTP ou HTTPS.');
 if(!document.pages.some(page=>normalizeCmsSlug(page.slug)==='/'))issues.push('O site precisa manter uma página inicial no slug /.');
 for(const page of document.pages){
  const label=page.name.trim()||page.id;
  if(!page.name.trim())issues.push(`A página ${page.id} precisa de um nome.`);
  const normalized=normalizeCmsSlug(page.slug);
  if(page.slug!==normalized)issues.push(`O slug da página “${label}” deve ser “${normalized}”.`);
  const slugKey=normalized.toLocaleLowerCase('pt-BR');
  const duplicate=seenSlugs.get(slugKey);
  if(duplicate)issues.push(`As páginas “${duplicate}” e “${label}” usam o mesmo slug “${normalized}”.`);else seenSlugs.set(slugKey,label);
  if(page.status==='scheduled'&&!isValidCmsSchedule(page.scheduledAt))issues.push(`A página “${label}” está agendada, mas não possui data e horário válidos.`);
  if(page.seo.canonicalUrl.trim()&&!isSafeCmsExternalUrl(page.seo.canonicalUrl))issues.push(`A Canonical URL da página “${label}” deve usar HTTP ou HTTPS.`);
  const seenSectionTypes=new Set<string>();
  for(const section of page.sections){
   if(!KNOWN_PAGE_SECTION_TYPES.has(section.type))issues.push(`A página “${label}” contém um tipo de seção não suportado: “${section.type}”.`);
   if(seenSectionTypes.has(section.type))issues.push(`A página “${label}” possui mais de uma seção do tipo “${section.label}”.`);else seenSectionTypes.add(section.type);
  }
 }
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
