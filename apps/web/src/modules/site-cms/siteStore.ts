import { createInitialCmsDocument } from './siteSchema';
import { normalizeCmsPath, parseCmsDocument } from './cmsDocumentContract';
import type { CmsDocument, CmsPage } from './types';

const DRAFT_KEY='visa-facil.cms.draft.v1';
const PUBLISHED_KEY='visa-facil.cms.published.v1';

function clone<T>(value:T):T{return structuredClone(value)}

function normalize(document:CmsDocument):CmsDocument{
 const initial=createInitialCmsDocument();
 const pages=document.pages.length?document.pages:initial.pages;
 const globals=document.globals.length?document.globals:initial.globals;
 return{...initial,...document,pages:clone(pages),globals:clone(globals),media:clone(document.media),settings:{...initial.settings,...document.settings}};
}

export function loadDraft():CmsDocument{
 const stored=parseCmsDocument(localStorage.getItem(DRAFT_KEY));
 if(stored)return normalize(stored);
 const published=parseCmsDocument(localStorage.getItem(PUBLISHED_KEY));
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
 const stored=parseCmsDocument(localStorage.getItem(PUBLISHED_KEY));
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
export function findPageByPath(document:CmsDocument,path:string):CmsPage|undefined{const clean=normalizeCmsPath(path);return document.pages.find(page=>page.slug===clean)}
