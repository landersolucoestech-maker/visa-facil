import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const read=(path)=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const nonEmpty=(value)=>Array.isArray(value)?value.length>0:value&&typeof value==='object'&&Object.values(value).some(nonEmpty);

const fixtures={
 crm:read('apps/web/src/mocks/crm/crm-records.dev.json'),
 agenda:read('apps/web/src/mocks/agenda/agenda.dev.json'),
 tasks:read('apps/web/src/mocks/tasks/tasks.dev.json'),
 attendance:read('apps/web/src/mocks/attendance/attendance.dev.json'),
 finance:read('apps/web/src/mocks/finance/finance.dev.json'),
 invoices:read('apps/web/src/mocks/finance/invoices.dev.json'),
 financeConfig:read('apps/web/src/mocks/finance/config.dev.json'),
 marketing:read('apps/web/src/mocks/marketing/marketing.dev.json'),
 contractRegistry:read('apps/web/src/mocks/contracts/contracts.dev.json'),
 contracts:read('apps/web/src/mocks/contracts/contracts-records.dev.json'),
 settings:read('apps/web/src/mocks/settings/settings.dev.json'),
};

test('every operational CRM domain has non-empty centralized mock data',()=>{
 for(const [name,fixture] of Object.entries(fixtures)){
  assert.equal(nonEmpty(fixture),true,`${name} fixture must contain usable mock data`);
 }
});

test('contracts include operational records without pretending external signature completion',()=>{
 assert.ok(Array.isArray(fixtures.contracts)&&fixtures.contracts.length>=3,'Contracts must expose multiple operational mock records');
 for(const contract of fixtures.contracts){
  assert.ok(contract.id&&contract.title&&contract.templateId,'Contract mock must identify itself and its template');
  assert.equal(contract.signatureProvider,null,'Mock contract must not pretend an Autentique provider is connected');
  assert.equal(contract.signatureState,'not_sent','Mock contract must not pretend signature delivery happened');
  assert.ok(Array.isArray(contract.parties)&&contract.parties.length>0,'Mock contract must include a party');
  assert.ok(Array.isArray(contract.versions)&&contract.versions.length>0,'Mock contract must include version history');
 }
});

test('finance and settings reference data are centralized instead of hidden in module stores',()=>{
 assert.ok(fixtures.financeConfig.categories?.length>0,'Finance categories fixture must be present');
 assert.ok(fixtures.financeConfig.rules?.length>0,'Finance rules fixture must be present');
 assert.ok(fixtures.settings.users?.length>0,'Settings users fixture must be present');
 assert.ok(fixtures.settings.roles?.length>0,'Settings roles fixture must be present');
});

test('derived modules have seeded canonical sources',()=>{
 assert.equal(nonEmpty(fixtures.crm),true,'Dashboard/Reports require CRM mock source');
 assert.equal(nonEmpty(fixtures.finance),true,'Accounting/Reports require Finance mock source');
 assert.equal(nonEmpty(fixtures.tasks),true,'Dashboard/Reports require Tasks mock source');
 assert.equal(nonEmpty(fixtures.agenda),true,'Dashboard/Reports require Agenda mock source');
 assert.equal(nonEmpty(fixtures.attendance),true,'Dashboard/Reports require VisaChat mock source');
});
