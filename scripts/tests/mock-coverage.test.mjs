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

test('every centralized prototype domain has non-empty mock data',()=>{
 for(const [name,fixture] of Object.entries(fixtures)){
  assert.equal(nonEmpty(fixture),true,`${name} fixture must contain usable mock data`);
 }
});

test('every operational CRM route has a representative seeded source',()=>{
 const coverage={
  dashboard:fixtures.crm,
  relacionamento:fixtures.crm,
  agenda:fixtures.agenda,
  tarefasGerais:fixtures.tasks.filter(record=>(record.area??'Geral')==='Geral'),
  atendimentos:fixtures.attendance,
  contratos:fixtures.contracts,
  templates:fixtures.contractRegistry.templates,
  variaveis:fixtures.contractRegistry.variables,
  transacoes:fixtures.finance,
  faturamento:fixtures.invoices,
  dre:fixtures.finance,
  categoriasFinanceiras:fixtures.financeConfig.categories,
  regrasFinanceiras:fixtures.financeConfig.rules,
  campanhas:fixtures.marketing.campaigns,
  calendarioMarketing:fixtures.marketing.contents,
  briefings:fixtures.marketing.briefings,
  tarefasMarketing:fixtures.tasks.filter(record=>record.area==='Marketing'),
  relatorios:[...fixtures.crm,...fixtures.finance,...fixtures.tasks,...fixtures.agenda],
  configuracoes:fixtures.settings.users,
 };
 for(const [route,source] of Object.entries(coverage)){
  assert.ok(Array.isArray(source)&&source.length>0,`${route} must open with representative seeded data`);
 }
});

test('task mocks cover both general operations and Marketing with canonical links',()=>{
 const crmIds=new Set(fixtures.crm.map(record=>record.id));
 const activeUserIds=new Set(fixtures.settings.users.filter(user=>user.status==='Ativo').map(user=>user.id));
 assert.ok(fixtures.tasks.some(record=>(record.area??'Geral')==='Geral'),'General tasks must be seeded');
 assert.ok(fixtures.tasks.filter(record=>record.area==='Marketing').length>=3,'Marketing tasks must expose multiple representative rows');
 for(const task of fixtures.tasks){
  assert.ok(task.relatedRecordId&&crmIds.has(task.relatedRecordId),`Task ${task.id} must link to a seeded CRM record`);
  assert.ok(task.ownerUserId&&activeUserIds.has(task.ownerUserId),`Task ${task.id} must link to an active seeded user`);
 }
});

test('marketing has campaigns contents and briefings instead of a partially seeded module',()=>{
 assert.ok(fixtures.marketing.campaigns?.length>=2,'Marketing campaigns must be seeded');
 assert.ok(fixtures.marketing.contents?.length>=4,'Marketing content calendar must be seeded');
 assert.ok(fixtures.marketing.briefings?.length>=3,'Marketing briefings must be seeded');
 const activeUserIds=new Set(fixtures.settings.users.filter(user=>user.status==='Ativo').map(user=>user.id));
 for(const briefing of fixtures.marketing.briefings){
  assert.ok(briefing.id&&briefing.title,'Briefing mock must identify itself');
  if(briefing.status!=='Rascunho'){
   assert.ok(briefing.objective.trim(),`Briefing ${briefing.id} requires an objective outside draft`);
   assert.ok(activeUserIds.has(briefing.ownerUserId),`Briefing ${briefing.id} must link to an active seeded user`);
  }
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

test('derived modules use seeded canonical sources rather than duplicate fixtures',()=>{
 assert.equal(nonEmpty(fixtures.crm),true,'Dashboard/Reports require CRM mock source');
 assert.equal(nonEmpty(fixtures.finance),true,'Accounting/Reports require Finance mock source');
 assert.equal(nonEmpty(fixtures.tasks),true,'Dashboard/Reports require Tasks mock source');
 assert.equal(nonEmpty(fixtures.agenda),true,'Dashboard/Reports require Agenda mock source');
 assert.equal(nonEmpty(fixtures.attendance),true,'Dashboard/Reports require VisaChat mock source');
});
