import { useEffect, useMemo, useState } from 'react';
import type { CrmRecord } from '../crm/types';
import { ContractDocumentPreview } from './ContractDocumentPreview';
import { extractTemplatePlaceholders, isSystemContractPlaceholder, mergedVariableValues, resolveTemplateContent } from './contractTemplateEngine';
import type { ContractEditorDraft, ContractParty, ContractRecord, ContractSigner, ContractTemplate, ContractVariableDefinition } from './contractTypes';

const STEPS=['Template','Partes','Variáveis','Documento','Signatários','Revisão'] as const;

function emptyParty():ContractParty{return{id:crypto.randomUUID(),role:'client',source:'manual',name:'',cpf:'',rg:'',passportNumber:'',email:'',phone:''}}
function partyFromCrm(record:CrmRecord):ContractParty{return{id:crypto.randomUUID(),role:'client',source:'crm',crmRecordId:record.id,name:record.fullName,cpf:record.cpf,rg:record.rg,passportNumber:record.passportNumber,email:record.email,phone:record.phone||record.whatsapp}}
function signerFromParty(party:ContractParty,order=1):ContractSigner{return{id:crypto.randomUUID(),name:party.name,email:party.email,role:'Contratante',required:true,order,status:'pending'}}
function emptySigner(order:number):ContractSigner{return{id:crypto.randomUUID(),name:'',email:'',role:'Signatário',required:true,order,status:'pending'}}

function initialDraft(record?:ContractRecord):ContractEditorDraft{
 if(record)return{title:record.title,templateId:record.templateId,status:record.status==='review'?'review':'draft',clientId:record.clientId??'',serviceDescription:record.serviceDescription,destination:record.destination,visaType:record.visaType,value:record.value,startDate:record.startDate,endDate:record.endDate,notes:record.notes,parties:structuredClone(record.parties),signers:structuredClone(record.signers),variableValues:structuredClone(record.variableValues)};
 return{title:'',templateId:'',status:'draft',clientId:'',serviceDescription:'',destination:'',visaType:'',value:0,startDate:'',endDate:'',notes:'',parties:[emptyParty()],signers:[],variableValues:{}};
}

function validEmail(value:string){return value.trim()===''||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())}
function fieldLabel(token:string,definitions:ContractVariableDefinition[]){return definitions.find(item=>item.placeholder===token)?.label??token.replace(/[{}]/g,'').replace('.', ' · ')}
function fieldType(token:string,definitions:ContractVariableDefinition[]){return definitions.find(item=>item.placeholder===token)?.type??'text'}
function fieldRequired(token:string,definitions:ContractVariableDefinition[]){return definitions.find(item=>item.placeholder===token)?.required??false}

function TextField({label,value,onChange,type='text',placeholder='',readOnly=false}:{label:string;value:string;onChange:(value:string)=>void;type?:string;placeholder?:string;readOnly?:boolean}){
 return <label className="contracts-field"><span>{label}</span><input type={type} value={value} placeholder={placeholder} readOnly={readOnly} onChange={event=>onChange(event.target.value)}/></label>;
}

function TextAreaField({label,value,onChange,placeholder=''}:{label:string;value:string;onChange:(value:string)=>void;placeholder?:string}){
 return <label className="contracts-field contracts-field--wide"><span>{label}</span><textarea rows={4} value={value} placeholder={placeholder} onChange={event=>onChange(event.target.value)}/></label>;
}

