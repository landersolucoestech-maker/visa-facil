import { useMemo, useState } from 'react';
import { DocumentChecklistForm } from '../components/DocumentChecklistForm';
import { DocumentTable } from '../components/DocumentTable';
import { PROCESS_STAGE_LABELS, type VisaProcess } from '../../processes/types/process';
import type { DocumentItem } from '../types/document';

type DocumentsPageProps = { processes: VisaProcess[]; documents: DocumentItem[]; onCreateDocument: (input: Omit<DocumentItem, 'id' | 'updatedAt'>) => void; onToggleReceived: (documentId: string) => void; };

export function DocumentsPage({ processes, documents, onCreateDocument, onToggleReceived }: DocumentsPageProps) {
  const [processFilter, setProcessFilter] = useState('all');
  const required = documents.filter((document) => document.required).length;
  const received = documents.filter((document) => document.received).length;
  const pending = documents.filter((document) => document.required && !document.received).length;
  const filteredDocuments = useMemo(() => processFilter === 'all' ? documents : documents.filter((document)=>document.processId===processFilter), [documents,processFilter]);
  const processProgress = processes.map((process)=>{
    const items=documents.filter((document)=>document.processId===process.id);
    const requiredItems=items.filter((document)=>document.required);
    const receivedRequired=requiredItems.filter((document)=>document.received).length;
    const progress=requiredItems.length?Math.round((receivedRequired/requiredItems.length)*100):0;
    return {process,items:items.length,required:requiredItems.length,pending:requiredItems.length-receivedRequired,progress};
  });

  return <section className="management-page document-page" aria-labelledby="documents-title"><div className="management-page__heading management-page__heading--row"><div><span className="management-eyebrow">Controle documental</span><h1 id="documents-title">Documentos</h1><p>Organize o checklist de cada processo e acompanhe rapidamente itens obrigatórios, recebidos e pendentes.</p></div>{processes.length>0&&<label className="document-process-filter"><span>Filtrar processo</span><select value={processFilter} onChange={(event)=>setProcessFilter(event.target.value)}><option value="all">Todos os processos</option>{processes.map((process)=><option key={process.id} value={process.id}>{process.category} · {PROCESS_STAGE_LABELS[process.stage]}</option>)}</select></label>}</div>
  <div className="document-summary-grid"><article><span>Total de itens</span><strong>{documents.length}</strong><small>Checklist desta sessão</small></article><article><span>Obrigatórios</span><strong>{required}</strong><small>Itens exigidos no processo</small></article><article><span>Recebidos</span><strong>{received}</strong><small>Documentos marcados como recebidos</small></article><article><span>Pendentes</span><strong>{pending}</strong><small>Obrigatórios ainda não recebidos</small></article></div>
  {processes.length>0&&<section className="document-progress-card"><div className="document-progress-card__heading"><div><span className="management-eyebrow">Progresso documental</span><h2>Por processo</h2></div><span>{processProgress.length} processo(s)</span></div><div className="document-progress-list">{processProgress.map(({process,items,required,pending,progress})=><a href={`/app/processos/${encodeURIComponent(process.id)}`} key={process.id}><div><strong>{process.category}</strong><small>{PROCESS_STAGE_LABELS[process.stage]} · {items} item(ns) · {pending} pendência(s)</small></div><div className="document-progress-meter"><i style={{width:`${progress}%`}} /></div><span>{progress}%</span></a>)}</div></section>}
  {processes.length === 0 ? <div className="document-prerequisite"><div><span className="management-eyebrow">Pré-requisito</span><h2>Crie um processo antes do checklist</h2><p>Os documentos são organizados por processo para manter contexto e rastreabilidade.</p></div><a className="management-primary-button" href="/app/processos">Ir para Processos</a></div> : <DocumentChecklistForm processes={processes} onCreateDocument={onCreateDocument} />}
  <section className="document-list-card"><div className="document-list-card__heading"><div><span className="management-eyebrow">Checklist</span><h2>{processFilter==='all'?'Itens documentais':'Itens do processo selecionado'}</h2></div><span>{filteredDocuments.length} registro(s)</span></div><DocumentTable processes={processes} documents={filteredDocuments} onToggleReceived={onToggleReceived} /></section></section>;
}
