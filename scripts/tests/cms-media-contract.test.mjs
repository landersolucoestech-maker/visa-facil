import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cmsPublicationIssues, isCmsDocument, isSafeCmsMediaUrl } from '../../apps/web/src/modules/site-cms/cmsDocumentContract.ts';

const resources=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/CmsResourceViews.tsx'),'utf8');
const timestamp='2026-08-27T12:00:00.000Z';
function documentWithMedia(media){return{
 version:1,updatedAt:timestamp,publishedAt:timestamp,
 pages:[{id:'home',name:'Home',slug:'/',status:'published',scheduledAt:'',updatedAt:timestamp,seo:{title:'Home',description:'',ogImage:'',canonicalUrl:'',noIndex:false},sections:[]}],
 globals:[{id:'header',type:'header',label:'Header',visible:true,order:0,values:{}},{id:'footer',type:'footer',label:'Footer',visible:true,order:1,values:{}}],
 media,settings:{siteName:'VISA FÁCIL',siteUrl:'',locale:'pt-BR',defaultOgImage:'',organizationName:'VISA FÁCIL'},
}}

test('CMS media URL contract accepts only HTTP(S), raster data images and PDF data documents',()=>{
 assert.equal(isSafeCmsMediaUrl('image','https://cdn.example.com/image'),true);
 assert.equal(isSafeCmsMediaUrl('document','https://cdn.example.com/file'),true);
 assert.equal(isSafeCmsMediaUrl('image','data:image/png;base64,iVBORw0KGgo='),true);
 assert.equal(isSafeCmsMediaUrl('document','data:application/pdf;base64,JVBERi0xLjQ='),true);
 assert.equal(isSafeCmsMediaUrl('image','data:image/svg+xml;base64,PHN2Zz4='),false);
 assert.equal(isSafeCmsMediaUrl('document','data:text/html;base64,PGgxPg=='),false);
 assert.equal(isSafeCmsMediaUrl('image','javascript:alert(1)'),false);
 assert.equal(isSafeCmsMediaUrl('document','blob:https://example.com/id'),false);
});

test('persisted CMS documents reject media URLs incompatible with their declared kind',()=>{
 const unsafe=documentWithMedia([{id:'m1',name:'SVG',url:'data:image/svg+xml;base64,PHN2Zz4=',alt:'',kind:'image',createdAt:timestamp}]);
 assert.equal(isCmsDocument(unsafe),false);
 assert.ok(cmsPublicationIssues(unsafe).some(issue=>issue.includes('URL incompatível com o tipo imagem')));
 const safe=documentWithMedia([{id:'m1',name:'PNG',url:'data:image/png;base64,iVBORw0KGgo=',alt:'',kind:'image',createdAt:timestamp}]);
 assert.equal(isCmsDocument(safe),true);
});

test('external CMS media type is explicit instead of guessed from URL extension',()=>{
 assert.ok(resources.includes("useState<CmsMediaItem['kind']>('image')"));
 assert.ok(resources.includes('Tipo da URL externa'));
 assert.ok(resources.includes('kind:externalKind'));
 assert.ok(resources.includes('isSafeCmsMediaUrl(item.kind,item.url)'));
 assert.equal(resources.includes("/\\.(pdf)(\\?|$)/i.test(normalized)"),false);
});
