import { FormEvent, useState } from 'react';
import type { Client } from '../../clients/types/client';
import type { VisaProcess } from '../../processes/types/process';
import type { ServiceInteraction } from '../types/interaction';

export const INTERACTION_CHANNEL_LABELS: Record<ServiceInteraction['channel'], string> = { whatsapp: 'WhatsApp', email: 'E-mail', phone: 'Telefone', meeting: 'Reunião', other: 'Outro' };

type InteractionFormProps = { clients: Client[]; processes: VisaProcess[]; onCreateInteraction: (input: Omit<ServiceInteraction, 'id'>) => void; };

export function InteractionForm({ clients, processes, onCreateInteraction }: InteractionFormProps) {
  const [clientId, setClientId] = useState('');
  const [processId, setProcessId] = useState('');
  const [channel, setChannel] = useState<ServiceInteraction['channel']>('whatsapp');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const clientProcesses = processes.filter((process) => process.clientId === clientId);

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onCreateInteraction({ clientId, processId: processId || undefined, channel, subject: subject.trim(), notes: notes.trim(), occurredAt: new Date().toISOString() }); setSubject(''); setNotes(''); }

  return <form className="management-form-card interaction-form" onSubmit={submit}><div className="interaction-form__heading"><div><span className="management-eyebrow">Novo registro</span><h2>Registrar atendimento</h2><p>Documente os principais contatos com o cliente e relacione-os ao processo quando necessário.</p></div></div><div className="management-form-grid"><label><span>Cliente</span><select required value={clientId} onChange={(e) => { setClientId(e.target.value); setProcessId(''); }}><option value="">Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select></label><label><span>Processo relacionado</span><select value={processId} onChange={(e) => setProcessId(e.target.value)} disabled={!clientId}><option value="">Sem processo específico</option>{clientProcesses.map((process) => <option key={process.id} value={process.id}>{process.category}</option>)}</select></label><label><span>Canal</span><select value={channel} onChange={(e) => setChannel(e.target.value as ServiceInteraction['channel'])}>{Object.entries(INTERACTION_CHANNEL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>Assunto</span><input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex.: checklist enviado" /></label><label className="management-field--full"><span>Registro do atendimento</span><textarea rows={4} required value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Resumo do contato, orientações e próximos passos." /></label></div><div className="management-form-actions"><button className="management-primary-button" type="submit">Registrar atendimento</button></div></form>;
}
