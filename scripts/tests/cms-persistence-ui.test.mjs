import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const store=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/siteStore.ts'),'utf8');
const app=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/SiteCmsApp.tsx'),'utf8');
const pages=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/CmsPagesView.tsx'),'utf8');
const resources=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/CmsResourceViews.tsx'),'utf8');
const overview=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/CmsOverviewView.tsx'),'utf8');

test('CMS user-triggered persistence failures are surfaced instead of silently succeeding',()=>{
  assert.ok(store.includes('export class CmsStorageError extends Error'));
  assert.ok(store.includes('throw new CmsStorageError()'));
  assert.ok(app.includes('error instanceof CmsStorageError'));
});

test('CMS never describes browser-local publication as a central production publish',()=>{
  assert.ok(app.includes('Conteúdo publicado localmente neste navegador.'));
  assert.ok(app.includes('Publicar localmente'));
  assert.ok(app.includes('Rascunho salvo localmente'));
  assert.ok(overview.includes('Última publicação local'));
  assert.ok(overview.includes('snapshot publicado neste navegador'));
  assert.ok(overview.includes('Publicação central exige backend.'));
  assert.equal(overview.includes('Envie a versão aprovada ao site.'),false);
});

test('CMS warns before leaving with unsaved browser-local changes',()=>{
  assert.ok(app.includes("window.addEventListener('beforeunload',warn)"));
  assert.ok(app.includes("window.removeEventListener('beforeunload',warn)"));
  assert.ok(app.includes("event.returnValue=''"));
});

test('CMS preview and reset synchronize the in-memory clean state with persisted local data',()=>{
  assert.ok(app.includes('const next=saveDraft(document);setDocumentState(next);setDirty(false)'));
  assert.ok(app.includes('const next=resetCms();setDocumentState(next)'));
  assert.ok(app.includes("showNotice('CMS local restaurado para o conteúdo inicial.'"));
  assert.ok(resources.includes('onReset:()=>void'));
  assert.ok(resources.includes('onReset()'));
  assert.equal(resources.includes('setDocument(resetCms())'),false);
});

test('CMS publication and page editing enforce canonical route and schedule integrity',()=>{
  assert.ok(app.includes('cmsPublicationIssues(document)'));
  assert.ok(app.includes('Publicação bloqueada:'));
  assert.ok(pages.includes('normalizeCmsSlug'));
  assert.ok(pages.includes('slugExists'));
  assert.ok(pages.includes("disabled={page.slug==='/'}"));
  assert.ok(pages.includes('isValidCmsSchedule(page.scheduledAt)'));
  assert.ok(pages.includes('Já existe outra página com esse slug.'));
});

test('CMS media UI blocks unsafe URLs and removal of referenced assets',()=>{
  assert.ok(resources.includes('isSafeCmsExternalUrl'));
  assert.ok(resources.includes('cmsMediaReferenceCount'));
  assert.ok(resources.includes('a mídia está em uso'));
  assert.ok(resources.includes('Tipo de arquivo não suportado. Envie uma imagem ou PDF.'));
});
