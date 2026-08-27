import test from 'node:test';
import assert from 'node:assert/strict';
import { cmsHref, cmsImageSrc, cmsTarget } from '../../apps/web/src/modules/public-site/content/publicContentSafety.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const read=path=>readFileSync(resolve(root,path),'utf8');

test('CMS public href sanitizer accepts only safe navigation forms',()=>{
 assert.equal(cmsHref('#diagnostico'),'#diagnostico');
 assert.equal(cmsHref('/sobre'),'/sobre');
 assert.equal(cmsHref('../contato'),'../contato');
 assert.equal(cmsHref('https://example.com/x'),'https://example.com/x');
 assert.equal(cmsHref('mailto:contato@example.com'),'mailto:contato@example.com');
 assert.equal(cmsHref('tel:+5511999999999'),'tel:+5511999999999');
 assert.equal(cmsHref('javascript:alert(1)'),'#');
 assert.equal(cmsHref('java\nscript:alert(1)'),'#');
 assert.equal(cmsHref('data:text/html;base64,abc'),'#');
 assert.equal(cmsHref('//evil.example/x'),'#');
 assert.equal(cmsHref('\\evil.example\\x'),'#');
});

test('CMS public image sanitizer accepts HTTP HTTPS local paths and safe raster data images',()=>{
 const png='data:image/png;base64,iVBORw0KGgo=';
 assert.equal(cmsImageSrc('https://cdn.example.com/banner.webp'),'https://cdn.example.com/banner.webp');
 assert.equal(cmsImageSrc('/assets/banner.webp'),'/assets/banner.webp');
 assert.equal(cmsImageSrc('./banner.webp'),'./banner.webp');
 assert.equal(cmsImageSrc(png),png);
 assert.equal(cmsImageSrc('javascript:alert(1)'),'');
 assert.equal(cmsImageSrc('data:image/svg+xml;base64,PHN2Zz4='),'');
 assert.equal(cmsImageSrc('blob:https://example.com/id'),'');
 assert.equal(cmsImageSrc('//evil.example/banner.png'),'');
 assert.equal(cmsImageSrc('https://example.com/a\nb.png'),'');
});

test('CMS target sanitizer exposes only self or blank',()=>{
 assert.equal(cmsTarget('_blank'),'_blank');
 assert.equal(cmsTarget('_self'),'_self');
 assert.equal(cmsTarget('frame-name'),'_self');
});

test('all CMS-controlled public image surfaces use the canonical image sanitizer',()=>{
 const sources=[
  'apps/web/src/modules/public-site/components/HeroSection.tsx',
  'apps/web/src/modules/public-site/components/PublicHeader.tsx',
  'apps/web/src/modules/public-site/components/PublicFooter.tsx',
  'apps/web/src/modules/public-site/components/ServicesSection.tsx',
  'apps/web/src/modules/public-site/components/ExperienceSection.tsx',
 ];
 for(const path of sources){
  const source=read(path);
  assert.ok(source.includes('cmsImageSrc'),`${path} must use cmsImageSrc`);
 }
});

test('public metadata never exposes an unvalidated CMS OG image URL',()=>{
 const page=read('apps/web/src/modules/public-site/pages/PublicSitePage.tsx');
 assert.ok(page.includes('isSafeCmsExternalUrl(pageImage)?pageImage'));
 assert.ok(page.includes('isSafeCmsExternalUrl(defaultImage)?defaultImage'));
 assert.equal(page.includes("content=image||''"),false);
});

test('public base-path routing does not strip partial path prefixes',()=>{
 const page=read('apps/web/src/modules/public-site/pages/PublicSitePage.tsx');
 assert.ok(page.includes('pathname===base'));
 assert.ok(page.includes('pathname.startsWith(`${base}/`)'));
 assert.equal(page.includes('pathname.startsWith(base)?'),false);
});
