import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const router=readFileSync(resolve(root,'apps/web/src/RootApplication.tsx'),'utf8');
const sidebar=readFileSync(resolve(root,'apps/web/src/components/CrmSidebar.tsx'),'utf8');
const finance=readFileSync(resolve(root,'apps/web/src/modules/finance/FinanceTransactionsApp.tsx'),'utf8');

const sidebarRoutes=[...sidebar.matchAll(/href:\s*'([^']+)'/g)].map(match=>match[1]).filter(path=>path.startsWith('/crm'));

test('every CRM sidebar destination is handled explicitly by RootApplication',()=>{
  assert.ok(sidebarRoutes.length>0);
  for(const path of sidebarRoutes)assert.ok(router.includes(`path==='${path}'`)||router.includes(`path==='/crm/financeiro'||path==='/crm/financeiro/transacoes'`)||router.includes(`path==='/crm/marketing'||path==='/crm/marketing/campanhas'||path==='/crm/marketing/calendario'||path==='/crm/marketing/metricas'`),`unhandled CRM sidebar route ${path}`);
});

test('finance configuration routes are reachable from the finance workspace and do not masquerade as Transactions',()=>{
  for(const path of ['/crm/categorias-financeiras','/crm/regras-financeiras']){
    assert.ok(router.includes(`path==='${path}'`),`router missing ${path}`);
    assert.ok(finance.includes(`href('/crm/${path.split('/crm/')[1]}')`)||finance.includes(`href={href('${path}')}`),`finance workspace missing ${path}`);
  }
  assert.ok(sidebar.includes("if(path==='/crm/categorias-financeiras'||path==='/crm/regras-financeiras')return undefined"));
});

test('obsolete CRM aliases redirect to canonical destinations instead of rendering ghost pages',()=>{
  assert.ok(router.includes("path==='/crm/contatos'||path==='/crm/leads'"));
  assert.ok(router.includes("replacePath('/crm/relacionamento')"));
  assert.ok(router.includes("path==='/crm/marketing/ia-criativa'"));
  assert.ok(router.includes("path==='/crm/contratos/categorias'"));
  assert.ok(router.includes("replacePath('/crm/contratos/templates')"));
});
