import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractTemplatePlaceholders, makePlaceholder, resolveTemplateContent } from '../../apps/web/src/modules/contracts/contractTemplateEngine.ts';

const root=process.cwd();
const read=(path)=>readFileSync(resolve(root,path),'utf8');

test('contract placeholders are normalized, unique and resolved as plain text',()=>{
  assert.equal(makePlaceholder('processo','número do protocolo'),'{{PROCESSO.NUMERO_DO_PROTOCOLO}}');
  const source='Cliente {{CLIENTE.NOME}} · {{CLIENTE.CPF}} · {{CLIENTE.NOME}}';
  assert.deepEqual(extractTemplatePlaceholders(source),['{{CLIENTE.NOME}}','{{CLIENTE.CPF}}']);
  assert.equal(resolveTemplateContent(source,{'{{CLIENTE.NOME}}':'Ana <b>Silva</b>','{{CLIENTE.CPF}}':'123'}),'Cliente Ana <b>Silva</b> · 123 · Ana <b>Silva</b>');
});

test('contracts source keeps validated stores and centralized operational fixtures',()=>{
  const store=read('apps/web/src/modules/contracts/contractSessionStore.ts');
  for(const token of ['isContractRecord','isContractTemplate','isContractVariable','readSessionRecords','writeSessionRecords','getContractMockRecords'])assert.ok(store.includes(token),`missing ${token}`);
  assert.ok(store.includes('readSessionRecords<ContractRecord>(KEYS.contracts,getContractMockRecords,isContractRecord)'));
  assert.equal(store.includes("readSessionRecords<ContractRecord>(KEYS.contracts,()=>[]"),false);
  assert.ok(store.includes("value.signatureProvider===null||value.signatureProvider==='autentique'"));
  assert.equal(store.includes('ContractCategory'),false);
  assert.equal(store.includes('contract-categories'),false);
  assert.equal(store.toLowerCase().includes('docusign'),false);
  assert.equal(store.toLowerCase().includes('clicksign'),false);
});

test('reference adaptation keeps the visa contract model and six-step workflow without redundant page tabs',()=>{
  const editor=read('apps/web/src/modules/contracts/ContractEditorModal.tsx');
  const app=read('apps/web/src/modules/contracts/ContractsApp.tsx');
  const types=read('apps/web/src/modules/contracts/contractTypes.ts');
  for(const step of ['Template','Partes','Variáveis','Documento','Signatários','Revisão'])assert.ok(editor.includes(step),`missing step ${step}`);
  for(const route of ['/crm/contratos/templates','/crm/contratos/variaveis'])assert.ok(app.includes(route),`missing route ${route}`);
  assert.equal(app.includes('contracts-module-tabs'),false);
  assert.equal(app.includes('CategoriesWorkspace'),false);
  assert.equal(app.includes('/crm/contratos/categorias'),false);
  assert.equal(types.includes('ContractCategory'),false);
  assert.equal(types.includes('categoryId'),false);
  for(const forbidden of ['obra musical','lançamento musical','clicksign','docusign'])assert.equal(`${editor}\n${app}`.toLowerCase().includes(forbidden),false);
});
