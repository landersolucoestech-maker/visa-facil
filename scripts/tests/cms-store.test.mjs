import test from 'node:test';
import assert from 'node:assert/strict';
import { cmsMediaReferenceCount, cmsPublicationIssues, isCmsDocument, isSafeCmsExternalUrl, isValidCmsSchedule, normalizeCmsPath, normalizeCmsSlug, parseCmsDocument } from '../../apps/web/src/modules/site-cms/cmsDocumentContract.ts';

function validDocument(){
  return {
    version:1,
    updatedAt:'2026-08-25T12:00:00.000Z',
    publishedAt:'2026-08-25T12:00:00.000Z',
    pages:[{
      id:'home',name:'Home',slug:'/',status:'published',scheduledAt:'',updatedAt:'2026-08-25T12:00:00.000Z',
      seo:{title:'Home',description:'Descrição',ogImage:'',canonicalUrl:'',noIndex:false},
      sections:[{id:'hero',type:'hero',label:'Hero',visible:true,order:0,values:{title:'Visa Fácil',visible:true,items:[{label:'Item',enabled:true}]}}],
    }],
    globals:[{id:'global-header',type:'header',label:'Header',visible:true,order:0,values:{title:'Visa Fácil'}}],
    media:[],
    settings:{siteName:'VISA FÁCIL',siteUrl:'',locale:'pt-BR',defaultOgImage:'',organizationName:'VISA FÁCIL'},
  };
}

test('CMS persisted document contract accepts a complete valid document',()=>{
  const document=validDocument();
  assert.equal(isCmsDocument(document),true);
  assert.deepEqual(parseCmsDocument(JSON.stringify(document)),document);
});

test('CMS persisted document contract rejects malformed JSON',()=>{
  assert.equal(parseCmsDocument('{broken'),null);
});

test('CMS persisted document contract rejects duplicate page and section ids',()=>{
  const duplicatePage=validDocument();
  duplicatePage.pages.push({...structuredClone(duplicatePage.pages[0]),name:'Duplicada'});
  assert.equal(isCmsDocument(duplicatePage),false);

  const duplicateSection=validDocument();
  duplicateSection.pages[0].sections.push(structuredClone(duplicateSection.pages[0].sections[0]));
  assert.equal(isCmsDocument(duplicateSection),false);
});

test('CMS persisted document contract rejects invalid page status and media kind',()=>{
  const invalidStatus=validDocument();
  invalidStatus.pages[0].status='invalid-status';
  assert.equal(isCmsDocument(invalidStatus),false);

  const invalidMedia=validDocument();
  invalidMedia.media=[{id:'media-1',name:'Arquivo',url:'/x',alt:'',kind:'executable',createdAt:'2026-08-25T12:00:00.000Z'}];
  assert.equal(isCmsDocument(invalidMedia),false);
});

test('CMS path normalization removes trailing slashes and preserves root',()=>{
  assert.equal(normalizeCmsPath('/'),'/');
  assert.equal(normalizeCmsPath('/servicos/'),'/servicos');
  assert.equal(normalizeCmsPath('/servicos///'),'/servicos');
  assert.equal(normalizeCmsPath(''),'/');
});

test('CMS slug normalization produces canonical stable routes',()=>{
  assert.equal(normalizeCmsSlug(' Sobre Nós '),'/sobre-nos');
  assert.equal(normalizeCmsSlug('/Serviços/Europa/'),'/servicos/europa');
  assert.equal(normalizeCmsSlug('/'),'/');
  assert.equal(normalizeCmsSlug('///'),'/');
});

test('CMS scheduling accepts real datetime values and rejects empty or malformed values',()=>{
  assert.equal(isValidCmsSchedule('2026-08-27T19:00'),true);
  assert.equal(isValidCmsSchedule(''),false);
  assert.equal(isValidCmsSchedule('not-a-date'),false);
});

test('CMS external media URLs accept only HTTP and HTTPS resources',()=>{
  assert.equal(isSafeCmsExternalUrl('https://cdn.example.com/banner.webp'),true);
  assert.equal(isSafeCmsExternalUrl('http://example.com/file.pdf'),true);
  assert.equal(isSafeCmsExternalUrl('javascript:alert(1)'),false);
  assert.equal(isSafeCmsExternalUrl('data:text/html;base64,abc'),false);
  assert.equal(isSafeCmsExternalUrl('/relative-image.webp'),false);
});

test('CMS counts media references across SEO, sections, repeaters, globals and settings',()=>{
  const document=validDocument();
  const url='https://cdn.example.com/shared.webp';
  document.settings.defaultOgImage=url;
  document.pages[0].seo.ogImage=url;
  document.pages[0].sections[0].values.image=url;
  document.pages[0].sections[0].values.items=[{image:url,label:'Item'}];
  document.globals[0].values.logo=url;
  assert.equal(cmsMediaReferenceCount(document,url),5);
  assert.equal(cmsMediaReferenceCount(document,'https://cdn.example.com/unused.webp'),0);
});

test('CMS publication validation blocks duplicate routes, missing home and invalid schedules',()=>{
  const valid=validDocument();
  assert.deepEqual(cmsPublicationIssues(valid),[]);

  const duplicate=validDocument();
  duplicate.pages.push({...structuredClone(duplicate.pages[0]),id:'about',name:'Sobre',slug:'/sobre',status:'draft'});
  duplicate.pages.push({...structuredClone(duplicate.pages[0]),id:'about-2',name:'Sobre 2',slug:'/SOBRE',status:'draft'});
  assert.ok(cmsPublicationIssues(duplicate).some(issue=>issue.includes('mesmo slug')));

  const scheduled=validDocument();
  scheduled.pages[0].status='scheduled';
  scheduled.pages[0].scheduledAt='';
  assert.ok(cmsPublicationIssues(scheduled).some(issue=>issue.includes('não possui data e horário válidos')));

  const withoutHome=validDocument();
  withoutHome.pages[0].slug='/home';
  assert.ok(cmsPublicationIssues(withoutHome).some(issue=>issue.includes('página inicial')));
});
