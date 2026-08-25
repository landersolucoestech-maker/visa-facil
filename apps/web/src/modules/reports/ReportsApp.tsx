import { useRef, useState } from 'react';
import './reports.css';

type ReportEntity = {
  id: string;
  label: string;
  description: string;
  columns: string[];
};

const ENTITIES: ReportEntity[] = [
  { id: 'contacts', label: 'Contatos', description: 'Cadastros e dados de relacionamento do CRM.', columns: ['Nome', 'E-mail', 'Telefone', 'CPF', 'RG', 'Passaporte', 'Serviço', 'Destino'] },
  { id: 'leads', label: 'Leads', description: 'Leads, origem, interesse, status e informações comerciais.', columns: ['Nome', 'E-mail', 'Telefone', 'Origem', 'Status', 'Serviço', 'Tipo de visto', 'Destino'] },
  { id: 'attendance', label: 'Atendimentos', description: 'Conversas, canais, protocolos, filas e responsáveis.', columns: ['Cliente', 'Canal', 'Protocolo', 'Status', 'Fila', 'Responsável', 'Última mensagem'] },
  { id: 'tasks', label: 'Tarefas', description: 'Pendências, prioridades, responsáveis, prazos e status.', columns: ['Tarefa', 'Vínculo', 'Responsável', 'Prioridade', 'Prazo', 'Status'] },
  { id: 'agenda', label: 'Agenda', description: 'Compromissos, eventos, entrevistas e prazos.', columns: ['Evento', 'Tipo', 'Data', 'Horário', 'Status', 'Responsável', 'Vínculo'] },
  { id: 'finance', label: 'Transações financeiras', description: 'Receitas, despesas, contas a pagar e a receber.', columns: ['Descrição', 'Tipo', 'Categoria', 'Valor', 'Data', 'Vencimento', 'Status'] },
];

function BellIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>}
function downloadTemplate(entity: ReportEntity) {
  const csv = `\uFEFF${entity.columns.join(';')}\n`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${entity.id}-template.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function normalizeHeader(value:string){return value.replace(/^\uFEFF/,'').trim().toLocaleLowerCase('pt-BR')}
async function validateCsv(file:File,entity:ReportEntity){
  if(!file.name.toLowerCase().endsWith('.csv'))throw new Error('Envie um arquivo CSV. XLSX ainda não é suportado neste frontend.');
  const text=await file.text();
  const firstLine=text.split(/\r?\n/,1)[0]??'';
  const delimiter=firstLine.includes(';')?';':',';
  const headers=firstLine.split(delimiter).map(normalizeHeader);
  const missing=entity.columns.filter(column=>!headers.includes(normalizeHeader(column)));
  if(missing.length)throw new Error(`Campos ausentes: ${missing.join(', ')}.`);
  return Math.max(0,text.split(/\r?\n/).filter(line=>line.trim()).length-1);
}

export function ReportsApp() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [importEntity, setImportEntity] = useState<ReportEntity>();
  const [file, setFile] = useState<File>();
  const [validation,setValidation]=useState<{ok:boolean;message:string}>();
  const fileRef = useRef<HTMLInputElement>(null);
  const closeImport = () => { setImportEntity(undefined); setFile(undefined); setValidation(undefined); };
  const runValidation=async()=>{
    if(!file||!importEntity)return;
    try{const rows=await validateCsv(file,importEntity);setValidation({ok:true,message:`Estrutura válida. ${rows} linha${rows===1?'':'s'} de dados encontrada${rows===1?'':'s'}. A persistência ainda não está conectada, portanto nenhum registro foi alterado.`})}
    catch(error){setValidation({ok:false,message:error instanceof Error?error.message:'Não foi possível validar o arquivo.'})}
  };

  return <div className="crm-shell reports-shell" onClick={() => setNotificationsOpen(false)}>
    <div className="crm-workspace">
      <header className="crm-topbar">
        <div><small>VISA FÁCIL · CRM</small><h1>Relatórios</h1><p>Contratos de importação e exportação por domínio.</p></div>
        <div className="crm-topbar-actions" onClick={event => event.stopPropagation()}>
          <div className="reports-topbar-menu"><button className="reports-notification-button" type="button" aria-label="Alertas" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(value => !value)}><BellIcon/></button>{notificationsOpen && <div className="reports-dropdown"><strong>Notificações</strong><p>Nenhuma notificação no momento.</p></div>}</div>
          <button className="crm-user" type="button"><span>VF</span><div><strong>Administrador</strong><small>Protótipo frontend</small></div><span className="crm-user-caret">⌄</span></button>
        </div>
      </header>

      <main className="reports-content">
        <div className="reports-validation reports-validation--ok"><strong>Estado da integração</strong><p>Este repositório não possui backend ou store persistente compartilhado. Templates e validação CSV são funcionais; importação persistente e exportação de dados permanecem indisponíveis para evitar resultados falsos.</p></div>
        <section className="reports-card"><div className="reports-entity-list">{ENTITIES.map(entity => <article key={entity.id} className="reports-entity-row">
          <div className="reports-entity-icon">▥</div>
          <div className="reports-entity-copy"><strong>{entity.label}</strong><p>{entity.description}</p><small>{entity.columns.length} campos no contrato</small></div>
          <div className="reports-entity-actions"><button className="reports-action-button" type="button" onClick={() => downloadTemplate(entity)}>↓ Template CSV</button><button className="reports-action-button" type="button" onClick={() => { setImportEntity(entity); setFile(undefined); setValidation(undefined); }}>↑ Validar CSV</button><button className="reports-action-button reports-action-button--primary" type="button" disabled title="Requer persistência/backend conectado">↓ Exportar dados</button></div>
        </article>)}</div></section>
      </main>
    </div>

    {importEntity && <div className="reports-modal-backdrop" onMouseDown={event => event.currentTarget === event.target && closeImport()}><div className="reports-import-modal">
      <header><div><span>VALIDAÇÃO DE CSV</span><h2>{importEntity.label}</h2><p>Valide o contrato do arquivo sem simular uma importação inexistente.</p></div><button type="button" onClick={closeImport} aria-label="Fechar">×</button></header>
      <div className="reports-import-body"><div className="reports-import-toolbar"><button type="button" onClick={() => downloadTemplate(importEntity)}>↓ Baixar template</button></div><button className="reports-dropzone" type="button" onClick={() => fileRef.current?.click()}><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={event => { const next = event.target.files?.[0]; setFile(next); setValidation(undefined); }} /><span>↑</span><strong>{file ? file.name : 'Selecionar CSV'}</strong><small>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : 'Somente CSV'}</small></button>{validation&&<div className={`reports-validation${validation.ok?' reports-validation--ok':''}`} role={validation.ok?'status':'alert'}><strong>{validation.ok?'Arquivo válido':'Falha na validação'}</strong><p>{validation.message}</p></div>}<div className="reports-import-columns"><span>Campos esperados</span><div>{importEntity.columns.map(column => <b key={column}>{column}</b>)}</div></div></div>
      <footer><button className="crm-btn-secondary" type="button" onClick={closeImport}>Fechar</button><button className="crm-btn-primary" type="button" disabled={!file} onClick={runValidation}>Validar arquivo</button></footer>
    </div></div>}
  </div>;
}

export default ReportsApp;
