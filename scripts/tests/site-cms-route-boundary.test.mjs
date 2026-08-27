import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source=readFileSync(resolve(process.cwd(),'apps/web/src/modules/site-cms/siteCmsUtils.ts'),'utf8');

test('site CMS strips BASE_URL only at exact boundaries',()=>{
 assert.ok(source.includes("if(pathname===base)return'/'"));
 assert.ok(source.includes("pathname.startsWith(`${base}/`)"));
 assert.equal(source.includes('pathname.startsWith(base)'),false);
});

test('site CMS tabs use route-segment boundaries instead of broad prefixes',()=>{
 assert.ok(source.includes("isPathAtOrBelow(raw,'/site-admin/pages')"));
 assert.ok(source.includes("isPathAtOrBelow(raw,'/site-admin/media')"));
 assert.ok(source.includes("isPathAtOrBelow(raw,'/site-admin/globals')"));
 assert.ok(source.includes("isPathAtOrBelow(raw,'/site-admin/settings')"));
 assert.equal(source.includes("raw.startsWith('/site-admin/pages')"),false);
});
