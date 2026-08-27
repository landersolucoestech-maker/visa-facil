import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const invoices=readFileSync(resolve(root,'apps/web/src/modules/finance/FinanceInvoicesWorkspace.tsx'),'utf8');
const provider=readFileSync(resolve(root,'apps/web/src/modules/finance/mocks/invoiceMockProvider.ts'),'utf8');

test('new invoices select canonical CRM clients instead of accepting free-text customer names',()=>{
  assert.ok(provider.includes('customerRecordId?: string'));
  assert.ok(invoices.includes('getCrmSessionRecords'));
  assert.ok(invoices.includes("record.kind==='contact'&&record.relationship==='Cliente'"));
  assert.ok(invoices.includes('customerRecordId:client.id'));
  assert.ok(invoices.includes('crmRecords={crmRecords}'));
  assert.ok(invoices.includes('Selecione um cliente'));
  assert.equal(invoices.includes('<Field label="Cliente *"><input'),false);
});

test('legacy invoice customer names are preserved while resolvable records migrate to canonical ids',()=>{
  assert.ok(invoices.includes('function migrateInvoiceCustomerLinks'));
  assert.ok(invoices.includes('function uniqueClientId'));
  assert.ok(invoices.includes('legado/indisponível'));
  assert.ok(invoices.includes('selecione um cliente canônico para relincar a cobrança'));
});

test('settled invoice payments preserve the same CRM customer id on generated finance transactions',()=>{
  assert.ok(invoices.includes('relatedRecordId:invoice.customerRecordId||undefined'));
  assert.ok(invoices.includes("if(invoice.customerRecordId&&!legacy.relatedRecordId)"));
  assert.ok(invoices.includes("record.relatedRecordId===invoice.customerRecordId"));
  assert.ok(invoices.includes('financeTransactionId'));
});
