import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INTEGRATION_REGISTRY, META_PRODUCTS, isIntegrationRuntimeStatus } from '../../apps/web/src/modules/integrations/integrationContract.ts';

const EXPECTED=['whatsapp','telephony-sms','autentique','nfse','meta','youtube','tiktok','google-ads','google-calendar'];
const OFFICIAL_ACCOUNT_PROVIDERS=['whatsapp','meta','youtube','tiktok'];
const root=process.cwd();
const contractSource=readFileSync(resolve(root,'apps/web/src/modules/integrations/integrationContract.ts'),'utf8');
const apiSource=readFileSync(resolve(root,'apps/web/src/modules/integrations/integrationApi.ts'),'utf8');
const settingsSource=readFileSync(resolve(root,'apps/web/src/modules/settings/SecurityIntegrationTabs.tsx'),'utf8');

test('integration registry contains every frontend-manageable provider exactly once',()=>{
  assert.deepEqual(INTEGRATION_REGISTRY.map(item=>item.id).sort(),[...EXPECTED].sort());
  assert.equal(new Set(INTEGRATION_REGISTRY.map(item=>item.id)).size,EXPECTED.length);
  assert.equal(new Set(INTEGRATION_REGISTRY.map(item=>item.name)).size,EXPECTED.length);
});

test('Meta is one technical provider while Facebook Instagram Messenger and Meta Ads remain products',()=>{
  const meta=INTEGRATION_REGISTRY.find(item=>item.id==='meta');
  assert.ok(meta,'Meta provider must exist');
  assert.equal(INTEGRATION_REGISTRY.some(item=>item.id==='instagram'),false);
  assert.equal(INTEGRATION_REGISTRY.some(item=>item.id==='facebook'),false);
  assert.deepEqual(META_PRODUCTS.map(item=>item.id),['facebook','instagram','messenger','meta-ads']);
  assert.equal(meta.officialAuthorizationProvider,'meta');
  assert.ok(meta.serverOnlySecrets.includes('META_APP_SECRET'));
  assert.ok(meta.apiFamilies?.includes('Meta Graph API'));
  assert.ok(meta.apiFamilies?.includes('Meta Marketing API'));
  assert.ok(meta.capabilities.includes('messaging'));
  assert.ok(meta.capabilities.includes('content-publishing'));
  assert.ok(meta.capabilities.includes('comments-moderation'));
  assert.ok(meta.capabilities.includes('ads'));
  assert.ok(meta.capabilities.includes('analytics'));
  assert.equal(meta.description,'Integração oficial via OAuth para atendimento, mensagens, conteúdo, comentários, anúncios, métricas e demais recursos autorizados pelas APIs da Meta.');
  assert.ok(settingsSource.includes('Meta — Facebook, Instagram, Messenger e Ads'));
  assert.equal(settingsSource.includes('Produtos / canais: Facebook · Instagram · Messenger · Meta Ads'),false);
  assert.equal(settingsSource.includes('Meta App ID, Meta App Secret, OAuth, tokens, webhook, Graph API e estado geral pertencem ao provider Meta'),false);
  assert.ok(settingsSource.includes("meta:'M'"));
  assert.equal(settingsSource.includes("instagram:'IG'"),false);
  assert.equal(settingsSource.includes("facebook:'FB'"),false);
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
  const telephony=INTEGRATION_REGISTRY.find(item=>item.id==='telephony-sms');
  const meta=INTEGRATION_REGISTRY.find(item=>item.id==='meta');
  const youtube=INTEGRATION_REGISTRY.find(item=>item.id==='youtube');
  const tiktok=INTEGRATION_REGISTRY.find(item=>item.id==='tiktok');
  assert.ok(whatsapp?.capabilities.includes('messaging'));
  assert.ok(whatsapp?.capabilities.includes('customer-service'));
  assert.ok(telephony?.capabilities.includes('sms'));
  assert.ok(telephony?.capabilities.includes('voice'));
  assert.ok(telephony?.capabilities.includes('phone-numbers'));
  assert.ok(telephony?.capabilities.includes('delivery-status'));
  assert.ok(meta?.capabilities.includes('messaging'));
  assert.ok(meta?.capabilities.includes('content-management'));
  assert.ok(meta?.capabilities.includes('analytics'));
  assert.ok(meta?.capabilities.includes('ads'));
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

test('runtime connection status models Meta products and assets without exposing provider tokens',()=>{
  for(const id of EXPECTED){
    assert.equal(isIntegrationRuntimeStatus({id,state:'unconfigured'}),true);
    assert.equal(isIntegrationRuntimeStatus({id,state:'connected',accountId:'account-1',accountLabel:'Conta',grantedScopes:['scope.read'],authorizedCapabilities:['analytics'],lastCheckedAt:'2026-08-25T12:00:00.000Z'}),true);
  }
  const metaStatus={id:'meta',state:'connected',metaProducts:[{id:'facebook',state:'connected',assetIds:['page-1'],authorizedCapabilities:['content-publishing']},{id:'instagram',state:'disconnected'},{id:'messenger',state:'unavailable'},{id:'meta-ads',state:'connected',assetIds:['ad-1'],authorizedCapabilities:['ads','analytics']}],metaAssets:[{id:'page-1',kind:'facebook-page',label:'Página',productIds:['facebook','messenger']},{id:'ad-1',kind:'ad-account',label:'Conta de anúncios',productIds:['meta-ads']} ]};
  assert.equal(isIntegrationRuntimeStatus(metaStatus),true);
  assert.equal(isIntegrationRuntimeStatus({...metaStatus,id:'youtube'}),false,'Meta product metadata must not leak into another provider');
  assert.equal(isIntegrationRuntimeStatus({id:'meta',state:'connected',metaProducts:[{id:'facebook',state:'connected'},{id:'facebook',state:'connected'}]}),false,'Meta products must be unique');
  assert.equal(isIntegrationRuntimeStatus({id:'unknown',state:'connected'}),false);
  assert.equal(isIntegrationRuntimeStatus({id:'whatsapp',state:'fake-connected'}),false);
  assert.equal(isIntegrationRuntimeStatus({id:'meta',state:'connected',authorizedCapabilities:['not-real']}),false);
  assert.equal(contractSource.includes('accessToken'),false);
  assert.equal(contractSource.includes('refreshToken'),false);
});
