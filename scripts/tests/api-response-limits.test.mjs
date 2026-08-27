import test from 'node:test';
import assert from 'node:assert/strict';
import { readBoundedJsonResponse, ResponseBodyLimitError } from '../../apps/web/src/shared/boundedJsonResponse.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('bounded JSON reader accepts valid small API payloads',async()=>{
 const value=await readBoundedJsonResponse(new Response(JSON.stringify({ok:true})),1024);
 assert.deepEqual(value,{ok:true});
});

test('bounded JSON reader rejects declared and streamed payloads above the limit',async()=>{
 await assert.rejects(()=>readBoundedJsonResponse(new Response('1234567890',{headers:{'content-length':'10'}}),5),ResponseBodyLimitError);
 await assert.rejects(()=>readBoundedJsonResponse(new Response(JSON.stringify({value:'x'.repeat(100)})),32),ResponseBodyLimitError);
});

test('API client no longer consumes success and error bodies with response.json directly',()=>{
 const source=readFileSync(resolve(process.cwd(),'apps/web/src/shared/apiClient.ts'),'utf8');
 assert.ok(source.includes('readBoundedJsonResponse(response)'));
 assert.equal(source.includes('await response.json()'),false);
 assert.ok(source.includes("code:'API_RESPONSE_TOO_LARGE'"));
});
