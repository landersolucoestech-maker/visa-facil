import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { COMMUNICATION_PROVIDER_CATALOG, communicationProvidersByClass } from '../../apps/web/src/modules/integrations/communicationContract.ts';

const root=process.cwd();
const source=readFileSync(resolve(root,'apps/web/src/modules/integrations/communicationContract.ts'),'utf8');
const settings=readFileSync(resolve(root,'apps/web/src/modules/settings/SecurityIntegrationTabs.tsx'),'utf8');
const integrations=readFileSync(resolve(root,'apps/web/src/modules/integrations/integrationContract.ts'),'utf8');

const requiredProviders=['Vivo','TIM','Claro','Twilio','Dialpad','RingCentral'];

test('telephony and SMS provider catalog covers traditional carriers and IP providers without closing the provider id type',()=>{
  const names=new Set(COMMUNICATION_PROVIDER_CATALOG.map(provider=>provider.name));
  for(const name of requiredProviders)assert.ok(names.has(name),`${name} provider target must be present`);
  assert.ok(communicationProvidersByClass('telecom-carrier').length>=4);
  assert.ok(communicationProvidersByClass('cloud-communications').length>=4);
  assert.match(source,/CommunicationProviderKey=string/);
  assert.ok(COMMUNICATION_PROVIDER_CATALOG.some(provider=>provider.key==='traditional-carrier'));
  assert.ok(COMMUNICATION_PROVIDER_CATALOG.some(provider=>provider.key==='cloud-communications'));
});

test('communication contract models SMS, phone lines, routing and delivery history independently from provider SDKs',()=>{
  for(const token of ['CommunicationEndpoint','CommunicationRoute','CommunicationMessageRecord','CommunicationDeliveryStatus','providerMessageId','providerConnectionId','endpointId','routeId','delivery-status','physical-lines','virtual-numbers','sender-ids'])assert.ok(source.includes(token),`missing ${token}`);
  for(const status of ['queued','submitted','sent','delivered','undelivered','failed','received','read','unknown'])assert.ok(source.includes(`'${status}'`),`missing delivery status ${status}`);
  assert.match(source,/interface CommunicationProviderAdapter/);
  assert.match(source,/sendSms\(command:SendSmsCommand\)/);
  assert.match(source,/normalizeInboundEvent/);
  assert.match(source,/normalizeDeliveryEvent/);
});

test('communication records can link back to CRM and VisaChat while provider credentials stay server-side',()=>{
  for(const token of ['crmRecordId','attendanceConversationId','contractId','taskId','invoiceId'])assert.ok(source.includes(token),`missing cross-module link ${token}`);
  assert.match(source,/credentialSetRef\?:string/);
  assert.equal(source.includes('accessToken'),false);
  assert.equal(source.includes('refreshToken'),false);
  assert.equal(source.includes('localStorage'),false);
  assert.equal(source.includes('sessionStorage'),false);
  assert.ok(integrations.includes("id:'telephony-sms'"));
  assert.ok(integrations.includes("authMode:'hybrid'"));
  assert.ok(integrations.includes("description:'Integração agnóstica com operadoras e provedores IP para SMS, voz, linhas/números, roteamento e atendimento integrado ao CRM e VisaChat por meio de APIs.'"));
  assert.ok(settings.includes("item.id==='telephony-sms'"));
  assert.equal(settings.includes('Operadoras tradicionais previstas:'),false);
  assert.equal(settings.includes('Provedores IP/Internet previstos:'),false);
  assert.equal(settings.includes('Credenciais, linhas/números, remetentes, rotas e webhooks serão configurados por provider adapter no backend'),false);
});

test('catalog capability declarations remain provider-dependent rather than pretending connections are live',()=>{
  for(const provider of COMMUNICATION_PROVIDER_CATALOG){
    assert.equal(provider.availability,'provider-dependent');
    assert.ok(provider.channels.length>0);
    assert.ok(provider.targetCapabilities.length>0);
    assert.ok(provider.configurationHints.length>0);
  }
  assert.equal(settings.includes('Conectado automaticamente'),false);
});
