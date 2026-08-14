import { FormEvent, useState } from 'react';
import type { Client } from '../../clients/types/client';
import { DESTINATION_LABELS, PROCESS_PRIORITY_LABELS, PROCESS_STAGE_LABELS, type ProcessPriority, type ProcessStage, type VisaDestination, type VisaProcess } from '../types/process';

type ProcessFormProps = {
  clients: Client[];
  onCreateProcess: (input: Omit<VisaProcess, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
};

const emptyForm = { clientId: '', destination: 'usa' as VisaDestination, category: '', stage: 'diagnosis' as ProcessStage, priority: 'normal' as ProcessPriority, targetDate: '', notes: '' };

export function ProcessForm({ clients, onCreateProcess, onCancel }: ProcessFormProps) {
  const [form, setForm] = useState(emptyForm);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreateProcess({ ...form, category: form.category.trim(), notes: form.notes.trim() });
    setForm(emptyForm);
  }

  return <form className="management-form-card process-form" onSubmit={submit}>
    <div className="process-form__heading"><div><span className="management-eyebrow">Novo processo</span><h2>Abrir solicitação</h2><p>Vincule o processo a um cliente e defina destino, etapa inicial e prioridade operacional.</p></div><button type="button" className="management-secondary-button" onClick={onCancel}>Fechar</button></div>
    <div className="management-form-grid">
      <label><span>Cliente</span><select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}><option value="">Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select></label>
      <label><span>Destino</span><select value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value as VisaDestination })}>{Object.entries(DESTINATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Categoria / objetivo</span><input required placeholder="Ex.: turismo B1/B2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
      <label><span>Etapa atual</span><select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as ProcessStage })}>{Object.entries(PROCESS_STAGE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Prioridade</span><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as ProcessPriority })}>{Object.entries(PROCESS_PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Data-alvo</span><input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></label>
      <label className="management-field--full"><span>Observações</span><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Informações importantes sobre o processo." /></label>
    </div>
    <div className="management-form-actions"><button type="button" className="management-secondary-button" onClick={onCancel}>Cancelar</button><button className="management-primary-button" type="submit">Adicionar processo</button></div>
  </form>;
}
