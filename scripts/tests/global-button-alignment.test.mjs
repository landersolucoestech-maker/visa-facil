import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const baseline=readFileSync(resolve(root,'apps/web/src/styles/app-baseline.css'),'utf8');

test('ordinary project buttons center their visible content globally',()=>{
  const match=baseline.match(/button\s*\{([\s\S]*?)\}/);
  assert.ok(match,'global button rule not found');
  const rule=match[1];
  assert.ok(rule.includes('text-align:center!important'));
  assert.ok(rule.includes('justify-content:center!important'));
  assert.ok(rule.includes('align-items:center!important'));
});

test('action dropdown commands override global centering and align labels left',()=>{
  const selectorStart=baseline.indexOf('.crm-global-page :is(');
  assert.ok(selectorStart>=0,'action-menu exception selector not found');
  const actionBlock=baseline.slice(selectorStart,baseline.indexOf('/* Canonical row-action placement.',selectorStart));
  for(const selector of ['.crm-actions-menu','.tasks-actions-menu','.contracts-actions-dropdown','.finance-actions-menu','.invoice-actions-menu','.marketing-actions-menu','.marketing-action-menu','.accounting-actions-menu']){
    assert.ok(actionBlock.includes(selector),`${selector} must use the action-menu alignment exception`);
  }
  assert.ok(actionBlock.includes('display:flex!important'));
  assert.ok(actionBlock.includes('justify-content:flex-start!important'));
  assert.ok(actionBlock.includes('text-align:left!important'));
});
