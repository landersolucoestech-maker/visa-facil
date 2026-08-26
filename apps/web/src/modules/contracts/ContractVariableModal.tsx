import { useMemo, useState } from 'react';
import { makePlaceholder } from './contractTemplateEngine';
import type { ContractVariableDefinition, ContractVariableType } from './contractTypes';
import './contract-variable-modal.css';

export type ContractVariableDraft = Pick<ContractVariableDefinition,'group'|'field'|'placeholder'|'label'|'type'|'required'|'description'>;

type Props={
 variables:ContractVariableDefinition[];
 onClose:()=>void;
 onSave:(draft:ContractVariableDraft)=>void;
};

export function ContractVariableModal({variables,onClose,onSave}:Props){
 const [label,setLabel]=useState('');
 const [group,setGroup]=useState('');
 const [field,setField]=useState('');
 const [type,setType]=useState<ContractVariableType>('text');
 const [required,setRequired]=useState(false);
 const [description,setDescription]=useState('');
 const placeholder=useMemo(()=>group.trim()&&field.trim()?makePlaceholder(group,field):'',[group,field]);
 const duplicate=placeholder?variables.some(item=>item.placeholder===placeholder):false;
 const valid=Boolean(label.trim()&&placeholder&&!duplicate);
 const submit=()=>{
  if(!valid)return;
  onSave({group:group.trim().toUpperCase(),field:field.trim().toUpperCase(),placeholder,label:label.trim(),type,required,description:description.trim()});
 };
 return <div className="contracts-modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <section className="contracts-template-editor contracts-variable-editor" role="dialog" aria-modal="true" aria-labelledby="contract-variable-title">
   <header><div><span>VARIÁVEL DE TEMPLATE</span><h2 id="contract-variable-title">Criar variável</h2><p>Cadastre um placeholder reutilizável para os templates de contrato.</p></div><button type="button" aria-label="Fechar" onClick={onClose}>×</button></header>
   <div className="contracts-variable-editor-body">
    <div className="contracts-form-grid">
     <label className="contracts-field"><span>Nome amigável</span><input autoFocus value={label} onChange={event=>setLabel(event.target.value)} placeholder="Ex: Número do protocolo"/></label>
     <label className="contracts-field"><span>Tipo</span><select value={type} onChange={event=>setType(event.target.value as ContractVariableType)}><option value="text">Texto</option><option value="textarea">Texto longo</option><option value="number">Número</option><option value="date">Data</option><option value="currency">Moeda</option><option value="email">E-mail</option><option value="cpf">CPF</option><option value="passport">Passaporte</option></select></label>
     <label className="contracts-field"><span>Grupo</span><input value={group} onChange={event=>setGroup(event.target.value)} placeholder="Ex: PROCESSO"/></label>
     <label className="contracts-field"><span>Campo</span><input value={field} onChange={event=>setField(event.target.value)} placeholder="Ex: PROTOCOLO"/></label>
     <label className="contracts-field contracts-field--wide"><span>Descrição</span><textarea value={description} onChange={event=>setDescription(event.target.value)} placeholder="Como e quando esta variável deve ser preenchida"/></label>
     <label className="contracts-checkbox contracts-field--wide"><input type="checkbox" checked={required} onChange={event=>setRequired(event.target.checked)}/><span>Obrigatória para revisão</span></label>
    </div>
    <div className={`contracts-registry-preview${duplicate?' is-error':''}`}><span>Placeholder</span><code>{placeholder||'{{GRUPO.CAMPO}}'}</code></div>
    {duplicate&&<p className="contracts-field-error">Já existe uma variável com este placeholder.</p>}
   </div>
   <footer><button type="button" className="contracts-secondary-button" onClick={onClose}>Cancelar</button><button type="button" className="contracts-primary-button" disabled={!valid} onClick={submit}>Criar variável</button></footer>
  </section>
 </div>;
}
