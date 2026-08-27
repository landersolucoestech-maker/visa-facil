import test from 'node:test';
import assert from 'node:assert/strict';
import { cmsPublicationIssues, isCmsDocument } from '../../apps/web/src/modules/site-cms/cmsDocumentContract.ts';

function validDocument(){
 return {
  version:1,
  updatedAt:'2026-08-27T20:00:00.000Z',
  publishedAt:'2026-08-27T20:00:00.000Z',
  pages:[{
   id:'home',name:'Home',slug:'/',status:'published',scheduledAt:'',updatedAt:'2026-08-27T20:00:00.000Z',
   seo:{title:'Home',description:'',ogImage:'',canonicalUrl:'',noIndex:false},
   sections:[{id:'hero',type:'hero',label:'Hero',visible:true,order:0,values:{}}],
  }],
  globals:[
   {id:'global-header',type:'header',label:'Header',visible:true,order:0,values:{}},
   {id:'global-footer',type:'footer',label:'Footer',visible:true,order:1,values:{}},
  ],
  media:[{id:'media-1',name:'Imagem',url:'https://example.com/image.webp',alt:'',kind:'image',createdAt:'2026-08-27T20:00:00.000Z'}],
  settings:{siteName:'VISA FÁCIL',siteUrl:'',locale:'pt-BR',defaultOgImage:'',organizationName:'VISA FÁCIL'},
 };
}

test('CMS persisted contract rejects invalid document timestamps',()=>{
 const document=validDocument();
 document.updatedAt='not-a-date';
 assert.equal(isCmsDocument(document),false);
 assert.ok(cmsPublicationIssues(document).some(issue=>issue.includes('data de atualização do documento CMS')));
});

test('CMS persisted contract rejects invalid page timestamps',()=>{
 const document=validDocument();
 document.pages[0].updatedAt='broken';
 assert.equal(isCmsDocument(document),false);
 assert.ok(cmsPublicationIssues(document).some(issue=>issue.includes('data de atualização inválida')));
});

test('CMS persisted contract rejects invalid media timestamps',()=>{
 const document=validDocument();
 document.media[0].createdAt='broken';
 assert.equal(isCmsDocument(document),false);
 assert.ok(cmsPublicationIssues(document).some(issue=>issue.includes('data de criação inválida')));
});

test('CMS persisted contract accepts real ISO timestamps',()=>{
 assert.equal(isCmsDocument(validDocument()),true);
 assert.deepEqual(cmsPublicationIssues(validDocument()),[]);
});
