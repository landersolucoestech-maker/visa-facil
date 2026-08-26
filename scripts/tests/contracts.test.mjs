import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTemplatePlaceholders, makePlaceholder, resolveTemplateContent } from '../../apps/web/src/modules/contracts/contractTemplateEngine.ts';
import { isContractCategory, isContractRecord, isContractTemplate, isContractVariable } from '../../apps/web/src/modules/contracts/contractSessionStore.ts';

const stamp='2026-08-25T12:00:00.000Z';

test('contract placeholders are normalized, unique and resolved as plain text',()=>{
  assert.equal(makePlaceholder('processo','número do protocolo'),'{{PROCESSO.NUMERO_DO_PROTOCOLO}}');
  const source='Cliente {{CLIENTE.NOME}} · {{CLIENTE.CPF}} · {{CLIENTE.NOME}}';
  assert.deepEqual(extractTemplatePlaceholders(source),['{{CLIENTE.NOME}}','{{CLIENTE.CPF}}']);
  assert.equal(resolveTemplateContent(source,{'{{CLIENTE.NOME}}':'Ana <b>Silva</b>','{{CLIENTE.CPF}}':'123'}),'Cliente Ana <b>Silva</b> · 123 · Ana <b>Silva</b>');
});

test('contract runtime validators accept canonical configuration records',()=>{
  assert.equal(isContractCategory({id:'c1',label:'Assessoria',slug:'assessoria',description:'',active:true,createdAt:stamp,updatedAt:stamp}),true);
  assert.equal(isContractTemplate({id:'t1',name:'Modelo',categoryId:'c1',description:'',content:'{{CLIENTE.NOME}}',active:true,createdAt:stamp,updatedAt:stamp}),true);
  assert.equal(isContractVariable({id:'v1',group:'CLIENTE',field:'NOME',placeholder:'{{CLIENTE.NOME}}',label:'Nome',type:'text',required:true,description:'',createdAt:stamp,updatedAt:stamp}),true);
});

test('contract records reject fake signing providers and duplicate nested identities',()=>{
  const base={id:'r1',title:'Contrato',categoryId:'c1',templateId:'t1',status:'draft',serviceDescription:'Assessoria',destination:'EUA',visaType:'B1/B2',value:100,startDate:'2026-08-25',endDate:'',notes:'',parties:[{id:'p1',role:'client',source:'manual',name:'Ana',cpf:'',rg:'',passportNumber:'',email:'',phone:''}],signers:[],variableValues:{},templateSnapshot:'Modelo',documentContent:'Contrato',signatureProvider:null,signatureState:'not_sent',versions:[],audit:[],createdAt:stamp,updatedAt:stamp};
  assert.equal(isContractRecord(base),true);
  assert.equal(isContractRecord({...base,signatureProvider:'docusign'}),false);
  assert.equal(isContractRecord({...base,parties:[...base.parties,{...base.parties[0]}]}),false);
});
