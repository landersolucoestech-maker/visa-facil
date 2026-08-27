import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isSafeMarketingDestinationUrl } from '../../apps/web/src/modules/marketing/marketingUrl.ts';

const storeSource=readFileSync(resolve(process.cwd(),'apps/web/src/modules/marketing/marketingSessionStore.ts'),'utf8');
const appSource=readFileSync(resolve(process.cwd(),'apps/web/src/modules/marketing/MarketingApp.tsx'),'utf8');

test('marketing destination URLs accept only absolute HTTP(S) without embedded credentials',()=>{
 assert.equal(isSafeMarketingDestinationUrl('https://visafacil.com.br/landing?utm_source=meta'),true);
 assert.equal(isSafeMarketingDestinationUrl('http://example.com/landing'),true);
 assert.equal(isSafeMarketingDestinationUrl('javascript:alert(1)'),false);
 assert.equal(isSafeMarketingDestinationUrl('//evil.example/path'),false);
 assert.equal(isSafeMarketingDestinationUrl('https://user:pass@example.com/path'),false);
 assert.equal(isSafeMarketingDestinationUrl('https://example.com\\@evil.example/path'),false);
});

test('campaign persistence requires the pure destination URL guard for non-empty and non-draft URLs',()=>{
 assert.ok(storeSource.includes("import { isSafeMarketingDestinationUrl } from './marketingUrl'"));
 assert.ok(storeSource.includes("value.destinationUrl.trim()&&!isSafeMarketingDestinationUrl(value.destinationUrl)"));
 assert.ok(storeSource.includes("value.status!=='Rascunho'"));
 assert.ok(storeSource.includes('!isSafeMarketingDestinationUrl(value.destinationUrl as string)'));
});

test('campaign builder uses the same destination URL guard before mutating in-memory state',()=>{
 assert.ok(appSource.includes("import { isSafeMarketingDestinationUrl } from './marketingUrl'"));
 assert.ok(appSource.includes("const destinationSafe=!draft.destinationUrl.trim()||isSafeMarketingDestinationUrl(draft.destinationUrl)"));
 assert.ok(appSource.includes('draft.paidPlatforms.length>0&&isSafeMarketingDestinationUrl(draft.destinationUrl)'));
 assert.ok(appSource.includes("if(!validCampaignDraft(draft,draft.status!=='Rascunho'))return"));
});
