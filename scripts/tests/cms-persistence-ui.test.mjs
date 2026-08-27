import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const store=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/siteStore.ts'),'utf8');
const contract=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/cmsDocumentContract.ts'),'utf8');
const app=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/SiteCmsApp.tsx'),'utf8');
const pages=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/CmsPagesView.tsx'),'utf8');
const resources=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/CmsResourceViews.tsx'),'utf8');
const overview=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/CmsOverviewView.tsx'),'utf8');
const editors=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/CmsEditors.tsx'),'utf8');

test('CMS user-triggered persistence failures are surfaced instead of silently succeeding',()=>{
  assert.ok(store.includes('export class CmsStorageError extends Error'));
  assert.ok(store.includes('throw new CmsStorageError()'));
  assert.ok(app.includes('error instanceof CmsStorageError'));
});

test('CMS publication contract is enforced before storage normalization as well as in the UI',()=>{
  assert.ok(contract.includes('export class CmsPublicationError extends Error'));
  assert.ok(contract.includes('export function assertCmsPublishable'));
  assert.ok(store.includes('const candidate=clone(document)'));
  assert.ok(store.includes('assertCmsPublishable(candidate)'));
  assert.ok(store.includes('const normalized=normalize(candidate)'));
  assert.ok(store.indexOf('assertCmsPublishable(candidate)')<store.indexOf('const normalized=normalize(candidate)'));
  assert.ok(app.includes('error instanceof CmsPublicationError'));
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

test('CMS page builder prevents duplicate structural section types',()=>{
  assert.ok(pages.includes('page.sections.some(section=>section.type===type)'));
  assert.ok(pages.includes('já existe nesta página'));
  assert.ok(pages.includes('disabled={used}'));
  assert.ok(pages.includes("used?' · adicionada':''"));
});

test('CMS media UI blocks unsafe URLs, unsafe upload formats and removal of referenced assets',()=>{
  assert.ok(resources.includes('isSafeCmsExternalUrl'));
  assert.ok(resources.includes('cmsMediaReferenceCount'));
  assert.ok(resources.includes('a mídia está em uso'));
  assert.ok(resources.includes("new Set(['image/png','image/jpeg','image/gif','image/webp','image/avif'])"));
  assert.ok(resources.includes('Tipo de arquivo não suportado. Envie PNG, JPEG, GIF, WebP, AVIF ou PDF.'));
  assert.ok(resources.includes('SAFE_MEDIA_UPLOAD_ACCEPT'));
  assert.equal(resources.includes('accept="image/*'),false);
});

test('CMS settings and SEO surface invalid publishable metadata while editing',()=>{
  assert.ok(resources.includes('A URL principal deve usar http:// ou https://.'));
  assert.ok(resources.includes('Informe o nome do site.'));
  assert.ok(resources.includes('type="url"'));
  assert.ok(editors.includes('isSafeCmsExternalUrl'));
  assert.ok(editors.includes('A Canonical URL deve usar http:// ou https://.'));
  assert.ok(editors.includes('role="alert"'));
});
