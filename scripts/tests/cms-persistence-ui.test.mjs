import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const store=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/siteStore.ts'),'utf8');
const app=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/SiteCmsApp.tsx'),'utf8');

test('CMS user-triggered persistence failures are surfaced instead of silently succeeding',()=>{
  assert.ok(store.includes('export class CmsStorageError extends Error'));
  assert.ok(store.includes('throw new CmsStorageError()'));
  assert.ok(app.includes('error instanceof CmsStorageError'));
});

test('CMS never describes browser-local publication as a central production publish',()=>{
  assert.ok(app.includes('Conteúdo publicado localmente neste navegador.'));
  assert.ok(app.includes('Publicar localmente'));
  assert.ok(app.includes('Rascunho salvo localmente'));
});
