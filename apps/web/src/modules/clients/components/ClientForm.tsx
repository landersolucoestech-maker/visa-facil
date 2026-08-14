import { FormEvent, useState } from 'react';
import type { Client, ClientStatus } from '../types/client';

type ClientFormProps = {
  onCreateClient: (input: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
};

const emptyForm = { fullName: '', email: '', phone: '', status: 'lead' as ClientStatus, notes: '' };

export function ClientForm({ onCreateClient, onCancel }: ClientFormProps) {
  const [form, setForm] = useState(emptyForm);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreateClient({ ...form, fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), notes: form.notes.trim() });
    setForm(emptyForm);
  }

  return (
    <form className="management-form-card client-form" onSubmit={submit}>
      <div className="client-form__heading"><div><span className="management-eyebrow">Novo cadastro</span><h2>Adicionar cliente</h2><p>Registre os dados básicos para iniciar o atendimento e abrir processos posteriormente.</p></div><button type="button" className="management-secondary-button" onClick={onCancel}>Fechar</button></div>
      <div className="management-form-grid">
        <label><span>Nome completo</span><input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nome do cliente" /></label>
        <label><span>WhatsApp</span><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></label>
        <label><span>E-mail</span><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.com" /></label>
        <label><span>Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}><option value="lead">Lead</option><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
        <label className="management-field--full"><span>Observações</span><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Contexto inicial, objetivo da viagem ou observações do atendimento." /></label>
      </div>
      <div className="management-form-actions"><button type="button" className="management-secondary-button" onClick={onCancel}>Cancelar</button><button className="management-primary-button" type="submit">Adicionar cliente</button></div>
    </form>
  );
}
