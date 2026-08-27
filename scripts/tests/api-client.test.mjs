import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiBaseUrl } from '../../apps/web/src/shared/apiBaseUrl.ts';

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
