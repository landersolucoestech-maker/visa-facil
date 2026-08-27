import test from 'node:test';
import assert from 'node:assert/strict';
import { cmsPublicationIssues } from '../../apps/web/src/modules/site-cms/cmsDocumentContract.ts';

const timestamp='2026-08-27T12:00:00.000Z';
function field(index,overrides={}){return{name:`campo${index}`,label:`Campo ${index}`,type:'text',placeholder:'',required:false,options:'',...overrides}}
function documentWithFields(fields){return{
 version:1,updatedAt:timestamp,publishedAt:timestamp,
 pages:[{id:'home',name:'Home',slug:'/',status:'published',scheduledAt:'',updatedAt:timestamp,seo:{title:'Home',description:'',ogImage:'',canonicalUrl:'',noIndex:false},sections:[{id:'contact',type:'contact',label:'Contato',visible:true,order:0,values:{formFields:fields}}]}],
 globals:[{id:'header',type:'header',label:'Header',visible:true,order:0,values:{}},{id:'footer',type:'footer',label:'Footer',visible:true,order:1,values:{}}],
 media:[],settings:{siteName:'VISA FÁCIL',siteUrl:'',locale:'pt-BR',defaultOgImage:'',organizationName:'VISA FÁCIL'},
}}

test('CMS publication caps public forms at 30 fields',()=>{
 const fields=Array.from({length:31},(_,index)=>field(index+1));
 assert.ok(cmsPublicationIssues(documentWithFields(fields)).some(issue=>issue.includes('limite de 30 campos')));
});

test('CMS publication caps select fields at 100 options',()=>{
 const options=Array.from({length:101},(_,index)=>`Opção ${index+1}`).join('\n');
 assert.ok(cmsPublicationIssues(documentWithFields([field(1,{type:'select',options})])).some(issue=>issue.includes('limite de 100 opções')));
});

test('CMS publication requires usable labels and typed form configuration',()=>{
 const issues=cmsPublicationIssues(documentWithFields([field(1,{label:'',placeholder:false,required:'maybe',options:false})]));
 assert.ok(issues.some(issue=>issue.includes('precisa de um label')));
 assert.ok(issues.some(issue=>issue.includes('placeholder inválido')));
 assert.ok(issues.some(issue=>issue.includes('obrigatoriedade inválida')));
 assert.ok(issues.some(issue=>issue.includes('opções inválida')));
});

test('a normal public form remains publishable',()=>{
 const fields=[field(1,{name:'nome',label:'Nome',required:true}),field(2,{name:'destino',label:'Destino',type:'select',options:'EUA\nCanadá'})];
 assert.deepEqual(cmsPublicationIssues(documentWithFields(fields)),[]);
});
