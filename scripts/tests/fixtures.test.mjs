import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const json=(path)=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const uniqueIds=(items,label)=>{
  const ids=items.map((item)=>item.id);
  assert.equal(ids.length,new Set(ids).size,`${label} must not contain duplicate ids`);
  ids.forEach((id)=>assert.equal(typeof id,'string',`${label} id must be a string`));
};
const invoiceTotal=(item)=>{
  const number=(key)=>typeof item[key]==='number'&&Number.isFinite(item[key])?item[key]:0;
  const subtotal=Math.max(0,number('serviceFee')+number('consularFee')+number('translationFee')+number('courierFee')+number('thirdPartyFee')+number('otherCharges')-number('discounts'));
  return Math.max(0,subtotal+number('tax')+number('icms')+number('ipi')+number('pis')+number('cofins')+number('iss')+number('freight')+number('insurance')+number('otherFiscalExpenses')-number('withheldTaxes'));
};
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const TIME_RE=/^([01]\d|2[0-3]):[0-5]\d$/;

test('CRM fixtures satisfy the person relationship contract',()=>{
  const items=json('apps/web/src/mocks/crm/crm-records.dev.json');
  assert.ok(Array.isArray(items));
  uniqueIds(items,'CRM fixtures');
  for(const item of items){
    assert.ok(['contact','lead'].includes(item.kind));
    assert.equal(typeof item.fullName,'string');
    assert.ok(item.fullName.trim());
    assert.equal(typeof item.email,'string');
    assert.ok(item.email.trim());
    assert.equal(typeof item.cpf,'string');
    assert.equal(typeof item.rg,'string');
    assert.equal(typeof item.passportNumber,'string');
    assert.ok(Number.isFinite(Date.parse(item.createdAt)));
    assert.ok(Number.isFinite(Date.parse(item.updatedAt)));
    if(item.kind==='contact'){
      assert.ok(['Cliente','Parceiro','Outro'].includes(item.relationship));
      assert.ok(['Ativo','Inativo'].includes(item.contactStatus));
    }else{
      assert.ok(['Novo','Em contato','Qualificado','Não qualificado','Convertido','Perdido'].includes(item.leadStatus));
      assert.ok(['Frio','Morno','Quente'].includes(item.temperature));
    }
    for(const forbidden of ['cnpj','legalName','tradeName','contactPerson','personType'])assert.equal(forbidden in item,false,`CRM person fixture contains forbidden company field ${forbidden}`);
  }
});

test('finance transaction fixtures satisfy the canonical transaction model',()=>{
  const items=json('apps/web/src/mocks/finance/finance.dev.json');
  assert.ok(Array.isArray(items));
  uniqueIds(items,'Finance fixtures');
  for(const item of items){
    assert.ok(['Receita','Despesa'].includes(item.type));
    const allowed=item.type==='Receita'?['Recebido','A receber']:['Pago','A pagar'];
    assert.ok(allowed.includes(item.status),`${item.id} status must be compatible with ${item.type}`);
    assert.equal(typeof item.amount,'number');
    assert.ok(Number.isFinite(item.amount)&&item.amount>0);
    assert.match(item.date,DATE_RE);
    assert.ok(item.dueDate===''||DATE_RE.test(item.dueDate));
  }
});

test('invoice fixtures have unique documents and settlement-consistent payment ledgers',()=>{
  const items=json('apps/web/src/mocks/finance/invoices.dev.json');
  assert.ok(Array.isArray(items));
  uniqueIds(items,'Invoice fixtures');
  const numbers=new Set();
  for(const item of items){
    assert.equal(typeof item.invoiceNumber,'string');
    assert.equal(numbers.has(item.invoiceNumber),false,`Duplicate invoice number ${item.invoiceNumber}`);
    numbers.add(item.invoiceNumber);
    assert.equal(typeof item.customer,'string');
    assert.equal(typeof item.serviceFee,'number');
    assert.equal(typeof item.paid,'number');
    assert.ok(Number.isFinite(item.paid)&&item.paid>=0);
    assert.ok(Array.isArray(item.payments));
    uniqueIds(item.payments,`Payments for ${item.invoiceNumber}`);
    item.payments.forEach((payment)=>{
      assert.equal(typeof payment.id,'string');
      assert.equal(typeof payment.amount,'number');
      assert.ok(Number.isFinite(payment.amount)&&payment.amount>0);
      assert.equal(typeof payment.processingFee,'number');
      assert.ok(Number.isFinite(payment.processingFee)&&payment.processingFee>=0);
      assert.ok(['Liquidado','Pendente'].includes(payment.settlementStatus));
    });
    const liquidated=item.payments.filter((payment)=>payment.settlementStatus==='Liquidado').reduce((sum,payment)=>sum+payment.amount,0);
    const total=invoiceTotal(item);
    assert.equal(item.paid,liquidated,`${item.invoiceNumber} paid must equal liquidated payments`);
    assert.ok(item.paid<=total,`${item.invoiceNumber} paid cannot exceed invoice total`);
    if(item.status==='Pago')assert.equal(item.paid,total,`${item.invoiceNumber} marked Pago must be fully settled`);
    if(item.status==='Parcialmente pago')assert.ok(item.paid>0&&item.paid<total,`${item.invoiceNumber} partial status requires a partial settled amount`);
  }
});

