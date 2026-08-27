import { useRef, useState } from 'react';
import './reports.css';
import { getReportRows, importReportRows, REPORT_DATASET_COLUMNS, type ReportDatasetId, type ReportRow } from './reportDatasetAdapter';
import { CONFIGURATION_REPORT_DATASET_COLUMNS, getConfigurationReportRows, importConfigurationReportRows, isConfigurationReportDatasetId, type ConfigurationReportDatasetId } from './reportConfigurationDatasetAdapter';
import { assertSafeXlsxFile } from './xlsxImportSafety';
import { createXlsxBlob, readXlsxFile } from './xlsxWorkbook';

type ReportEntityId=ReportDatasetId|ConfigurationReportDatasetId;
type ReportEntity = {
  id: ReportEntityId;
  label: string;
  description: string;
  columns: readonly string[];
};

const MAX_XLSX_BYTES=10*1024*1024;
const ENTITIES:ReportEntity[]=[
  {id:'contacts',label:'Contatos',description:'Todos os campos do modal Criar contato.',columns:REPORT_DATASET_COLUMNS.contacts},
  {id:'leads',label:'Leads',description:'Todos os campos do modal Criar lead.',columns:REPORT_DATASET_COLUMNS.leads},
  {id:'attendance',label:'Atendimentos',description:'Todos os campos do modal Iniciar conversa.',columns:REPORT_DATASET_COLUMNS.attendance},
  {id:'tasks',label:'Tarefas',description:'Todos os campos do modal Criar tarefa.',columns:REPORT_DATASET_COLUMNS.tasks},
  {id:'agenda',label:'Agenda',description:'Todos os campos do modal Novo evento na agenda.',columns:REPORT_DATASET_COLUMNS.agenda},
  {id:'finance',label:'Transações financeiras',description:'Todos os campos do modal Adicionar transação.',columns:REPORT_DATASET_COLUMNS.finance},
  {id:'financeCategories',label:'Categorias financeiras',description:'Todos os campos do modal Nova categoria financeira.',columns:CONFIGURATION_REPORT_DATASET_COLUMNS.financeCategories},
  {id:'financeRules',label:'Regras financeiras',description:'Todos os campos do modal Nova regra financeira.',columns:CONFIGURATION_REPORT_DATASET_COLUMNS.financeRules},
  {id:'contractTemplates',label:'Templates de contratos',description:'Todos os campos editáveis do modal Novo template.',columns:CONFIGURATION_REPORT_DATASET_COLUMNS.contractTemplates},
  {id:'contractVariables',label:'Variáveis de templates de contratos',description:'Todos os campos editáveis do modal Criar variável.',columns:CONFIGURATION_REPORT_DATASET_COLUMNS.contractVariables},
];

function BellIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>}
function normalizeHeader(value:string){return value.trim().toLocaleLowerCase('pt-BR')}
function downloadBlob(blob:Blob,fileName:string){const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=fileName;document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url)}
function reportRows(id:ReportEntityId){return isConfigurationReportDatasetId(id)?getConfigurationReportRows(id):getReportRows(id)}
function importRows(id:ReportEntityId,rows:ReportRow[]){return isConfigurationReportDatasetId(id)?importConfigurationReportRows(id,rows):importReportRows(id,rows)}
function downloadTemplate(entity:ReportEntity){downloadBlob(createXlsxBlob(entity.label,[...entity.columns],[]),`${entity.id}-template.xlsx`)}
function downloadDataset(entity:ReportEntity){const records=reportRows(entity.id);const rows=records.map(row=>entity.columns.map(column=>row[column]??''));const stamp=new Date().toISOString().slice(0,10);downloadBlob(createXlsxBlob(entity.label,[...entity.columns],rows),`${entity.id}-${stamp}.xlsx`)}
function validateHeaders(headers:string[],entity:ReportEntity){
 const normalized=headers.map(normalizeHeader);
 if(headers.length===0)throw new Error('O XLSX não possui cabeçalho.');
 if(new Set(normalized).size!==normalized.length)throw new Error('O XLSX possui cabeçalhos duplicados.');
 const expected=entity.columns.map(normalizeHeader);
 const missing=entity.columns.filter(column=>!normalized.includes(normalizeHeader(column)));
 const extras=headers.filter(header=>!expected.includes(normalizeHeader(header)));
 if(missing.length||extras.length){const messages:string[]=[];if(missing.length)messages.push(`Campos ausentes: ${missing.join(', ')}`);if(extras.length)messages.push(`Campos não permitidos: ${extras.join(', ')}`);throw new Error(`${messages.join('. ')}. O arquivo precisa conter exatamente os campos do modal correspondente.`)}
 if(headers.length!==entity.columns.length)throw new Error('O XLSX precisa conter exatamente os campos do modal correspondente.');
}
async function parseXlsx(file:File,entity:ReportEntity):Promise<ReportRow[]>{
 if(!file.name.toLowerCase().endsWith('.xlsx'))throw new Error('Envie exclusivamente um arquivo XLSX (.xlsx).');
 if(file.size===0)throw new Error('O arquivo XLSX está vazio.');
 if(file.size>MAX_XLSX_BYTES)throw new Error('O arquivo XLSX excede o limite de 10 MB.');
 await assertSafeXlsxFile(file);
 const workbook=await readXlsxFile(file);validateHeaders(workbook.headers,entity);
 const headerIndex=new Map(workbook.headers.map((header,index)=>[normalizeHeader(header),index]));
 return workbook.rows.map(values=>{const row:ReportRow={};for(const column of entity.columns){const index=headerIndex.get(normalizeHeader(column));row[column]=index===undefined?'':String(values[index]??'').trim()}return row}).filter(row=>Object.values(row).some(value=>value.length>0));
}

