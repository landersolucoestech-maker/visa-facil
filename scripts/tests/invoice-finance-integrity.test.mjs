import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workspace=readFileSync(resolve(process.cwd(),'apps/web/src/modules/finance/FinanceInvoicesWorkspace.tsx'),'utf8');
const provider=readFileSync(resolve(process.cwd(),'apps/web/src/modules/finance/mocks/invoiceMockProvider.ts'),'utf8');
const sidebar=readFileSync(resolve(process.cwd(),'apps/web/src/components/CrmSidebar.tsx'),'utf8');

test('billing due states use the browser-local calendar date',()=>{
  assert.ok(workspace.includes("import { localDateIso } from '../../shared/localDate';"));
  assert.ok(workspace.includes('const today = () => localDateIso();'));
  assert.equal(workspace.includes('toISOString().slice(0, 10)'),false);
});

test('frontend cannot fabricate externally authorized fiscal states',()=>{
  assert.ok(workspace.includes("const LOCAL_FISCAL_STATUSES = ['Não emitida', 'Preparada localmente', 'Aguardando integração']"));
  assert.equal(workspace.includes('<option>Autorizada</option>'),false);
  assert.equal(workspace.includes('<option>Contingência</option>'),false);
  assert.ok(workspace.includes('só poderão vir da integração fiscal/backend'));
  assert.ok(workspace.includes('NÃO COMPROVA AUTORIZAÇÃO FISCAL'));
});

test('pending billing payments have explicit settle and cancel transitions',()=>{
  assert.ok(provider.includes("'Liquidado' | 'Pendente' | 'Cancelado'"));
  assert.ok(workspace.includes("payment.settlementStatus === 'Pendente'"));
  assert.ok(workspace.includes("settlePayment(payment.id,'Liquidado')"));
  assert.ok(workspace.includes("settlePayment(payment.id,'Cancelado')"));
});

test('liquidated billing payments are linked to canonical finance transactions',()=>{
  assert.ok(workspace.includes('financeTransactionId'));
  assert.ok(workspace.includes('ensureFinanceTransaction'));
  assert.ok(workspace.includes("type:'Receita'"));
  assert.ok(workspace.includes("status:'Recebido'"));
  assert.ok(workspace.includes('getFinanceSessionRecords'));
  assert.ok(workspace.includes('saveFinanceSessionRecords'));
});

test('visible finance vocabulary no longer treats invoice and fiscal document as synonyms',()=>{
  assert.ok(sidebar.includes("{label:'Faturamento',href:'/crm/financeiro/invoices'"));
  assert.ok(workspace.includes('<h1>Faturamento e Notas Fiscais</h1>'));
  assert.ok(workspace.includes('A cobrança financeira e o estado fiscal são relacionados, mas permanecem independentes.'));
  assert.ok(workspace.includes('Nova cobrança'));
});
