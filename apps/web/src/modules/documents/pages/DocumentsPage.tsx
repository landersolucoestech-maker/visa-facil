import { DocumentChecklistForm } from '../components/DocumentChecklistForm';
import { DocumentTable } from '../components/DocumentTable';
import type { VisaProcess } from '../../processes/types/process';
import type { DocumentItem } from '../types/document';

type DocumentsPageProps = { processes: VisaProcess[]; documents: DocumentItem[]; onCreateDocument: (input: Omit<DocumentItem, 'id' | 'updatedAt'>) => void; onToggleReceived: (documentId: string) => void; };

export function DocumentsPage({ processes, documents, onCreateDocument, onToggleReceived }: DocumentsPageProps) {
  const required = documents.filter((document) => document.required).length;
  const received = documents.filter((document) => document.received).length;
  const pending = documents.filter((document) => document.required && !document.received).length;

  return <section className="management-page document-page" aria-labelledby="documents-title"><div className="management-page__heading"><span className="management-eyebrow">Controle documental</span><h1 id="documents-title">Documentos</h1><p>Organize o checklist de cada processo e acompanhe rapidamente itens obrigatórios, recebidos e pendentes.</p></div>
  <div className="document-summary-grid"><article><span>Total de itens</span><strong>{documents.length}</strong><small>Checklist desta sessão</small></article><article><span>Obrigatórios</span><strong>{required}</strong><small>Itens exigidos no processo</small></article><article><span>Recebidos</span><strong>{received}</strong><small>Documentos marcados como recebidos</small></article><article><span>Pendentes</span><strong>{pending}</strong><small>Obrigatórios ainda não recebidos</small></article></div>
  {processes.length === 0 ? <div className="document-prerequisite"><div><span className="management-eyebrow">Pré-requisito</span><h2>Crie um processo antes do checklist</h2><p>Os documentos são organizados por processo para manter contexto e rastreabilidade.</p></div><a className="management-primary-button" href="/app/processos">Ir para Processos</a></div> : <DocumentChecklistForm processes={processes} onCreateDocument={onCreateDocument} />}
  <section className="document-list-card"><div className="document-list-card__heading"><div><span className="management-eyebrow">Checklist geral</span><h2>Itens documentais</h2></div><span>{documents.length} registro(s)</span></div><DocumentTable processes={processes} documents={documents} onToggleReceived={onToggleReceived} /></section></section>;
}