export function ReportsApp(){
 const [notificationsOpen,setNotificationsOpen]=useState(false);
 const [importEntity,setImportEntity]=useState<ReportEntity>();
 const [file,setFile]=useState<File>();
 const [result,setResult]=useState<{ok:boolean;message:string}>();
 const [busy,setBusy]=useState(false);
 const fileRef=useRef<HTMLInputElement>(null);
 const closeImport=()=>{if(busy)return;setImportEntity(undefined);setFile(undefined);setResult(undefined)};
 const chooseFile=(next?:File)=>{
  setResult(undefined);
  if(!next){setFile(undefined);return}
  if(!next.name.toLowerCase().endsWith('.xlsx')){setFile(undefined);setResult({ok:false,message:'Envie exclusivamente um arquivo XLSX (.xlsx).'});return}
  if(next.size===0){setFile(undefined);setResult({ok:false,message:'O arquivo XLSX está vazio.'});return}
  if(next.size>MAX_XLSX_BYTES){setFile(undefined);setResult({ok:false,message:'O arquivo XLSX excede o limite de 10 MB.'});return}
  setFile(next);
 };
 const runImport=async()=>{
  if(!file||!importEntity||busy)return;
  setBusy(true);setResult(undefined);
  try{const rows=await parseXlsx(file,importEntity);const outcome=importRows(importEntity.id,rows);setResult({ok:true,message:`Importação XLSX concluída no protótipo local: ${outcome.imported} novo${outcome.imported===1?' registro':'s registros'} e ${outcome.updated} atualizado${outcome.updated===1?'':'s'}. Total processado: ${outcome.total}.`})}
  catch(error){setResult({ok:false,message:error instanceof Error?error.message:'Não foi possível importar o XLSX.'})}
  finally{setBusy(false)}
 };

 return <div className="crm-shell reports-shell" onClick={()=>setNotificationsOpen(false)} onKeyDown={event=>{if(event.key==='Escape'){setNotificationsOpen(false);if(importEntity)closeImport()}}}>
  <div className="crm-workspace">
   <header className="crm-topbar">
    <div><small>VISA FÁCIL · CRM</small><h1>Relatórios</h1><p>Importação e exportação dos datasets operacionais e de configuração exclusivamente em XLSX.</p></div>
    <div className="crm-topbar-actions" onClick={event=>event.stopPropagation()}><div className="reports-topbar-menu"><button className="reports-notification-button" type="button" aria-label="Alertas" aria-haspopup="true" aria-expanded={notificationsOpen} onClick={()=>setNotificationsOpen(value=>!value)}><BellIcon/></button>{notificationsOpen&&<div className="reports-dropdown" role="region" aria-label="Notificações de relatórios"><strong>Notificações</strong><p>Nenhuma notificação no momento.</p></div>}</div></div>
   </header>

   <main className="reports-content">
    <div className="reports-validation reports-validation--ok"><strong>XLSX completo por entidade</strong><p>Cada arquivo contém exatamente todos os campos exibidos no respectivo modal de criação. Não há schema reduzido, CSV ou omissão de campos. Importar e Exportar operam sobre os dados locais atuais desta sessão do navegador.</p></div>
    <section className="reports-card"><div className="reports-entity-list">{ENTITIES.map(entity=><article key={entity.id} className="reports-entity-row">
     <div className="reports-entity-icon">▥</div>
     <div className="reports-entity-copy"><strong>{entity.label}</strong><p>{entity.description}</p><small>{entity.columns.length} campos · contrato completo do modal</small></div>
     <div className="reports-entity-actions"><button className="reports-action-button" type="button" onClick={()=>{setImportEntity(entity);setFile(undefined);setResult(undefined)}}>↑ Importar XLSX</button><button className="reports-action-button reports-action-button--primary" type="button" onClick={()=>downloadDataset(entity)}>↓ Exportar XLSX</button></div>
    </article>)}</div></section>
   </main>
  </div>

  {importEntity&&<div className="reports-modal-backdrop" onMouseDown={event=>event.currentTarget===event.target&&closeImport()}><div className="reports-import-modal" role="dialog" aria-modal="true" aria-labelledby="reports-import-title">
   <header><div><span>IMPORTAR XLSX</span><h2 id="reports-import-title">{importEntity.label}</h2><p>O arquivo deve conter exatamente os {importEntity.columns.length} campos do modal correspondente.</p></div><button type="button" disabled={busy} onClick={closeImport} aria-label="Fechar">×</button></header>
   <div className="reports-import-body"><div className="reports-import-toolbar"><button type="button" disabled={busy} onClick={()=>downloadTemplate(importEntity)}>↓ Baixar template XLSX completo</button></div><button className="reports-dropzone" type="button" disabled={busy} onClick={()=>fileRef.current?.click()}><input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={event=>chooseFile(event.target.files?.[0])}/><span>↑</span><strong>{file?file.name:'Selecionar XLSX'}</strong><small>{file?`${Math.max(1,Math.round(file.size/1024))} KB`:'Somente .xlsx · máximo de 10 MB'}</small></button>{result&&<div className={`reports-validation${result.ok?' reports-validation--ok':''}`} role={result.ok?'status':'alert'}><strong>{result.ok?'Importação concluída':'Falha na importação'}</strong><p>{result.message}</p></div>}<div className="reports-import-columns"><span>Campos exatos do modal</span><div>{importEntity.columns.map(column=><b key={column}>{column}</b>)}</div></div></div>
   <footer><button className="crm-btn-secondary" type="button" disabled={busy} onClick={closeImport}>Fechar</button><button className="crm-btn-primary" type="button" disabled={!file||busy} onClick={runImport}>{busy?'Importando XLSX...':'Importar dados'}</button></footer>
  </div></div>}
 </div>;
}

export default ReportsApp;
