import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const app=readFileSync(resolve(root,'apps/web/src/modules/crm/CrmApp.tsx'),'utf8');
const types=readFileSync(resolve(root,'apps/web/src/modules/crm/types.ts'),'utf8');
const provider=readFileSync(resolve(root,'apps/web/src/modules/crm/mocks/mockDataProvider.ts'),'utf8');
const tasks=readFileSync(resolve(root,'apps/web/src/modules/tasks/TasksApp.tsx'),'utf8');
const taskProvider=readFileSync(resolve(root,'apps/web/src/modules/tasks/mocks/tasksMockProvider.ts'),'utf8');
const agenda=readFileSync(resolve(root,'apps/web/src/modules/agenda/AgendaApp.tsx'),'utf8');
const agendaProvider=readFileSync(resolve(root,'apps/web/src/modules/agenda/mocks/agendaMockProvider.ts'),'utf8');
const finance=readFileSync(resolve(root,'apps/web/src/modules/finance/FinanceTransactionsApp.tsx'),'utf8');
const financeTypes=readFileSync(resolve(root,'apps/web/src/modules/finance/types.ts'),'utf8');
const reports=readFileSync(resolve(root,'apps/web/src/modules/reports/reportDatasetAdapter.ts'),'utf8');

test('CRM ownership is selected by active canonical user id instead of free text',()=>{
  assert.ok(types.includes('ownerUserId?: string'));
  assert.ok(app.includes('getOperationalTeamMembers'));
  assert.ok(app.includes('<OwnerField'));
  assert.ok(app.includes("value={draft.ownerUserId||''}"));
  assert.ok(app.includes('members.find((item)=>item.id===id)'));
  assert.ok(app.includes("set('ownerUserId',id)"));
  assert.ok(app.includes("set('owner',member?.name||'')"));
  assert.equal(app.includes('<Field label="Responsável"><input'),false);
});

test('lead conversion creates or links a client and records both sides of the relationship',()=>{
  for(const token of ['convertedContactId?: string','convertedFromLeadId?: string','convertedAt?: string'])assert.ok(types.includes(token));
  assert.ok(app.includes('const convertLead='));
  assert.ok(app.includes("leadStatus:'Convertido'"));
  assert.ok(app.includes("relationship:'Cliente'"));
  assert.ok(app.includes('convertedFromLeadId:lead.id'));
  assert.ok(app.includes('convertedContactId:contact.id'));
  assert.ok(app.includes('Converter em cliente'));
  assert.ok(provider.includes("if(value.convertedContactId&&value.leadStatus!=='Convertido')return false"));
});

test('Convertido is no longer a manually selectable lead lifecycle shortcut',()=>{
  assert.ok(app.includes("LEAD_EDITABLE_STATUS_OPTIONS = LEAD_STATUS_OPTIONS.filter((status) => status !== 'Convertido')"));
  assert.ok(app.includes('disabled={convertedLead}'));
  assert.ok(app.includes('Convertido · via conversão'));
});

test('CRM blocks duplicate identities using email CPF passport or WhatsApp while ignoring explicit conversion pairs',()=>{
  assert.ok(app.includes('function duplicateMessage'));
  assert.ok(app.includes("['e-mail',normalizeRecordIdentity(record.email)]"));
  assert.ok(app.includes("['CPF',normalizeDigits(record.cpf)]"));
  assert.ok(app.includes("['passaporte',normalizePassport(record.passportNumber)]"));
  assert.ok(app.includes("['WhatsApp',normalizeDigits(record.whatsapp)]"));
  assert.ok(app.includes('editing?.convertedContactId'));
  assert.ok(app.includes('editing?.convertedFromLeadId'));
});

test('Tasks Agenda and Finance persist canonical CRM relation ids while preserving legacy display names',()=>{
  assert.ok(taskProvider.includes('relatedRecordId?: string'));
  assert.ok(taskProvider.includes('ownerUserId?: string'));
  assert.ok(tasks.includes('getCrmSessionRecords'));
  assert.ok(tasks.includes('getOperationalTeamMembers'));
  assert.ok(tasks.includes('relatedRecordId:id'));
  assert.ok(tasks.includes('ownerUserId:id'));
  assert.equal(tasks.includes('<span>Responsável</span><input'),false);
  assert.equal(tasks.includes('<span>Contato / Lead relacionado</span><input'),false);

  assert.ok(agendaProvider.includes('relatedRecordId?: string'));
  assert.ok(agendaProvider.includes('ownerUserId?: string'));
  assert.ok(agenda.includes('getCrmSessionRecords'));
  assert.ok(agenda.includes('getOperationalTeamMembers'));
  assert.ok(agenda.includes('relatedRecordId:id'));
  assert.ok(agenda.includes('ownerUserId:id'));
  assert.equal(agenda.includes('<span>Responsável</span><input'),false);
  assert.equal(agenda.includes('<span>Contato / Lead / Cliente</span><input'),false);

  assert.ok(financeTypes.includes('relatedRecordId?: string'));
  assert.ok(finance.includes('getCrmSessionRecords'));
  assert.ok(finance.includes('relatedRecordId:id'));
  assert.equal(finance.includes('<span>Cliente / contato relacionado</span><input'),false);
});

test('XLSX imports resolve visible relation labels into canonical ids instead of creating dangling text references',()=>{
  assert.ok(reports.includes('function crmRelationSelection'));
  assert.ok(reports.includes('function financeRelationSelection'));
  assert.ok(reports.includes('relatedRecordId:relation.relatedRecordId'));
  assert.ok(reports.includes('ownerUserId:owner.ownerUserId'));
  assert.ok(reports.includes('não corresponde a um único registro'));
  assert.ok(reports.includes('não corresponde a um único contato/cliente no CRM'));
});
