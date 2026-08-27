import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source=readFileSync(resolve(process.cwd(),'apps/web/src/modules/crm/CrmDashboardApp.tsx'),'utf8');

test('CRM dashboard derives its operation from canonical session stores',()=>{
  for(const getter of ['getCrmSessionRecords','getFinanceSessionRecords','getAgendaSessionEvents','getTaskSessionRecords','getAttendanceSessionConversations'])assert.ok(source.includes(getter),`missing ${getter}`);
  for(const label of ['Contatos','Leads','Clientes','Receitas','Despesas','Resultado'])assert.ok(source.includes(`label="${label}"`),`missing ${label}`);
});

test('CRM dashboard uses local browser date for today agenda and pending work',()=>{
  assert.ok(source.includes("import { localDateIso } from '../../shared/localDate';"));
  assert.ok(source.includes('const today=localDateIso();'));
  assert.equal(source.includes("new Date().toISOString().slice(0, 10)"),false);
  assert.ok(source.includes('event.date===today'));
  assert.ok(source.includes('record.nextActionDate!<=today'));
});
