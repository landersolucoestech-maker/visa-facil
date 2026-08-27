import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { officialAuthorizationUrl } from '../../apps/web/src/modules/integrations/officialAuthorization.ts';

const root=process.cwd();
const guardSource=readFileSync(resolve(root,'apps/web/src/modules/integrations/officialAuthorization.ts'),'utf8');
const settingsSource=readFileSync(resolve(root,'apps/web/src/modules/settings/SecurityIntegrationTabs.tsx'),'utf8');

test('integration authorization redirects are limited to official provider HTTPS hosts only',()=>{
  for(const host of ['www.facebook.com','business.facebook.com','accounts.google.com','www.tiktok.com'])assert.ok(guardSource.includes(host));
  assert.ok(guardSource.includes("url.protocol!=='https:'"));
  assert.ok(guardSource.includes('OFFICIAL_AUTH_HOSTS[provider].includes(url.hostname)'));
  assert.ok(settingsSource.includes('officialAuthorizationUrl(definition.officialAuthorizationProvider,response.authorizationUrl)'));
  assert.equal(settingsSource.includes('url.origin===window.location.origin'),false,'OAuth must never accept a same-origin imitation login');
});

test('official OAuth redirects accept only HTTPS provider hosts without credentials or custom ports',()=>{
  assert.ok(officialAuthorizationUrl('meta','https://www.facebook.com/v20.0/dialog/oauth?client_id=1'));
  assert.ok(officialAuthorizationUrl('meta','https://business.facebook.com/dialog/oauth?client_id=1'));
  assert.ok(officialAuthorizationUrl('google','https://accounts.google.com/o/oauth2/v2/auth?client_id=1'));
  assert.ok(officialAuthorizationUrl('tiktok','https://www.tiktok.com/v2/auth/authorize/?client_key=1'));
  assert.equal(officialAuthorizationUrl('meta','http://www.facebook.com/dialog/oauth'),null);
  assert.equal(officialAuthorizationUrl('meta','https://facebook.com/dialog/oauth'),null);
  assert.equal(officialAuthorizationUrl('google','https://accounts.google.com.evil.example/oauth'),null);
  assert.equal(officialAuthorizationUrl('google','https://user:pass@accounts.google.com/oauth'),null);
  assert.equal(officialAuthorizationUrl('google','https://accounts.google.com:444/oauth'),null);
  assert.equal(officialAuthorizationUrl('tiktok','//www.tiktok.com/oauth'),null);
  assert.equal(officialAuthorizationUrl('tiktok','https://www.tiktok.com\\@evil.example/oauth'),null);
});

test('settings validates OAuth URL before changing local status or navigating',()=>{
  const validation=settingsSource.indexOf('officialAuthorizationUrl(definition.officialAuthorizationProvider,response.authorizationUrl)');
  const navigation=settingsSource.indexOf('window.location.assign(redirect)');
  assert.ok(validation>=0&&navigation>validation);
  assert.ok(settingsSource.includes("if(!redirect)throw new Error('OFFICIAL_AUTHORIZATION_REQUIRED')"));
});
