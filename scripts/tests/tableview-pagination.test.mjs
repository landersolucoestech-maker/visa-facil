import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const paginationSource=readFileSync(resolve(process.cwd(),'apps/web/src/components/TableViewPagination.tsx'),'utf8');
const rootSource=readFileSync(resolve(process.cwd(),'apps/web/src/RootApplication.tsx'),'utf8');

const requiredPaths=[
 '/crm/relacionamento',
 '/crm/tarefas',
 '/crm/contratos',
 '/crm/contratos/templates',
 '/crm/contratos/variaveis',
 '/crm/financeiro',
 '/crm/financeiro/transacoes',
 '/crm/financeiro/invoices',
 '/crm/marketing/briefings',
 '/crm/marketing/campanhas',
 '/crm/marketing/tarefas',
];

test('table view pagination remains scoped to ten records per page',()=>{
 assert.ok(paginationSource.includes('const PAGE_SIZE = 10;'));
});

test('table view pagination keeps every requested CRM table route covered',()=>{
 for(const path of requiredPaths){
  assert.ok(paginationSource.includes(`'${path}'`),`missing pagination route: ${path}`);
 }
});

test('CRM pagination stays mounted inside the rendered table surface',()=>{
 assert.ok(paginationSource.includes("containerSelector: '.crm-directory-table'"));
 assert.equal(paginationSource.includes("containerSelector: '.crm-directory'"),false);
 assert.ok(paginationSource.includes("container.insertAdjacentElement('beforeend', paginationMount)"));
 assert.ok(paginationSource.includes('container.appendChild(paginationMount)'));
});

test('pagination resets safely when rendered rows change and restores rows on cleanup',()=>{
 assert.ok(paginationSource.includes('const nextPage = changed ? 1 : Math.min(pageRef.current, pageCount);'));
 assert.ok(paginationSource.includes('rowsRef.current.forEach((row) => { row.hidden = false; });'));
});

test('shared CRM shell keeps the pagination controller mounted',()=>{
 assert.ok(rootSource.includes("import { TableViewPagination } from './components/TableViewPagination';"));
 assert.ok(rootSource.includes('<TableViewPagination />'));
});
