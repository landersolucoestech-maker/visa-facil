import test from 'node:test';
import assert from 'node:assert/strict';
import { INTEGRATION_REGISTRY, isIntegrationRuntimeStatus } from '../../apps/web/src/modules/integrations/integrationContract.ts';

const EXPECTED=['whatsapp','resend','autentique','nfse','instagram','facebook','youtube','tiktok','google-ads','google-calendar'];

test('integration registry contains every planned provider exactly once',()=>{
  assert.deepEqual(INTEGRATION_REGISTRY.map(item=>item.id).sort(),[...EXPECTED].sort());
  assert.equal(new Set(INTEGRATION_REGISTRY.map(item=>item.id)).size,EXPECTED.length);
  assert.equal(new Set(INTEGRATION_REGISTRY.map(item=>item.name)).size,EXPECTED.length);
});

test('every integration declares production authentication and dependency metadata',()=>{
  for(const integration of INTEGRATION_REGISTRY){
    assert.ok(integration.name.trim());
    assert.ok(integration.description.trim());
    assert.ok(['oauth2','api-key','provider-token','certificate','hybrid'].includes(integration.authMode));
    assert.ok(integration.capabilities.length>0,`${integration.id} must declare capabilities`);
    assert.ok(integration.externalRequirements.length>0,`${integration.id} must declare external requirements`);
    assert.ok(Array.isArray(integration.serverOnlySecrets));
    integration.serverOnlySecrets.forEach(name=>{
      assert.match(name,/^[A-Z][A-Z0-9_]+$/);
      assert.equal(name.startsWith('VITE_'),false,`${integration.id} secret must never be browser-exposed`);
    });
  }
});

test('runtime connection status accepts only canonical provider/state contracts',()=>{
  for(const id of EXPECTED){
    assert.equal(isIntegrationRuntimeStatus({id,state:'unconfigured'}),true);
    assert.equal(isIntegrationRuntimeStatus({id,state:'connected',accountLabel:'Conta',lastCheckedAt:'2026-08-25T12:00:00.000Z'}),true);
  }
  assert.equal(isIntegrationRuntimeStatus({id:'unknown',state:'connected'}),false);
  assert.equal(isIntegrationRuntimeStatus({id:'resend',state:'fake-connected'}),false);
});
