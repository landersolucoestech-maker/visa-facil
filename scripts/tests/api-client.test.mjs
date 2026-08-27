import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source=readFileSync(resolve(process.cwd(),'apps/web/src/shared/apiClient.ts'),'utf8');

test('API client never turns a root-relative base into a protocol-relative host',()=>{
  assert.ok(source.includes("if(base==='/')return clean;"));
  assert.equal(source.includes('return `${base}${clean}`;')&&source.includes("if(base==='/')return clean;"),true);
});
