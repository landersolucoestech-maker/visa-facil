import { createInitialCmsDocument } from './siteSchema';
import { normalizeCmsPath, parseCmsDocument } from './cmsDocumentContract';
import type { CmsDocument, CmsPage } from './types';

const DRAFT_KEY='visa-facil.cms.draft.v1';
const PUBLISHED_KEY='visa-facil.cms.published.v1';

export class CmsStorageError extends Error{
 constructor(){super('O navegador não conseguiu salvar o CMS local. Reduza a biblioteca de mídia ou libere espaço antes de tentar novamente.');this.name='CmsStorageError'}
}

function clone<T>(value:T):T{return structuredClone(value)}
function persist(key:string,document:CmsDocument){try{localStorage.setItem(key,JSON.stringify(document))}catch{throw new CmsStorageError()}}
function tryPersist(key:string,document:CmsDocument){try{localStorage.setItem(key,JSON.stringify(document));return true}catch{return false}}

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
 tryPersist(DRAFT_KEY,document);
 return clone(document);
}

export function saveDraft(document:CmsDocument){
 const next={...normalize(document),updatedAt:new Date().toISOString()};
 persist(DRAFT_KEY,next);
 window.dispatchEvent(new CustomEvent('visa-cms-updated',{detail:{source:'draft'}}));
 return next;
}

export function loadPublished():CmsDocument{
 const stored=parseCmsDocument(localStorage.getItem(PUBLISHED_KEY));
 if(stored)return normalize(stored);
 const initial=createInitialCmsDocument();
 tryPersist(PUBLISHED_KEY,initial);
 return clone(initial);
}

export function publishDraft(document:CmsDocument){
 const now=new Date().toISOString();
 const published:CmsDocument={...normalize(clone(document)),updatedAt:now,publishedAt:now};
 persist(PUBLISHED_KEY,published);
 try{
  persist(DRAFT_KEY,published);
 }catch(error){
  try{localStorage.removeItem(PUBLISHED_KEY)}catch{}
  throw error;
 }
 window.dispatchEvent(new CustomEvent('visa-cms-updated',{detail:{source:'published'}}));
 return published;
}

export function resetCms(){
 const previousDraft=localStorage.getItem(DRAFT_KEY);const previousPublished=localStorage.getItem(PUBLISHED_KEY);
 const initial=createInitialCmsDocument();
 try{
  persist(DRAFT_KEY,initial);persist(PUBLISHED_KEY,initial);
  return initial;
 }catch(error){
  try{if(previousDraft===null)localStorage.removeItem(DRAFT_KEY);else localStorage.setItem(DRAFT_KEY,previousDraft)}catch{}
  try{if(previousPublished===null)localStorage.removeItem(PUBLISHED_KEY);else localStorage.setItem(PUBLISHED_KEY,previousPublished)}catch{}
  throw error;
 }
}
export function resolvePublicDocument(previewDraft=false):CmsDocument{return previewDraft?loadDraft():loadPublished()}
export function findPageByPath(document:CmsDocument,path:string):CmsPage|undefined{const clean=normalizeCmsPath(path);return document.pages.find(page=>page.slug===clean)}
