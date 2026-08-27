import { useEffect, useMemo, useState } from 'react';
import { makePlaceholder } from './contractTemplateEngine';
import type { ContractVariableDefinition, ContractVariableType } from './contractTypes';
import './contract-variable-modal.css';

export type ContractVariableDraft = Pick<ContractVariableDefinition,'group'|'field'|'placeholder'|'label'|'type'|'required'|'description'>;
export type ContractVariableModalMode='create'|'edit'|'view';

type Props={
 variables:ContractVariableDefinition[];
 variable?:ContractVariableDefinition;
 mode?:ContractVariableModalMode;
 onClose:()=>void;
 onSave:(draft:ContractVariableDraft)=>void;
};

export function ContractVariableModal({variables,variable,mode=variable?'edit':'create',onClose,onSave}:Props){
 const [label,setLabel]=useState(variable?.label??'');
 const [group,setGroup]=useState(variable?.group??'');
 const [field,setField]=useState(variable?.field??'');
 const [type,setType]=useState<ContractVariableType>(variable?.type??'text');
 const [required,setRequired]=useState(variable?.required??false);
 const [description,setDescription]=useState(variable?.description??'');
 const readOnly=mode==='view';
 const identityLocked=Boolean(variable)&&mode!=='create';
 useEffect(()=>{const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};document.addEventListener('keydown',closeOnEscape);return()=>document.removeEventListener('keydown',closeOnEscape)},[onClose]);
 const placeholder=useMemo(()=>identityLocked&&variable?variable.placeholder:group.trim()&&field.trim()?makePlaceholder(group,field):'',[field,group,identityLocked,variable]);
 const duplicate=placeholder?variables.some(item=>item.id!==variable?.id&&item.placeholder===placeholder):false;
 const valid=Boolean(label.trim()&&placeholder&&!duplicate);
 const submit=()=>{
  if(readOnly||!valid)return;
  onSave({group:identityLocked&&variable?variable.group:group.trim().toUpperCase(),field:identityLocked&&variable?variable.field:field.trim().toUpperCase(),placeholder,label:label.trim(),type,required,description:description.trim()});
 };
 const title=mode==='view'?'Visualizar variável':mode==='edit'?'Editar variável':'Criar variável';
 const descriptionText=mode==='view'?'Consulte os dados e o placeholder desta variável de template.':mode==='edit'?'Atualize os dados da variável. Grupo, campo e placeholder permanecem imutáveis para preservar templates existentes.':'Cadastre um placeholder reutilizável para os templates de contrato.';
 return <div className="contracts-modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <section className="contracts-template-editor contracts-variable-editor" role="dialog" aria-modal="true" aria-labelledby="contract-variable-title">
   <header><div><span>VARIÁVEL DE TEMPLATE</span><h2 id="contract-variable-title">{title}</h2><p>{descriptionText}</p></div><button type="button" aria-label="Fechar" onClick={onClose}>×</button></header>
   <div className="contracts-variable-editor-body">
    <div className="contracts-form-grid">
     <label className="contracts-field"><span>Nome amigável</span><input autoFocus={!readOnly} value={label} readOnly={readOnly} onChange={event=>setLabel(event.target.value)} placeholder="Ex: Número do protocolo"/></label>
     <label className="contracts-field"><span>Tipo</span><select value={type} disabled={readOnly} onChange={event=>setType(event.target.value as ContractVariableType)}><option value="text">Texto</option><option value="textarea">Texto longo</option><option value="number">Número</option><option value="date">Data</option><option value="currency">Moeda</option><option value="email">E-mail</option><option value="cpf">CPF</option><option value="passport">Passaporte</option></select></label>
     <label className="contracts-field"><span>Grupo</span><input value={group} readOnly={readOnly||identityLocked} onChange={event=>setGroup(event.target.value)} placeholder="Ex: PROCESSO"/></label>
     <label className="contracts-field"><span>Campo</span><input value={field} readOnly={readOnly||identityLocked} onChange={event=>setField(event.target.value)} placeholder="Ex: PROTOCOLO"/></label>
     <label className="contracts-field contracts-field--wide"><span>Descrição</span><textarea value={description} readOnly={readOnly} onChange={event=>setDescription(event.target.value)} placeholder="Como e quando esta variável deve ser preenchida"/></label>
     <label className="contracts-checkbox contracts-field--wide"><input type="checkbox" checked={required} disabled={readOnly} onChange={event=>setRequired(event.target.checked)}/><span>Obrigatória para revisão</span></label>
    </div>
    <div className={`contracts-registry-preview${duplicate?' is-error':''}`}><span>Placeholder</span><code>{placeholder||'{{GRUPO.CAMPO}}'}</code></div>
    {duplicate&&<p className="contracts-field-error">Já existe uma variável com este placeholder.</p>}
   </div>
   <footer>{readOnly?<button type="button" className="contracts-primary-button" onClick={onClose}>Fechar</button>:<><button type="button" className="contracts-secondary-button" onClick={onClose}>Cancelar</button><button type="button" className="contracts-primary-button" disabled={!valid} onClick={submit}>{mode==='edit'?'Salvar alterações':'Criar variável'}</button></>}</footer>
  </section>
 </div>;
}