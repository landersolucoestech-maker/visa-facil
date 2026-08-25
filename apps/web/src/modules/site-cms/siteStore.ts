import { createInitialCmsDocument } from './siteSchema';
import type { CmsDocument, CmsPage } from './types';

const DRAFT_KEY='visa-facil.cms.draft.v1';
const PUBLISHED_KEY='visa-facil.cms.published.v1';

function clone<T>(value:T):T{return structuredClone(value)}
function parse(raw:string|null):CmsDocument|null{if(!raw)return null;try{return JSON.parse(raw) as CmsDocument}catch{return null}}

function normalize(document:CmsDocument):CmsDocument{
 const initial=createInitialCmsDocument();
 const pages=document.pages?.length?document.pages:initial.pages;
 return{...initial,...document,pages,globals:document.globals?.length?document.globals:initial.globals,media:document.media||[],settings:{...initial.settings,...(document.settings||{})}};
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
 const next={...document,updatedAt:new Date().toISOString()};
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
 const published: CmsDocument={...clone(document),updatedAt:now,publishedAt:now};
 localStorage.setItem(PUBLISHED_KEY,JSON.stringify(published));
 localStorage.setItem(DRAFT_KEY,JSON.stringify(published));
 window.dispatchEvent(new CustomEvent('visa-cms-updated',{detail:{source:'published'}}));
 return published;
}

export function resetCms(){localStorage.removeItem(DRAFT_KEY);localStorage.removeItem(PUBLISHED_KEY);const initial=createInitialCmsDocument();localStorage.setItem(DRAFT_KEY,JSON.stringify(initial));localStorage.setItem(PUBLISHED_KEY,JSON.stringify(initial));return initial}

export function resolvePublicDocument(previewDraft=false):CmsDocument{
 return previewDraft?loadDraft():loadPublished();
}

export function findPageByPath(document:CmsDocument,path:string):CmsPage|undefined{
 const clean=path==='/'?'/':path.replace(/\/+$/,'');
 return document.pages.find(page=>page.slug===clean);
}
