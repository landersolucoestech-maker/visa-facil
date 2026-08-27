import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const store=readFileSync(resolve(root,'apps/web/src/modules/site-cms/siteStore.ts'),'utf8');
const cms=readFileSync(resolve(root,'apps/web/src/modules/site-cms/SiteCmsApp.tsx'),'utf8');
const workspaces=readFileSync(resolve(root,'apps/web/src/modules/workspaces/WorkspaceSelectorApp.tsx'),'utf8');

test('CMS storage access is guarded and writes are verified',()=>{
  assert.ok(store.includes("function storage(){try{return typeof localStorage==='undefined'?null:localStorage}catch{return null}}"));
  assert.ok(store.includes('if(store.getItem(key)!==raw)'));
  assert.ok(store.includes('throw new CmsStorageError()'));
  assert.equal(store.includes('parseCmsDocument(localStorage.getItem(DRAFT_KEY))'),false);
  assert.equal(store.includes('parseCmsDocument(localStorage.getItem(PUBLISHED_KEY))'),false);
});

test('CMS local publish restores the previous published snapshot on partial failure',()=>{
  assert.ok(store.includes('const previousPublished=readRaw(PUBLISHED_KEY)'));
  assert.ok(store.includes('restoreRaw(PUBLISHED_KEY,previousPublished)'));
  assert.equal(store.includes('localStorage.removeItem(PUBLISHED_KEY)'),false);
});

test('CMS reset preserves both prior snapshots if a local reset fails',()=>{
  assert.ok(store.includes('const previousDraft=readRaw(DRAFT_KEY)'));
  assert.ok(store.includes('const previousPublished=readRaw(PUBLISHED_KEY)'));
  assert.ok(store.includes('restoreRaw(DRAFT_KEY,previousDraft)'));
  assert.ok(store.includes('restoreRaw(PUBLISHED_KEY,previousPublished)'));
});

test('CMS and workspace copy make browser-local publication explicit',()=>{
  assert.ok(cms.includes('Conteúdo publicado localmente neste navegador.'));
  assert.ok(cms.includes('Publicar localmente'));
  assert.ok(workspaces.includes('publicação local do site institucional'));
  assert.ok(workspaces.includes('Rascunho, prévia & publicação local'));
});
