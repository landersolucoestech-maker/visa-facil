import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GOOGLE_PRODUCTS, INTEGRATION_REGISTRY, META_PRODUCTS, isIntegrationRuntimeStatus } from '../../apps/web/src/modules/integrations/integrationContract.ts';

const EXPECTED=['whatsapp','telephony-sms','autentique','nfse','meta','google','tiktok'];
const OFFICIAL_ACCOUNT_PROVIDERS=['whatsapp','meta','google','tiktok'];
const root=process.cwd();
const contractSource=readFileSync(resolve(root,'apps/web/src/modules/integrations/integrationContract.ts'),'utf8');
const apiSource=readFileSync(resolve(root,'apps/web/src/modules/integrations/integrationApi.ts'),'utf8');
const settingsSource=readFileSync(resolve(root,'apps/web/src/modules/settings/SecurityIntegrationTabs.tsx'),'utf8');
const authorizationSource=readFileSync(resolve(root,'apps/web/src/modules/integrations/officialAuthorization.ts'),'utf8');

test('integration registry contains every frontend-manageable technical provider exactly once',()=>{
  assert.deepEqual(INTEGRATION_REGISTRY.map(item=>item.id).sort(),[...EXPECTED].sort());
  assert.equal(new Set(INTEGRATION_REGISTRY.map(item=>item.id)).size,EXPECTED.length);
  assert.equal(new Set(INTEGRATION_REGISTRY.map(item=>item.name)).size,EXPECTED.length);
  assert.deepEqual([...new Set(INTEGRATION_REGISTRY.map(item=>item.category))],['Comunicação','Documentos','Fiscal','Social, Conteúdo & Publicidade']);
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
  assert.equal(meta.description,'Integração oficial com o ecossistema Meta, utilizando uma única estrutura de autorização para disponibilizar os recursos permitidos de Facebook, Instagram, Messenger e Meta Ads.');
  assert.ok(settingsSource.includes('Facebook · Instagram · Messenger · Meta Ads'));
  assert.ok(settingsSource.includes('A conexão deverá centralizar atendimento, mensagens, gestão de conteúdo, interações sociais, publicidade e métricas conforme as permissões concedidas e os recursos disponibilizados pelas APIs oficiais da Meta.'));
  assert.ok(settingsSource.includes("meta:'M'"));
  assert.equal(settingsSource.includes("instagram:'IG'"),false);
  assert.equal(settingsSource.includes("facebook:'FB'"),false);
});

test('Google is one technical provider while YouTube Ads and Calendar remain service products',()=>{
  const google=INTEGRATION_REGISTRY.find(item=>item.id==='google');
  assert.ok(google,'Google provider must exist');
  assert.equal(INTEGRATION_REGISTRY.some(item=>item.id==='youtube'),false);
  assert.equal(INTEGRATION_REGISTRY.some(item=>item.id==='google-ads'),false);
  assert.equal(INTEGRATION_REGISTRY.some(item=>item.id==='google-calendar'),false);
  assert.deepEqual(GOOGLE_PRODUCTS.map(item=>item.id),['youtube','google-ads','google-calendar']);
  assert.equal(google.officialAuthorizationProvider,'google');
  assert.ok(google.serverOnlySecrets.includes('GOOGLE_CLIENT_SECRET'));
  assert.ok(google.serverOnlySecrets.includes('GOOGLE_ADS_DEVELOPER_TOKEN'));
  assert.ok(google.apiFamilies?.includes('YouTube Data API'));
  assert.ok(google.apiFamilies?.includes('Google Ads API'));
  assert.ok(google.apiFamilies?.includes('Google Calendar API'));
  assert.ok(google.capabilities.includes('content-publishing'));
  assert.ok(google.capabilities.includes('ads'));
  assert.ok(google.capabilities.includes('analytics'));
  assert.ok(google.capabilities.includes('calendar-sync'));
  const youtube=GOOGLE_PRODUCTS.find(item=>item.id==='youtube');
  assert.ok(youtube?.capabilities.includes('content-publishing'));
  assert.ok(youtube?.capabilities.includes('analytics'));
  assert.equal(youtube?.capabilities.includes('ads'),false,'YouTube paid campaigns belong to the Google Ads service product');
  assert.ok(settingsSource.includes('YouTube · Google Ads · Google Calendar'));
  assert.ok(settingsSource.includes('A conexão poderá habilitar individualmente ou em conjunto os seguintes serviços:'));
  assert.ok(settingsSource.includes("google:'G'"));
  assert.equal(settingsSource.includes("youtube:'YT'"),false);
  assert.equal(settingsSource.includes("'google-ads':'GA'"),false);
  assert.equal(settingsSource.includes("'google-calendar':'GC'"),false);
});

test('server-owned transactional email provider is not exposed by the browser contract',()=>{
  assert.equal(contractSource.includes("'resend'"),false);
  assert.equal(contractSource.includes('RESEND_API_KEY'),false);
  assert.equal(contractSource.includes('RESEND_WEBHOOK_SECRET'),false);
  assert.equal(settingsSource.includes("resend:'R'"),false);
  assert.equal(INTEGRATION_REGISTRY.some(item=>item.name.toLowerCase().includes('resend')),false);
  assert.equal(isIntegrationRuntimeStatus({id:'resend',state:'connected'}),false);
});

