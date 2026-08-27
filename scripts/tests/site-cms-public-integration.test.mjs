import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const read=path=>readFileSync(resolve(root,path),'utf8');
const header=read('apps/web/src/modules/public-site/components/PublicHeader.tsx');
const footer=read('apps/web/src/modules/public-site/components/PublicFooter.tsx');
const page=read('apps/web/src/modules/public-site/pages/PublicSitePage.tsx');

test('public site honors CMS visibility for global header and footer',()=>{
 assert.ok(header.includes("if(section&&!section.visible)return null"));
 assert.ok(footer.includes("if(section&&!section.visible)return null"));
});

test('public header and footer logos navigate to the site home instead of a page-local anchor',()=>{
 assert.ok(header.includes('href={homeHref()}'));
 assert.ok(footer.includes('href={homeHref()}'));
 assert.equal(header.includes('className="logo" href="#inicio"'),false);
 assert.equal(footer.includes('className="logo logo--light" href="#inicio"'),false);
});

test('public site continues to honor page visibility, publication state and section order',()=>{
 assert.ok(page.includes("candidate.status==='published'||scheduledReady"));
 assert.ok(page.includes('page.sections.filter(section=>section.visible).sort((a,b)=>a.order-b.order)'));
});

test('blank-target floating footer CTA receives noreferrer protection',()=>{
 assert.ok(footer.includes("rel={floatingTarget==='_blank'?'noreferrer':undefined}"));
});
