import test from 'node:test';
import assert from 'node:assert/strict';
import { isMarketingCampaign, isSafeMarketingDestinationUrl } from '../../apps/web/src/modules/marketing/marketingSessionStore.ts';

function campaign(){return{id:'campaign-1',name:'Campanha',owner:'Operador',ownerUserId:'user-1',objective:'Conversões',result:'Leads',status:'Agendada',paidPlatforms:['Meta Ads'],budget:1000,dailyBudget:100,spent:0,leads:0,conversions:0,startDate:'2026-08-27',endDate:'2026-09-05',audience:'Brasil',location:'Brasil',ageRange:'25–34',gender:'Todos',languages:'Português',interests:'Viagens',destinationUrl:'https://visafacil.com.br/landing',internalDescription:'',placements:['Feed'],creativeName:'Criativo',creativeFileName:'',headline:'Headline',primaryCopy:'Copy',cta:'Saiba mais',bidStrategy:'Menor custo'}}

test('marketing destination URLs accept only absolute HTTP(S) without embedded credentials',()=>{
 assert.equal(isSafeMarketingDestinationUrl('https://visafacil.com.br/landing?utm_source=meta'),true);
 assert.equal(isSafeMarketingDestinationUrl('http://example.com/landing'),true);
 assert.equal(isSafeMarketingDestinationUrl('javascript:alert(1)'),false);
 assert.equal(isSafeMarketingDestinationUrl('//evil.example/path'),false);
 assert.equal(isSafeMarketingDestinationUrl('https://user:pass@example.com/path'),false);
 assert.equal(isSafeMarketingDestinationUrl('https://example.com\\@evil.example/path'),false);
});

test('non-draft campaigns require a safe destination URL while drafts may remain incomplete',()=>{
 const valid=campaign();
 assert.equal(isMarketingCampaign(valid),true);
 assert.equal(isMarketingCampaign({...valid,destinationUrl:'javascript:alert(1)'}),false);
 assert.equal(isMarketingCampaign({...valid,destinationUrl:''}),false);
 assert.equal(isMarketingCampaign({...valid,status:'Rascunho',destinationUrl:''}),true);
});
