import { FormEvent, useState } from 'react';
import type { Client, ClientStatus } from '../types/client';

type ClientFormProps = {
  onCreateClient: (input: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
};

const emptyForm = { fullName: '', email: '', phone: '', status: 'lead' as ClientStatus, notes: '' };

export function ClientForm({ onCreateClient, onCancel }: ClientFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    if (fullName.length < 2) { setError('Informe o nome completo do cliente.'); return; }
    if (phoneDigits.length < 8) { setError('Informe um telefone/WhatsApp válido para o atendimento.'); return; }
    if (!email) { setError('Informe o e-mail do cliente.'); return; }
    onCreateClient({ ...form, fullName, email, phone, notes: form.notes.trim() });
    setForm(emptyForm);
    setError('');
  }

  return (
    <form className="management-form-card client-form" onSubmit={submit} noValidate>
      <div className="client-form__heading"><div><span className="management-eyebrow">Novo cadastro</span><h2>Adicionar cliente</h2><p>Registre os dados básicos para iniciar o atendimento e abrir processos posteriormente.</p></div><button type="button" className="management-secondary-button" onClick={onCancel}>Fechar</button></div>
      {error && <div className="management-form-error" role="alert">{error}</div>}
      <div className="management-form-grid">
        <label><span>Nome completo</span><input required aria-invalid={Boolean(error) && form.fullName.trim().length < 2} value={form.fullName} onChange={(e) => { setForm({ ...form, fullName: e.target.value }); setError(''); }} placeholder="Nome do cliente" /></label>
        <label><span>WhatsApp</span><input required inputMode="tel" aria-invalid={Boolean(error) && form.phone.replace(/\D/g, '').length < 8} value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setError(''); }} placeholder="(00) 00000-0000" /><small className="management-field-hint">Use telefone com DDD quando disponível.</small></label>
        <label><span>E-mail</span><input type="email" required aria-invalid={Boolean(error) && !form.email.trim()} value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(''); }} placeholder="cliente@email.com" /></label>
        <label><span>Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}><option value="lead">Lead</option><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
        <label className="management-field--full"><span>Observações</span><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Contexto inicial, objetivo da viagem ou observações do atendimento." /></label>
      </div>
      <div className="management-form-actions"><button type="button" className="management-secondary-button" onClick={onCancel}>Cancelar</button><button className="management-primary-button" type="submit">Adicionar cliente</button></div>
    </form>
  );
}
