import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source=readFileSync(resolve(process.cwd(),'apps/web/src/RootApplication.tsx'),'utf8');

test('root router strips BASE_URL only at an exact path boundary',()=>{
 assert.ok(source.includes("pathname===base"));
 assert.ok(source.includes("pathname.startsWith(`${base}/`)"));
 assert.equal(source.includes('base && pathname.startsWith(base)'),false);
});

test('root router normalizes root BASE_URL without creating a fake prefix',()=>{
 assert.ok(source.includes("return base==='/'?'':base"));
});
