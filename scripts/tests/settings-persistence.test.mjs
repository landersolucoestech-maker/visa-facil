import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const tabs=readFileSync(resolve(root,'apps/web/src/modules/settings/CompanyAutomationTabs.tsx'),'utf8');
const shared=readFileSync(resolve(root,'apps/web/src/modules/settings/settingsShared.tsx'),'utf8');
const mockProvider=readFileSync(resolve(root,'apps/web/src/modules/settings/mocks/settingsMockProvider.ts'),'utf8');
const fixture=JSON.parse(readFileSync(resolve(root,'apps/web/src/mocks/settings/settings.dev.json'),'utf8'));
const security=readFileSync(resolve(root,'apps/web/src/modules/settings/SecurityIntegrationTabs.tsx'),'utf8');
const users=readFileSync(resolve(root,'apps/web/src/modules/settings/UsersTab.tsx'),'utf8');
const profile=readFileSync(resolve(root,'apps/web/src/modules/settings/ProfileApp.tsx'),'utf8');

test('company and automation settings confirm local persistence before claiming success',()=>{
  assert.ok(tabs.includes('function writeSetting'));
  assert.ok(tabs.includes('store.getItem(key)!==raw'));
  assert.ok(tabs.includes('reportSessionPersistenceError'));
  assert.ok(tabs.includes("if(!writeCompany(company))"));
  assert.ok(tabs.includes('setSaved(ok)'));
  assert.ok(tabs.includes('Não foi possível preservar as preferências nesta sessão'));
});

test('automation settings remain explicit preferences rather than executable automation',()=>{
  assert.ok(tabs.includes('nenhum executor de automações está conectado'));
  assert.ok(tabs.includes('não disparam e-mails, SMS, push, backups ou jobs'));
  assert.ok(tabs.includes('Backup automático'));
  assert.ok(tabs.includes('checked={false} onChange={()=>{}} disabled'));
});

test('SMS is modeled as a future notification preference without pretending a provider can send it',()=>{
  assert.ok(shared.includes("AutomationKey='email'|'sms'|'push'"));
  assert.ok(mockProvider.includes("['email','sms','push'"));
  assert.equal(fixture.automations.sms,false);
  assert.ok(tabs.includes("checked={values.sms} onChange={value=>set('sms',value)}"));
  assert.equal(tabs.includes('<strong>SMS</strong><Toggle checked={false} onChange={()=>{}} disabled/>'),false);
  assert.ok(tabs.includes('nenhum executor de automações está conectado'));
});

test('security and integrations do not fake unavailable backend capabilities',()=>{
  assert.ok(security.includes('A autenticação está desativada neste ambiente'));
  assert.ok(security.includes('Alteração de senha, 2FA, gestão de sessões e exclusão de conta permanecem indisponíveis'));
  assert.ok(security.includes("disabled={!backendConfigured||working}"));
  assert.ok(security.includes("INTEGRATION_REGISTRY.map(item=>({id:item.id,state:'unconfigured'}))"));
  assert.ok(security.includes("'Backend necessário'"));
});

test('users and profile remain reference-only while authentication is disabled',()=>{
  assert.ok(users.includes('apenas referências de interface'));
  assert.ok(users.includes('não concedem, restringem ou persistem acesso real'));
  assert.ok(profile.includes('não simula edição ou persistência de credenciais'));
  assert.ok(profile.includes("AUTHENTICATION_ENABLED?'Ativa':'Desativada'"));
});
