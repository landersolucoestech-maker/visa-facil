import { FormEvent, useMemo, useState } from 'react';
import { CLIENT_STATUS_LABELS, type Client, type ClientStatus } from '../domain';

const emptyForm = { fullName: '', email: '', phone: '', status: 'lead' as ClientStatus, notes: '' };

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return clients;
    return clients.filter((client) => [client.fullName, client.email, client.phone].some((value) => value.toLowerCase().includes(normalized)));
  }, [clients, query]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const now = new Date().toISOString();
    const client: Client = {
      id: `session-client-${clients.length + 1}`,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,
      notes: form.notes.trim(),
      createdAt: now,
      updatedAt: now,
    };
    setClients((current) => [client, ...current]);
    setForm(emptyForm);
    setShowForm(false);
  }

  return (
    <section className="management-page" aria-labelledby="clients-title">
      <div className="management-page__heading management-page__heading--row">
        <div><span className="management-eyebrow">Relacionamento</span><h1 id="clients-title">Clientes</h1><p>Cadastro central de leads e clientes atendidos pela Visa Fácil.</p></div>
        <button className="management-primary-button" type="button" onClick={() => setShowForm((value) => !value)}>{showForm ? 'Fechar cadastro' : 'Novo cliente'}</button>
      </div>
      <div className="management-session-note">Modo de fundação: registros criados nesta tela existem somente durante a sessão atual e não são enviados a servidor.</div>
      {showForm && <form className="management-form-card" onSubmit={submit}>
        <div className="management-form-grid">
          <label><span>Nome completo</span><input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
          <label><span>WhatsApp</span><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label><span>E-mail</span><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><span>Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}><option value="lead">Lead</option><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
          <label className="management-field--full"><span>Observações</span><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
        <div className="management-form-actions"><button type="button" className="management-secondary-button" onClick={() => setShowForm(false)}>Cancelar</button><button className="management-primary-button" type="submit">Adicionar à sessão</button></div>
      </form>}
      <div className="management-toolbar"><label className="management-search"><span>Buscar</span><input placeholder="Nome, e-mail ou WhatsApp" value={query} onChange={(e) => setQuery(e.target.value)} /></label><span>{filteredClients.length} registro(s)</span></div>
      {filteredClients.length === 0 ? <div className="management-empty-state"><strong>Nenhum cliente na sessão.</strong><span>Cadastre um cliente para validar o fluxo de interface antes da conexão com backend.</span></div> : <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Cliente</th><th>Contato</th><th>Status</th><th>Criado em</th></tr></thead><tbody>{filteredClients.map((client) => <tr key={client.id}><td><strong>{client.fullName}</strong>{client.notes && <small>{client.notes}</small>}</td><td><span>{client.phone}</span><small>{client.email}</small></td><td><span className={`management-badge management-badge--${client.status}`}>{CLIENT_STATUS_LABELS[client.status]}</span></td><td>{new Date(client.createdAt).toLocaleDateString('pt-BR')}</td></tr>)}</tbody></table></div>}
    </section>
  );
}
