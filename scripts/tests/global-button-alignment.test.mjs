import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const baseline=readFileSync(resolve(root,'apps/web/src/styles/app-baseline.css'),'utf8');

test('every project button centers its visible content globally',()=>{
  const match=baseline.match(/button\s*\{([\s\S]*?)\}/);
  assert.ok(match,'global button rule not found');
  const rule=match[1];
  assert.ok(rule.includes('text-align:center!important'));
  assert.ok(rule.includes('justify-content:center!important'));
  assert.ok(rule.includes('align-items:center!important'));
});
