import { createInitialCmsDocument } from './siteSchema';
import type { CmsDocument, CmsMediaItem, CmsPage, CmsRepeaterItem, CmsSectionInstance, CmsSeo, CmsSettings, CmsStatus, CmsValue } from './types';

const DRAFT_KEY='visa-facil.cms.draft.v1';
const PUBLISHED_KEY='visa-facil.cms.published.v1';
const VALID_PAGE_STATUSES=new Set<CmsStatus>(['draft','published','scheduled','hidden']);
const VALID_MEDIA_KINDS=new Set<CmsMediaItem['kind']>(['image','document']);

function clone<T>(value:T):T{return structuredClone(value)}
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
function isDocument(value:unknown):value is CmsDocument{
 if(!isRecord(value)||!isNumber(value.version)||!Number.isInteger(value.version)||value.version<1||!isString(value.updatedAt)||(value.publishedAt!==null&&!isString(value.publishedAt))||!Array.isArray(value.pages)||!value.pages.every(isPage)||!Array.isArray(value.globals)||!value.globals.every(isSection)||!Array.isArray(value.media)||!value.media.every(isMedia)||!isSettings(value.settings))return false;
 return hasUniqueIds(value.pages)&&hasUniqueIds(value.globals)&&hasUniqueIds(value.media)&&value.pages.every(page=>hasUniqueIds(page.sections));
}

function parse(raw:string|null):CmsDocument|null{
 if(!raw)return null;
 try{const value:unknown=JSON.parse(raw);return isDocument(value)?value:null}catch{return null}
}

function normalize(document:CmsDocument):CmsDocument{
 const initial=createInitialCmsDocument();
 const pages=document.pages.length?document.pages:initial.pages;
 const globals=document.globals.length?document.globals:initial.globals;
 return{...initial,...document,pages:clone(pages),globals:clone(globals),media:clone(document.media),settings:{...initial.settings,...document.settings}};
}

export function loadDraft():CmsDocument{
 const stored=parse(localStorage.getItem(DRAFT_KEY));
 if(stored)return normalize(stored);
 const published=parse(localStorage.getItem(PUBLISHED_KEY));
 const document=normalize(published||createInitialCmsDocument());
 localStorage.setItem(DRAFT_KEY,JSON.stringify(document));
 return clone(document);
}

export function saveDraft(document:CmsDocument){
 const next={...normalize(document),updatedAt:new Date().toISOString()};
 localStorage.setItem(DRAFT_KEY,JSON.stringify(next));
 window.dispatchEvent(new CustomEvent('visa-cms-updated',{detail:{source:'draft'}}));
 return next;
}

export function loadPublished():CmsDocument{
 const stored=parse(localStorage.getItem(PUBLISHED_KEY));
 if(stored)return normalize(stored);
 const initial=createInitialCmsDocument();
 localStorage.setItem(PUBLISHED_KEY,JSON.stringify(initial));
 return clone(initial);
}

export function publishDraft(document:CmsDocument){
 const now=new Date().toISOString();
 const published:CmsDocument={...normalize(clone(document)),updatedAt:now,publishedAt:now};
 localStorage.setItem(PUBLISHED_KEY,JSON.stringify(published));
 localStorage.setItem(DRAFT_KEY,JSON.stringify(published));
 window.dispatchEvent(new CustomEvent('visa-cms-updated',{detail:{source:'published'}}));
 return published;
}

export function resetCms(){localStorage.removeItem(DRAFT_KEY);localStorage.removeItem(PUBLISHED_KEY);const initial=createInitialCmsDocument();localStorage.setItem(DRAFT_KEY,JSON.stringify(initial));localStorage.setItem(PUBLISHED_KEY,JSON.stringify(initial));return initial}
export function resolvePublicDocument(previewDraft=false):CmsDocument{return previewDraft?loadDraft():loadPublished()}
export function findPageByPath(document:CmsDocument,path:string):CmsPage|undefined{const clean=path==='/'?'/':path.replace(/\/+$/,'');return document.pages.find(page=>page.slug===clean)}
