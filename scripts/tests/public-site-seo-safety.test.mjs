import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const page=readFileSync(resolve(process.cwd(),'apps/web/src/modules/public-site/pages/PublicSitePage.tsx'),'utf8');

test('public not-found routes are explicitly non-indexable and clear canonical metadata',()=>{
 assert.ok(page.includes('`Página não encontrada | ${siteName}`'));
 assert.ok(page.includes("ensureMeta('robots').content='noindex,nofollow'"));
 assert.ok(page.includes("setCanonical('')"));
});

test('draft CMS previews are always non-indexable regardless of page SEO preference',()=>{
 assert.ok(page.includes("ensureMeta('robots').content=draftPreview?'noindex,nofollow':page.seo.noIndex?'noindex,nofollow':'index,follow'"));
});

test('canonical metadata remains restricted to validated HTTP or HTTPS URLs',()=>{
 assert.ok(page.includes('isSafeCmsExternalUrl(explicitCanonical)'));
 assert.ok(page.includes('isSafeCmsExternalUrl(siteUrl)'));
 assert.ok(page.includes('setCanonical(canonical)'));
});
