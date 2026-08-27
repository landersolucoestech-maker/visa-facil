import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildApiEndpoint, normalizeApiBaseUrl } from '../../apps/web/src/shared/apiBaseUrl.ts';

const client=readFileSync(resolve(process.cwd(),'apps/web/src/shared/apiClient.ts'),'utf8');

test('API base URL accepts only safe same-origin paths or allowed absolute HTTP(S) origins',()=>{
  assert.equal(normalizeApiBaseUrl('/api/'),'/api');
  assert.equal(normalizeApiBaseUrl('/'),'/');
  assert.equal(normalizeApiBaseUrl('https://api.example.com/v1/'),'https://api.example.com/v1');
  assert.equal(normalizeApiBaseUrl('http://localhost:3000/api',true),'http://localhost:3000/api');
  assert.equal(normalizeApiBaseUrl('http://api.example.com'),null);
});

test('API base URL rejects protocol-relative hosts and malformed relative paths',()=>{
  assert.equal(normalizeApiBaseUrl('//evil.example/api'),null);
  assert.equal(normalizeApiBaseUrl('/\\evil.example/api'),null);
  assert.equal(normalizeApiBaseUrl('/api/../admin'),null);
  assert.equal(normalizeApiBaseUrl('/api?host=evil'),null);
  assert.equal(normalizeApiBaseUrl('/api#fragment'),null);
  assert.equal(normalizeApiBaseUrl('/api\n/next'),null);
});

test('API base URL rejects embedded credentials query strings and fragments',()=>{
  assert.equal(normalizeApiBaseUrl('https://user:pass@api.example.com'),null);
  assert.equal(normalizeApiBaseUrl('https://api.example.com?token=secret'),null);
  assert.equal(normalizeApiBaseUrl('https://api.example.com/#fragment'),null);
});

test('API endpoint builder cannot escape a root-relative backend through its request path',()=>{
  assert.equal(buildApiEndpoint('/','/public/leads'),'/public/leads');
  assert.equal(buildApiEndpoint('/api','public/leads?source=site'),'/api/public/leads?source=site');
  assert.equal(buildApiEndpoint('/','//evil.example/steal'),null);
  assert.equal(buildApiEndpoint('/','https://evil.example/steal'),null);
  assert.equal(buildApiEndpoint('/api','/../admin'),null);
  assert.equal(buildApiEndpoint('/api','/public/leads#fragment'),null);
  assert.equal(buildApiEndpoint('/api','/public\\leads'),null);
});

test('API client preserves configuration and path errors instead of misreporting them as network failures',()=>{
  assert.ok(client.includes("code:'INVALID_API_PATH'"));
  assert.ok(client.includes('if(error instanceof ApiClientError)throw error'));
});