export function ContractEditorModal({record,contacts,templates,variables,onClose,onSave}:{record?:ContractRecord;contacts:CrmRecord[];templates:ContractTemplate[];variables:ContractVariableDefinition[];onClose:()=>void;onSave:(draft:ContractEditorDraft,template:ContractTemplate,documentContent:string)=>void}){
 const [step,setStep]=useState(0);
 const [draft,setDraft]=useState<ContractEditorDraft>(()=>initialDraft(record));
 useEffect(()=>{setStep(0);setDraft(initialDraft(record))},[record]);
 const activeTemplates=templates.filter(item=>item.active);
 const selectedTemplate=templates.find(item=>item.id===draft.templateId);
 const selectedClient=contacts.find(item=>item.id===draft.clientId);
 const placeholders=useMemo(()=>extractTemplatePlaceholders(selectedTemplate?.content??''),[selectedTemplate?.content]);
 const customPlaceholders=useMemo(()=>placeholders.filter(token=>!isSystemContractPlaceholder(token)),[placeholders]);
 const values=useMemo(()=>mergedVariableValues(draft,selectedClient),[draft,selectedClient]);
 const documentContent=useMemo(()=>selectedTemplate?resolveTemplateContent(selectedTemplate.content,values):'',[selectedTemplate,values]);
 const unresolved=useMemo(()=>extractTemplatePlaceholders(documentContent),[documentContent]);
 const clientParty=draft.parties[0]??emptyParty();

 const set=(patch:Partial<ContractEditorDraft>)=>setDraft(current=>({...current,...patch}));
 const setParty=(patch:Partial<ContractParty>)=>setDraft(current=>({...current,parties:[{...(current.parties[0]??emptyParty()),...patch},...current.parties.slice(1)]}));
 const chooseClient=(id:string)=>{
  if(id==='manual'){const manual=emptyParty();setDraft(current=>({...current,clientId:'',parties:[manual,...current.parties.slice(1)],signers:current.signers.filter(item=>item.role!=='Contratante')}));return}
  const contact=contacts.find(item=>item.id===id);if(!contact)return;
  const party=partyFromCrm(contact);
  setDraft(current=>({...current,clientId:contact.id,parties:[party,...current.parties.slice(1)],signers:current.signers.length?current.signers:[signerFromParty(party)]}));
 };
 const chooseTemplate=(id:string)=>{
  const template=templates.find(item=>item.id===id);if(!template)return;
  setDraft(current=>({...current,templateId:id,title:current.title||template.name}));
 };
 const setVariable=(token:string,value:string)=>setDraft(current=>({...current,variableValues:{...current.variableValues,[token]:value}}));
 const setSigner=(id:string,patch:Partial<ContractSigner>)=>setDraft(current=>({...current,signers:current.signers.map(item=>item.id===id?{...item,...patch}:item)}));
 const removeSigner=(id:string)=>setDraft(current=>({...current,signers:current.signers.filter(item=>item.id!==id).map((item,index)=>({...item,order:index+1}))}));
 const addSigner=()=>setDraft(current=>({...current,signers:[...current.signers,emptySigner(current.signers.length+1)]}));

 const requiredCustomComplete=customPlaceholders.every(token=>!fieldRequired(token,variables)||Boolean(draft.variableValues[token]?.trim()));
 const signersValid=draft.signers.every(item=>item.name.trim()&&validEmail(item.email));
 const stepValid=[Boolean(draft.templateId),Boolean(clientParty.name.trim()),Boolean(draft.title.trim()&&draft.startDate&&draft.serviceDescription.trim()&&requiredCustomComplete),true,signersValid,true][step]??false;
 const canSave=Boolean(selectedTemplate&&draft.title.trim()&&draft.startDate&&draft.serviceDescription.trim()&&clientParty.name.trim());

 const finish=(status:'draft'|'review')=>{
  if(!selectedTemplate||!canSave)return;
  if(status==='review'&&(!requiredCustomComplete||!signersValid||unresolved.some(token=>fieldRequired(token,variables))))return;
  onSave({...draft,status},selectedTemplate,documentContent);
 };

 return <div className="contracts-modal-backdrop" role="presentation" onMouseDown={event=>event.currentTarget===event.target&&onClose()}>
  <section className="contracts-editor" role="dialog" aria-modal="true" aria-labelledby="contracts-editor-title">
   <aside className="contracts-editor-steps"><div><span>CONTRATOS</span><h2 id="contracts-editor-title">{record?'Editar contrato':'Novo contrato'}</h2></div><nav>{STEPS.map((label,index)=><button key={label} type="button" className={step===index?'is-active':step>index?'is-done':''} onClick={()=>index<=step&&setStep(index)}><b>{step>index?'✓':index+1}</b><span>{label}</span></button>)}</nav><p>Os dados ficam somente na sessão atual até existir persistência backend.</p></aside>
   <div className="contracts-editor-main">
    <header><div><span>ETAPA {step+1} DE {STEPS.length}</span><h3>{STEPS[step]}</h3></div><button type="button" aria-label="Fechar" onClick={onClose}>×</button></header>
    <div className="contracts-editor-body">
     {step===0&&<div className="contracts-template-picker"><p>Selecione um template. Ele é a classificação canônica do contrato e define a estrutura documental.</p>{activeTemplates.length?activeTemplates.map(template=><button type="button" key={template.id} className={draft.templateId===template.id?'is-selected':''} onClick={()=>chooseTemplate(template.id)}><div><strong>{template.name}</strong><p>{template.description}</p></div><b>{draft.templateId===template.id?'Selecionado':'Selecionar'}</b></button>):<div className="contracts-empty-inline">Nenhum template ativo. Crie um template antes de cadastrar contratos.</div>}</div>}
     {step===1&&<div className="contracts-form-section"><div className="contracts-section-copy"><h4>Contratante / cliente</h4><p>Vincule um registro real do CRM ou use entrada manual. O contrato preserva um snapshot dos dados selecionados.</p></div><label className="contracts-field contracts-field--wide"><span>Origem da parte</span><select value={draft.clientId||'manual'} onChange={event=>chooseClient(event.target.value)}><option value="manual">Preenchimento manual</option>{contacts.map(contact=><option key={contact.id} value={contact.id}>{contact.fullName} · {contact.kind==='lead'?'Lead':'Contato'}</option>)}</select></label><div className="contracts-form-grid"><TextField label="Nome completo" value={clientParty.name} onChange={value=>setParty({name:value})} readOnly={clientParty.source==='crm'}/><TextField label="CPF" value={clientParty.cpf} onChange={value=>setParty({cpf:value})} readOnly={clientParty.source==='crm'}/><TextField label="RG" value={clientParty.rg} onChange={value=>setParty({rg:value})} readOnly={clientParty.source==='crm'}/><TextField label="Passaporte" value={clientParty.passportNumber} onChange={value=>setParty({passportNumber:value})} readOnly={clientParty.source==='crm'}/><TextField label="E-mail" value={clientParty.email} onChange={value=>setParty({email:value})} type="email" readOnly={clientParty.source==='crm'}/><TextField label="Telefone" value={clientParty.phone} onChange={value=>setParty({phone:value})} readOnly={clientParty.source==='crm'}/></div></div>}
     {step===2&&<div className="contracts-form-section"><div className="contracts-section-copy"><h4>Dados do contrato</h4><p>Campos estruturados alimentam o documento. O template selecionado já representa o tipo/classificação contratual.</p></div><div className="contracts-form-grid"><TextField label="Título" value={draft.title} onChange={value=>set({title:value})} placeholder="Ex: Assessoria de visto americano"/><TextField label="Template" value={selectedTemplate?.name??''} onChange={()=>{}} readOnly/><TextField label="Destino" value={draft.destination} onChange={value=>set({destination:value})} placeholder="Ex: Estados Unidos"/><TextField label="Tipo de visto" value={draft.visaType} onChange={value=>set({visaType:value})} placeholder="Ex: B1/B2"/><TextField label="Data de início" value={draft.startDate} onChange={value=>set({startDate:value})} type="date"/><TextField label="Data de término" value={draft.endDate} onChange={value=>set({endDate:value})} type="date"/><label className="contracts-field"><span>Valor</span><input type="number" min="0" step="0.01" value={draft.value||''} onChange={event=>set({value:Math.max(0,Number(event.target.value)||0)})}/></label><TextAreaField label="Serviço / objeto do contrato" value={draft.serviceDescription} onChange={value=>set({serviceDescription:value})} placeholder="Descreva claramente o serviço contratado."/><TextAreaField label="Observações" value={draft.notes} onChange={value=>set({notes:value})} placeholder="Condições específicas, ressalvas ou observações internas."/></div>{customPlaceholders.length>0&&<div className="contracts-custom-vars"><h4>Variáveis adicionais do template</h4><div className="contracts-form-grid">{customPlaceholders.map(token=>fieldType(token,variables)==='textarea'?<TextAreaField key={token} label={`${fieldLabel(token,variables)}${fieldRequired(token,variables)?' *':''}`} value={draft.variableValues[token]??''} onChange={value=>setVariable(token,value)}/>:<TextField key={token} label={`${fieldLabel(token,variables)}${fieldRequired(token,variables)?' *':''}`} value={draft.variableValues[token]??''} onChange={value=>setVariable(token,value)} type={fieldType(token,variables)==='date'?'date':fieldType(token,variables)==='number'||fieldType(token,variables)==='currency'?'number':fieldType(token,variables)==='email'?'email':'text'}/>)}</div></div>}</div>}
     {step===3&&<div className="contracts-preview-step"><div className="contracts-section-copy"><h4>Documento gerado</h4><p>Placeholders ainda não resolvidos ficam destacados. Nenhum HTML do template é executado.</p></div><ContractDocumentPreview content={documentContent}/>{unresolved.length>0&&<div className="contracts-warning"><strong>{unresolved.length} variável(is) ainda sem valor.</strong><p>{unresolved.join(', ')}</p></div>}</div>}
     {step===4&&<div className="contracts-form-section"><div className="contracts-section-copy"><h4>Signatários</h4><p>Cadastre quem deverá assinar. O envio real ficará a cargo do Autentique pelo backend.</p></div><div className="contracts-signers">{draft.signers.map((signer,index)=><article key={signer.id}><header><strong>Signatário {index+1}</strong><button type="button" onClick={()=>removeSigner(signer.id)}>Remover</button></header><div className="contracts-form-grid"><TextField label="Nome" value={signer.name} onChange={value=>setSigner(signer.id,{name:value})}/><TextField label="E-mail" value={signer.email} onChange={value=>setSigner(signer.id,{email:value})} type="email"/><TextField label="Papel" value={signer.role} onChange={value=>setSigner(signer.id,{role:value})} placeholder="Ex: Contratante"/><label className="contracts-checkbox"><input type="checkbox" checked={signer.required} onChange={event=>setSigner(signer.id,{required:event.target.checked})}/><span>Assinatura obrigatória</span></label></div>{!validEmail(signer.email)&&<small className="contracts-field-error">Informe um e-mail válido.</small>}</article>)}</div><button className="contracts-secondary-button" type="button" onClick={addSigner}>+ Adicionar signatário</button></div>}
     {step===5&&<div className="contracts-review"><div className="contracts-section-copy"><h4>Revisão final</h4><p>Revise os dados antes de salvar. “Salvar para revisão” não envia o documento ao Autentique.</p></div><div className="contracts-review-grid"><div><span>Template</span><strong>{selectedTemplate?.name??'—'}</strong></div><div><span>Cliente</span><strong>{clientParty.name||'—'}</strong></div><div><span>Signatários</span><strong>{draft.signers.length}</strong></div><div><span>Destino</span><strong>{draft.destination||'—'}</strong></div><div><span>Tipo de visto</span><strong>{draft.visaType||'—'}</strong></div></div><ContractDocumentPreview content={documentContent}/>{unresolved.length>0&&<div className="contracts-warning"><strong>Documento incompleto.</strong><p>Preencha as variáveis pendentes antes de considerar o documento pronto para assinatura.</p></div>}</div>}
    </div>
    <footer><button type="button" className="contracts-secondary-button" onClick={()=>step===0?onClose():setStep(current=>current-1)}>{step===0?'Cancelar':'Voltar'}</button><div>{step<STEPS.length-1?<button type="button" className="contracts-primary-button" disabled={!stepValid} onClick={()=>setStep(current=>current+1)}>Avançar</button>:<><button type="button" className="contracts-secondary-button" disabled={!canSave} onClick={()=>finish('draft')}>Salvar rascunho</button><button type="button" className="contracts-primary-button" disabled={!canSave||!requiredCustomComplete||!signersValid||unresolved.some(token=>fieldRequired(token,variables))} onClick={()=>finish('review')}>Salvar para revisão</button></>}</div></footer>
   </div>
  </section>
 </div>;
}
