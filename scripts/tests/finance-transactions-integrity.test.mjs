import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source=readFileSync(resolve(process.cwd(),'apps/web/src/modules/finance/FinanceTransactionsApp.tsx'),'utf8');

test('finance transactions use the local browser date for due and overdue states',()=>{
  assert.ok(source.includes("import { localDateIso } from '../../shared/localDate';"));
  assert.ok(source.includes('const today = localDateIso();'));
  assert.equal(source.includes("new Date().toISOString().slice(0, 10)"),false);
});

test('editing a transaction preserves an inactive historical category until the operator explicitly changes it',()=>{
  assert.ok(source.includes('category: record.category,'));
  assert.ok(source.includes('preservesHistoricalCategory'));
  assert.ok(source.includes('(inativa — histórico)'));
  assert.ok(source.includes('foi preservada'));
});
