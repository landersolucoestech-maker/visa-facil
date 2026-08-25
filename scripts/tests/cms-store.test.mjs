import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialCmsDocument } from '../../apps/web/src/modules/site-cms/siteSchema.ts';
import { findPageByPath, loadDraft, loadPublished } from '../../apps/web/src/modules/site-cms/siteStore.ts';

const DRAFT_KEY='visa-facil.cms.draft.v1';
const PUBLISHED_KEY='visa-facil.cms.published.v1';

function memoryStorage(initial={}){
  const values=new Map(Object.entries(initial));
  return {
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key),
    clear:()=>values.clear(),
  };
}

function withLocalStorage(initial,callback){
  const previous=globalThis.localStorage;
  globalThis.localStorage=memoryStorage(initial);
  try{return callback();}
  finally{
    if(previous===undefined)delete globalThis.localStorage;
    else globalThis.localStorage=previous;
  }
}

test('CMS draft rejects malformed persisted JSON and falls back to a valid initial document',()=>withLocalStorage({[DRAFT_KEY]:'{broken'},()=>{
  const draft=loadDraft();
  assert.ok(draft.pages.length>0);
  assert.ok(draft.globals.length>0);
  assert.equal(typeof draft.version,'number');
}));

test('CMS rejects duplicate page ids instead of accepting an ambiguous persisted document',()=>{
  const invalid=createInitialCmsDocument();
  invalid.pages=[...invalid.pages,{...structuredClone(invalid.pages[0]),name:'Duplicada'}];
  return withLocalStorage({[DRAFT_KEY]:JSON.stringify(invalid)},()=>{
    const draft=loadDraft();
    const ids=draft.pages.map(page=>page.id);
    assert.equal(ids.length,new Set(ids).size);
    assert.equal(draft.pages.some(page=>page.name==='Duplicada'),false);
  });
});

test('CMS rejects invalid media entries and invalid page statuses from persistence',()=>{
  const invalid=createInitialCmsDocument();
  invalid.pages[0].status='invalid-status';
  invalid.media=[{id:'media-1',name:'Arquivo',url:'/x',alt:'',kind:'executable',createdAt:new Date().toISOString()}];
  return withLocalStorage({[PUBLISHED_KEY]:JSON.stringify(invalid)},()=>{
    const published=loadPublished();
    assert.notEqual(published.pages[0]?.status,'invalid-status');
    assert.equal(published.media.some(item=>item.kind==='executable'),false);
  });
});

test('CMS path lookup normalizes trailing slashes without changing the canonical slug',()=>{
  const document=createInitialCmsDocument();
  const page=document.pages.find(item=>item.slug!=='/')??document.pages[0];
  assert.ok(page);
  const lookup=page.slug==='/'?'/':`${page.slug}/`;
  assert.equal(findPageByPath(document,lookup)?.id,page.id);
});
