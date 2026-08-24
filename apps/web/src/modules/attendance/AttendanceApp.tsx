import { useMemo, useState } from 'react';
import './attendance.css';
import './attendanceSidebarKpis.css';
import { getAttendanceInitialConversations, type AttendanceConversation } from './mocks/attendanceMockProvider';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/crm', icon: '⌂' },
  { label: 'CRM', href: '/crm/relacionamento', icon: '◎' },
  { label: 'Atendimentos', href: '/crm/atendimentos', icon: '◌' },
  { label: 'Tarefas', href: '/crm/tarefas', icon: '✓' },
  { label: 'Agenda', href: '/crm/agenda', icon: '□' },
  { label: 'Financeiro', href: '/crm/financeiro', icon: '$' },
  { label: 'Relatórios', href: '/crm/relatorios', icon: '▥' },
  { label: 'Configurações', href: '/crm/configuracoes', icon: '⚙' },
];

const STATUS_OPTIONS = ['Aguardando atendimento', 'Em atendimento', 'Aguardando cliente', 'Resolvida', 'Arquivada'];

function getBasePath() { const base = import.meta.env.BASE_URL.replace(/\/$/, ''); return base || ''; }
function browserHref(path: string) { return `${getBasePath()}${path}` || path; }
function BrandMark() { return <span className="crm-brand-mark" aria-hidden="true"><i /><b /></span>; }
function FlagCard() { return <div className="crm-flag" aria-hidden="true"><span className="crm-flag__blue">✦ ✦ ✦<br /> ✦ ✦</span><span className="crm-flag__stripes" /></div>; }
function BellIcon() { return <span className="attendance-bell" aria-hidden="true" />; }

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

  return <div className="crm-shell attendance-shell" onClick={() => { if (notificationsOpen) setNotificationsOpen(false); if (userOpen) setUserOpen(false); }}>
    <aside className="crm-sidebar">
      <a className="crm-brand" href={browserHref('/crm')}><BrandMark /><span><strong>VISA FÁCIL</strong><small>CRM · Relacionamento</small></span></a>
      <div className="crm-sidebar-accent"><i /><i /><i /></div><span className="crm-sidebar-label">OPERAÇÃO</span>
      <nav>{NAV_ITEMS.map((item) => <a key={item.href} className={item.href === '/crm/atendimentos' ? 'is-active' : ''} href={browserHref(item.href)}><span>{item.icon}</span>{item.label}</a>)}</nav>
      <div className="crm-sidebar-footer"><FlagCard /><a href={browserHref('/')}>← Voltar ao site</a><small>Protótipo · branch dev</small></div>
    </aside>

    <div className="crm-workspace">
      <header className="crm-topbar">
        <div><small>VISA FÁCIL · CRM</small><h1>Atendimentos</h1><p>Central de conversas e relacionamento com clientes e leads.</p></div>
        <div className="crm-topbar-actions" onClick={(event) => event.stopPropagation()}>
          <button className="crm-topbar-primary" type="button" onClick={() => setNewConversationOpen(true)}>+ Nova conversa</button>
          <div className="attendance-topbar-menu">
            <button className="attendance-notification-button" type="button" aria-label="Alertas" onClick={() => { setNotificationsOpen((value) => !value); setUserOpen(false); }}><BellIcon /></button>
            {notificationsOpen && <div className="attendance-dropdown attendance-notifications"><strong>Notificações</strong><p>Nenhuma notificação no momento.</p></div>}
          </div>
          <div className="attendance-topbar-menu">
            <button className="crm-user" type="button" onClick={() => { setUserOpen((value) => !value); setNotificationsOpen(false); }}><span>VF</span><div><strong>Administrador</strong><small>Protótipo frontend</small></div><span className="crm-user-caret">⌄</span></button>
            {userOpen && <div className="attendance-dropdown attendance-user-dropdown"><button type="button">Perfil</button><a href={browserHref('/crm/configuracoes')}>Configurações</a><button type="button" className="is-danger">Logout</button></div>}
          </div>
        </div>
      </header>

      <main className="attendance-content">
        <section className="attendance-inbox">
          <aside className="attendance-list-panel">
            <div className="attendance-list-header"><div><span>INBOX</span><h2>Conversas</h2></div><button type="button" onClick={() => setNewConversationOpen(true)}>+</button></div>
            <div className="attendance-filters"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar conversa..." /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos</option>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></div>
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
              <header className="attendance-chat-header"><div className="attendance-chat-person"><span className="attendance-avatar attendance-avatar--large">{selected.customer.slice(0, 2).toUpperCase()}</span><div><h2>{selected.customer}</h2><p>{selected.handle} · {selected.channel}</p></div></div><div className="attendance-chat-actions"><select value={selected.status} onChange={(event) => updateSelected({ status: event.target.value })}>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select><button type="button" onClick={() => updateSelected({ status: 'Resolvida' })}>Finalizar</button></div></header>
              <div className="attendance-chat-context"><span>Protocolo <strong>{selected.protocol}</strong></span><span>Fila <strong>{selected.queue}</strong></span><span>Responsável <strong>{selected.assignee}</strong></span></div>
              <div className="attendance-messages">{selected.messages.map((item) => <div key={item.id} className={`attendance-message attendance-message--${item.sender}`}><div><small>{item.author}</small><p>{item.body}</p><time>{item.time}</time></div></div>)}</div>
              <footer className="attendance-composer"><div className="attendance-composer-tools"><button type="button" title="Anexar">＋</button><button type="button" title="Nota interna">Nota interna</button></div><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Digite uma mensagem..." /><button className="attendance-send" type="button" onClick={sendMessage} disabled={!message.trim()}>Enviar</button></footer>
            </>}
          </section>

          <aside className="attendance-details-panel">
            {!selected ? null : <><div className="attendance-details-hero"><span className="attendance-avatar attendance-avatar--large">{selected.customer.slice(0, 2).toUpperCase()}</span><h3>{selected.customer}</h3><p>{selected.crmType} vinculado ao CRM</p></div>
              <section><header><span>CRM</span><a href={browserHref('/crm/relacionamento')}>Abrir cadastro</a></header><dl><div><dt>E-mail</dt><dd>{selected.email}</dd></div><div><dt>Contato</dt><dd>{selected.handle}</dd></div><div><dt>Serviço</dt><dd>{selected.service}</dd></div><div><dt>Destino</dt><dd>{selected.destination}</dd></div><div><dt>Tipo de visto</dt><dd>{selected.visaType}</dd></div></dl></section>
              <section><header><span>Atendimento</span></header><dl><div><dt>Canal</dt><dd>{selected.channel}</dd></div><div><dt>Protocolo</dt><dd>{selected.protocol}</dd></div><div><dt>Fila</dt><dd>{selected.queue}</dd></div><div><dt>Responsável</dt><dd>{selected.assignee}</dd></div></dl></section>
              <section><header><span>Tags</span></header><div className="attendance-tags">{selected.tags.map((tag) => <b key={tag}>{tag}</b>)}</div></section></>}
          </aside>
        </section>
      </main>
    </div>

    {newConversationOpen && <div className="attendance-modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setNewConversationOpen(false); }}><div className="attendance-modal"><header><div><span>NOVA CONVERSA</span><h2>Iniciar atendimento</h2><p>Estrutura visual inspirada no MusicChat, adaptada à Visa Fácil.</p></div><button type="button" onClick={() => setNewConversationOpen(false)}>×</button></header><div className="attendance-modal-body"><label><span>Contato / Lead</span><select><option>Selecione um registro do CRM</option>{conversations.map((item) => <option key={item.id}>{item.customer}</option>)}</select></label><label><span>Canal</span><select><option>WhatsApp</option><option>Instagram</option><option>Facebook</option><option>Website</option><option>E-mail</option></select></label><label><span>Telefone / usuário</span><input placeholder="Contato do canal" /></label><label><span>Mensagem inicial</span><textarea rows={4} placeholder="Digite a mensagem inicial..." /></label></div><footer><button className="crm-btn-secondary" type="button" onClick={() => setNewConversationOpen(false)}>Cancelar</button><button className="crm-btn-primary" type="button" onClick={() => setNewConversationOpen(false)}>Iniciar conversa</button></footer></div></div>}
  </div>;
}
