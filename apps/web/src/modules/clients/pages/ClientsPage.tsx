import { useMemo, useState } from 'react';
import { ManagementModal } from '../../management/components/ManagementModal';
import { ClientEditForm } from '../components/ClientEditForm';
import { ClientForm } from '../components/ClientForm';
import { ClientTable } from '../components/ClientTable';
import { CLIENT_STATUS_LABELS, type Client, type ClientStatus } from '../types/client';

type ClientUpdate = Pick<Client, 'fullName' | 'email' | 'phone' | 'status' | 'notes'>;
type CrmTab = 'contacts' | 'clients' | 'leads';
type ClientsPageProps = {
  clients: Client[];
  onCreateClient: (input: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateClient: (clientId: string, patch: ClientUpdate) => void;
  showForm: boolean;
  onCloseForm: () => void;
};

export function ClientsPage({ clients, onCreateClient, onUpdateClient, showForm, onCloseForm }: ClientsPageProps) {
  const [tab, setTab] = useState<CrmTab>('contacts');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ClientStatus | 'all'>('all');
  const [viewClient, setViewClient] = useState<Client>();
  const [editClient, setEditClient] = useState<Client>();

  const activeCount = clients.filter((client) => client.status === 'active').length;
  const leadCount = clients.filter((client) => client.status === 'lead').length;
  const inactiveCount = clients.filter((client) => client.status === 'inactive').length;

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesTab = tab === 'contacts' || (tab === 'clients' && client.status === 'active') || (tab === 'leads' && client.status === 'lead');
      const matchesQuery = !normalized || [client.fullName, client.email, client.phone].some((value) => value.toLowerCase().includes(normalized));
      const matchesStatus = status === 'all' || client.status === status;
      return matchesTab && matchesQuery && matchesStatus;
    });
  }, [clients, query, status, tab]);

  function createClient(input: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) { onCreateClient(input); onCloseForm(); }
  function saveClient(clientId: string, patch: ClientUpdate) { onUpdateClient(clientId, patch); setEditClient(undefined); }
  function selectTab(nextTab: CrmTab) { setTab(nextTab); setStatus(nextTab === 'clients' ? 'active' : nextTab === 'leads' ? 'lead' : 'all'); }

  const sectionTitle = tab === 'contacts' ? 'Contatos' : tab === 'clients' ? 'Clientes' : 'Leads';
  const sectionDescription = tab === 'contacts' ? 'Todos os relacionamentos cadastrados na operação, independentemente da etapa atual.' : tab === 'clients' ? 'Clientes ativos que já estão em acompanhamento pela Visa Fácil.' : 'Contatos em fase inicial que ainda precisam evoluir para atendimento ativo.';

  return <section className="management-page client-page crm-page" aria-labelledby="clients-title">
    <div className="management-page__heading"><div><span className="management-eyebrow">Relacionamento</span><h1 id="clients-title">CRM</h1><p>Centralize contatos, clientes e leads em uma única área de relacionamento.</p></div></div>

    <div className="client-summary-grid crm-summary-grid" aria-label="Resumo do CRM">
      <article><span>Todos os contatos</span><strong>{clients.length}</strong><small>Base completa da sessão</small></article>
      <article><span>Clientes</span><strong>{activeCount}</strong><small>Em acompanhamento ativo</small></article>
      <article><span>Leads</span><strong>{leadCount}</strong><small>Em evolução comercial</small></article>
      <article><span>Inativos</span><strong>{inactiveCount}</strong><small>Sem operação ativa</small></article>
    </div>

    <div className="crm-tabs" role="tablist" aria-label="Navegação do CRM">
      <button type="button" role="tab" aria-selected={tab === 'contacts'} className={tab === 'contacts' ? 'is-active' : ''} onClick={() => selectTab('contacts')}>Contatos</button>
      <button type="button" role="tab" aria-selected={tab === 'clients'} className={tab === 'clients' ? 'is-active' : ''} onClick={() => selectTab('clients')}>Clientes</button>
      <button type="button" role="tab" aria-selected={tab === 'leads'} className={tab === 'leads' ? 'is-active' : ''} onClick={() => selectTab('leads')}>Leads</button>
    </div>

    <section className="client-list-card crm-list-card" aria-labelledby="client-list-title">
      <div className="client-list-card__heading"><div><span className="management-eyebrow">CRM</span><h2 id="client-list-title">{sectionTitle}</h2><p>{sectionDescription}</p></div><span>{filteredClients.length} resultado(s)</span></div>
      <div className="client-filter-bar crm-filter-bar"><label><span>Buscar contato</span><input placeholder="Nome, e-mail ou WhatsApp" value={query} onChange={(e) => setQuery(e.target.value)} /></label><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as ClientStatus | 'all')}><option value="all">Todos os status</option>{Object.entries(CLIENT_STATUS_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><small>Dados somente da sessão atual</small></div>
      <ClientTable clients={filteredClients} onView={setViewClient} onEdit={setEditClient} />
    </section>

    <ManagementModal open={showForm} onClose={onCloseForm} eyebrow="Novo cadastro" title="Novo contato" subtitle="Cadastre o contato e defina se ele entra como lead, cliente ativo ou inativo."><ClientForm onCreateClient={createClient} onCancel={onCloseForm} /></ManagementModal>
    <ManagementModal open={Boolean(viewClient)} onClose={() => setViewClient(undefined)} eyebrow="Visualização" title={viewClient?.fullName ?? 'Contato'} subtitle="Consulta rápida do relacionamento." size="md">{viewClient && <div className="management-modal-view"><div className="management-modal-view__grid"><div className="management-modal-view__field"><span>Status</span><strong>{CLIENT_STATUS_LABELS[viewClient.status]}</strong></div><div className="management-modal-view__field"><span>WhatsApp</span><strong>{viewClient.phone}</strong></div><div className="management-modal-view__field"><span>E-mail</span><strong>{viewClient.email}</strong></div><div className="management-modal-view__field"><span>Criado em</span><strong>{new Date(viewClient.createdAt).toLocaleString('pt-BR')}</strong></div><div className="management-modal-view__field management-modal-view__field--full"><span>Observações</span><p>{viewClient.notes || 'Sem observações.'}</p></div></div><div className="management-form-actions"><button className="management-secondary-button" type="button" onClick={() => { setViewClient(undefined); setEditClient(viewClient); }}>Editar contato</button><a className="management-primary-button" href={`/app/clientes/${encodeURIComponent(viewClient.id)}`}>Abrir detalhes</a></div></div>}</ManagementModal>
    <ManagementModal open={Boolean(editClient)} onClose={() => setEditClient(undefined)} eyebrow="Editar cadastro" title={editClient?.fullName ?? 'Contato'} subtitle="Atualize os dados do relacionamento." size="lg">{editClient && <ClientEditForm client={editClient} onSave={saveClient} onCancel={() => setEditClient(undefined)} />}</ManagementModal>
  </section>;
}
