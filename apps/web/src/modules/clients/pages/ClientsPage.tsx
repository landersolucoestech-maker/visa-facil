import { useMemo, useState } from 'react';
import { ManagementModal } from '../../management/components/ManagementModal';
import { ClientEditForm } from '../components/ClientEditForm';
import { ClientForm } from '../components/ClientForm';
import { ClientTable } from '../components/ClientTable';
import { CLIENT_STATUS_LABELS, type Client, type ClientStatus } from '../types/client';

type ClientUpdate = Pick<Client, 'fullName' | 'email' | 'phone' | 'status' | 'notes'>;
type ClientsPageProps = {
  clients: Client[];
  onCreateClient: (input: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateClient: (clientId: string, patch: ClientUpdate) => void;
  showForm: boolean;
  onCloseForm: () => void;
};

export function ClientsPage({ clients, onCreateClient, onUpdateClient, showForm, onCloseForm }: ClientsPageProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ClientStatus | 'all'>('all');
  const [viewClient, setViewClient] = useState<Client>();
  const [editClient, setEditClient] = useState<Client>();

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesQuery = !normalized || [client.fullName, client.email, client.phone].some((value) => value.toLowerCase().includes(normalized));
      return matchesQuery && (status === 'all' || client.status === status);
    });
  }, [clients, query, status]);

  const activeCount = clients.filter((client) => client.status === 'active').length;
  const leadCount = clients.filter((client) => client.status === 'lead').length;
  const inactiveCount = clients.filter((client) => client.status === 'inactive').length;

  function createClient(input: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) { onCreateClient(input); onCloseForm(); }
  function saveClient(clientId: string, patch: ClientUpdate) { onUpdateClient(clientId, patch); setEditClient(undefined); }

  return <section className="management-page client-page" aria-labelledby="clients-title">
    <div className="management-page__heading"><div><span className="management-eyebrow">Relacionamento</span><h1 id="clients-title">Clientes</h1><p>Organize leads e clientes atendidos pela Visa Fácil e mantenha a entrada da operação centralizada.</p></div></div>
    <div className="client-summary-grid" aria-label="Resumo de clientes"><article><span>Total na sessão</span><strong>{clients.length}</strong><small>Todos os cadastros temporários</small></article><article><span>Leads</span><strong>{leadCount}</strong><small>Aguardando evolução do atendimento</small></article><article><span>Ativos</span><strong>{activeCount}</strong><small>Clientes em acompanhamento</small></article><article><span>Inativos</span><strong>{inactiveCount}</strong><small>Cadastros sem operação ativa</small></article></div>
    <section className="client-list-card" aria-labelledby="client-list-title"><div className="client-list-card__heading"><div><span className="management-eyebrow">Base de clientes</span><h2 id="client-list-title">Cadastros</h2></div><span>{filteredClients.length} resultado(s)</span></div><div className="client-filter-bar"><label><span>Buscar cliente</span><input placeholder="Nome, e-mail ou WhatsApp" value={query} onChange={(e) => setQuery(e.target.value)} /></label><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as ClientStatus | 'all')}><option value="all">Todos</option>{Object.entries(CLIENT_STATUS_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><small>Dados somente da sessão atual</small></div><ClientTable clients={filteredClients} onView={setViewClient} onEdit={setEditClient} /></section>

    <ManagementModal open={showForm} onClose={onCloseForm} eyebrow="Novo cadastro" title="Novo cliente" subtitle="Cadastre os dados principais do cliente sem sair da página."><ClientForm onCreateClient={createClient} onCancel={onCloseForm} /></ManagementModal>
    <ManagementModal open={Boolean(viewClient)} onClose={() => setViewClient(undefined)} eyebrow="Visualização" title={viewClient?.fullName ?? 'Cliente'} subtitle="Consulta rápida do cadastro." size="md">{viewClient && <div className="management-modal-view"><div className="management-modal-view__grid"><div className="management-modal-view__field"><span>Status</span><strong>{CLIENT_STATUS_LABELS[viewClient.status]}</strong></div><div className="management-modal-view__field"><span>WhatsApp</span><strong>{viewClient.phone}</strong></div><div className="management-modal-view__field"><span>E-mail</span><strong>{viewClient.email}</strong></div><div className="management-modal-view__field"><span>Criado em</span><strong>{new Date(viewClient.createdAt).toLocaleString('pt-BR')}</strong></div><div className="management-modal-view__field management-modal-view__field--full"><span>Observações</span><p>{viewClient.notes || 'Sem observações.'}</p></div></div><div className="management-form-actions"><button className="management-secondary-button" type="button" onClick={() => { setViewClient(undefined); setEditClient(viewClient); }}>Editar cliente</button><a className="management-primary-button" href={`/app/clientes/${encodeURIComponent(viewClient.id)}`}>Abrir detalhes</a></div></div>}</ManagementModal>
    <ManagementModal open={Boolean(editClient)} onClose={() => setEditClient(undefined)} eyebrow="Editar cadastro" title={editClient?.fullName ?? 'Cliente'} subtitle="Atualize os dados do cliente." size="lg">{editClient && <ClientEditForm client={editClient} onSave={saveClient} onCancel={() => setEditClient(undefined)} />}</ManagementModal>
  </section>;
}