test('official account providers require their original OAuth authorization flow',()=>{
  for(const id of OFFICIAL_ACCOUNT_PROVIDERS){
    const integration=INTEGRATION_REGISTRY.find(item=>item.id===id);
    assert.ok(integration,`${id} integration must exist`);
    assert.equal(integration.authMode,'oauth2',`${id} must use provider OAuth/official authorization`);
    assert.ok(integration.officialAuthorizationProvider,`${id} must identify its official authorization provider`);
  }
  assert.match(authorizationSource,/OFFICIAL_AUTH_HOSTS/);
  assert.match(authorizationSource,/url\.protocol!==['"]https:['"]/);
  assert.match(authorizationSource,/OFFICIAL_AUTH_HOSTS\[provider\]\.includes\(url\.hostname\)/);
  assert.equal(settingsSource.includes('url.origin===window.location.origin'),false,'OAuth authorization must never fall back to a local imitation login');
  assert.match(settingsSource,/officialAuthorizationUrl\(definition\.officialAuthorizationProvider,response\.authorizationUrl\)/);
  assert.match(settingsSource,/Conectar \$\{item\.name\}/);
  assert.match(settingsSource,/Reconectar/);
  assert.match(settingsSource,/fluxo oficial/);
  assert.match(apiSource,/reconnectIntegration/);
  assert.match(apiSource,/authorizationUrl/);
});

test('integration presentation exposes the requested operational capabilities without inventing live connections',()=>{
  for(const copy of [
    'Gerenciamento de conversas',
    'Recebimento e envio de mensagens',
    'Histórico de comunicação',
    'Envio para assinatura',
    'Histórico de assinaturas',
    'Emissão de NFS-e',
    'Histórico fiscal',
    'Páginas e perfis',
    'Grupos de anúncios',
    'Inventário de YouTube quando aplicável',
    'Sincronização bidirecional',
    'Campanhas e anúncios quando autorizados',
  ])assert.ok(settingsSource.includes(copy),`missing integration copy: ${copy}`);
  assert.ok(settingsSource.includes("backendConfigured?(item.authMode==='oauth2'?`Conectar ${item.name}`:`Configurar ${item.name}`):'Backend necessário'"));
});

test('provider capabilities remain explicit and YouTube paid-media ownership stays under Google Ads',()=>{
  const whatsapp=INTEGRATION_REGISTRY.find(item=>item.id==='whatsapp');
  const telephony=INTEGRATION_REGISTRY.find(item=>item.id==='telephony-sms');
  const meta=INTEGRATION_REGISTRY.find(item=>item.id==='meta');
  const google=INTEGRATION_REGISTRY.find(item=>item.id==='google');
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
  assert.ok(google?.capabilities.includes('content-publishing'));
  assert.ok(google?.capabilities.includes('calendar-sync'));
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

test('runtime connection status models Meta and Google products without exposing provider tokens',()=>{
  for(const id of EXPECTED){
    assert.equal(isIntegrationRuntimeStatus({id,state:'unconfigured'}),true);
    assert.equal(isIntegrationRuntimeStatus({id,state:'connected',accountId:'account-1',accountLabel:'Conta',grantedScopes:['scope.read'],authorizedCapabilities:['analytics'],lastCheckedAt:'2026-08-25T12:00:00.000Z'}),true);
  }
  const metaStatus={id:'meta',state:'connected',metaProducts:[{id:'facebook',state:'connected',assetIds:['page-1'],authorizedCapabilities:['content-publishing']},{id:'instagram',state:'disconnected'},{id:'messenger',state:'unavailable'},{id:'meta-ads',state:'connected',assetIds:['ad-1'],authorizedCapabilities:['ads','analytics']}],metaAssets:[{id:'page-1',kind:'facebook-page',label:'Página',productIds:['facebook','messenger']},{id:'ad-1',kind:'ad-account',label:'Conta de anúncios',productIds:['meta-ads']} ]};
  assert.equal(isIntegrationRuntimeStatus(metaStatus),true);
  assert.equal(isIntegrationRuntimeStatus({...metaStatus,id:'google'}),false,'Meta product metadata must not leak into Google');
  assert.equal(isIntegrationRuntimeStatus({id:'meta',state:'connected',metaProducts:[{id:'facebook',state:'connected'},{id:'facebook',state:'connected'}]}),false,'Meta products must be unique');
  const googleStatus={id:'google',state:'connected',googleProducts:[{id:'youtube',state:'connected',authorizedCapabilities:['content-publishing','analytics']},{id:'google-ads',state:'connected',authorizedCapabilities:['ads','analytics']},{id:'google-calendar',state:'disconnected'}]};
  assert.equal(isIntegrationRuntimeStatus(googleStatus),true);
  assert.equal(isIntegrationRuntimeStatus({...googleStatus,id:'meta'}),false,'Google product metadata must not leak into Meta');
  assert.equal(isIntegrationRuntimeStatus({id:'google',state:'connected',googleProducts:[{id:'youtube',state:'connected'},{id:'youtube',state:'connected'}]}),false,'Google products must be unique');
  assert.equal(isIntegrationRuntimeStatus({id:'unknown',state:'connected'}),false);
  assert.equal(isIntegrationRuntimeStatus({id:'whatsapp',state:'fake-connected'}),false);
  assert.equal(isIntegrationRuntimeStatus({id:'meta',state:'connected',authorizedCapabilities:['not-real']}),false);
  assert.equal(contractSource.includes('accessToken'),false);
  assert.equal(contractSource.includes('refreshToken'),false);
});
