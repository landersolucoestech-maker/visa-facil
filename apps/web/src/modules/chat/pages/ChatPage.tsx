import { useMemo, useState } from 'react';
import type { Client } from '../../clients/types/client';
import type { VisaProcess } from '../../processes/types/process';
import type { ChatConversation, ChatMessage } from '../types/chat';

type ChatPageProps = {
  clients: Client[];
  processes: VisaProcess[];
  conversations: ChatConversation[];
  messages: ChatMessage[];
  onCreateConversation: (clientId: string, processId?: string) => string;
  onSendMessage: (conversationId: string, body: string) => void;
  onToggleFavorite: (conversationId: string) => void;
  onMarkRead: (conversationId: string) => void;
};

type Tab = 'all' | 'unread' | 'favorites';

export function ChatPage({ clients, processes, conversations, messages, onCreateConversation, onSendMessage, onToggleFavorite, onMarkRead }: ChatPageProps) {
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>();
  const [draft, setDraft] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newClientId, setNewClientId] = useState('');
  const [newProcessId, setNewProcessId] = useState('');

  const filtered = useMemo(() => conversations.filter((conversation) => {
    const client = clients.find((item) => item.id === conversation.clientId);
    const matchesTab = tab === 'all' || (tab === 'unread' && conversation.unread) || (tab === 'favorites' && conversation.favorite);
    const normalized = query.trim().toLowerCase();
    const matchesQuery = !normalized || client?.fullName.toLowerCase().includes(normalized) || client?.phone.toLowerCase().includes(normalized);
    return matchesTab && matchesQuery;
  }), [clients, conversations, query, tab]);

  const active = conversations.find((conversation) => conversation.id === activeId);
  const activeClient = clients.find((client) => client.id === active?.clientId);
  const activeProcess = processes.find((process) => process.id === active?.processId);
  const activeMessages = messages.filter((message) => message.conversationId === activeId).sort((a, b) => a.sentAt.localeCompare(b.sentAt));

  function selectConversation(id: string) {
    setActiveId(id);
    onMarkRead(id);
  }

  function createConversation() {
    if (!newClientId) return;
    const id = onCreateConversation(newClientId, newProcessId || undefined);
    setActiveId(id);
    setNewClientId('');
    setNewProcessId('');
    setShowNew(false);
  }

  function sendMessage() {
    const body = draft.trim();
    if (!activeId || !body) return;
    onSendMessage(activeId, body);
    setDraft('');
  }

  return <section className="management-page chat-page" aria-labelledby="chat-title">
    <div className="management-page__heading management-page__heading--row">
      <div><span className="management-eyebrow">Central de relacionamento</span><h1 id="chat-title">VisaChat</h1><p>Atendimento em formato de conversa inspirado no MusicChat, adaptado à operação da Visa Fácil e mantido somente na sessão enquanto o backend não existe.</p></div>
      <button className="management-primary-button" type="button" disabled={clients.length === 0} onClick={() => setShowNew((value) => !value)}>{showNew ? 'Cancelar' : '+ Nova conversa'}</button>
    </div>

    {clients.length === 0 && <div className="chat-prerequisite"><div><span className="management-eyebrow">Pré-requisito</span><h2>Cadastre um cliente para iniciar o chat</h2><p>Cada conversa precisa estar associada a um cliente da operação.</p></div><a className="management-primary-button" href="/app/clientes">Ir para Clientes</a></div>}

    {showNew && clients.length > 0 && <div className="chat-new-conversation"><div><span className="management-eyebrow">Nova conversa</span><h2>Escolha o cliente e, se houver, o processo</h2></div><label><span>Cliente</span><select value={newClientId} onChange={(event) => { setNewClientId(event.target.value); setNewProcessId(''); }}><option value="">Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select></label><label><span>Processo</span><select value={newProcessId} onChange={(event) => setNewProcessId(event.target.value)} disabled={!newClientId}><option value="">Sem processo vinculado</option>{processes.filter((process) => process.clientId === newClientId).map((process) => <option key={process.id} value={process.id}>{process.category}</option>)}</select></label><button className="management-primary-button" type="button" disabled={!newClientId} onClick={createConversation}>Iniciar conversa</button></div>}

    <div className="chat-workspace">
      <aside className="chat-conversations" aria-label="Conversas">
        <div className="chat-search"><span>⌕</span><input aria-label="Buscar conversas" placeholder="Buscar conversas..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="chat-tabs" role="tablist" aria-label="Filtros de conversa"><button className={tab === 'all' ? 'is-active' : ''} onClick={() => setTab('all')} type="button">Todas</button><button className={tab === 'unread' ? 'is-active' : ''} onClick={() => setTab('unread')} type="button">Não lidas</button><button className={tab === 'favorites' ? 'is-active' : ''} onClick={() => setTab('favorites')} type="button">Favoritas</button></div>
        <div className="chat-conversation-list">{filtered.length === 0 ? <div className="chat-empty-list"><span>💬</span><strong>Nenhuma conversa ainda</strong><small>Inicie uma nova conversa para começar.</small></div> : filtered.map((conversation) => { const client = clients.find((item) => item.id === conversation.clientId); const last = messages.filter((message) => message.conversationId === conversation.id).sort((a,b) => b.sentAt.localeCompare(a.sentAt))[0]; return <button type="button" key={conversation.id} className={`chat-conversation ${activeId === conversation.id ? 'is-active' : ''}`} onClick={() => selectConversation(conversation.id)}><span className="chat-avatar">{client?.fullName.slice(0,2).toUpperCase() ?? 'VF'}</span><span className="chat-conversation__body"><strong>{client?.fullName ?? 'Cliente'}</strong><small>{last?.body ?? 'Conversa iniciada'}</small></span><span className="chat-conversation__meta"><small>{new Date(conversation.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>{conversation.unread && <i aria-label="Não lida" />}</span></button>; })}</div>
      </aside>

      <section className="chat-panel" aria-label="Área da conversa">
        {!active || !activeClient ? <div className="chat-panel-empty"><span className="chat-panel-empty__icon">💬</span><h2>Selecione uma conversa</h2><p>Escolha uma conversa existente ou inicie uma nova para atender um cliente.</p><button className="management-primary-button" type="button" disabled={clients.length === 0} onClick={() => setShowNew(true)}>+ Nova conversa</button></div> : <>
          <header className="chat-panel__header"><div className="chat-contact"><span className="chat-avatar chat-avatar--large">{activeClient.fullName.slice(0,2).toUpperCase()}</span><div><strong>{activeClient.fullName}</strong><small>{activeClient.phone} {activeProcess ? `· ${activeProcess.category}` : ''}</small></div></div><div className="chat-header-actions"><span className={`chat-status chat-status--${active.status}`}>{active.status === 'open' ? 'Em atendimento' : active.status === 'waiting' ? 'Aguardando' : 'Encerrada'}</span><button type="button" aria-label="Favoritar conversa" className={active.favorite ? 'is-favorite' : ''} onClick={() => onToggleFavorite(active.id)}>★</button></div></header>
          <div className="chat-messages">{activeMessages.length === 0 && <div className="chat-day-separator"><span>Conversa iniciada</span></div>}{activeMessages.map((message) => <div key={message.id} className={`chat-message chat-message--${message.direction}`}><div><p>{message.body}</p><small>{new Date(message.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small></div></div>)}</div>
          <footer className="chat-composer"><textarea aria-label="Mensagem" placeholder="Digite uma mensagem..." value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} /><button type="button" disabled={!draft.trim()} onClick={sendMessage} aria-label="Enviar mensagem">➤</button><small>Enter envia · Shift + Enter quebra linha</small></footer>
        </>}
      </section>
    </div>
  </section>;
}
