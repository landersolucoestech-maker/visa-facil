import { useRef, useState } from 'react';
import './reports.css';
import { getReportRows, importReportRows, REPORT_DATASET_COLUMNS, type ReportDatasetId, type ReportRow } from './reportDatasetAdapter';

type ReportEntity = {
  id: ReportDatasetId;
  label: string;
  description: string;
  columns: readonly string[];
};

type ParsedCsv={rows:ReportRow[];rowCount:number};

const MAX_CSV_BYTES = 5 * 1024 * 1024;
const ENTITIES: ReportEntity[] = [
  { id: 'contacts', label: 'Contatos', description: 'Cadastros e dados de relacionamento do CRM.', columns: REPORT_DATASET_COLUMNS.contacts },
  { id: 'leads', label: 'Leads', description: 'Leads, origem, interesse, status e informações comerciais.', columns: REPORT_DATASET_COLUMNS.leads },
  { id: 'attendance', label: 'Atendimentos', description: 'Conversas de clientes, canais, protocolos, filas e responsáveis.', columns: REPORT_DATASET_COLUMNS.attendance },
  { id: 'tasks', label: 'Tarefas', description: 'Pendências, prioridades, responsáveis, prazos e status.', columns: REPORT_DATASET_COLUMNS.tasks },
  { id: 'agenda', label: 'Agenda', description: 'Compromissos, eventos, entrevistas e prazos.', columns: REPORT_DATASET_COLUMNS.agenda },
  { id: 'finance', label: 'Transações financeiras', description: 'Receitas, despesas, contas a pagar e a receber.', columns: REPORT_DATASET_COLUMNS.finance },
];

function BellIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>}
function normalizeHeader(value:string){return value.replace(/^\uFEFF/,'').trim().toLocaleLowerCase('pt-BR')}
function escapeCsv(value:string){return /[;"\r\n]/.test(value)?`"${value.replace(/"/g,'""')}"`:value}
function createDownload(content:string,fileName:string){const blob=new Blob([content],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=fileName;document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url)}
function downloadTemplate(entity:ReportEntity){createDownload(`\uFEFF${entity.columns.map(escapeCsv).join(';')}\n`,`${entity.id}-template.csv`)}
function downloadDataset(entity:ReportEntity){const rows=getReportRows(entity.id);const lines=[entity.columns.join(';'),...rows.map(row=>entity.columns.map(column=>escapeCsv(row[column]??'')).join(';'))];const stamp=new Date().toISOString().slice(0,10);createDownload(`\uFEFF${lines.join('\n')}\n`,`${entity.id}-${stamp}.csv`)}

function detectDelimiter(line:string){let quoted=false;for(const char of line){if(char==='"')quoted=!quoted;else if(!quoted&&(char===';'||char===','))return char}return';'}
function parseDelimited(text:string,delimiter:string){const rows:string[][]=[];let row:string[]=[];let field='';let quoted=false;for(let index=0;index<text.length;index+=1){const char=text[index];if(char==='"'){if(quoted&&text[index+1]==='"'){field+='"';index+=1}else quoted=!quoted;continue}if(!quoted&&char===delimiter){row.push(field);field='';continue}if(!quoted&&(char==='\n'||char==='\r')){if(char==='\r'&&text[index+1]==='\n')index+=1;row.push(field);field='';if(row.some(value=>value.trim()))rows.push(row);row=[];continue}field+=char}if(quoted)throw new Error('O CSV possui aspas não fechadas.');row.push(field);if(row.some(value=>value.trim()))rows.push(row);return rows}
async function parseCsv(file:File,entity:ReportEntity):Promise<ParsedCsv>{
  if(!file.name.toLowerCase().endsWith('.csv'))throw new Error('Envie um arquivo CSV.');
  if(file.size===0)throw new Error('O arquivo CSV está vazio.');
  if(file.size>MAX_CSV_BYTES)throw new Error('O arquivo CSV excede o limite de 5 MB.');
  const text=await file.text();
  const firstLine=text.split(/\r?\n/,1)[0]??'';
  if(!firstLine.trim())throw new Error('O CSV não possui cabeçalho.');
  const delimiter=detectDelimiter(firstLine);
  const matrix=parseDelimited(text,delimiter);
  if(!matrix.length)throw new Error('O CSV não possui cabeçalho.');
  const headers=matrix[0].map(normalizeHeader);
  if(new Set(headers).size!==headers.length)throw new Error('O CSV possui cabeçalhos duplicados.');
  const missing=entity.columns.filter(column=>!headers.includes(normalizeHeader(column)));
  if(missing.length)throw new Error(`Campos ausentes: ${missing.join(', ')}.`);
  const rows=matrix.slice(1).map(values=>{const row:ReportRow={};entity.columns.forEach(column=>{const index=headers.indexOf(normalizeHeader(column));row[column]=(values[index]??'').trim()});return row}).filter(row=>Object.values(row).some(value=>value));
  return{rows,rowCount:rows.length};
}

export function ReportsApp() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [importEntity, setImportEntity] = useState<ReportEntity>();
  const [file, setFile] = useState<File>();
  const [result,setResult]=useState<{ok:boolean;message:string}>();
  const [busy,setBusy]=useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const closeImport = () => { if(busy)return;setImportEntity(undefined); setFile(undefined); setResult(undefined); };
  const chooseFile=(next?:File)=>{
    setResult(undefined);
    if(!next){setFile(undefined);return}
    if(!next.name.toLowerCase().endsWith('.csv')){setFile(undefined);setResult({ok:false,message:'Envie um arquivo CSV.'});return}
    if(next.size===0){setFile(undefined);setResult({ok:false,message:'O arquivo CSV está vazio.'});return}
    if(next.size>MAX_CSV_BYTES){setFile(undefined);setResult({ok:false,message:'O arquivo CSV excede o limite de 5 MB.'});return}
    setFile(next);
  };
  const runImport=async()=>{
    if(!file||!importEntity||busy)return;
    setBusy(true);setResult(undefined);
    try{const parsed=await parseCsv(file,importEntity);const outcome=importReportRows(importEntity.id,parsed.rows);setResult({ok:true,message:`Importação concluída no protótipo local: ${outcome.imported} novo${outcome.imported===1?' registro':'s registros'} e ${outcome.updated} atualizado${outcome.updated===1?'':'s'}. Total processado: ${outcome.total}.`})}
    catch(error){setResult({ok:false,message:error instanceof Error?error.message:'Não foi possível importar o arquivo.'})}
    finally{setBusy(false)}
  };

  return <div className="crm-shell reports-shell" onClick={() => setNotificationsOpen(false)} onKeyDown={event=>{if(event.key==='Escape'){setNotificationsOpen(false);if(importEntity)closeImport()}}}>
    <div className="crm-workspace">
      <header className="crm-topbar">
        <div><small>VISA FÁCIL · CRM</small><h1>Relatórios</h1><p>Importação e exportação dos datasets operacionais.</p></div>
        <div className="crm-topbar-actions" onClick={event => event.stopPropagation()}>
          <div className="reports-topbar-menu"><button className="reports-notification-button" type="button" aria-label="Alertas" aria-haspopup="true" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(value => !value)}><BellIcon/></button>{notificationsOpen && <div className="reports-dropdown" role="region" aria-label="Notificações de relatórios"><strong>Notificações</strong><p>Nenhuma notificação no momento.</p></div>}</div>
        </div>
      </header>

      <main className="reports-content">
        <div className="reports-validation reports-validation--ok"><strong>Dados do protótipo</strong><p>Importar e Exportar operam sobre os dados locais atuais desta sessão do navegador. Não há sincronização com servidor externo enquanto o backend não estiver conectado.</p></div>
        <section className="reports-card"><div className="reports-entity-list">{ENTITIES.map(entity => <article key={entity.id} className="reports-entity-row">
          <div className="reports-entity-icon">▥</div>
          <div className="reports-entity-copy"><strong>{entity.label}</strong><p>{entity.description}</p><small>{entity.columns.length} campos no dataset</small></div>
          <div className="reports-entity-actions"><button className="reports-action-button" type="button" onClick={() => { setImportEntity(entity); setFile(undefined); setResult(undefined); }}>↑ Importar</button><button className="reports-action-button reports-action-button--primary" type="button" onClick={()=>downloadDataset(entity)}>↓ Exportar</button></div>
        </article>)}</div></section>
      </main>
    </div>

    {importEntity && <div className="reports-modal-backdrop" onMouseDown={event => event.currentTarget === event.target && closeImport()}><div className="reports-import-modal" role="dialog" aria-modal="true" aria-labelledby="reports-import-title">
      <header><div><span>IMPORTAR CSV</span><h2 id="reports-import-title">{importEntity.label}</h2><p>Os dados válidos serão gravados no dataset local correspondente.</p></div><button type="button" disabled={busy} onClick={closeImport} aria-label="Fechar">×</button></header>
      <div className="reports-import-body"><div className="reports-import-toolbar"><button type="button" disabled={busy} onClick={() => downloadTemplate(importEntity)}>↓ Baixar template CSV</button></div><button className="reports-dropzone" type="button" disabled={busy} onClick={() => fileRef.current?.click()}><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={event => chooseFile(event.target.files?.[0])} /><span>↑</span><strong>{file ? file.name : 'Selecionar CSV'}</strong><small>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : 'Somente CSV · máximo de 5 MB'}</small></button>{result&&<div className={`reports-validation${result.ok?' reports-validation--ok':''}`} role={result.ok?'status':'alert'}><strong>{result.ok?'Importação concluída':'Falha na importação'}</strong><p>{result.message}</p></div>}<div className="reports-import-columns"><span>Campos esperados</span><div>{importEntity.columns.map(column => <b key={column}>{column}</b>)}</div></div></div>
      <footer><button className="crm-btn-secondary" type="button" disabled={busy} onClick={closeImport}>Fechar</button><button className="crm-btn-primary" type="button" disabled={!file||busy} onClick={runImport}>{busy?'Importando...':'Importar dados'}</button></footer>
    </div></div>}
  </div>;
}

export default ReportsApp;