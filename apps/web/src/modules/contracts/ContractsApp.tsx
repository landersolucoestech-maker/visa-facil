import { useEffect, useMemo, useState } from 'react';
import { getCrmSessionRecords } from '../../shared/operationalSessionStore';
import { isBackendConfigured } from '../../shared/apiClient';
import { getIntegrationStatuses } from '../integrations/integrationApi';
import { ContractEditorModal } from './ContractEditorModal';
import { ContractTemplateModal, type ContractTemplateDraft } from './ContractTemplateModal';
import { ContractVariableModal, type ContractVariableDraft } from './ContractVariableModal';
import { ContractViewModal } from './ContractViewModal';
import { createAudit, createVersion, getContractRecords, getContractTemplates, getContractVariables, saveContractRecords, saveContractTemplates, saveContractVariables } from './contractSessionStore';
import { extractTemplatePlaceholders, nextVersionLabel } from './contractTemplateEngine';
import { CONTRACT_STATUS_LABEL, type ContractEditorDraft, type ContractRecord, type ContractTemplate, type ContractVariableDefinition } from './contractTypes';
import './contracts.css';
import './contract-table-actions.css';

type Section='contracts'|'templates'|'variables';
type ItemModalMode='create'|'edit'|'view';

function base(){return import.meta.env.BASE_URL.replace(/\/$/,'')}
function href(path:string){return `${base()}${path}`||path}
function go(path:string){window.location.href=href(path)}
function sectionFromPath():Section{const root=base();const raw=root&&window.location.pathname.startsWith(root)?window.location.pathname.slice(root.length):window.location.pathname;if(raw.endsWith('/templates'))return'templates';if(raw.endsWith('/variaveis'))return'variables';return'contracts'}
function money(value:number){return value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function date(value:string){if(!value)return'—';const parsed=new Date(`${value}T12:00:00`);return Number.isNaN(parsed.getTime())?value:parsed.toLocaleDateString('pt-BR')}
function statusClass(status:ContractRecord['status']){return `is-${status.replaceAll('_','-')}`}
function statusClosed(status:ContractRecord['status']){return status==='expired'||status==='terminated'||status==='cancelled'}
function canEditRecord(record:ContractRecord){return record.status==='draft'||record.status==='review'}
function variableTypeLabel(type:ContractVariableDefinition['type']){const labels:Record<ContractVariableDefinition['type'],string>={text:'Texto',textarea:'Texto longo',number:'Número',date:'Data',currency:'Moeda',email:'E-mail',cpf:'CPF',passport:'Passaporte'};return labels[type]}

function Kpi({label,value,note}:{label:string;value:string|number;note:string}){return <article className="contracts-kpi"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>}
function NotificationBell(){return <button type="button" aria-label="Notificações — nenhuma disponível" title="Nenhuma notificação de Contratos disponível" disabled/>}
function BackButton(){return <button type="button" onClick={()=>go('/crm/contratos')}><span aria-hidden="true">←</span> Voltar</button>}
function RowActionMenu({label,onView,onEdit,onDelete,editDisabled=false,editTitle,deleteDisabled=false,deleteTitle}:{label:string;onView:()=>void;onEdit:()=>void;onDelete:()=>void;editDisabled?:boolean;editTitle?:string;deleteDisabled?:boolean;deleteTitle?:string}){
 const [open,setOpen]=useState(false);
 const run=(action:()=>void)=>{setOpen(false);action()};
 return <div className="contracts-actions-menu"><button className="contracts-actions-trigger" type="button" aria-label={`Ações de ${label}`} aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(current=>!current)}>⋯</button>{open&&<div className="contracts-actions-dropdown" role="menu"><button type="button" role="menuitem" onClick={()=>run(onView)}>Ver</button><button type="button" role="menuitem" disabled={editDisabled} title={editTitle} onClick={()=>run(onEdit)}>Editar</button><button type="button" role="menuitem" className="is-danger" disabled={deleteDisabled} title={deleteTitle} onClick={()=>run(onDelete)}>Excluir</button></div>}</div>;
}

