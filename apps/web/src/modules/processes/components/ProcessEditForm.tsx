import { FormEvent, useEffect, useState } from 'react';
import { DESTINATION_LABELS, PROCESS_PRIORITY_LABELS, PROCESS_STAGE_LABELS, type ProcessPriority, type ProcessStage, type VisaDestination, type VisaProcess } from '../types/process';

type ProcessEditableFields = Pick<VisaProcess, 'destination' | 'category' | 'stage' | 'priority' | 'targetDate' | 'notes'>;
type ProcessEditFormProps = { process: VisaProcess; onSave: (processId: string, patch: ProcessEditableFields) => void; onCancel: () => void; };

export function ProcessEditForm({ process, onSave, onCancel }: ProcessEditFormProps) {
  const [destination, setDestination] = useState<VisaDestination>(process.destination);
  const [category, setCategory] = useState(process.category);
  const [stage, setStage] = useState<ProcessStage>(process.stage);
  const [priority, setPriority] = useState<ProcessPriority>(process.priority);
  const [targetDate, setTargetDate] = useState(process.targetDate);
  const [notes, setNotes] = useState(process.notes);
  const [error, setError] = useState('');

  useEffect(() => { setDestination(process.destination); setCategory(process.category); setStage(process.stage); setPriority(process.priority); setTargetDate(process.targetDate); setNotes(process.notes); setError(''); }, [process]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCategory = category.trim();
    if (normalizedCategory.length < 2) { setError('Informe a categoria ou objetivo do processo.'); return; }
    onSave(process.id, { destination, category: normalizedCategory, stage, priority, targetDate, notes: notes.trim() });
    setError('');
  }

  return <form className="process-edit-form" onSubmit={submit} noValidate><div className="process-edit-form__heading"><div><span className="management-eyebrow">Editar processo</span><h2>Dados operacionais</h2></div><button type="button" className="management-secondary-button" onClick={onCancel}>Cancelar</button></div>{error && <div className="management-form-error" role="alert">{error}</div>}<div className="management-form-grid"><label><span>Destino</span><select value={destination} onChange={(event) => setDestination(event.target.value as VisaDestination)}>{Object.entries(DESTINATION_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Categoria / objetivo</span><input value={category} onChange={(event) => { setCategory(event.target.value); setError(''); }} /></label><label><span>Etapa</span><select value={stage} onChange={(event) => setStage(event.target.value as ProcessStage)}>{Object.entries(PROCESS_STAGE_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Prioridade</span><select value={priority} onChange={(event) => setPriority(event.target.value as ProcessPriority)}>{Object.entries(PROCESS_PRIORITY_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Data-alvo</span><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label><label className="management-field--full"><span>Observações</span><textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} /></label></div><div className="management-form-actions"><button className="management-primary-button" type="submit">Salvar alterações</button></div></form>;
}
