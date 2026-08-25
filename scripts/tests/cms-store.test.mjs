import test from 'node:test';
import assert from 'node:assert/strict';
import { isCmsDocument, normalizeCmsPath, parseCmsDocument } from '../../apps/web/src/modules/site-cms/cmsDocumentContract.ts';

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
