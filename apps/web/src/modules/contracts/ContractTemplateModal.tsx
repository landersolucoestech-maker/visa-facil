import { useEffect, useMemo, useState } from 'react';
import { ContractDocumentPreview } from './ContractDocumentPreview';
import { extractTemplatePlaceholders } from './contractTemplateEngine';
import type { ContractTemplate, ContractVariableDefinition } from './contractTypes';

export type ContractTemplateDraft={name:string;description:string;content:string;active:boolean};
export type ContractTemplateModalMode='create'|'edit'|'view';

function initial(template?:ContractTemplate):ContractTemplateDraft{return template?{name:template.name,description:template.description,content:template.content,active:template.active}:{name:'',description:'',content:'',active:true}}

export function ContractTemplateModal({template,variables,mode=template?'edit':'create',onClose,onSave}:{template?:ContractTemplate;variables:ContractVariableDefinition[];mode?:ContractTemplateModalMode;onClose:()=>void;onSave:(draft:ContractTemplateDraft)=>void}){
 const [draft,setDraft]=useState(()=>initial(template));
 const [query,setQuery]=useState('');
 const readOnly=mode==='view';
 useEffect(()=>setDraft(initial(template)),[template]);
 const visibleVariables=useMemo(()=>variables.filter(item=>`${item.label} ${item.placeholder}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0,80),[variables,query]);
 const placeholders=useMemo(()=>extractTemplatePlaceholders(draft.content),[draft.content]);
 const append=(placeholder:string)=>{if(!readOnly)setDraft(current=>({...current,content:`${current.content}${current.content&&!current.content.endsWith('\n')?' ':''}${placeholder}`}))};
 const valid=Boolean(draft.name.trim()&&draft.content.trim());
 const title=mode==='view'?'Visualizar template':mode==='edit'?'Editar template':'Novo template';
 return <div className="contracts-modal-backdrop" role="presentation" onMouseDown={event=>event.currentTarget===event.target&&onClose()}>
  <section className="contracts-template-editor" role="dialog" aria-modal="true" aria-labelledby="template-editor-title">
   <header><div><span>TEMPLATES</span><h2 id="template-editor-title">{title}</h2><p>{readOnly?'Consulte a estrutura, placeholders e prévia deste template.':'Monte o documento com placeholders seguros. O conteúdo é tratado como texto, nunca como HTML executável.'}</p></div><button type="button" aria-label="Fechar" onClick={onClose}>×</button></header>
   <div className="contracts-template-editor-body">
    <div className="contracts-template-form"><div className="contracts-form-grid"><label className="contracts-field"><span>Nome</span><input value={draft.name} readOnly={readOnly} onChange={event=>setDraft(current=>({...current,name:event.target.value}))} placeholder="Ex: Contrato de assessoria consular"/></label><label className="contracts-field contracts-field--wide"><span>Descrição</span><input value={draft.description} readOnly={readOnly} onChange={event=>setDraft(current=>({...current,description:event.target.value}))} placeholder="Objetivo e contexto de uso deste modelo"/></label></div><label className="contracts-field"><span>Conteúdo do documento</span><textarea className="contracts-template-textarea" rows={22} value={draft.content} readOnly={readOnly} onChange={event=>setDraft(current=>({...current,content:event.target.value}))} placeholder={'CONTRATO...\n\nCONTRATANTE: {{CLIENTE.NOME}}\n...'} /></label><label className="contracts-checkbox"><input type="checkbox" checked={draft.active} disabled={readOnly} onChange={event=>setDraft(current=>({...current,active:event.target.checked}))}/><span>Template ativo e disponível no wizard</span></label></div>
    <aside className="contracts-variable-panel"><div><span>REGISTRO DE VARIÁVEIS</span><strong>{variables.length} cadastradas</strong></div><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar variável…"/>
     <div className="contracts-variable-panel-list">{visibleVariables.map(variable=><button type="button" key={variable.id} disabled={readOnly} onClick={()=>append(variable.placeholder)}><strong>{variable.label}</strong><code>{variable.placeholder}</code></button>)}</div>
     <div className="contracts-template-meta"><span>{placeholders.length} placeholder(s) detectado(s)</span><p>{placeholders.join(', ')||'Nenhum placeholder no conteúdo.'}</p></div>
    </aside>
    <div className="contracts-template-preview"><div><span>PRÉVIA A4</span><strong>Estrutura do documento</strong></div><ContractDocumentPreview content={draft.content}/></div>
   </div>
   <footer>{readOnly?<button type="button" className="contracts-primary-button" onClick={onClose}>Fechar</button>:<><button type="button" className="contracts-secondary-button" onClick={onClose}>Cancelar</button><button type="button" className="contracts-primary-button" disabled={!valid} onClick={()=>onSave({...draft,name:draft.name.trim(),description:draft.description.trim()})}>Salvar template</button></>}</footer>
  </section>
 </div>;
}
