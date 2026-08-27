import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source=readFileSync(resolve(process.cwd(),'apps/web/src/components/CrmSidebar.tsx'),'utf8');

test('finance config routes keep the Finance group open without marking Transactions as current',()=>{
  assert.ok(source.includes("if(path==='/crm/categorias-financeiras'||path==='/crm/regras-financeiras')return undefined"));
  assert.ok(source.includes("const active=isFinance&&fSection===item.section"));
});