test('task fixtures use canonical statuses, priorities and valid scheduling fields',()=>{
  const items=json('apps/web/src/mocks/tasks/tasks.dev.json');
  assert.ok(Array.isArray(items));
  uniqueIds(items,'Task fixtures');
  for(const item of items){
    assert.ok(['Pendente','Em andamento','Concluída'].includes(item.status));
    assert.ok(['Baixa','Média','Alta'].includes(item.priority));
    assert.ok(['Contato','Lead'].includes(item.relatedType));
    assert.ok(['Geral','Marketing'].includes(item.area??'Geral'));
    assert.match(item.dueDate,DATE_RE);
    assert.match(item.dueTime,TIME_RE);
    assert.ok(Number.isFinite(Date.parse(item.createdAt)));
    assert.ok(Number.isFinite(Date.parse(item.updatedAt)));
  }
});

test('agenda fixtures use valid dates, statuses and chronological time ranges',()=>{
  const items=json('apps/web/src/mocks/agenda/agenda.dev.json');
  assert.ok(Array.isArray(items));
  uniqueIds(items,'Agenda fixtures');
  for(const item of items){
    assert.match(item.date,DATE_RE);
    assert.match(item.startTime,TIME_RE);
    assert.match(item.endTime,TIME_RE);
    assert.ok(item.endTime>item.startTime,`${item.id} must end after it starts`);
    assert.ok(['Confirmado','Pendente','Realizado','Cancelado'].includes(item.status));
    assert.ok(['Contato','Lead','Cliente'].includes(item.relatedType));
  }
});

test('attendance fixtures keep conversations and message ids unique',()=>{
  const data=json('apps/web/src/mocks/attendance/attendance.dev.json');
  assert.deepEqual(Object.keys(data).sort(),['conversations']);
  assert.ok(Array.isArray(data.conversations));
  uniqueIds(data.conversations,'Attendance conversations');
  for(const conversation of data.conversations){
    assert.ok(Number.isInteger(conversation.unread)&&conversation.unread>=0);
    assert.ok(Array.isArray(conversation.messages));
    uniqueIds(conversation.messages,`Messages for ${conversation.id}`);
    conversation.messages.forEach((message)=>assert.ok(['customer','agent','team','system'].includes(message.sender)));
  }
});

test('marketing fixtures expose supported content campaigns and briefing contracts',()=>{
  const data=json('apps/web/src/mocks/marketing/marketing.dev.json');
  assert.deepEqual(Object.keys(data).sort(),['briefings','campaigns','contents']);
  assert.ok(Array.isArray(data.contents));
  assert.ok(Array.isArray(data.campaigns));
  assert.ok(Array.isArray(data.briefings));
  uniqueIds(data.contents,'Marketing contents');
  uniqueIds(data.campaigns,'Marketing campaigns');
  uniqueIds(data.briefings,'Marketing briefings');
  const contentChannels=['Instagram','Facebook','TikTok','YouTube','X','Threads'];
  const campaignChannels=['Meta Ads','Google Ads','YouTube','TikTok'];
  const briefingStatuses=['Rascunho','Em elaboração','Em revisão','Aprovado','Arquivado'];
  data.contents.forEach((content)=>{
    assert.ok(contentChannels.includes(content.channel));
    assert.match(content.date,DATE_RE);
    assert.match(content.time,TIME_RE);
    assert.ok(content.title.trim());
  });
  data.campaigns.forEach((campaign)=>{
    assert.ok(campaignChannels.includes(campaign.channel));
    assert.ok(Number.isFinite(campaign.budget)&&campaign.budget>0);
    assert.ok(Number.isFinite(campaign.spent)&&campaign.spent>=0&&campaign.spent<=campaign.budget);
    assert.ok(Number.isInteger(campaign.leads)&&campaign.leads>=0);
    assert.ok(Number.isInteger(campaign.conversions)&&campaign.conversions>=0&&campaign.conversions<=campaign.leads);
    assert.match(campaign.startDate,DATE_RE);
    assert.match(campaign.endDate,DATE_RE);
    assert.ok(campaign.endDate>=campaign.startDate);
  });
  data.briefings.forEach((briefing)=>{
    assert.ok(briefing.title.trim());
    assert.ok(briefingStatuses.includes(briefing.status));
    assert.ok(Array.isArray(briefing.channels));
    briefing.channels.forEach((channel)=>assert.ok(contentChannels.includes(channel)));
    assert.ok(briefing.dueDate===''||DATE_RE.test(briefing.dueDate));
    assert.ok(Number.isFinite(Date.parse(briefing.createdAt)));
    assert.ok(Number.isFinite(Date.parse(briefing.updatedAt)));
    if(briefing.status!=='Rascunho'){
      assert.ok(briefing.objective.trim());
      assert.ok(typeof briefing.ownerUserId==='string'&&briefing.ownerUserId.trim());
    }
  });
});