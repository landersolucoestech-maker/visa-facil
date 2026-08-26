import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const read=(path)=>readFileSync(resolve(root,path),'utf8');
const rootApp=read('apps/web/src/RootApplication.tsx');
const css=read('apps/web/src/styles/crm-ui-standard.css');

test('RootApplication loads the canonical CRM UI contract',()=>{
 assert.match(rootApp,/import '\.\/styles\/crm-ui-standard\.css';/);
});

test('canonical CRM UI tokens cover typography, colors, sizing and radii',()=>{
 for(const token of ['--vf-navy:','--vf-red:','--vf-text:','--vf-muted:','--vf-border:','--vf-radius-control:','--vf-radius-card:','--vf-radius-modal:','--vf-control-height:36px','--vf-field-height:40px']){
  assert.ok(css.includes(token),`Missing canonical token ${token}`);
 }
 assert.match(css,/font-family:Inter,system-ui/);
});

test('topbar buttons keep the chosen vertical-centering contract',()=>{
 assert.ok(css.includes('line-height:0!important'),'Topbar textual actions must preserve line-height 0');
 assert.ok(css.includes('align-items:center!important'));
 assert.ok(css.includes('justify-content:center!important'));
});

test('modal, form, dropdown, KPI and row-action chrome is standardized',()=>{
 for(const marker of ['.contracts-modal-backdrop','.settings-modal-backdrop','[role="dialog"]','.contracts-actions-menu','.invoice-actions-menu','.contracts-kpi','.invoice-kpis article','.invoice-action-trigger']){
  assert.ok(css.includes(marker),`UI contract must cover ${marker}`);
 }
 assert.ok(css.includes('box-shadow:var(--vf-shadow-modal)!important'));
 assert.ok(css.includes('box-shadow:var(--vf-shadow-menu)!important'));
});

test('calendar-specific canvases are not converted into table/card selectors by the global standard',()=>{
 assert.equal(css.includes('.agenda-calendar'),false);
 assert.equal(css.includes('.marketing-calendar'),false);
 assert.equal(css.includes('.marketing-month-view'),false);
});
