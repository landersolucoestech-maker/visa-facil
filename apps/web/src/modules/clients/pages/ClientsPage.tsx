import { useMemo, useState } from 'react';
import { ClientForm } from '../components/ClientForm';
import { ClientTable } from '../components/ClientTable';
import type { Client } from '../types/client';

type ClientsPageProps = {
  clients: Client[];
  onCreateClient: (input: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
};

export function ClientsPage({ clients, onCreateClient }: ClientsPageProps) {
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return clients;
    return clients.filter((client) => [client.fullName, client.email, client.phone].some((value) => value.toLowerCase().includes(normalized)));
  }, [clients, query]);

  const activeCount = clients.filter((client) => client.status === 'active').length;
  const leadCount = clients.filter((client) => client.status === 'lead').length;
  const inactiveCount = clients.filter((client) => client.status === 'inactive').length;

  function createClient(input: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
    onCreateClient(input);
    setShowForm(false);
  }

  return (
    <section className="management-page client-page" aria-labelledby="clients-title">
      <div className="management-page__heading management-page__heading--row">
        <div><span className="management-eyebrow">Relacionamento</span><h1 id="clients-title">Clientes</h1><p>Organize leads e clientes atendidos pela Visa Fácil e mantenha a entrada da operação centralizada.</p></div>
        <button className="management-primary-button" type="button" onClick={() => setShowForm((value) => !value)}>{showForm ? 'Fechar cadastro' : 'Novo cliente'}</button>
      </div>

      <div className="client-summary-grid" aria-label="Resumo de clientes">
        <article><span>Total na sessão</span><strong>{clients.length}</strong><small>Todos os cadastros temporários</small></article>
        <article><span>Leads</span><strong>{leadCount}</strong><small>Aguardando evolução do atendimento</small></article>
        <article><span>Ativos</span><strong>{activeCount}</strong><small>Clientes em acompanhamento</small></article>
        <article><span>Inativos</span><strong>{inactiveCount}</strong><small>Cadastros sem operação ativa</small></article>
      </div>

      {showForm && <ClientForm onCreateClient={createClient} onCancel={() => setShowForm(false)} />}

      <section className="client-list-card" aria-labelledby="client-list-title">
        <div className="client-list-card__heading"><div><span className="management-eyebrow">Base de clientes</span><h2 id="client-list-title">Cadastros</h2></div><span>{filteredClients.length} resultado(s)</span></div>
        <div className="management-toolbar"><label className="management-search"><span>Buscar cliente</span><input placeholder="Nome, e-mail ou WhatsApp" value={query} onChange={(e) => setQuery(e.target.value)} /></label><span>Dados somente da sessão atual</span></div>
        <ClientTable clients={filteredClients} />
      </section>
    </section>
  );
}
