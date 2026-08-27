import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonicalCmsLocale, cmsPublicationIssues, isValidCmsLocale } from '../../apps/web/src/modules/site-cms/cmsDocumentContract.ts';

const root=process.cwd();
const publicPage=readFileSync(resolve(root,'apps/web/src/modules/public-site/pages/PublicSitePage.tsx'),'utf8');
const resources=readFileSync(resolve(root,'apps/web/src/modules/site-cms/CmsResourceViews.tsx'),'utf8');

function documentWithLocale(locale){
 const timestamp='2026-08-27T12:00:00.000Z';
 return {
  version:1,updatedAt:timestamp,publishedAt:timestamp,
  pages:[{id:'home',name:'Home',slug:'/',status:'published',scheduledAt:'',updatedAt:timestamp,seo:{title:'Home',description:'',ogImage:'',canonicalUrl:'',noIndex:false},sections:[]}],
  globals:[
   {id:'global-header',type:'header',label:'Header',visible:true,order:0,values:{}},
   {id:'global-footer',type:'footer',label:'Footer',visible:true,order:1,values:{}},
  ],
  media:[],settings:{siteName:'VISA FÁCIL',siteUrl:'',locale,defaultOgImage:'',organizationName:'VISA FÁCIL'},
 };
}

test('CMS locale validation accepts canonical BCP-47 tags and rejects malformed values',()=>{
 assert.equal(canonicalCmsLocale('pt-br'),'pt-BR');
 assert.equal(canonicalCmsLocale('en-us'),'en-US');
 assert.equal(isValidCmsLocale('pt-BR'),true);
 assert.equal(isValidCmsLocale(''),false);
 assert.equal(isValidCmsLocale('portugues-brasil'),false);
});

test('CMS publication rejects an invalid site locale',()=>{
 const issues=cmsPublicationIssues(documentWithLocale('portugues-brasil'));
 assert.ok(issues.some(issue=>issue.includes('BCP-47')));
 assert.deepEqual(cmsPublicationIssues(documentWithLocale('pt-BR')),[]);
});

test('public site applies the validated CMS locale to the html document with a safe fallback',()=>{
 assert.ok(publicPage.includes("window.document.documentElement.lang=canonicalCmsLocale(cmsDocument.settings.locale)||'pt-BR'"));
});

test('CMS settings surface locale validation while editing',()=>{
 assert.ok(resources.includes('isValidCmsLocale(settings.locale)'));
 assert.ok(resources.includes('Informe um locale BCP-47 válido, como pt-BR ou en-US.'));
});
