import { useState } from 'react';
import { ClientEditForm } from '../components/ClientEditForm';
import { CLIENT_STATUS_LABELS, type Client, type ClientStatus } from '../types/client';
import { DESTINATION_LABELS, PROCESS_STAGE_LABELS, type VisaProcess } from '../../processes/types/process';
import type { ServiceInteraction } from '../../interactions/types/interaction';
import type { ManagementTask } from '../../tasks/types/task';
import type { ChatConversation } from '../../chat/types/chat';
import type { FinancialEntry } from '../../finance/types/finance';

type ClientPatch = Pick<Client, 'fullName' | 'email' | 'phone' | 'status' | 'notes'>;
type ClientDetailPageProps = {
  client?: Client;
  processes: VisaProcess[];
  interactions: ServiceInteraction[];
  tasks: ManagementTask[];
  conversations: ChatConversation[];
  financialEntries: FinancialEntry[];
  onUpdateStatus: (clientId: string, status: ClientStatus) => void;
  onUpdateClient: (clientId: string, patch: ClientPatch) => void;
};

function money(valueCents: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueCents / 100); }

export function ClientDetailPage({ client, processes, interactions, tasks, conversations, financialEntries, onUpdateStatus, onUpdateClient }: ClientDetailPageProps) {
  const [editing, setEditing] = useState(false);
  if (!client) return <section className="management-page client-detail-page"><div className="management-empty-state"><strong>Cliente não encontrado nesta sessão.</strong><span>Os dados temporários são perdidos ao recarregar a página.</span><a className="management-primary-button" href="/app/clientes">Voltar para Clientes</a></div></section>;

  const clientProcesses = processes.filter((process) => process.clientId === client.id);
  const clientInteractions = interactions.filter((interaction) => interaction.clientId === client.id);
  const clientTasks = tasks.filter((task) => task.clientId === client.id);
  const clientConversations = conversations.filter((conversation) => conversation.clientId === client.id);
  const clientFinancial = financialEntries.filter((entry) => entry.clientId === client.id);
  const openTasks = clientTasks.filter((task) => task.status === 'open').length;
  const openProcesses = clientProcesses.filter((process) => !['completed', 'cancelled'].includes(process.stage)).length;
  const realizedIncome = clientFinancial.filter((entry) => entry.type === 'income' && entry.status === 'paid').reduce((sum, entry) => sum + entry.amountCents, 0);
  const latestInteraction = clientInteractions[0];
  function saveClient(clientId: string, patch: ClientPatch) { onUpdateClient(clientId, patch); setEditing(false); }

  return <section className="management-page client-detail-page" aria-labelledby="client-detail-title">
    <div className="client-detail-hero"><div className="client-detail-identity"><span className="client-detail-avatar">{client.fullName.slice(0, 2).toUpperCase()}</span><div><span className="management-eyebrow">Cliente</span><h1 id="client-detail-title">{client.fullName}</h1><p>{client.email} · {client.phone}</p></div></div><div className="client-detail-actions"><label className="client-status-control"><span>Status</span><select aria-label="Status do cliente" value={client.status} onChange={(event) => onUpdateStatus(client.id, event.target.value as ClientStatus)}>{Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button className="management-secondary-button" type="button" onClick={() => setEditing((value) => !value)}>{editing ? 'Fechar edição' : 'Editar cliente'}</button><a className="management-primary-button" href="/app/chat">Abrir VisaChat</a></div></div>

    {editing && <ClientEditForm client={client} onSave={saveClient} onCancel={() => setEditing(false)} />}

    <nav className="client-quick-actions" aria-label="Ações rápidas do cliente"><a href="/app/processos"><span>PR</span><strong>Novo processo</strong><small>Abrir solicitação vinculada</small></a><a href="/app/chat"><span>CH</span><strong>VisaChat</strong><small>Iniciar ou continuar conversa</small></a><a href="/app/atendimentos"><span>AT</span><strong>Atendimento</strong><small>Registrar marco relevante</small></a><a href="/app/tarefas"><span>TA</span><strong>Tarefa</strong><small>Criar próximo passo</small></a><a href="/app/financeiro"><span>FI</span><strong>Financeiro</strong><small>Registrar movimentação</small></a></nav>
    <div className="client-detail-kpis"><article><span>Processos ativos</span><strong>{openProcesses}</strong><small>{clientProcesses.length} no total</small></article><article><span>Tarefas abertas</span><strong>{openTasks}</strong><small>{clientTasks.length} vinculada(s)</small></article><article><span>Conversas</span><strong>{clientConversations.length}</strong><small>VisaChat nesta sessão</small></article><article><span>Receita realizada</span><strong>{money(realizedIncome)}</strong><small>Lançamentos pagos vinculados</small></article></div>
    <div className="client-detail-grid">
      <section className="client-detail-card client-detail-card--processes"><div className="client-detail-card__heading"><div><span className="management-eyebrow">Jornada</span><h2>Processos do cliente</h2></div><a href="/app/processos">Novo processo →</a></div>{clientProcesses.length ? <div className="client-detail-process-list">{clientProcesses.map((process) => <a key={process.id} href={`/app/processos/${encodeURIComponent(process.id)}`}><div><strong>{process.category}</strong><small>{DESTINATION_LABELS[process.destination]}</small></div><span>{PROCESS_STAGE_LABELS[process.stage]}</span></a>)}</div> : <div className="client-detail-empty">Nenhum processo vinculado ainda.</div>}</section>
      <aside className="client-detail-card"><span className="management-eyebrow">Contato</span><h2>Dados principais</h2><dl className="client-detail-data"><div><dt>E-mail</dt><dd>{client.email}</dd></div><div><dt>Telefone</dt><dd>{client.phone}</dd></div><div><dt>Status</dt><dd>{CLIENT_STATUS_LABELS[client.status]}</dd></div><div><dt>Atualizado em</dt><dd>{new Date(client.updatedAt).toLocaleString('pt-BR')}</dd></div></dl></aside>
      <section className="client-detail-card"><div className="client-detail-card__heading"><div><span className="management-eyebrow">Relacionamento</span><h2>Último atendimento</h2></div><a href="/app/atendimentos">Histórico →</a></div>{latestInteraction ? <div className="client-detail-latest"><strong>{latestInteraction.subject}</strong><small>{new Date(latestInteraction.occurredAt).toLocaleString('pt-BR')}</small><p>{latestInteraction.notes}</p></div> : <div className="client-detail-empty">Nenhum atendimento manual registrado.</div>}</section>
      <aside className="client-detail-card client-detail-card--notes"><span className="management-eyebrow">Observações</span><h2>Contexto do cliente</h2><p>{client.notes || 'Nenhuma observação registrada neste cadastro.'}</p></aside>
    </div>
  </section>;
}
