import { createInitialCmsDocument } from './siteSchema';
import type { CmsDocument, CmsPage, CmsSectionInstance, CmsSeo, CmsSettings } from './types';

const DRAFT_KEY='visa-facil.cms.draft.v1';
const PUBLISHED_KEY='visa-facil.cms.published.v1';

function clone<T>(value:T):T{return structuredClone(value)}
function isRecord(value:unknown):value is Record<string,unknown>{return Boolean(value)&&typeof value==='object'&&!Array.isArray(value)}
function isString(value:unknown):value is string{return typeof value==='string'}
function isBoolean(value:unknown):value is boolean{return typeof value==='boolean'}
function isNumber(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value)}
function isSeo(value:unknown):value is CmsSeo{return isRecord(value)&&isString(value.title)&&isString(value.description)&&isString(value.ogImage)&&isString(value.canonicalUrl)&&isBoolean(value.noIndex)}
function isSection(value:unknown):value is CmsSectionInstance{return isRecord(value)&&isString(value.id)&&isString(value.type)&&isString(value.label)&&isBoolean(value.visible)&&isNumber(value.order)&&isRecord(value.values)}
function isPage(value:unknown):value is CmsPage{return isRecord(value)&&isString(value.id)&&isString(value.name)&&isString(value.slug)&&isString(value.status)&&isString(value.scheduledAt)&&isString(value.updatedAt)&&isSeo(value.seo)&&Array.isArray(value.sections)&&value.sections.every(isSection)}
function isSettings(value:unknown):value is CmsSettings{return isRecord(value)&&isString(value.siteName)&&isString(value.siteUrl)&&isString(value.locale)&&isString(value.defaultOgImage)&&isString(value.organizationName)}
function isDocument(value:unknown):value is CmsDocument{return isRecord(value)&&isNumber(value.version)&&isString(value.updatedAt)&&(value.publishedAt===null||isString(value.publishedAt))&&Array.isArray(value.pages)&&value.pages.every(isPage)&&Array.isArray(value.globals)&&value.globals.every(isSection)&&Array.isArray(value.media)&&isSettings(value.settings)}

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
