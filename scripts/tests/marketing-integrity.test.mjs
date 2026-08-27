import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const app=readFileSync(resolve(root,'apps/web/src/modules/marketing/MarketingApp.tsx'),'utf8');
const store=readFileSync(resolve(root,'apps/web/src/modules/marketing/marketingSessionStore.ts'),'utf8');
const persistence=readFileSync(resolve(root,'apps/web/src/shared/sessionPersistence.ts'),'utf8');
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

test('YouTube paid inventory is canonicalized under Google Ads instead of a duplicate provider',()=>{
  assert.ok(store.includes("export type PaidPlatform='Meta Ads'|'Google Ads'|'TikTok Ads'"));
  assert.ok(store.includes("if(value==='YouTube Ads'||value==='YouTube')return'Google Ads'"));
  assert.ok(store.includes("if(channel==='Google Ads'||channel==='YouTube')return'Google Ads'"));
  assert.ok(app.includes("const PAID_PLATFORMS:PaidPlatform[]=['Meta Ads','Google Ads','TikTok Ads']"));
  assert.equal(app.includes("'YouTube Ads'"),false);
  assert.ok(app.includes('YouTube In-stream'));
  assert.ok(app.includes('YouTube Shorts'));
  assert.ok(app.includes('inventário do YouTube'));
});

test('marketing writes use the same crash-safe persistence contract as operational modules',()=>{
  assert.ok(store.includes('writeSessionRecordsSafely<ContentItem>'));
  assert.ok(store.includes('writeSessionRecordsSafely<Campaign>'));
  assert.ok(persistence.includes("LOCAL_PERSISTENCE_ERROR_EVENT='visa-local-persistence-error'"));
  assert.ok(persistence.includes('catch(error){reportSessionPersistenceError(error,key);return structuredClone(records)}'));
  assert.ok(persistence.includes('window.dispatchEvent(new CustomEvent<LocalPersistenceErrorDetail>'));
});

test('marketing overview derives upcoming content from schedule instead of insertion order',()=>{
  assert.ok(app.includes('const contentScheduleKey='));
  assert.ok(app.includes('const now=currentScheduleKey()'));
  assert.ok(app.includes("content.status==='Agendado'&&contentScheduleKey(content)>=now"));
  assert.ok(app.includes('sort((left,right)=>contentScheduleKey(left).localeCompare(contentScheduleKey(right)))'));
  assert.ok(app.includes('Nenhum conteúdo futuro agendado.'));
});

test('marketing day and week calendars keep every valid hour visible',()=>{
  assert.ok((app.match(/Array\.from\(\{length:24\}/g)||[]).length>=2);
  assert.equal(app.includes('Array.from({length:12},(_,index)=>index+8)'),false);
  assert.equal(app.includes('Array.from({length:11},(_,index)=>index+8)'),false);
});

test('marketing makes local-only campaign and publication state explicit',()=>{
  assert.ok(app.includes('Status interno'));
  assert.ok(app.includes('este status não publica automaticamente nas plataformas'));
  assert.ok(app.includes('O protótipo não publica campanhas nas plataformas'));
  assert.ok(app.includes("total===1?'conteúdo':'conteúdos'"));
});
