import { DESTINATION_LABELS, type VisaProcess } from '../../processes/types/process';
import type { DocumentItem } from '../types/document';

type DocumentTableProps = { processes: VisaProcess[]; documents: DocumentItem[]; onToggleReceived: (documentId: string) => void; };

export function DocumentTable({ processes, documents, onToggleReceived }: DocumentTableProps) {
  if (documents.length === 0) return <div className="management-empty-state document-empty-state"><span className="document-empty-state__icon">DOC</span><strong>Nenhum item documental na sessão.</strong><span>Adicione documentos ao checklist para acompanhar recebimentos e pendências.</span></div>;
  return <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Documento</th><th>Processo</th><th>Obrigatório</th><th>Situação</th></tr></thead><tbody>{documents.map((document) => { const process = processes.find((item) => item.id === document.processId); return <tr key={document.id}><td><strong>{document.title}</strong></td><td>{process ? `${DESTINATION_LABELS[process.destination]} · ${process.category}` : 'Processo não encontrado'}</td><td>{document.required ? 'Sim' : 'Não'}</td><td><button type="button" className={`management-status-button ${document.received ? 'is-complete' : ''}`} onClick={() => onToggleReceived(document.id)}>{document.received ? 'Recebido' : 'Pendente'}</button></td></tr>; })}</tbody></table></div>;
}
