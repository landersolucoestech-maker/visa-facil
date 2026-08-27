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
    globals:[
      {id:'global-header',type:'header',label:'Header',visible:true,order:0,values:{title:'Visa Fácil'}},
      {id:'global-footer',type:'footer',label:'Footer',visible:true,order:1,values:{copyright:'© 2026 VISA FÁCIL'}},
    ],
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

test('CMS persisted document contract rejects unsupported schema versions',()=>{
  const future=validDocument();
  future.version=2;
  assert.equal(isCmsDocument(future),false);
  assert.equal(parseCmsDocument(JSON.stringify(future)),null);
  assert.ok(cmsPublicationIssues(future).some(issue=>issue.includes('versão do documento CMS')));
});

test('CMS persisted document contract rejects duplicate page and section ids',()=>{
  const duplicatePage=validDocument();
  duplicatePage.pages.push({...structuredClone(duplicatePage.pages[0]),name:'Duplicada'});
  assert.equal(isCmsDocument(duplicatePage),false);

  const duplicateSection=validDocument();
  duplicateSection.pages[0].sections.push(structuredClone(duplicateSection.pages[0].sections[0]));
  assert.equal(isCmsDocument(duplicateSection),false);
});

test('CMS persisted document contract rejects negative or duplicate structural order',()=>{
  const negative=validDocument();
  negative.pages[0].sections[0].order=-1;
  assert.equal(isCmsDocument(negative),false);
  assert.ok(cmsPublicationIssues(negative).some(issue=>issue.includes('ordem inválida')));

  const duplicateOrder=validDocument();
  duplicateOrder.pages[0].sections.push({id:'services',type:'services',label:'Serviços',visible:true,order:0,values:{}});
  assert.equal(isCmsDocument(duplicateOrder),false);
  assert.ok(cmsPublicationIssues(duplicateOrder).some(issue=>issue.includes('mais de uma seção na ordem 0')));

  const duplicateGlobalOrder=validDocument();
  duplicateGlobalOrder.globals[1].order=0;
  assert.equal(isCmsDocument(duplicateGlobalOrder),false);
  assert.ok(cmsPublicationIssues(duplicateGlobalOrder).some(issue=>issue.includes('mais de uma seção na ordem 0')));
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

test('CMS external media and metadata URLs accept only HTTP and HTTPS resources',()=>{
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

test('CMS publication validation blocks invalid site metadata',()=>{
  const blankName=validDocument();
  blankName.settings.siteName='   ';
  assert.ok(cmsPublicationIssues(blankName).some(issue=>issue.includes('nome do site')));

  const invalidSiteUrl=validDocument();
  invalidSiteUrl.settings.siteUrl='javascript:alert(1)';
  assert.ok(cmsPublicationIssues(invalidSiteUrl).some(issue=>issue.includes('URL principal')));

  const invalidCanonical=validDocument();
  invalidCanonical.pages[0].seo.canonicalUrl='data:text/html;base64,abc';
  assert.ok(cmsPublicationIssues(invalidCanonical).some(issue=>issue.includes('Canonical URL')));

  const invalidPageOg=validDocument();
  invalidPageOg.pages[0].seo.ogImage='data:image/png;base64,iVBORw0KGgo=';
  assert.ok(cmsPublicationIssues(invalidPageOg).some(issue=>issue.includes('OG Image da página')));

  const invalidDefaultOg=validDocument();
  invalidDefaultOg.settings.defaultOgImage='/local-preview.png';
  assert.ok(cmsPublicationIssues(invalidDefaultOg).some(issue=>issue.includes('OG Image padrão')));
});

test('CMS publication validation blocks duplicate structural page and global section types',()=>{
  const duplicatePageSection=validDocument();
  duplicatePageSection.pages[0].sections.push({...structuredClone(duplicatePageSection.pages[0].sections[0]),id:'hero-duplicate',order:1});
  assert.ok(cmsPublicationIssues(duplicatePageSection).some(issue=>issue.includes('mais de uma seção')));

  const duplicateGlobal=validDocument();
  duplicateGlobal.globals.push({...structuredClone(duplicateGlobal.globals[0]),id:'global-header-duplicate',order:2});
  assert.ok(cmsPublicationIssues(duplicateGlobal).some(issue=>issue.includes('mais de um bloco global')));
});

test('CMS publication validation blocks unsupported and missing structural blocks',()=>{
  const unknownPageSection=validDocument();
  unknownPageSection.pages[0].sections[0].type='unknown-section';
  assert.ok(cmsPublicationIssues(unknownPageSection).some(issue=>issue.includes('tipo de seção não suportado')));

  const unknownGlobal=validDocument();
  unknownGlobal.globals[0].type='unknown-global';
  assert.ok(cmsPublicationIssues(unknownGlobal).some(issue=>issue.includes('bloco global não suportado')));

  const missingFooter=validDocument();
  missingFooter.globals=missingFooter.globals.filter(section=>section.type!=='footer');
  assert.ok(cmsPublicationIssues(missingFooter).some(issue=>issue.includes('bloco global obrigatório “footer” está ausente')));
});

test('CMS publication validation blocks unsafe public form field identities and controls',()=>{
  const document=validDocument();
  document.pages[0].sections.push({
    id:'contact',type:'contact',label:'Contato',visible:true,order:1,
    values:{formFields:[
      {name:'consent',label:'Reservado',type:'hidden',placeholder:'',required:true,options:''},
      {name:'email',label:'E-mail',type:'email',placeholder:'',required:true,options:''},
      {name:'EMAIL',label:'Duplicado',type:'email',placeholder:'',required:false,options:''},
      {name:'destino',label:'Destino',type:'select',placeholder:'Selecione',required:true,options:''},
    ]},
  });
  const issues=cmsPublicationIssues(document);
  assert.ok(issues.some(issue=>issue.includes('nome técnico inválido ou reservado')));
  assert.ok(issues.some(issue=>issue.includes('tipo não suportado')));
  assert.ok(issues.some(issue=>issue.includes('nome técnico duplicado')));
  assert.ok(issues.some(issue=>issue.includes('precisa ter pelo menos uma opção')));
});
