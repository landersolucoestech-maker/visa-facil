import { useEffect, useMemo, useState } from 'react';
import { getCrmSessionRecords } from '../../shared/operationalSessionStore';
import { isBackendConfigured } from '../../shared/apiClient';
import { getIntegrationStatuses } from '../integrations/integrationApi';
import { ContractEditorModal } from './ContractEditorModal';
import { ContractTemplateModal, type ContractTemplateDraft } from './ContractTemplateModal';
import { ContractViewModal } from './ContractViewModal';
import { createAudit, createVersion, getContractCategories, getContractRecords, getContractTemplates, getContractVariables, saveContractCategories, saveContractRecords, saveContractTemplates, saveContractVariables } from './contractSessionStore';
import { extractTemplatePlaceholders, makePlaceholder, nextVersionLabel } from './contractTemplateEngine';
import { CONTRACT_STATUS_LABEL, type ContractCategory, type ContractEditorDraft, type ContractRecord, type ContractTemplate, type ContractVariableDefinition, type ContractVariableType } from './contractTypes';
import './contracts.css';

type Section='contracts'|'templates'|'variables'|'categories';

function base(){return import.meta.env.BASE_URL.replace(/\/$/,'')}
function href(path:string){return `${base()}${path}`||path}
function go(path:string){window.location.href=href(path)}
function sectionFromPath():Section{const root=base();const raw=root&&window.location.pathname.startsWith(root)?window.location.pathname.slice(root.length):window.location.pathname;if(raw.endsWith('/templates'))return'templates';if(raw.endsWith('/variaveis'))return'variables';if(raw.endsWith('/categorias'))return'categories';return'contracts'}
function money(value:number){return value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function date(value:string){if(!value)return'—';const parsed=new Date(`${value}T12:00:00`);return Number.isNaN(parsed.getTime())?value:parsed.toLocaleDateString('pt-BR')}
function slug(value:string){return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
function statusClass(status:ContractRecord['status']){return `is-${status.replaceAll('_','-')}`}
function statusClosed(status:ContractRecord['status']){return status==='expired'||status==='terminated'||status==='cancelled'}
function canEditRecord(record:ContractRecord){return record.status==='draft'||record.status==='review'}

function Kpi({label,value,note}:{label:string;value:string|number;note:string}){return <article className="contracts-kpi"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>}

export function ContractsApp(){
 const section=sectionFromPath();
 const [records,setRecords]=useState<ContractRecord[]>(()=>getContractRecords());
 const [templates,setTemplates]=useState<ContractTemplate[]>(()=>getContractTemplates());
 const [variables,setVariables]=useState<ContractVariableDefinition[]>(()=>getContractVariables());
 const [categories,setCategories]=useState<ContractCategory[]>(()=>getContractCategories());
 const [query,setQuery]=useState('');
 const [statusFilter,setStatusFilter]=useState('all');
 const [categoryFilter,setCategoryFilter]=useState('all');
 const [editingRecord,setEditingRecord]=useState<ContractRecord>();
 const [viewRecord,setViewRecord]=useState<ContractRecord>();
 const [editorOpen,setEditorOpen]=useState(false);
 const [templateEditorOpen,setTemplateEditorOpen]=useState(false);
 const [editingTemplate,setEditingTemplate]=useState<ContractTemplate>();
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
 const persistCategories=(next:ContractCategory[])=>{saveContractCategories(next);setCategories(next)};

 const filteredRecords=useMemo(()=>records.filter(record=>{
  const text=`${record.title} ${record.parties.map(item=>item.name).join(' ')} ${record.destination} ${record.visaType}`.toLowerCase();
  return(!query.trim()||text.includes(query.trim().toLowerCase()))&&(statusFilter==='all'||record.status===statusFilter)&&(categoryFilter==='all'||record.categoryId===categoryFilter);
 }),[records,query,statusFilter,categoryFilter]);
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

 const title=section==='contracts'?'Contratos':section==='templates'?'Templates de Contrato':section==='variables'?'Variáveis de Template':'Categorias de Contrato';
 const subtitle=section==='contracts'?'Gestão de contratos, documentos e preparação para assinatura eletrônica':section==='templates'?'Modelos reutilizáveis com variáveis estruturadas e snapshot documental':section==='variables'?'Registro canônico de placeholders reutilizáveis':'Classificação dos contratos e templates';

 return <div className="crm-shell contracts-shell"><div className="crm-workspace">
  <header className="crm-topbar"><div><small>VISA FÁCIL · CRM · CONTRATOS</small><h1>{title}</h1><p>{subtitle}</p></div><div className="crm-topbar-actions contracts-topbar-actions">{section==='contracts'&&<button className="crm-topbar-primary" type="button" onClick={()=>{setEditingRecord(undefined);setEditorOpen(true)}}>+ Novo Contrato</button>}{section==='templates'&&<button className="crm-topbar-primary" type="button" onClick={()=>{setEditingTemplate(undefined);setTemplateEditorOpen(true)}}>+ Novo Template</button>}</div></header>
  <main className="contracts-content">
   <nav className="contracts-module-tabs" aria-label="Seções de contratos"><button type="button" className={section==='contracts'?'is-active':''} onClick={()=>go('/crm/contratos')}>Contratos</button><button type="button" className={section==='templates'?'is-active':''} onClick={()=>go('/crm/contratos/templates')}>Templates</button><button type="button" className={section==='variables'?'is-active':''} onClick={()=>go('/crm/contratos/variaveis')}>Variáveis</button><button type="button" className={section==='categories'?'is-active':''} onClick={()=>go('/crm/contratos/categorias')}>Categorias</button></nav>
   <div className="contracts-session-notice"><strong>Persistência atual: sessão do navegador.</strong><span>O módulo é funcional no frontend, mas contratos reais, anexos, auditoria imutável e assinatura Autentique exigem backend persistente.</span></div>
   {section==='contracts'&&<ContractsList records={filteredRecords} allRecords={records} categories={categories} query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} stats={stats} activeValue={activeValue} onView={setViewRecord} onEdit={record=>{setEditingRecord(record);setEditorOpen(true)}} onDelete={removeRecord}/>} 
   {section==='templates'&&<TemplatesWorkspace templates={templates} categories={categories} records={records} onNew={()=>{setEditingTemplate(undefined);setTemplateEditorOpen(true)}} onEdit={template=>{setEditingTemplate(template);setTemplateEditorOpen(true)}} onDelete={removeTemplate}/>} 
   {section==='variables'&&<VariablesWorkspace variables={variables} templates={templates} persist={persistVariables}/>} 
   {section==='categories'&&<CategoriesWorkspace categories={categories} templates={templates} records={records} persist={persistCategories}/>} 
  </main>
 </div>
 {editorOpen&&<ContractEditorModal record={editingRecord} contacts={contacts} templates={templates} categories={categories} variables={variables} onClose={()=>{setEditingRecord(undefined);setEditorOpen(false)}} onSave={saveEditor}/>} 
 {viewRecord&&<ContractViewModal record={viewRecord} category={categories.find(item=>item.id===viewRecord.categoryId)} template={templates.find(item=>item.id===viewRecord.templateId)} autentiqueState={autentiqueState} onClose={()=>setViewRecord(undefined)} onEdit={()=>{if(canEditRecord(viewRecord)){setEditingRecord(viewRecord);setViewRecord(undefined);setEditorOpen(true)}}} onDelete={()=>removeRecord(viewRecord)}/>} 
 {templateEditorOpen&&<ContractTemplateModal template={editingTemplate} categories={categories} variables={variables} onClose={()=>{setEditingTemplate(undefined);setTemplateEditorOpen(false)}} onSave={saveTemplate}/>} 
 </div>;
}

function ContractsList({records,allRecords,categories,query,setQuery,statusFilter,setStatusFilter,categoryFilter,setCategoryFilter,stats,activeValue,onView,onEdit,onDelete}:{records:ContractRecord[];allRecords:ContractRecord[];categories:ContractCategory[];query:string;setQuery:(value:string)=>void;statusFilter:string;setStatusFilter:(value:string)=>void;categoryFilter:string;setCategoryFilter:(value:string)=>void;stats:{total:number;active:number;awaiting:number;review:number;closed:number};activeValue:number;onView:(record:ContractRecord)=>void;onEdit:(record:ContractRecord)=>void;onDelete:(record:ContractRecord)=>void}){
 return <><section className="contracts-kpis"><Kpi label="Total de contratos" value={stats.total} note="na sessão atual"/><Kpi label="Vigentes" value={stats.active} note="em vigor"/><Kpi label="Aguardando assinatura" value={stats.awaiting} note="somente após envio real"/><Kpi label="Em revisão" value={stats.review} note="pré-assinatura"/><Kpi label="Encerrados" value={stats.closed} note="expirados/rescindidos/cancelados"/><Kpi label="Valor efetivo" value={money(activeValue)} note="vigentes + assinados"/></section>
  <section className="contracts-panel"><div className="contracts-toolbar"><input aria-label="Buscar contratos" placeholder="Buscar por título, cliente, destino ou visto…" value={query} onChange={event=>setQuery(event.target.value)}/><select value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="all">Todos os status</option>{Object.entries(CONTRACT_STATUS_LABEL).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><select value={categoryFilter} onChange={event=>setCategoryFilter(event.target.value)}><option value="all">Todas as categorias</option>{categories.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><span>{records.length} de {allRecords.length}</span></div>
   {records.length?<div className="contracts-table-wrap"><table className="contracts-table"><thead><tr><th>Contrato</th><th>Cliente</th><th>Categoria</th><th>Status</th><th>Período</th><th>Valor</th><th>Assinatura</th><th aria-label="Ações"/></tr></thead><tbody>{records.map(record=>{const client=record.parties.find(item=>item.role==='client')??record.parties[0];return <tr key={record.id}><td><strong>{record.title}</strong><small>{record.destination||record.visaType?`${record.destination||'—'} · ${record.visaType||'—'}`:'Sem destino/tipo de visto'}</small></td><td>{client?.name||'—'}</td><td>{categories.find(item=>item.id===record.categoryId)?.label??'—'}</td><td><span className={`contracts-status ${statusClass(record.status)}`}>{CONTRACT_STATUS_LABEL[record.status]}</span></td><td>{date(record.startDate)} — {date(record.endDate)}</td><td>{record.value>0?money(record.value):'—'}</td><td>{record.signatureProvider==='autentique'?'Autentique':'Não enviado'}</td><td><div className="contracts-row-actions"><button type="button" onClick={()=>onView(record)}>Ver</button><button type="button" disabled={!canEditRecord(record)} onClick={()=>onEdit(record)}>Editar</button><button type="button" className="is-danger" onClick={()=>onDelete(record)}>Excluir</button></div></td></tr>})}</tbody></table></div>:<div className="contracts-empty"><strong>Nenhum contrato encontrado</strong><p>{allRecords.length?'Ajuste os filtros para localizar contratos.':'Crie o primeiro contrato usando um template e um cliente do CRM.'}</p></div>}
  </section></>;
}

function TemplatesWorkspace({templates,categories,records,onNew,onEdit,onDelete}:{templates:ContractTemplate[];categories:ContractCategory[];records:ContractRecord[];onNew:()=>void;onEdit:(template:ContractTemplate)=>void;onDelete:(template:ContractTemplate)=>void}){
 const [query,setQuery]=useState('');
 const filtered=templates.filter(item=>`${item.name} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()));
 return <><section className="contracts-kpis contracts-kpis--four"><Kpi label="Templates" value={templates.length} note="total"/><Kpi label="Ativos" value={templates.filter(item=>item.active).length} note="disponíveis no wizard"/><Kpi label="Em uso" value={new Set(records.map(item=>item.templateId)).size} note="vinculados a contratos"/><Kpi label="Placeholders" value={templates.reduce((sum,item)=>sum+extractTemplatePlaceholders(item.content).length,0)} note="mapeados"/></section><section className="contracts-panel"><div className="contracts-toolbar"><input placeholder="Buscar template…" value={query} onChange={event=>setQuery(event.target.value)}/><button className="contracts-primary-button" type="button" onClick={onNew}>+ Novo Template</button></div>{filtered.length?<div className="contracts-table-wrap"><table className="contracts-table"><thead><tr><th>Template</th><th>Categoria</th><th>Variáveis</th><th>Status</th><th>Atualizado</th><th aria-label="Ações"/></tr></thead><tbody>{filtered.map(template=><tr key={template.id}><td><strong>{template.name}</strong><small>{template.description||'Sem descrição'}</small></td><td>{categories.find(item=>item.id===template.categoryId)?.label??'—'}</td><td>{extractTemplatePlaceholders(template.content).length}</td><td><span className={`contracts-status ${template.active?'is-active':'is-draft'}`}>{template.active?'Ativo':'Inativo'}</span></td><td>{new Date(template.updatedAt).toLocaleDateString('pt-BR')}</td><td><div className="contracts-row-actions"><button type="button" onClick={()=>onEdit(template)}>Editar</button><button type="button" className="is-danger" onClick={()=>onDelete(template)}>Excluir</button></div></td></tr>)}</tbody></table></div>:<div className="contracts-empty"><strong>Nenhum template encontrado</strong><p>Crie ou ajuste os filtros.</p></div>}</section></>;
}

function VariablesWorkspace({variables,templates,persist}:{variables:ContractVariableDefinition[];templates:ContractTemplate[];persist:(records:ContractVariableDefinition[])=>void}){
 const [label,setLabel]=useState('');const [group,setGroup]=useState('');const [field,setField]=useState('');const [type,setType]=useState<ContractVariableType>('text');const [required,setRequired]=useState(false);const [description,setDescription]=useState('');const [query,setQuery]=useState('');
 const placeholder=group.trim()&&field.trim()?makePlaceholder(group,field):'';
 const add=()=>{if(!label.trim()||!placeholder)return;if(variables.some(item=>item.placeholder===placeholder)){window.alert('Já existe uma variável com este placeholder.');return}const stamp=new Date().toISOString();persist([{id:crypto.randomUUID(),group:group.trim().toUpperCase(),field:field.trim().toUpperCase(),placeholder,label:label.trim(),type,required,description:description.trim(),createdAt:stamp,updatedAt:stamp},...variables]);setLabel('');setGroup('');setField('');setType('text');setRequired(false);setDescription('')};
 const remove=(variable:ContractVariableDefinition)=>{if(templates.some(template=>template.content.includes(variable.placeholder))){window.alert('Esta variável está sendo usada por um template e não pode ser removida.');return}if(window.confirm(`Excluir ${variable.placeholder}?`))persist(variables.filter(item=>item.id!==variable.id))};
 const filtered=variables.filter(item=>`${item.label} ${item.placeholder} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()));
 return <div className="contracts-registry-layout"><section className="contracts-panel contracts-registry-form"><div className="contracts-panel-heading"><span>NOVA VARIÁVEL</span><h2>Placeholder reutilizável</h2><p>Use o padrão <code>{'{{GRUPO.CAMPO}}'}</code>. Templates só armazenam texto; nenhum código é executado.</p></div><div className="contracts-form-grid"><label className="contracts-field"><span>Nome amigável</span><input value={label} onChange={event=>setLabel(event.target.value)} placeholder="Ex: Número do protocolo"/></label><label className="contracts-field"><span>Grupo</span><input value={group} onChange={event=>setGroup(event.target.value)} placeholder="Ex: PROCESSO"/></label><label className="contracts-field"><span>Campo</span><input value={field} onChange={event=>setField(event.target.value)} placeholder="Ex: PROTOCOLO"/></label><label className="contracts-field"><span>Tipo</span><select value={type} onChange={event=>setType(event.target.value as ContractVariableType)}><option value="text">Texto</option><option value="textarea">Texto longo</option><option value="number">Número</option><option value="date">Data</option><option value="currency">Moeda</option><option value="email">E-mail</option><option value="cpf">CPF</option><option value="passport">Passaporte</option></select></label><label className="contracts-field contracts-field--wide"><span>Descrição</span><input value={description} onChange={event=>setDescription(event.target.value)} placeholder="Como e quando esta variável deve ser preenchida"/></label><label className="contracts-checkbox"><input type="checkbox" checked={required} onChange={event=>setRequired(event.target.checked)}/><span>Obrigatória para revisão</span></label></div><div className="contracts-registry-preview"><span>Placeholder</span><code>{placeholder||'{{GRUPO.CAMPO}}'}</code></div><button type="button" className="contracts-primary-button" disabled={!label.trim()||!placeholder} onClick={add}>Criar variável</button></section><section className="contracts-panel"><div className="contracts-toolbar"><input placeholder="Buscar variável…" value={query} onChange={event=>setQuery(event.target.value)}/><span>{filtered.length} de {variables.length}</span></div><div className="contracts-registry-list">{filtered.map(variable=><article key={variable.id}><div><strong>{variable.label}</strong><code>{variable.placeholder}</code><p>{variable.description||`${variable.type}${variable.required?' · obrigatória':''}`}</p></div><button type="button" onClick={()=>navigator.clipboard?.writeText(variable.placeholder)}>Copiar</button><button type="button" className="is-danger" onClick={()=>remove(variable)}>Excluir</button></article>)}</div></section></div>;
}

function CategoriesWorkspace({categories,templates,records,persist}:{categories:ContractCategory[];templates:ContractTemplate[];records:ContractRecord[];persist:(records:ContractCategory[])=>void}){
 const [label,setLabel]=useState('');const [description,setDescription]=useState('');const [query,setQuery]=useState('');
 const add=()=>{const clean=label.trim();const categorySlug=slug(clean);if(!clean||!categorySlug)return;if(categories.some(item=>item.slug===categorySlug)){window.alert('Já existe uma categoria com esse slug.');return}const stamp=new Date().toISOString();persist([{id:crypto.randomUUID(),label:clean,slug:categorySlug,description:description.trim(),active:true,createdAt:stamp,updatedAt:stamp},...categories]);setLabel('');setDescription('')};
 const toggle=(category:ContractCategory)=>persist(categories.map(item=>item.id===category.id?{...item,active:!item.active,updatedAt:new Date().toISOString()}:item));
 const remove=(category:ContractCategory)=>{if(templates.some(item=>item.categoryId===category.id)||records.some(item=>item.categoryId===category.id)){window.alert('Categoria em uso. Desative-a em vez de excluir.');return}if(window.confirm(`Excluir a categoria “${category.label}”?`))persist(categories.filter(item=>item.id!==category.id))};
 const filtered=categories.filter(item=>`${item.label} ${item.slug} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()));
 return <div className="contracts-registry-layout"><section className="contracts-panel contracts-registry-form"><div className="contracts-panel-heading"><span>NOVA CATEGORIA</span><h2>Classificação contratual</h2><p>Categorias organizam templates, contratos e filtros sem criar tipos rígidos no código.</p></div><div className="contracts-form-grid"><label className="contracts-field"><span>Nome</span><input value={label} onChange={event=>setLabel(event.target.value)} placeholder="Ex: Consultoria Premium"/></label><label className="contracts-field"><span>Slug</span><input value={slug(label)} readOnly/></label><label className="contracts-field contracts-field--wide"><span>Descrição</span><input value={description} onChange={event=>setDescription(event.target.value)} placeholder="Quando utilizar esta categoria"/></label></div><button type="button" className="contracts-primary-button" disabled={!label.trim()} onClick={add}>Criar categoria</button></section><section className="contracts-panel"><div className="contracts-toolbar"><input placeholder="Buscar categoria…" value={query} onChange={event=>setQuery(event.target.value)}/><span>{filtered.length} de {categories.length}</span></div><div className="contracts-registry-list">{filtered.map(category=><article key={category.id}><div><strong>{category.label}</strong><code>{category.slug}</code><p>{category.description||'Sem descrição'}</p></div><button type="button" onClick={()=>toggle(category)}>{category.active?'Desativar':'Ativar'}</button><button type="button" className="is-danger" onClick={()=>remove(category)}>Excluir</button></article>)}</div></section></div>;
}

export default ContractsApp;
