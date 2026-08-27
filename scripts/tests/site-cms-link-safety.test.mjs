import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const read=path=>readFileSync(resolve(root,path),'utf8');
const context=read('apps/web/src/modules/public-site/content/SiteContentContext.tsx');
const safety=read('apps/web/src/modules/public-site/content/publicContentSafety.ts');
const linkSurfaces=[
 'apps/web/src/modules/public-site/components/PublicHeader.tsx',
 'apps/web/src/modules/public-site/components/PublicFooter.tsx',
 'apps/web/src/modules/public-site/components/HeroSection.tsx',
 'apps/web/src/modules/public-site/components/ServicesSection.tsx',
 'apps/web/src/modules/public-site/components/ExperienceSection.tsx',
 'apps/web/src/modules/public-site/components/ProcessSection.tsx',
 'apps/web/src/modules/public-site/components/FaqSection.tsx',
];

test('CMS public link sanitizer allows only explicitly supported absolute protocols',()=>{
 assert.ok(context.includes("export { cmsHref, cmsImageSrc, cmsTarget } from './publicContentSafety'"));
 assert.ok(safety.includes("new Set(['http:','https:','mailto:','tel:'])"));
 assert.ok(safety.includes("href.startsWith('#')"));
 assert.ok(safety.includes("new URL(href,URL_BASE)"));
 assert.ok(safety.includes('SAFE_LINK_PROTOCOLS.has(parsed.protocol)'));
 assert.ok(safety.includes('parsed.origin===URL_BASE_ORIGIN'));
 assert.ok(safety.includes("value==='_blank'?'_blank':'_self'"));
});

test('editable CMS hrefs are routed through the canonical public link sanitizer',()=>{
 for(const path of linkSurfaces){
  const source=read(path);
  assert.equal(/href=\{cmsText\(/.test(source),false,`${path} still renders cmsText directly as href`);
  assert.equal(/href=\{itemText\(/.test(source),false,`${path} still renders itemText directly as href`);
  assert.ok(source.includes('cmsHref')||!source.includes('href={'),`${path} does not reference cmsHref`);
 }
});

test('editable blank-target links keep noreferrer protection on public surfaces',()=>{
 for(const path of linkSurfaces){
  const source=read(path);
  if(source.includes("'_blank'"))assert.ok(source.includes("'noreferrer'"),`${path} is missing noreferrer handling`);
 }
});
