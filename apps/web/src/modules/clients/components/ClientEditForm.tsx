import { FormEvent, useEffect, useState } from 'react';
import { CLIENT_STATUS_LABELS, type Client, type ClientStatus } from '../types/client';

type ClientEditFormProps = {
  client: Client;
  onSave: (clientId: string, patch: Pick<Client, 'fullName' | 'email' | 'phone' | 'status' | 'notes'>) => void;
  onCancel: () => void;
};

export function ClientEditForm({ client, onSave, onCancel }: ClientEditFormProps) {
  const [fullName, setFullName] = useState(client.fullName);
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone);
  const [status, setStatus] = useState<ClientStatus>(client.status);
  const [notes, setNotes] = useState(client.notes);
  const [error, setError] = useState('');

  useEffect(() => { setFullName(client.fullName); setEmail(client.email); setPhone(client.phone); setStatus(client.status); setNotes(client.notes); setError(''); }, [client]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim();
    const normalizedPhone = phone.trim();
    if (normalizedName.length < 2) { setError('Informe o nome do cliente.'); return; }
    if (normalizedPhone.replace(/\D/g, '').length < 8) { setError('Informe um telefone/WhatsApp válido.'); return; }
    if (!normalizedEmail) { setError('Informe o e-mail do cliente.'); return; }
    onSave(client.id, { fullName: normalizedName, email: normalizedEmail, phone: normalizedPhone, status, notes: notes.trim() });
    setError('');
  }

  return <form className="client-edit-form" onSubmit={submit} noValidate><div className="client-edit-form__heading"><div><span className="management-eyebrow">Editar cadastro</span><h2>Dados do cliente</h2></div><button type="button" className="management-secondary-button" onClick={onCancel}>Cancelar</button></div>{error && <div className="management-form-error" role="alert">{error}</div>}<div className="management-form-grid"><label><span>Nome completo</span><input value={fullName} onChange={(event) => { setFullName(event.target.value); setError(''); }} /></label><label><span>WhatsApp</span><input inputMode="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setError(''); }} /></label><label><span>E-mail</span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} /></label><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as ClientStatus)}>{Object.entries(CLIENT_STATUS_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="management-field--full"><span>Observações</span><textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} /></label></div><div className="management-form-actions"><button className="management-primary-button" type="submit">Salvar alterações</button></div></form>;
}
