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

test('invoice fixtures have unique documents and valid payment collections',()=>{
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
    assert.ok(Array.isArray(item.payments));
    item.payments.forEach((payment)=>{
      assert.equal(typeof payment.id,'string');
      assert.equal(typeof payment.amount,'number');
      assert.ok(payment.amount>0);
    });
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
