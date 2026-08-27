import test from 'node:test';
import assert from 'node:assert/strict';
import { CmsPublicationError, assertCmsPublishable } from '../../apps/web/src/modules/site-cms/cmsDocumentContract.ts';

function validDocument(){
 return {
  version:1,
  updatedAt:'2026-08-27T20:00:00.000Z',
  publishedAt:null,
  pages:[{
   id:'home',name:'Home',slug:'/',status:'published',scheduledAt:'',updatedAt:'2026-08-27T20:00:00.000Z',
   seo:{title:'Home',description:'',ogImage:'',canonicalUrl:'',noIndex:false},
   sections:[{id:'hero',type:'hero',label:'Hero',visible:true,order:0,values:{title:'Visa Fácil'}}],
  }],
  globals:[
   {id:'global-header',type:'header',label:'Header',visible:true,order:0,values:{}},
   {id:'global-footer',type:'footer',label:'Footer',visible:true,order:1,values:{}},
  ],
  media:[],
  settings:{siteName:'VISA FÁCIL',siteUrl:'',locale:'pt-BR',defaultOgImage:'',organizationName:'VISA FÁCIL'},
 };
}

function expectPublicationError(document,fragment){
 assert.throws(
  ()=>assertCmsPublishable(document),
  error=>error instanceof CmsPublicationError&&error.issues.some(issue=>issue.includes(fragment)),
 );
}

test('pure publication guard rejects invalid metadata before storage is involved',()=>{
 const document=validDocument();
 document.settings.siteName='   ';
 expectPublicationError(document,'nome do site');
});

test('pure publication guard rejects an empty page set before normalization can inject defaults',()=>{
 const document=validDocument();
 document.pages=[];
 expectPublicationError(document,'página inicial');
});

test('pure publication guard rejects missing globals before normalization can inject defaults',()=>{
 const document=validDocument();
 document.globals=[];
 expectPublicationError(document,'bloco global obrigatório');
});

test('pure publication guard accepts a structurally publishable document',()=>{
 assert.doesNotThrow(()=>assertCmsPublishable(validDocument()));
});
