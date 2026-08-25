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

test('CRM fixtures satisfy the person relationship contract',()=>{
  const items=json('apps/web/src/modules/crm/mocks/crm-records.dev.json');
  assert.ok(Array.isArray(items));
  uniqueIds(items,'CRM fixtures');
  for(const item of items){
    assert.ok(['contact','lead'].includes(item.kind));
    assert.equal(typeof item.fullName,'string');
    assert.equal(typeof item.email,'string');
    assert.equal(typeof item.cpf,'string');
    assert.equal(typeof item.rg,'string');
    assert.equal(typeof item.passportNumber,'string');
    for(const forbidden of ['cnpj','legalName','tradeName','contactPerson','personType'])assert.equal(forbidden in item,false,`CRM person fixture contains forbidden company field ${forbidden}`);
  }
});

test('finance transaction fixtures satisfy the canonical transaction model',()=>{
  const items=json('apps/web/src/modules/finance/mocks/finance.dev.json');
  assert.ok(Array.isArray(items));
  uniqueIds(items,'Finance fixtures');
  for(const item of items){
    assert.ok(['Receita','Despesa'].includes(item.type));
    assert.ok(['Recebido','A receber','Pago','A pagar'].includes(item.status));
    assert.equal(typeof item.amount,'number');
    assert.ok(Number.isFinite(item.amount)&&item.amount>=0);
    assert.match(item.date,/^\d{4}-\d{2}-\d{2}$/);
  }
});

test('invoice fixtures have unique documents and settlement-consistent payment ledgers',()=>{
  const items=json('apps/web/src/modules/finance/mocks/invoices.dev.json');
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

test('task fixtures use known status and priority values',()=>{
  const items=json('apps/web/src/modules/tasks/mocks/tasks.dev.json');
  assert.ok(Array.isArray(items));
  uniqueIds(items,'Task fixtures');
  for(const item of items){
    assert.ok(['Pendente','Em andamento','Concluída'].includes(item.status));
    assert.ok(['Baixa','Média','Alta'].includes(item.priority));
    assert.ok(['Contato','Lead'].includes(item.relatedType));
  }
});

test('agenda fixtures use valid dates and statuses',()=>{
  const items=json('apps/web/src/modules/agenda/mocks/agenda.dev.json');
  assert.ok(Array.isArray(items));
  uniqueIds(items,'Agenda fixtures');
  for(const item of items){
    assert.match(item.date,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(['Confirmado','Pendente','Realizado','Cancelado'].includes(item.status));
  }
});

test('attendance fixtures keep conversations and message ids unique',()=>{
  const data=json('apps/web/src/modules/attendance/mocks/attendance.dev.json');
  assert.ok(Array.isArray(data.conversations));
  uniqueIds(data.conversations,'Attendance conversations');
  for(const conversation of data.conversations){
    assert.ok(Array.isArray(conversation.messages));
    uniqueIds(conversation.messages,`Messages for ${conversation.id}`);
  }
});

test('marketing fixtures expose only supported content/campaign primitive contracts',()=>{
  const data=json('apps/web/src/modules/marketing/mocks/marketing.dev.json');
  assert.ok(Array.isArray(data.contents));
  assert.ok(Array.isArray(data.campaigns));
  uniqueIds(data.contents,'Marketing contents');
  uniqueIds(data.campaigns,'Marketing campaigns');
  data.campaigns.forEach((campaign)=>{
    assert.equal(typeof campaign.budget,'number');
    assert.equal(typeof campaign.spent,'number');
    assert.equal(typeof campaign.leads,'number');
    assert.equal(typeof campaign.conversions,'number');
  });
});
