import test from 'node:test';
import assert from 'node:assert/strict';
import { CmsPublicationError, publishDraft } from '../../apps/web/src/modules/site-cms/siteStore.ts';

function invalidDocument(){
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
  settings:{siteName:'   ',siteUrl:'',locale:'pt-BR',defaultOgImage:'',organizationName:'VISA FÁCIL'},
 };
}

test('publishDraft rejects an invalid document before touching browser storage',()=>{
 assert.throws(
  ()=>publishDraft(invalidDocument()),
  error=>error instanceof CmsPublicationError&&error.issues.some(issue=>issue.includes('nome do site')),
 );
});
