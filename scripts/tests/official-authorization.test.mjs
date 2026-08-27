import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { officialAuthorizationUrl } from '../../apps/web/src/modules/integrations/officialAuthorization.ts';

const settings=readFileSync(resolve(process.cwd(),'apps/web/src/modules/settings/SecurityIntegrationTabs.tsx'),'utf8');

test('official OAuth redirects accept only HTTPS provider hosts without credentials or custom ports',()=>{
 assert.equal(officialAuthorizationUrl('meta','https://www.facebook.com/v25.0/dialog/oauth?client_id=1'),'https://www.facebook.com/v25.0/dialog/oauth?client_id=1');
 assert.equal(officialAuthorizationUrl('meta','https://business.facebook.com/wa/manage/'),'https://business.facebook.com/wa/manage/');
 assert.equal(officialAuthorizationUrl('google','https://accounts.google.com/o/oauth2/v2/auth?client_id=1'),'https://accounts.google.com/o/oauth2/v2/auth?client_id=1');
 assert.equal(officialAuthorizationUrl('tiktok','https://www.tiktok.com/v2/auth/authorize/?client_key=1'),'https://www.tiktok.com/v2/auth/authorize/?client_key=1');
 assert.equal(officialAuthorizationUrl('google','http://accounts.google.com/o/oauth2/v2/auth'),null);
 assert.equal(officialAuthorizationUrl('google','https://evil.example/o/oauth2/v2/auth'),null);
 assert.equal(officialAuthorizationUrl('google','https://user:pass@accounts.google.com/o/oauth2/v2/auth'),null);
 assert.equal(officialAuthorizationUrl('google','https://accounts.google.com:444/o/oauth2/v2/auth'),null);
 assert.equal(officialAuthorizationUrl('meta','https://www.facebook.com\\@evil.example/x'),null);
});

test('settings validates OAuth URL before changing local status or navigating',()=>{
 assert.ok(settings.includes('officialAuthorizationUrl'));
 assert.ok(settings.includes("if(!redirect)throw new Error('OFFICIAL_AUTHORIZATION_REQUIRED')"));
 const redirectIndex=settings.indexOf("if((action==='connect'||action==='reconnect')&&definition.authMode==='oauth2')");
 const setStatusIndex=settings.indexOf('setStatuses(current=>current.map',redirectIndex);
 const assignIndex=settings.indexOf('window.location.assign(redirect)',redirectIndex);
 assert.ok(redirectIndex>=0&&assignIndex>redirectIndex&&setStatusIndex>assignIndex);
});
