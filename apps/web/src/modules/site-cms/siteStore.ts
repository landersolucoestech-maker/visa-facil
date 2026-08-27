import { createInitialCmsDocument } from './siteSchema';
import { assertCmsPublishable, normalizeCmsPath, parseCmsDocument } from './cmsDocumentContract';
import type { CmsDocument, CmsPage } from './types';

const DRAFT_KEY='visa-facil.cms.draft.v1';
const PUBLISHED_KEY='visa-facil.cms.published.v1';

export class CmsStorageError extends Error{
 constructor(){super('O navegador não conseguiu salvar o CMS local. Reduza a biblioteca de mídia ou libere espaço antes de tentar novamente.');this.name='CmsStorageError'}
}

export type CmsDraftLoadState={document:CmsDocument;recoveryMessage:string};

function clone<T>(value:T):T{return structuredClone(value)}
function storage(){try{return typeof localStorage==='undefined'?null:localStorage}catch{return null}}
function readRaw(key:string){const store=storage();if(!store)return null;try{return store.getItem(key)}catch{return null}}
function restoreRaw(key:string,value:string|null){
 const store=storage();if(!store)return false;
 try{
  if(value===null)store.removeItem(key);else store.setItem(key,value);
  return value===null?store.getItem(key)===null:store.getItem(key)===value;
 }catch{return false}
}
function persist(key:string,document:CmsDocument){
 const store=storage();
 if(!store)throw new CmsStorageError();
 try{
  const raw=JSON.stringify(document);
  store.setItem(key,raw);
  if(store.getItem(key)!==raw)throw new Error('local storage verification failed');
 }catch{throw new CmsStorageError()}
}
function tryPersist(key:string,document:CmsDocument){try{persist(key,document);return true}catch{return false}}

function normalize(document:CmsDocument):CmsDocument{
 const initial=createInitialCmsDocument();
 const pages=document.pages.length?document.pages:initial.pages;
 const globals=document.globals.length?document.globals:initial.globals;
 return{...initial,...document,pages:clone(pages),globals:clone(globals),media:clone(document.media),settings:{...initial.settings,...document.settings}};
}

export function loadDraftState():CmsDraftLoadState{
 const draftRaw=readRaw(DRAFT_KEY);
 const publishedRaw=readRaw(PUBLISHED_KEY);
 const draft=parseCmsDocument(draftRaw);
 const published=parseCmsDocument(publishedRaw);
 if(draft){
  const recoveryMessage=publishedRaw!==null&&!published?'A publicação local armazenada estava inválida. O rascunho válido foi preservado; publique novamente após revisar o conteúdo.':'';
  return{document:normalize(draft),recoveryMessage};
 }
 const document=normalize(published||createInitialCmsDocument());
 tryPersist(DRAFT_KEY,document);
 if(draftRaw!==null&&published)return{document:clone(document),recoveryMessage:'O rascunho local estava inválido e foi recuperado a partir da última publicação local válida.'};
 if(draftRaw!==null)return{document:clone(document),recoveryMessage:'O rascunho local estava inválido e não havia publicação local válida; o conteúdo inicial foi restaurado.'};
 if(publishedRaw!==null&&!published)return{document:clone(document),recoveryMessage:'A publicação local armazenada estava inválida; o CMS iniciou com o conteúdo padrão do projeto.'};
 return{document:clone(document),recoveryMessage:''};
}

export function loadDraft():CmsDocument{return loadDraftState().document}

export function saveDraft(document:CmsDocument){
 const next={...normalize(document),updatedAt:new Date().toISOString()};
 persist(DRAFT_KEY,next);
 window.dispatchEvent(new CustomEvent('visa-cms-updated',{detail:{source:'draft'}}));
 return next;
}

export function loadPublished():CmsDocument{
 const stored=parseCmsDocument(readRaw(PUBLISHED_KEY));
 if(stored)return normalize(stored);
 const initial=createInitialCmsDocument();
 tryPersist(PUBLISHED_KEY,initial);
 return clone(initial);
}

export function publishDraft(document:CmsDocument){
 const candidate=clone(document);
 assertCmsPublishable(candidate);
 const normalized=normalize(candidate);
 const previousPublished=readRaw(PUBLISHED_KEY);
 const now=new Date().toISOString();
 const published:CmsDocument={...normalized,updatedAt:now,publishedAt:now};
 persist(PUBLISHED_KEY,published);
 try{
  persist(DRAFT_KEY,published);
 }catch(error){
  restoreRaw(PUBLISHED_KEY,previousPublished);
  throw error;
 }
 window.dispatchEvent(new CustomEvent('visa-cms-updated',{detail:{source:'published'}}));
 return published;
}

export function resetCms(){
 const previousDraft=readRaw(DRAFT_KEY);
 const previousPublished=readRaw(PUBLISHED_KEY);
 const initial=createInitialCmsDocument();
 try{
  persist(DRAFT_KEY,initial);
  persist(PUBLISHED_KEY,initial);
  return initial;
 }catch(error){
  restoreRaw(DRAFT_KEY,previousDraft);
  restoreRaw(PUBLISHED_KEY,previousPublished);
  throw error;
 }
}

export function resolvePublicDocument(previewDraft=false):CmsDocument{return previewDraft?loadDraft():loadPublished()}
export function findPageByPath(document:CmsDocument,path:string):CmsPage|undefined{const clean=normalizeCmsPath(path);return document.pages.find(page=>page.slug===clean)}
