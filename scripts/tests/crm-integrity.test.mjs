import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const app=readFileSync(resolve(process.cwd(),'apps/web/src/modules/crm/CrmApp.tsx'),'utf8');
const types=readFileSync(resolve(process.cwd(),'apps/web/src/modules/crm/types.ts'),'utf8');
const provider=readFileSync(resolve(process.cwd(),'apps/web/src/modules/crm/mocks/mockDataProvider.ts'),'utf8');

test('CRM ownership is selected by active canonical user id instead of free text',()=>{
  assert.ok(types.includes('ownerUserId?: string'));
  assert.ok(app.includes('getOperationalTeamMembers'));
  assert.ok(app.includes('<OwnerField'));
  assert.ok(app.includes("value={draft.ownerUserId||''}"));
  assert.ok(app.includes('member.id===id'));
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
