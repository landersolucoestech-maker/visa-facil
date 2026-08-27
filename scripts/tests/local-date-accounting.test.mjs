import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateIso, localMonthStartIso } from '../../apps/web/src/shared/localDate.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('local date helper formats the browser calendar date without UTC conversion',()=>{
  const date=new Date(2026,7,27,23,30,0);
  assert.equal(localDateIso(date),'2026-08-27');
  assert.equal(localMonthStartIso(date),'2026-08-01');
});

test('cash-basis accounting never reports 0 percent margin when revenue is zero',()=>{
  const source=readFileSync(resolve(process.cwd(),'apps/web/src/modules/finance/FinancePLApp.tsx'),'utf8');
  assert.ok(source.includes("const margin = revenue > 0 ? (net / revenue) * 100 : null;"));
  assert.ok(source.includes("const marginLabel = margin === null ? '—'"));
  assert.ok(source.includes('resultado em regime de caixa'));
});
