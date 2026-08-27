import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source=readFileSync(resolve(process.cwd(),'apps/web/src/components/CrmSidebar.tsx'),'utf8');

test('CRM sidebar strips BASE_URL only at exact segment boundaries',()=>{
 assert.ok(source.includes('pathname===base'));
 assert.ok(source.includes('pathname.startsWith(`${base}/`)'));
 assert.equal(source.includes('pathname.startsWith(base)'),false);
});