export function ContractsApp(){
 const section=sectionFromPath();
 const [records,setRecords]=useState<ContractRecord[]>(()=>getContractRecords());
 const [templates,setTemplates]=useState<ContractTemplate[]>(()=>getContractTemplates());
 const [variables,setVariables]=useState<ContractVariableDefinition[]>(()=>getContractVariables());
 const [query,setQuery]=useState('');
 const [statusFilter,setStatusFilter]=useState('all');
 const [templateFilter,setTemplateFilter]=useState('all');
 const [editingRecord,setEditingRecord]=useState<ContractRecord>();
 const [viewRecord,setViewRecord]=useState<ContractRecord>();
 const [editorOpen,setEditorOpen]=useState(false);
 const [templateEditorOpen,setTemplateEditorOpen]=useState(false);
 const [templateModalMode,setTemplateModalMode]=useState<ItemModalMode>('create');
 const [variableEditorOpen,setVariableEditorOpen]=useState(false);
 const [variableModalMode,setVariableModalMode]=useState<ItemModalMode>('create');
 const [editingTemplate,setEditingTemplate]=useState<ContractTemplate>();
 const [selectedVariable,setSelectedVariable]=useState<ContractVariableDefinition>();
 const [autentiqueState,setAutentiqueState]=useState('Backend não configurado');
 const contacts=useMemo(()=>getCrmSessionRecords(),[]);

 useEffect(()=>{
  if(!isBackendConfigured()){setAutentiqueState('Backend não configurado');return}
  const controller=new AbortController();
  setAutentiqueState('Consultando…');
  getIntegrationStatuses(controller.signal).then(items=>{
   const item=items.find(integration=>integration.id==='autentique');
   const labels:Record<string,string>={unconfigured:'Não configurado',disconnected:'Desconectado',connecting:'Conectando',connected:'Conectado',degraded:'Degradado',error:'Erro'};
   setAutentiqueState(item?labels[item.state]??item.state:'Não configurado');
  }).catch(()=>{if(!controller.signal.aborted)setAutentiqueState('Indisponível')});
  return()=>controller.abort();
 },[]);

 const persistRecords=(next:ContractRecord[])=>{saveContractRecords(next);setRecords(next)};
 const persistTemplates=(next:ContractTemplate[])=>{saveContractTemplates(next);setTemplates(next)};
 const persistVariables=(next:ContractVariableDefinition[])=>{saveContractVariables(next);setVariables(next)};

 const filteredRecords=useMemo(()=>records.filter(record=>{
  const templateName=templates.find(item=>item.id===record.templateId)?.name??'';
  const text=`${record.title} ${record.parties.map(item=>item.name).join(' ')} ${record.destination} ${record.visaType} ${templateName}`.toLowerCase();
  return(!query.trim()||text.includes(query.trim().toLowerCase()))&&(statusFilter==='all'||record.status===statusFilter)&&(templateFilter==='all'||record.templateId===templateFilter);
 }),[records,templates,query,statusFilter,templateFilter]);
 const activeValue=records.filter(item=>item.status==='active'||item.status==='signed').reduce((sum,item)=>sum+item.value,0);
 const stats={total:records.length,active:records.filter(item=>item.status==='active').length,awaiting:records.filter(item=>item.status==='awaiting_signature').length,review:records.filter(item=>item.status==='review').length,closed:records.filter(item=>statusClosed(item.status)).length};

 const saveEditor=(draft:ContractEditorDraft,template:ContractTemplate,documentContent:string)=>{
  const stamp=new Date().toISOString();
  if(editingRecord){
   const changedDocument=documentContent!==editingRecord.documentContent;
   const versions=changedDocument?[...editingRecord.versions,createVersion(nextVersionLabel(editingRecord),documentContent,'Revisão do documento')]:editingRecord.versions;
   const audit=[...editingRecord.audit,createAudit('updated','Contrato atualizado')];
   if(editingRecord.status!==draft.status)audit.push(createAudit('status_changed',`Status alterado para ${CONTRACT_STATUS_LABEL[draft.status]}`));
   const updated:ContractRecord={...editingRecord,...draft,clientId:draft.clientId||undefined,templateSnapshot:template.content,documentContent,versions,audit,updatedAt:stamp};
   persistRecords(records.map(item=>item.id===updated.id?updated:item));
   setViewRecord(updated);
  }else{
   const record:ContractRecord={id:crypto.randomUUID(),...draft,clientId:draft.clientId||undefined,templateSnapshot:template.content,documentContent,signatureProvider:null,signatureState:'not_sent',versions:[createVersion('1.0',documentContent,'Versão inicial')],audit:[createAudit('created','Contrato criado',`Salvo como ${CONTRACT_STATUS_LABEL[draft.status]}`)],createdAt:stamp,updatedAt:stamp};
   persistRecords([record,...records]);
   setViewRecord(record);
  }
  setEditingRecord(undefined);setEditorOpen(false);
 };

 const removeRecord=(record:ContractRecord)=>{
  if(!window.confirm(`Excluir o contrato “${record.title}”? Esta exclusão afeta somente a sessão atual.`))return;
  persistRecords(records.filter(item=>item.id!==record.id));
  if(viewRecord?.id===record.id)setViewRecord(undefined);
 };

 const saveTemplate=(draft:ContractTemplateDraft)=>{
  const stamp=new Date().toISOString();
  if(editingTemplate){const updated:ContractTemplate={...editingTemplate,...draft,updatedAt:stamp};persistTemplates(templates.map(item=>item.id===updated.id?updated:item))}
  else persistTemplates([{id:crypto.randomUUID(),...draft,createdAt:stamp,updatedAt:stamp},...templates]);
  setEditingTemplate(undefined);setTemplateEditorOpen(false);
 };
 const removeTemplate=(template:ContractTemplate)=>{
  if(records.some(record=>record.templateId===template.id)){window.alert('Este template está vinculado a contratos e não pode ser excluído. Desative-o para impedir novos usos.');return}
  if(!window.confirm(`Excluir o template “${template.name}”?`))return;
  persistTemplates(templates.filter(item=>item.id!==template.id));
 };
 const saveVariable=(draft:ContractVariableDraft)=>{
  const stamp=new Date().toISOString();
  if(selectedVariable){const updated:ContractVariableDefinition={...selectedVariable,...draft,updatedAt:stamp};persistVariables(variables.map(item=>item.id===updated.id?updated:item))}
  else persistVariables([{id:crypto.randomUUID(),...draft,createdAt:stamp,updatedAt:stamp},...variables]);
  setSelectedVariable(undefined);setVariableEditorOpen(false);
 };
 const removeVariable=(variable:ContractVariableDefinition)=>{
  if(templates.some(template=>template.content.includes(variable.placeholder))){window.alert('Esta variável está sendo usada por um template e não pode ser removida.');return}
  if(!window.confirm(`Excluir ${variable.placeholder}?`))return;
  persistVariables(variables.filter(item=>item.id!==variable.id));
 };

 const title=section==='contracts'?'Contratos':section==='templates'?'Templates de Contrato':'Variáveis de Template';
 const subtitle=section==='contracts'?'Gestão de contratos, documentos e preparação para assinatura eletrônica':section==='templates'?'Modelos reutilizáveis que classificam e estruturam cada contrato':'Registro canônico de placeholders reutilizáveis';

 return <div className="crm-shell contracts-shell"><div className="crm-workspace">
  <header className="crm-topbar"><div><small>VISA FÁCIL · CRM · CONTRATOS</small><h1>{title}</h1><p>{subtitle}</p></div><div className="crm-topbar-actions contracts-topbar-actions">
   {section==='contracts'&&<><button type="button" onClick={()=>go('/crm/contratos/templates')}>Templates</button><button className="crm-topbar-primary" type="button" onClick={()=>{setEditingRecord(undefined);setEditorOpen(true)}}>+ Novo Contrato</button><NotificationBell/></>}
   {section==='templates'&&<><BackButton/><button type="button" onClick={()=>go('/crm/contratos/variaveis')}>Variáveis</button><button className="crm-topbar-primary" type="button" onClick={()=>{setEditingTemplate(undefined);setTemplateModalMode('create');setTemplateEditorOpen(true)}}>+ Novo Template</button><NotificationBell/></>}
   {section==='variables'&&<><BackButton/><button className="crm-topbar-primary" type="button" onClick={()=>{setSelectedVariable(undefined);setVariableModalMode('create');setVariableEditorOpen(true)}}>+ Criar Variável</button><NotificationBell/></>}
  </div></header>
  <main className="contracts-content">
   {section==='contracts'&&<ContractsList records={filteredRecords} allRecords={records} templates={templates} query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} templateFilter={templateFilter} setTemplateFilter={setTemplateFilter} stats={stats} activeValue={activeValue} onView={setViewRecord} onEdit={record=>{setEditingRecord(record);setEditorOpen(true)}} onDelete={removeRecord}/>} 
   {section==='templates'&&<TemplatesWorkspace templates={templates} records={records} onView={template=>{setEditingTemplate(template);setTemplateModalMode('view');setTemplateEditorOpen(true)}} onEdit={template=>{setEditingTemplate(template);setTemplateModalMode('edit');setTemplateEditorOpen(true)}} onDelete={removeTemplate}/>} 
   {section==='variables'&&<VariablesWorkspace variables={variables} templates={templates} onView={variable=>{setSelectedVariable(variable);setVariableModalMode('view');setVariableEditorOpen(true)}} onEdit={variable=>{setSelectedVariable(variable);setVariableModalMode('edit');setVariableEditorOpen(true)}} onDelete={removeVariable}/>} 
  </main>
 </div>
 {editorOpen&&<ContractEditorModal record={editingRecord} contacts={contacts} templates={templates} variables={variables} onClose={()=>{setEditingRecord(undefined);setEditorOpen(false)}} onSave={saveEditor}/>} 
 {viewRecord&&<ContractViewModal record={viewRecord} template={templates.find(item=>item.id===viewRecord.templateId)} autentiqueState={autentiqueState} onClose={()=>setViewRecord(undefined)} onEdit={()=>{if(canEditRecord(viewRecord)){setEditingRecord(viewRecord);setViewRecord(undefined);setEditorOpen(true)}}} onDelete={()=>removeRecord(viewRecord)}/>} 
 {templateEditorOpen&&<ContractTemplateModal template={editingTemplate} variables={variables} mode={templateModalMode} onClose={()=>{setEditingTemplate(undefined);setTemplateEditorOpen(false)}} onSave={saveTemplate}/>} 
 {variableEditorOpen&&<ContractVariableModal variable={selectedVariable} variables={variables} mode={variableModalMode} onClose={()=>{setSelectedVariable(undefined);setVariableEditorOpen(false)}} onSave={saveVariable}/>} 
 </div>;
}

