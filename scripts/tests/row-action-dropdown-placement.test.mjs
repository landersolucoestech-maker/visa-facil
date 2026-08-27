import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const baseline=readFileSync(resolve(process.cwd(),'apps/web/src/styles/app-baseline.css'),'utf8');

const modules=[
  ['CRM','.crm-actions-trigger[aria-expanded="true"]','--vf-crm-row-action','.crm-actions-menu.crm-actions-menu'],
  ['Tarefas','.tasks-actions-trigger[aria-expanded="true"]','--vf-tasks-row-action','.tasks-actions-menu.tasks-actions-menu'],
  ['Contratos','.contracts-actions-trigger[aria-expanded="true"]','--vf-contracts-row-action','.contracts-actions-dropdown.contracts-actions-dropdown'],
  ['Transações','.finance-actions-trigger[aria-expanded="true"]','--vf-finance-row-action','.finance-actions-menu.finance-actions-menu'],
  ['Faturamento','.invoice-action-trigger[aria-expanded="true"]','--vf-invoice-row-action','.invoice-actions-menu.invoice-actions-menu'],
];

test('all row action menus open leftward and downward from the active trigger',()=>{
  for(const [label,trigger,anchor,menu] of modules){
    assert.ok(baseline.includes(`${trigger}{anchor-name:${anchor}}`),`${label}: active trigger must own a CSS anchor`);
    assert.ok(baseline.includes(menu),`${label}: canonical menu selector must be present`);
    assert.ok(baseline.includes(`position-anchor:${anchor}`),`${label}: menu must bind to its trigger anchor`);
  }
  assert.ok(baseline.includes('top:calc(anchor(bottom) + 4px)!important'),'menus must open below the trigger');
  assert.ok(baseline.includes('left:anchor(right)!important'),'menus must start from the trigger right edge');
  assert.ok(baseline.includes('transform:translateX(-100%)!important'),'menus must extend to the left of the trigger');
});

test('anchored action menus are fixed so table overflow cannot create scrollbars',()=>{
  const fixedCount=(baseline.match(/position:fixed!important;/g)||[]).length;
  assert.ok(fixedCount>=5,'every targeted action menu must use fixed positioning when anchor positioning is supported');
  assert.ok(baseline.includes('@supports (anchor-name:--vf-row-action)'),'fixed positioning must be progressive and keep the absolute-position fallback');
  assert.ok(baseline.includes('bottom:auto!important'),'legacy upward-opening bottom placement must be neutralized');
});
