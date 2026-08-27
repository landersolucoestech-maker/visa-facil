import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source=readFileSync(resolve(process.cwd(),'apps/web/src/modules/settings/SecurityIntegrationTabs.tsx'),'utf8');

test('integration authorization redirects are limited to official provider HTTPS hosts only',()=>{
  for(const host of ['www.facebook.com','business.facebook.com','accounts.google.com','www.tiktok.com'])assert.ok(source.includes(host));
  assert.ok(source.includes("url.protocol!=='https:'"));
  assert.ok(source.includes('AUTH_HOSTS[provider].includes(url.hostname)'));
  assert.ok(source.includes('safeAuthorizationRedirect(definition.officialAuthorizationProvider,response.authorizationUrl)'));
  assert.equal(source.includes('url.origin===window.location.origin'),false,'OAuth must never accept a same-origin imitation login');
});
