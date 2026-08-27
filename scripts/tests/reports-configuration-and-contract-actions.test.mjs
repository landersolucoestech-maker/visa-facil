import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const app=readFileSync(resolve(root,'apps/web/src/modules/reports/ReportsApp.tsx'),'utf8');
const adapter=readFileSync(resolve(root,'apps/web/src/modules/reports/reportConfigurationDatasetAdapter.ts'),'utf8');
const categories=readFileSync(resolve(root,'apps/web/src/modules/finance/FinancialCategoriesApp.tsx'),'utf8');
const rules=readFileSync(resolve(root,'apps/web/src/modules/finance/FinancialRulesApp.tsx'),'utf8');
const templates=readFileSync(resolve(root,'apps/web/src/modules/contracts/ContractTemplateModal.tsx'),'utf8');
const variables=readFileSync(resolve(root,'apps/web/src/modules/contracts/ContractVariableModal.tsx'),'utf8');
const actions=readFileSync(resolve(root,'apps/web/src/modules/contracts/contract-table-actions.css'),'utf8');

const schemas={
 financeCategories:['Nome','Tipo','Status'],
 financeRules:['Descrição contém','Tipo','Categoria','Status'],
 contractTemplates:['Nome','Descrição','Conteúdo do documento','Template ativo e disponível no wizard'],
 contractVariables:['Nome amigável','Tipo','Grupo','Campo','Descrição','Obrigatória para revisão'],
};

function arrayLiteral(name){
 const match=adapter.match(new RegExp(`const ${name}=\\[([\\s\\S]*?)\\] as const;`));
 assert.ok(match,`${name} not found`);
 return [...match[1].matchAll(/'([^']+)'/g)].map(item=>item[1]);
}

test('reports includes finance configuration and contract-template configuration datasets',()=>{
 for(const id of ['financeCategories','financeRules','contractTemplates','contractVariables'])assert.ok(app.includes(`id:'${id}'`),`missing ${id}`);
 assert.ok(app.includes('getConfigurationReportRows'));
 assert.ok(app.includes('importConfigurationReportRows'));
 assert.ok(app.includes('isConfigurationReportDatasetId'));
});

test('configuration XLSX schemas contain exactly every editable field from their create modals',()=>{
 assert.deepEqual(arrayLiteral('FINANCE_CATEGORY_COLUMNS'),schemas.financeCategories);
 assert.deepEqual(arrayLiteral('FINANCE_RULE_COLUMNS'),schemas.financeRules);
 assert.deepEqual(arrayLiteral('CONTRACT_TEMPLATE_COLUMNS'),schemas.contractTemplates);
 assert.deepEqual(arrayLiteral('CONTRACT_VARIABLE_COLUMNS'),schemas.contractVariables);
 for(const label of schemas.financeCategories)assert.ok(categories.includes(label),`finance category modal missing ${label}`);
 for(const label of schemas.financeRules)assert.ok(rules.includes(label),`finance rule modal missing ${label}`);
 for(const label of schemas.contractTemplates)assert.ok(templates.includes(label),`contract template modal missing ${label}`);
 for(const label of schemas.contractVariables)assert.ok(variables.includes(label),`contract variable modal missing ${label}`);
});

test('configuration imports write back to canonical stores and preserve computed variable identity',()=>{
 for(const token of ['getFinanceCategories','saveFinanceCategories','getFinanceRules','saveFinanceRules','getContractTemplates','saveContractTemplates','getContractVariables','saveContractVariables'])assert.ok(adapter.includes(token),`missing ${token}`);
 assert.ok(adapter.includes('makePlaceholder'));
 assert.ok(adapter.includes('normalizePlaceholderPart'));
 assert.ok(adapter.includes('assertPersisted'));
 assert.ok(adapter.includes('placeholder=makePlaceholder(group,field)'));
});

test('contract row action trigger cannot inherit the global popover shadow',()=>{
 assert.ok(actions.includes('.crm-global-page.crm-global-page .contracts-actions-menu.contracts-actions-menu{'));
 assert.ok(actions.includes('box-shadow:none!important'));
 assert.ok(actions.includes("content:'⋮'"));
 assert.ok(actions.includes('font-size:0!important'));
 assert.ok(actions.includes('filter:none!important'));
});
