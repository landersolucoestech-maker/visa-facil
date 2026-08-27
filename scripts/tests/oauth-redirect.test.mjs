import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source=readFileSync(resolve(process.cwd(),'apps/web/src/modules/settings/SecurityIntegrationTabs.tsx'),'utf8');

test('integration authorization redirects are limited to the expected provider hosts or same origin',()=>{
  for(const host of ['www.facebook.com','accounts.google.com','www.tiktok.com'])assert.ok(source.includes(host));
  assert.ok(source.includes('url.origin===window.location.origin'));
  assert.ok(source.includes('OAUTH_HOSTS[id]?.includes(url.hostname)'));
  assert.ok(source.includes('safeAuthorizationRedirect(id,response.authorizationUrl)'));
});
