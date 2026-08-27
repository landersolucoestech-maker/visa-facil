import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LOCAL_PERSISTENCE_ERROR_EVENT, safeWriteSessionRecords } from '../../apps/web/src/shared/sessionPersistence.ts';

const root=process.cwd();
const store=readFileSync(resolve(root,'apps/web/src/modules/marketing/marketingSessionStore.ts'),'utf8');
const fixture=JSON.parse(readFileSync(resolve(root,'apps/web/src/mocks/marketing/marketing.dev.json'),'utf8'));

const contentFormats={
  Instagram:['Feed','Carrossel','Stories','Reels'],
  Facebook:['Feed','Carrossel','Stories','Reels'],
  TikTok:['Reels','Stories'],
  YouTube:['Vídeo','Shorts','Post'],
  X:['Post','Carrossel','Reels','Shorts','Stories'],
  Threads:['Post','Carrossel'],
};
const objectives=['Alcance','Tráfego','Engajamento','Conversões'];
const campaignStatuses=['Rascunho','Agendada','Ativa','Pausada'];
const contentStatuses=['Agendado','Produção','Revisão','Publicado'];

test('marketing fixture matches the canonical builder and calendar contracts',()=>{
  for(const campaign of fixture.campaigns){
    assert.ok(objectives.includes(campaign.objective),`${campaign.id} has an unsupported objective`);
    assert.ok(campaignStatuses.includes(campaign.status),`${campaign.id} has an unsupported status`);
  }
  for(const content of fixture.contents){
    assert.ok(contentStatuses.includes(content.status),`${content.id} has an unsupported status`);
    assert.ok(contentFormats[content.channel]?.includes(content.type),`${content.id} has an unsupported format for ${content.channel}`);
  }
});

test('marketing store migrates known legacy records and rejects arbitrary lifecycle values',()=>{
  assert.ok(store.includes("if(value==='Geração de leads')return'Conversões'"));
  assert.ok(store.includes("primaryChannel==='Facebook'&&value.type==='Post'?'Feed':value.type"));
  assert.ok(store.includes('CAMPAIGN_OBJECTIVES.has(value.objective)'));
  assert.ok(store.includes('CAMPAIGN_STATUSES.has(value.status)'));
  assert.ok(store.includes('CONTENT_STATUSES.has(value.status)'));
  assert.ok(store.includes('CONTENT_FORMATS[value.primaryChannel as Platform].has(value.type)'));
});

test('marketing writes use the same crash-safe persistence contract as operational modules',()=>{
  assert.ok(store.includes('safeWriteSessionRecords<ContentItem>'));
  assert.ok(store.includes('safeWriteSessionRecords<Campaign>'));
});

test('safe session persistence reports quota failures without crashing the calling UI',()=>{
  const previousStorage=globalThis.sessionStorage;
  const previousWindow=globalThis.window;
  let captured;
  globalThis.sessionStorage={
    getItem:()=>null,
    setItem:()=>{throw new Error('quota')},
    removeItem:()=>{},
    clear:()=>{},
  };
  globalThis.window={dispatchEvent:event=>{captured=event;return true}};
  try{
    const records=[{id:'marketing-1',name:'Campaign'}];
    const validate=value=>Boolean(value)&&typeof value==='object'&&typeof value.id==='string'&&typeof value.name==='string';
    const result=safeWriteSessionRecords('marketing.test',records,validate);
    assert.deepEqual(result,records);
    assert.equal(captured?.type,LOCAL_PERSISTENCE_ERROR_EVENT);
    assert.equal(captured?.detail?.key,'marketing.test');
  }finally{
    if(previousStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=previousStorage;
    if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
  }
});