function ContractsList({records,allRecords,templates,query,setQuery,statusFilter,setStatusFilter,templateFilter,setTemplateFilter,stats,activeValue,onView,onEdit,onDelete}:{records:ContractRecord[];allRecords:ContractRecord[];templates:ContractTemplate[];query:string;setQuery:(value:string)=>void;statusFilter:string;setStatusFilter:(value:string)=>void;templateFilter:string;setTemplateFilter:(value:string)=>void;stats:{total:number;active:number;awaiting:number;review:number;closed:number};activeValue:number;onView:(record:ContractRecord)=>void;onEdit:(record:ContractRecord)=>void;onDelete:(record:ContractRecord)=>void}){
 return <><section className="contracts-kpis"><Kpi label="Total de contratos" value={stats.total} note="na sessão atual"/><Kpi label="Vigentes" value={stats.active} note="em vigor"/><Kpi label="Aguardando assinatura" value={stats.awaiting} note="somente após envio real"/><Kpi label="Em revisão" value={stats.review} note="pré-assinatura"/><Kpi label="Encerrados" value={stats.closed} note="expirados/rescindidos/cancelados"/><Kpi label="Valor efetivo" value={money(activeValue)} note="vigentes + assinados"/></section>
  <section className="contracts-panel"><div className="contracts-toolbar"><input aria-label="Buscar contratos" placeholder="Buscar por título, cliente, template, destino ou visto…" value={query} onChange={event=>setQuery(event.target.value)}/><select value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="all">Todos os status</option>{Object.entries(CONTRACT_STATUS_LABEL).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><select value={templateFilter} onChange={event=>setTemplateFilter(event.target.value)}><option value="all">Todos os templates</option>{templates.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><span>{records.length} de {allRecords.length}</span></div>
   {records.length?<div className="contracts-table-wrap"><table className="contracts-table"><thead><tr><th>Contrato</th><th>Cliente</th><th>Template</th><th>Status</th><th>Período</th><th>Valor</th><th>Assinatura</th><th>Ações</th></tr></thead><tbody>{records.map(record=>{const client=record.parties.find(item=>item.role==='client')??record.parties[0];return <tr key={record.id}><td><strong>{record.title}</strong><small>{record.destination||record.visaType?`${record.destination||'—'} · ${record.visaType||'—'}`:'Sem destino/tipo de visto'}</small></td><td>{client?.name||'—'}</td><td>{templates.find(item=>item.id===record.templateId)?.name??'Snapshot preservado'}</td><td><span className={`contracts-status ${statusClass(record.status)}`}>{CONTRACT_STATUS_LABEL[record.status]}</span></td><td>{date(record.startDate)} — {date(record.endDate)}</td><td>{record.value>0?money(record.value):'—'}</td><td>{record.signatureProvider==='autentique'?'Autentique':'Não enviado'}</td><td><RowActionMenu label={record.title} onView={()=>onView(record)} onEdit={()=>onEdit(record)} onDelete={()=>onDelete(record)} editDisabled={!canEditRecord(record)} editTitle={!canEditRecord(record)?'Este contrato não pode ser editado no status atual.':'Editar contrato'}/></td></tr>})}</tbody></table></div>:<div className="contracts-empty"><strong>Nenhum contrato encontrado</strong><p>{allRecords.length?'Ajuste os filtros para localizar contratos.':'Crie o primeiro contrato usando um template e um cliente do CRM.'}</p></div>}
  </section></>;
}

function TemplatesWorkspace({templates,records,onView,onEdit,onDelete}:{templates:ContractTemplate[];records:ContractRecord[];onView:(template:ContractTemplate)=>void;onEdit:(template:ContractTemplate)=>void;onDelete:(template:ContractTemplate)=>void}){
 const [query,setQuery]=useState('');
 const filtered=templates.filter(item=>`${item.name} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()));
 return <><section className="contracts-kpis contracts-kpis--four"><Kpi label="Templates" value={templates.length} note="total"/><Kpi label="Ativos" value={templates.filter(item=>item.active).length} note="disponíveis no wizard"/><Kpi label="Em uso" value={new Set(records.map(item=>item.templateId)).size} note="vinculados a contratos"/><Kpi label="Placeholders" value={templates.reduce((sum,item)=>sum+extractTemplatePlaceholders(item.content).length,0)} note="mapeados"/></section><section className="contracts-panel"><div className="contracts-toolbar"><input aria-label="Buscar templates" placeholder="Buscar template…" value={query} onChange={event=>setQuery(event.target.value)}/><span>{filtered.length} de {templates.length}</span></div>{filtered.length?<div className="contracts-table-wrap"><table className="contracts-table"><thead><tr><th>Template</th><th>Variáveis</th><th>Status</th><th>Atualizado</th><th>Ações</th></tr></thead><tbody>{filtered.map(template=>{const inUse=records.some(record=>record.templateId===template.id);return <tr key={template.id}><td><strong>{template.name}</strong><small>{template.description||'Sem descrição'}</small></td><td>{extractTemplatePlaceholders(template.content).length}</td><td><span className={`contracts-status ${template.active?'is-active':'is-draft'}`}>{template.active?'Ativo':'Inativo'}</span></td><td>{new Date(template.updatedAt).toLocaleDateString('pt-BR')}</td><td><RowActionMenu label={template.name} onView={()=>onView(template)} onEdit={()=>onEdit(template)} onDelete={()=>onDelete(template)} deleteDisabled={inUse} deleteTitle={inUse?'Template vinculado a contrato; desative-o em vez de excluir.':'Excluir template'}/></td></tr>})}</tbody></table></div>:<div className="contracts-empty"><strong>Nenhum template encontrado</strong><p>Ajuste a busca para localizar templates.</p></div>}</section></>;
}

function VariablesWorkspace({variables,templates,onView,onEdit,onDelete}:{variables:ContractVariableDefinition[];templates:ContractTemplate[];onView:(variable:ContractVariableDefinition)=>void;onEdit:(variable:ContractVariableDefinition)=>void;onDelete:(variable:ContractVariableDefinition)=>void}){
 const [query,setQuery]=useState('');
 const filtered=variables.filter(item=>`${item.label} ${item.placeholder} ${item.description} ${item.group} ${item.field}`.toLowerCase().includes(query.trim().toLowerCase()));
 return <section className="contracts-panel"><div className="contracts-toolbar"><input aria-label="Buscar variáveis" placeholder="Buscar variável…" value={query} onChange={event=>setQuery(event.target.value)}/><span>{filtered.length} de {variables.length}</span></div>{filtered.length?<div className="contracts-table-wrap"><table className="contracts-table"><thead><tr><th>Variável</th><th>Placeholder</th><th>Tipo</th><th>Obrigatória</th><th>Uso em templates</th><th>Atualizado</th><th>Ações</th></tr></thead><tbody>{filtered.map(variable=>{const usage=templates.filter(template=>template.content.includes(variable.placeholder)).length;return <tr key={variable.id}><td><strong>{variable.label}</strong><small>{variable.description||`${variable.group}.${variable.field}`}</small></td><td><code>{variable.placeholder}</code></td><td>{variableTypeLabel(variable.type)}</td><td>{variable.required?'Sim':'Não'}</td><td>{usage}</td><td>{new Date(variable.updatedAt).toLocaleDateString('pt-BR')}</td><td><RowActionMenu label={variable.label} onView={()=>onView(variable)} onEdit={()=>onEdit(variable)} onDelete={()=>onDelete(variable)} deleteDisabled={usage>0} deleteTitle={usage>0?'Variável em uso por template':'Excluir variável'}/></td></tr>})}</tbody></table></div>:<div className="contracts-empty"><strong>Nenhuma variável encontrada</strong><p>{variables.length?'Ajuste a busca para localizar variáveis.':'Crie a primeira variável pelo botão no cabeçalho.'}</p></div>}</section>;
}

export default ContractsApp;
