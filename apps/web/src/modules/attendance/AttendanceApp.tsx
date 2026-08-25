import { useMemo, useState } from 'react';
import './attendance.css';
import './attendanceSidebarKpis.css';
import { getAttendanceInitialConversations, type AttendanceConversation } from './mocks/attendanceMockProvider';

const STATUS_OPTIONS = ['Aguardando atendimento', 'Em atendimento', 'Aguardando cliente', 'Resolvida', 'Arquivada'];

function getBasePath() { const base = import.meta.env.BASE_URL.replace(/\/$/, ''); return base || ''; }
function browserHref(path: string) { return `${getBasePath()}${path}` || path; }

function BellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
}
function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>;
}
function PaperclipIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.6 9.6a2 2 0 1 1-2.8-2.8l8.9-8.9"/></svg>;
}
function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
}

export function AttendanceApp() {
  const [conversations, setConversations] = useState<AttendanceConversation[]>(() => getAttendanceInitialConversations());
  const [selectedId, setSelectedId] = useState<string>(() => getAttendanceInitialConversations()[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [message, setMessage] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);

  const selected = conversations.find((item) => item.id === selectedId) ?? conversations[0];
  const filtered = useMemo(() => conversations.filter((item) => {
    const haystack = `${item.customer} ${item.handle} ${item.email} ${item.protocol} ${item.channel}`.toLowerCase();
    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || item.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [conversations, query, statusFilter]);

  const waitingCount = conversations.filter((item) => item.status === 'Aguardando atendimento').length;
  const activeCount = conversations.filter((item) => item.status === 'Em atendimento').length;
  const unreadCount = conversations.reduce((sum, item) => sum + item.unread, 0);

  const updateSelected = (patch: Partial<AttendanceConversation>) => {
    if (!selected) return;
    setConversations((current) => current.map((item) => item.id === selected.id ? { ...item, ...patch } : item));
  };

  const sendMessage = () => {
    if (!selected || !message.trim()) return;
    const body = message.trim();
    const nextMessage = { id: crypto.randomUUID(), sender: 'agent' as const, author: 'Administrador', body, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
    setConversations((current) => current.map((item) => item.id === selected.id ? { ...item, messages: [...item.messages, nextMessage], lastMessage: body, lastMessageAt: nextMessage.time, status: item.status === 'Aguardando atendimento' ? 'Em atendimento' : item.status } : item));
    setMessage('');
  };

  const selectConversation = (conversation: AttendanceConversation) => {
    setSelectedId(conversation.id);
    setConversations((current) => current.map((item) => item.id === conversation.id ? { ...item, unread: 0 } : item));
  };

  return <div className="attendance-shell" onClick={() => { if (notificationsOpen) setNotificationsOpen(false); if (userOpen) setUserOpen(false); }}>
    <div className="crm-workspace attendance-workspace">
      <header className="crm-topbar attendance-topbar">
        <div><small>VISA FÁCIL · CRM</small><h1>VisaChat</h1><p>Central de conversas com clientes e leads.</p></div>
        <div className="crm-topbar-actions attendance-topbar-actions" onClick={(event) => event.stopPropagation()}>
          <button className="crm-topbar-primary attendance-new-conversation" type="button" onClick={() => setNewConversationOpen(true)}><PlusIcon/><span>Nova conversa</span></button>
          <div className="attendance-topbar-menu">
            <button className="attendance-notification-button" type="button" aria-label="Notificações" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setUserOpen(false); }}><BellIcon />{unreadCount > 0 && <span className="attendance-notification-dot" aria-label={`${unreadCount} mensagens não lidas`}>{unreadCount}</span>}</button>
            {notificationsOpen && <div className="attendance-dropdown attendance-notifications"><strong>Notificações</strong><p>{unreadCount > 0 ? `${unreadCount} mensagem${unreadCount === 1 ? '' : 's'} não lida${unreadCount === 1 ? '' : 's'} no VisaChat.` : 'Nenhuma notificação no momento.'}</p></div>}
          </div>
          <div className="attendance-topbar-menu">
            <button className="crm-user" type="button" aria-expanded={userOpen} onClick={() => { setUserOpen((value) => !value); setNotificationsOpen(false); }}><span>VF</span><div><strong>Administrador</strong><small>Conta interna</small></div><span className="crm-user-caret" aria-hidden="true">⌄</span></button>
            {userOpen && <div className="attendance-dropdown attendance-user-dropdown"><button type="button">Perfil</button><a href={browserHref('/crm/configuracoes')}>Configurações</a><button type="button" className="is-danger">Logout</button></div>}
          </div>
        </div>
      </header>

      <main className="attendance-content">
        <section className="attendance-inbox">
          <aside className="attendance-list-panel">
            <div className="attendance-list-header"><div><span>INBOX</span><h2>Conversas</h2></div><button type="button" aria-label="Nova conversa" onClick={() => setNewConversationOpen(true)}><PlusIcon/></button></div>
            <div className="attendance-filters"><label><SearchIcon/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar conversa" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar conversas por status"><option>Todos</option>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></div>
            <div className="attendance-sidebar-stats">
              <article><span>Conversas</span><strong>{conversations.length}</strong></article>
              <article><span>Aguardando</span><strong>{waitingCount}</strong></article>
              <article><span>Em atendimento</span><strong>{activeCount}</strong></article>
              <article><span>Não lidas</span><strong>{unreadCount}</strong></article>
            </div>
            <div className="attendance-conversation-list">{filtered.length === 0 ? <p className="attendance-empty">Nenhuma conversa encontrada.</p> : filtered.map((conversation) => <button key={conversation.id} type="button" className={conversation.id === selected?.id ? 'is-active' : ''} onClick={() => selectConversation(conversation)}>
              <span className="attendance-avatar">{conversation.customer.slice(0, 2).toUpperCase()}</span>
              <span className="attendance-conversation-copy"><span className="attendance-conversation-line"><strong>{conversation.customer}</strong><small>{conversation.lastMessageAt}</small></span><span className="attendance-meta"><b>{conversation.channel}</b><em>{conversation.status}</em></span><span className="attendance-preview">{conversation.lastMessage}</span></span>
              {conversation.unread > 0 && <span className="attendance-unread">{conversation.unread}</span>}
            </button>)}</div>
          </aside>

          <section className="attendance-chat-panel">
            {!selected ? <div className="attendance-no-selection"><strong>Nenhuma conversa selecionada</strong><p>Selecione uma conversa para visualizar o atendimento.</p></div> : <>
              <header className="attendance-chat-header"><div className="attendance-chat-person"><span className="attendance-avatar attendance-avatar--large">{selected.customer.slice(0, 2).toUpperCase()}</span><div><h2>{selected.customer}</h2><p>{selected.handle} <span>·</span> {selected.channel}</p></div></div><div className="attendance-chat-actions"><select value={selected.status} onChange={(event) => updateSelected({ status: event.target.value })} aria-label="Status da conversa">{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select><button type="button" onClick={() => updateSelected({ status: 'Resolvida' })}>Finalizar</button></div></header>
              <div className="attendance-chat-context"><span>Protocolo <strong>{selected.protocol}</strong></span><span>Fila <strong>{selected.queue}</strong></span><span>Responsável <strong>{selected.assignee}</strong></span></div>
              <div className="attendance-messages">{selected.messages.map((item) => <div key={item.id} className={`attendance-message attendance-message--${item.sender}`}><div><small>{item.author}</small><p>{item.body}</p><time>{item.time}</time></div></div>)}</div>
              <footer className="attendance-composer"><div className="attendance-composer-tools"><button type="button" title="Anexar arquivo" aria-label="Anexar arquivo"><PaperclipIcon/></button><button type="button" title="Nota interna">Nota interna</button></div><div className="attendance-composer-field"><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Digite uma mensagem..." /><small>Enter para enviar · Shift + Enter para quebrar linha</small></div><button className="attendance-send" type="button" onClick={sendMessage} disabled={!message.trim()}>Enviar</button></footer>
            </>}
          </section>

          <aside className="attendance-details-panel">
            {!selected ? null : <><div className="attendance-details-hero"><div className="attendance-details-person"><span className="attendance-avatar attendance-avatar--large">{selected.customer.slice(0, 2).toUpperCase()}</span><div><h3>{selected.customer}</h3><p>{selected.crmType} vinculado ao CRM</p></div></div><a href={browserHref('/crm/relacionamento')}>Abrir cadastro</a></div>
              <section><header><span>Contato</span></header><dl><div><dt>E-mail</dt><dd>{selected.email}</dd></div><div><dt>Telefone</dt><dd>{selected.handle}</dd></div><div><dt>Serviço</dt><dd>{selected.service}</dd></div><div><dt>Destino</dt><dd>{selected.destination}</dd></div><div><dt>Tipo de visto</dt><dd>{selected.visaType}</dd></div></dl></section>
              <section><header><span>Conversa</span></header><dl><div><dt>Canal</dt><dd>{selected.channel}</dd></div><div><dt>Protocolo</dt><dd>{selected.protocol}</dd></div><div><dt>Fila</dt><dd>{selected.queue}</dd></div><div><dt>Responsável</dt><dd>{selected.assignee}</dd></div></dl></section>
              <section><header><span>Tags</span></header><div className="attendance-tags">{selected.tags.map((tag) => <b key={tag}>{tag}</b>)}</div></section></>}
          </aside>
        </section>
      </main>
    </div>

    {newConversationOpen && <div className="attendance-modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setNewConversationOpen(false); }}><div className="attendance-modal"><header><div><span>NOVA CONVERSA</span><h2>Iniciar conversa</h2><p>Selecione o contato e o canal para iniciar um novo atendimento.</p></div><button type="button" onClick={() => setNewConversationOpen(false)}>×</button></header><div className="attendance-modal-body"><label><span>Contato / Lead</span><select><option>Selecione um registro do CRM</option>{conversations.map((item) => <option key={item.id}>{item.customer}</option>)}</select></label><label><span>Canal</span><select><option>WhatsApp</option><option>Instagram</option><option>Facebook</option><option>Website</option><option>E-mail</option></select></label><label><span>Telefone / usuário</span><input placeholder="Contato do canal" /></label><label><span>Mensagem inicial</span><textarea rows={4} placeholder="Digite a mensagem inicial..." /></label></div><footer><button className="crm-btn-secondary" type="button" onClick={() => setNewConversationOpen(false)}>Cancelar</button><button className="crm-btn-primary" type="button" onClick={() => setNewConversationOpen(false)}>Iniciar conversa</button></footer></div></div>}
  </div>;
}
