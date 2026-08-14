import { FormEvent, useState } from 'react';
import { DESTINATION_LABELS, type VisaProcess } from '../../processes/types/process';
import type { DocumentItem } from '../types/document';

type DocumentChecklistFormProps = { processes: VisaProcess[]; onCreateDocument: (input: Omit<DocumentItem, 'id' | 'updatedAt'>) => void; };

export function DocumentChecklistForm({ processes, onCreateDocument }: DocumentChecklistFormProps) {
  const [processId, setProcessId] = useState('');
  const [title, setTitle] = useState('');
  const [required, setRequired] = useState(true);
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const normalizedTitle = title.trim(); if (!processId) { setError('Selecione o processo ao qual o documento pertence.'); return; } if (normalizedTitle.length < 2) { setError('Informe o nome do documento do checklist.'); return; } onCreateDocument({ processId, title: normalizedTitle, required, received: false, notes: '' }); setTitle(''); setError(''); }
  return <form className="management-form-card document-form" onSubmit={submit} noValidate><div className="document-form__heading"><div><span className="management-eyebrow">Checklist</span><h2>Adicionar documento</h2><p>Cadastre os itens necessários para acompanhar a preparação documental de cada processo.</p></div></div>{error && <div className="management-form-error" role="alert">{error}</div>}<div className="management-form-grid"><label><span>Processo</span><select required aria-invalid={Boolean(error) && !processId} value={processId} onChange={(e) => { setProcessId(e.target.value); setError(''); }}><option value="">Selecione</option>{processes.map((process) => <option key={process.id} value={process.id}>{DESTINATION_LABELS[process.destination]} · {process.category}</option>)}</select></label><label><span>Documento</span><input required aria-invalid={Boolean(error) && title.trim().length < 2} placeholder="Ex.: passaporte válido" value={title} onChange={(e) => { setTitle(e.target.value); setError(''); }} /></label><label className="management-checkbox"><input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} /><span>Item obrigatório</span></label></div><div className="management-form-actions"><button className="management-primary-button" type="submit">Adicionar ao checklist</button></div></form>;
}
