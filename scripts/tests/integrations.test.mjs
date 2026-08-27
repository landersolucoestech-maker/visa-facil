import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INTEGRATION_REGISTRY, isIntegrationRuntimeStatus } from '../../apps/web/src/modules/integrations/integrationContract.ts';

const EXPECTED=['whatsapp','autentique','nfse','instagram','facebook','youtube','tiktok','google-ads','google-calendar'];
const OFFICIAL_ACCOUNT_PROVIDERS=['whatsapp','instagram','facebook','youtube','tiktok'];
const root=process.cwd();
const contractSource=readFileSync(resolve(root,'apps/web/src/modules/integrations/integrationContract.ts'),'utf8');
const apiSource=readFileSync(resolve(root,'apps/web/src/modules/integrations/integrationApi.ts'),'utf8');
const settingsSource=readFileSync(resolve(root,'apps/web/src/modules/settings/SecurityIntegrationTabs.tsx'),'utf8');

test('integration registry contains every frontend-manageable provider exactly once',()=>{
  assert.deepEqual(INTEGRATION_REGISTRY.map(item=>item.id).sort(),[...EXPECTED].sort());
  assert.equal(new Set(INTEGRATION_REGISTRY.map(item=>item.id)).size,EXPECTED.length);
  assert.equal(new Set(INTEGRATION_REGISTRY.map(item=>item.name)).size,EXPECTED.length);
});

test('server-owned transactional email provider is not exposed by the browser contract',()=>{
  assert.equal(contractSource.includes("'resend'"),false);
  assert.equal(contractSource.includes('RESEND_API_KEY'),false);
  assert.equal(contractSource.includes('RESEND_WEBHOOK_SECRET'),false);
  assert.equal(settingsSource.includes("resend:'R'"),false);
  assert.equal(INTEGRATION_REGISTRY.some(item=>item.name.toLowerCase().includes('resend')),false);
  assert.equal(isIntegrationRuntimeStatus({id:'resend',state:'connected'}),false);
});

test('social and WhatsApp account connections require official provider authorization',()=>{
  for(const id of OFFICIAL_ACCOUNT_PROVIDERS){
    const integration=INTEGRATION_REGISTRY.find(item=>item.id===id);
    assert.ok(integration,`${id} integration must exist`);
    assert.equal(integration.authMode,'oauth2',`${id} must use provider OAuth/official authorization`);
    assert.ok(integration.officialAuthorizationProvider,`${id} must identify its official authorization provider`);
  }
  assert.match(settingsSource,/AUTH_HOSTS/);
  assert.match(settingsSource,/url\.protocol!==['"]https:['"]/);
  assert.equal(settingsSource.includes('url.origin===window.location.origin'),false,'OAuth authorization must never fall back to a local imitation login');
  assert.match(settingsSource,/Conectar \$\{item\.name\}/);
  assert.match(settingsSource,/Reconectar/);
  assert.match(settingsSource,/fluxo oficial/);
  assert.match(apiSource,/reconnectIntegration/);
  assert.match(apiSource,/authorizationUrl/);
});

test('provider capabilities are explicit and do not overstate YouTube paid-media ownership',()=>{
  const whatsapp=INTEGRATION_REGISTRY.find(item=>item.id==='whatsapp');
  const instagram=INTEGRATION_REGISTRY.find(item=>item.id==='instagram');
  const facebook=INTEGRATION_REGISTRY.find(item=>item.id==='facebook');
  const youtube=INTEGRATION_REGISTRY.find(item=>item.id==='youtube');
  const tiktok=INTEGRATION_REGISTRY.find(item=>item.id==='tiktok');
  assert.ok(whatsapp?.capabilities.includes('messaging'));
  assert.ok(whatsapp?.capabilities.includes('customer-service'));
  assert.ok(instagram?.capabilities.includes('messaging'));
  assert.ok(instagram?.capabilities.includes('content-publishing'));
  assert.ok(instagram?.capabilities.includes('ads'));
  assert.ok(facebook?.capabilities.includes('messaging'));
  assert.ok(facebook?.capabilities.includes('content-management'));
  assert.ok(facebook?.capabilities.includes('analytics'));
  assert.ok(youtube?.capabilities.includes('content-publishing'));
  assert.ok(youtube?.capabilities.includes('analytics'));
  assert.equal(youtube?.capabilities.includes('ads'),false,'YouTube paid campaigns belong to Google Ads API, not YouTube Data API');
  assert.ok(tiktok?.capabilities.includes('content-publishing'));
  assert.ok(tiktok?.capabilities.includes('ads'));
});

test('every frontend integration declares production authentication and dependency metadata',()=>{
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

test('runtime connection status accepts authorized metadata but never needs provider tokens',()=>{
  for(const id of EXPECTED){
    assert.equal(isIntegrationRuntimeStatus({id,state:'unconfigured'}),true);
    assert.equal(isIntegrationRuntimeStatus({id,state:'connected',accountId:'account-1',accountLabel:'Conta',grantedScopes:['scope.read'],authorizedCapabilities:['analytics'],lastCheckedAt:'2026-08-25T12:00:00.000Z'}),true);
  }
  assert.equal(isIntegrationRuntimeStatus({id:'unknown',state:'connected'}),false);
  assert.equal(isIntegrationRuntimeStatus({id:'whatsapp',state:'fake-connected'}),false);
  assert.equal(isIntegrationRuntimeStatus({id:'instagram',state:'connected',authorizedCapabilities:['not-real']}),false);
  assert.equal(contractSource.includes('accessToken'),false);
  assert.equal(contractSource.includes('refreshToken'),false);
});
