import { useEffect, useMemo, useState } from 'react';
import './attendance.css';
import './attendanceSidebarKpis.css';
import './attendanceTeamChat.css';
import { getAttendanceConversationKind, type AttendanceConversation, type AttendanceMessage } from './mocks/attendanceMockProvider';
import { getAttendanceSessionConversations, saveAttendanceSessionConversations } from '../../shared/operationalSessionStore';

const STATUS_OPTIONS = ['Aguardando atendimento', 'Em atendimento', 'Aguardando cliente', 'Resolvida', 'Arquivada'];
const TEAM_STATUS_OPTIONS = ['Ativo', 'Arquivada'];
type ChatMode = 'customer' | 'team';
type NewConversationDraft = { customer: string; handle: string; channel: string; message: string };
const EMPTY_NEW_CONVERSATION: NewConversationDraft = { customer: '', handle: '', channel: 'WhatsApp', message: '' };
const EMPTY_TEAM_CONVERSATION: NewConversationDraft = { customer: '', handle: '', channel: 'Equipe', message: '' };

function getBasePath() { const base = import.meta.env.BASE_URL.replace(/\/$/, ''); return base || ''; }
function browserHref(path: string) { return `${getBasePath()}${path}` || path; }
function BellIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>; }
function PaperclipIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.6 9.6a2 2 0 1 1-2.8-2.8l8.9-8.9"/></svg>; }
function PlusIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>; }
function timeNow() { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }

export function AttendanceApp() {
  const [conversations, setConversations] = useState<AttendanceConversation[]>(() => getAttendanceSessionConversations());
  const [mode, setMode] = useState<ChatMode>('customer');
  const [selectedId, setSelectedId] = useState<string>(() => conversations.find((item) => getAttendanceConversationKind(item) === 'customer')?.id ?? '');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [message, setMessage] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [newConversationKind, setNewConversationKind] = useState<ChatMode>('customer');
  const [newConversation, setNewConversation] = useState<NewConversationDraft>(EMPTY_NEW_CONVERSATION);
  const [newConversationError, setNewConversationError] = useState('');
  useEffect(() => { saveAttendanceSessionConversations(conversations); }, [conversations]);

  const customerConversations = useMemo(() => conversations.filter((item) => getAttendanceConversationKind(item) === 'customer'), [conversations]);
  const teamConversations = useMemo(() => conversations.filter((item) => getAttendanceConversationKind(item) === 'team'), [conversations]);
  const modeConversations = mode === 'team' ? teamConversations : customerConversations;
  const selected = modeConversations.find((item) => item.id === selectedId) ?? modeConversations[0];
  const selectedKind = selected ? getAttendanceConversationKind(selected) : mode;
  const filtered = useMemo(() => modeConversations.filter((item) => {
    const haystack = `${item.customer} ${item.handle} ${item.email} ${item.protocol} ${item.channel} ${item.tags.join(' ')}`.toLowerCase();
    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    const matchesStatus = mode === 'team' || statusFilter === 'Todos' || item.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [modeConversations, mode, query, statusFilter]);
  const waitingCount = customerConversations.filter((item) => item.status === 'Aguardando atendimento').length;
  const activeCount = customerConversations.filter((item) => item.status === 'Em atendimento').length;
  const teamActiveCount = teamConversations.filter((item) => item.status === 'Ativo').length;
  const teamArchivedCount = teamConversations.filter((item) => item.status === 'Arquivada').length;
  const teamUnreadCount = teamConversations.reduce((sum, item) => sum + item.unread, 0);
  const unreadCount = conversations.reduce((sum, item) => sum + item.unread, 0);

  const updateSelected = (patch: Partial<AttendanceConversation>) => {
    if (!selected) return;
    setConversations((current) => current.map((item) => item.id === selected.id ? { ...item, ...patch } : item));
  };
  const sendMessage = () => {
    if (!selected || !message.trim()) return;
    const body = message.trim();
    const nextMessage: AttendanceMessage = { id: crypto.randomUUID(), sender: 'agent', author: 'Administrador', body, time: timeNow() };
    setConversations((current) => current.map((item) => item.id === selected.id ? {
      ...item,
      messages: [...item.messages, nextMessage],
      lastMessage: body,
      lastMessageAt: nextMessage.time,
      status: getAttendanceConversationKind(item) === 'customer' && item.status === 'Aguardando atendimento' ? 'Em atendimento' : item.status,
    } : item));
    setMessage('');
  };
  const selectConversation = (conversation: AttendanceConversation) => {
    setSelectedId(conversation.id);
    setConversations((current) => current.map((item) => item.id === conversation.id ? { ...item, unread: 0 } : item));
  };
  const changeMode = (nextMode: ChatMode) => {
    setMode(nextMode);
    setQuery('');
    setStatusFilter('Todos');
    setMessage('');
    const first = conversations.find((item) => getAttendanceConversationKind(item) === nextMode);
    if (first) selectConversation(first); else setSelectedId('');
  };
  const openNewConversation = () => {
    setNewConversationKind(mode);
    setNewConversation(mode === 'team' ? { ...EMPTY_TEAM_CONVERSATION } : { ...EMPTY_NEW_CONVERSATION });
    setNewConversationError('');
    setNewConversationOpen(true);
  };
  const createConversation = () => {
    const customer = newConversation.customer.trim();
    const handle = newConversation.handle.trim();
    const now = timeNow();
    const initialBody = newConversation.message.trim();
    if (newConversationKind === 'team') {
      if (!customer) { setNewConversationError('Informe o nome do chat interno.'); return; }
      const id = crypto.randomUUID();
      const initialMessage: AttendanceMessage[] = initialBody ? [{ id: crypto.randomUUID(), sender: 'agent', author: 'Administrador', body: initialBody, time: now }] : [];
      const record: AttendanceConversation = {
        id,
        kind: 'team',
        customer,
        handle: handle || 'Equipe Visa Fácil',
        email: '',
        channel: 'Equipe',
        status: 'Ativo',
        assignee: 'Administrador',
        queue: 'Equipe',
        protocol: `INT-${Date.now().toString(36).toUpperCase()}`,
        tags: ['Interno'],
        lastMessage: initialBody || 'Chat interno criado',
        lastMessageAt: now,
        unread: 0,
        crmType: 'Equipe',
        service: '',
        destination: '',
        visaType: '',
        messages: initialMessage,
      };
      setConversations((current) => [record, ...current]);
      setMode('team');
      setSelectedId(id);
      setNewConversationOpen(false);
      setNewConversation(EMPTY_TEAM_CONVERSATION);
      setNewConversationError('');
      return;
    }
    if (!customer || !handle) { setNewConversationError('Informe o nome e o telefone/usuário do contato.'); return; }
    const initialMessage: AttendanceMessage[] = initialBody ? [{ id: crypto.randomUUID(), sender: 'agent', author: 'Administrador', body: initialBody, time: now }] : [];
    const id = crypto.randomUUID();
    const record: AttendanceConversation = {
      id,
      kind: 'customer',
      customer,
      handle,
      email: '',
      channel: newConversation.channel,
      status: 'Em atendimento',
      assignee: 'Administrador',
      queue: 'Atendimento',
      protocol: `VF-${Date.now().toString(36).toUpperCase()}`,
      tags: [],
      lastMessage: initialBody || 'Conversa iniciada',
      lastMessageAt: now,
      unread: 0,
      crmType: 'Contato',
      service: '',
      destination: '',
      visaType: '',
      messages: initialMessage,
    };
    setConversations((current) => [record, ...current]);
    setSelectedId(id);
    setNewConversationOpen(false);
    setNewConversation(EMPTY_NEW_CONVERSATION);
    setNewConversationError('');
  };

  const creatingTeamChat = newConversationKind === 'team';

  return <div className="attendance-shell" onClick={() => setNotificationsOpen(false)}>
    <div className="crm-workspace attendance-workspace">
      <header className="crm-topbar attendance-topbar">
        <div><small>VISA FÁCIL · CRM</small><h1>VisaChat</h1><p>Central de conversas com clientes, leads e equipe.</p></div>
        <div className="crm-topbar-actions attendance-topbar-actions" onClick={(event) => event.stopPropagation()}>
          <button className="crm-topbar-primary attendance-new-conversation" type="button" onClick={openNewConversation}><PlusIcon/><span>{mode === 'team' ? 'Novo chat interno' : 'Nova conversa'}</span></button>
          <div className="attendance-topbar-menu"><button className="attendance-notification-button" type="button" aria-label="Notificações" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)}><BellIcon />{unreadCount > 0 && <span className="attendance-notification-dot" aria-label={`${unreadCount} mensagens não lidas`}>{unreadCount}</span>}</button>{notificationsOpen && <div className="attendance-dropdown attendance-notifications"><strong>Notificações</strong><p>{unreadCount > 0 ? `${unreadCount} mensagem${unreadCount === 1 ? '' : 's'} não lida${unreadCount === 1 ? '' : 's'} no VisaChat.` : 'Nenhuma notificação no momento.'}</p></div>}</div>
        </div>
      </header>

      <main className="attendance-content"><section className="attendance-inbox">
        <aside className="attendance-list-panel"><div className="attendance-list-header"><div><span>{mode === 'team' ? 'EQUIPE' : 'INBOX'}</span><h2>{mode === 'team' ? 'Chat interno' : 'Conversas'}</h2></div><button type="button" aria-label={mode === 'team' ? 'Novo chat interno' : 'Nova conversa'} onClick={openNewConversation}><PlusIcon/></button></div>
          <div className="attendance-mode-tabs" role="tablist" aria-label="Tipo de conversa"><button type="button" role="tab" aria-selected={mode === 'customer'} className={mode === 'customer' ? 'is-active' : ''} onClick={() => changeMode('customer')}>Atendimento <small>{customerConversations.length}</small></button><button type="button" role="tab" aria-selected={mode === 'team'} className={mode === 'team' ? 'is-active' : ''} onClick={() => changeMode('team')}>Equipe <small>{teamConversations.length}</small></button></div>
          <div className={`attendance-filters ${mode === 'team' ? 'is-team' : ''}`}><label><SearchIcon/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === 'team' ? 'Buscar chat interno' : 'Buscar conversa'} /></label>{mode === 'customer' && <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar conversas por status"><option>Todos</option>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select>}</div>
          <div className="attendance-sidebar-stats">{mode === 'customer' ? <><article><span>Conversas</span><strong>{customerConversations.length}</strong></article><article><span>Aguardando</span><strong>{waitingCount}</strong></article><article><span>Em atendimento</span><strong>{activeCount}</strong></article><article><span>Não lidas</span><strong>{customerConversations.reduce((sum, item) => sum + item.unread, 0)}</strong></article></> : <><article><span>Chats internos</span><strong>{teamConversations.length}</strong></article><article><span>Ativos</span><strong>{teamActiveCount}</strong></article><article><span>Arquivados</span><strong>{teamArchivedCount}</strong></article><article><span>Não lidas</span><strong>{teamUnreadCount}</strong></article></>}</div>
          <div className="attendance-conversation-list">{filtered.length === 0 ? <p className="attendance-empty">{mode === 'team' ? 'Nenhum chat interno encontrado.' : 'Nenhuma conversa encontrada.'}</p> : filtered.map((conversation) => { const kind = getAttendanceConversationKind(conversation); return <button key={conversation.id} type="button" className={`${conversation.id === selected?.id ? 'is-active' : ''} ${kind === 'team' ? 'is-team' : ''}`.trim()} onClick={() => selectConversation(conversation)}><span className="attendance-avatar">{conversation.customer.slice(0, 2).toUpperCase()}</span><span className="attendance-conversation-copy"><span className="attendance-conversation-line"><strong>{conversation.customer}</strong><small>{conversation.lastMessageAt}</small></span><span className="attendance-meta"><b>{kind === 'team' ? 'Interno' : conversation.channel}</b><em>{conversation.status}</em></span><span className="attendance-preview">{conversation.lastMessage}</span></span>{conversation.unread > 0 && <span className="attendance-unread">{conversation.unread}</span>}</button>; })}</div>
        </aside>

        <section className="attendance-chat-panel">{!selected ? <div className="attendance-no-selection"><strong>{mode === 'team' ? 'Nenhum chat interno selecionado' : 'Nenhuma conversa selecionada'}</strong><p>{mode === 'team' ? 'Selecione um chat da equipe ou crie uma nova conversa interna.' : 'Selecione uma conversa ou inicie um novo atendimento.'}</p></div> : <>
          <header className="attendance-chat-header"><div className={`attendance-chat-person ${selectedKind === 'team' ? 'is-team' : ''}`}><span className="attendance-avatar attendance-avatar--large">{selected.customer.slice(0, 2).toUpperCase()}</span><div><h2>{selected.customer}</h2><p>{selected.handle || 'Equipe Visa Fácil'} <span>·</span> {selectedKind === 'team' ? 'Chat interno' : selected.channel}</p></div></div><div className="attendance-chat-actions">{selectedKind === 'team' ? <><select value={selected.status} onChange={(event) => updateSelected({ status: event.target.value })} aria-label="Status do chat interno">{TEAM_STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select><button type="button" onClick={() => updateSelected({ status: selected.status === 'Arquivada' ? 'Ativo' : 'Arquivada' })}>{selected.status === 'Arquivada' ? 'Reabrir' : 'Arquivar'}</button></> : <><select value={selected.status} onChange={(event) => updateSelected({ status: event.target.value })} aria-label="Status da conversa">{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select><button type="button" onClick={() => updateSelected({ status: 'Resolvida' })}>Finalizar</button></>}</div></header>
          <div className="attendance-chat-context">{selectedKind === 'team' ? <><span>Ambiente <strong>Equipe</strong></span><span>Participantes <strong>{selected.handle || 'Equipe Visa Fácil'}</strong></span><span>Criado por <strong>{selected.assignee}</strong></span></> : <><span>Protocolo <strong>{selected.protocol}</strong></span><span>Fila <strong>{selected.queue}</strong></span><span>Responsável <strong>{selected.assignee}</strong></span></>}</div>
          <div className="attendance-messages">{selected.messages.length ? selected.messages.map((item) => <div key={item.id} className={`attendance-message attendance-message--${item.sender}`}><div><small>{item.author}</small><p>{item.body}</p><time>{item.time}</time></div></div>) : <p className="attendance-empty">{selectedKind === 'team' ? 'Chat interno criado. Envie a primeira mensagem para a equipe.' : 'Conversa iniciada. Envie a primeira mensagem.'}</p>}</div>
          <footer className="attendance-composer"><div className="attendance-composer-tools"><button type="button" disabled title="Anexos indisponíveis sem armazenamento de arquivos" aria-label="Anexos indisponíveis"><PaperclipIcon/></button>{selectedKind === 'team' ? <span className="attendance-internal-composer-label">Mensagem interna</span> : <button type="button" disabled title="Notas internas exigem persistência compartilhada">Nota interna</button>}</div><div className="attendance-composer-field"><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder={selectedKind === 'team' ? 'Escreva uma mensagem para a equipe...' : 'Digite uma mensagem...'} /><small>Enter para enviar · Shift + Enter para quebrar linha</small></div><button className="attendance-send" type="button" onClick={sendMessage} disabled={!message.trim()}>Enviar</button></footer>
        </>}</section>

        <aside className="attendance-details-panel">{!selected ? null : selectedKind === 'team' ? <><div className="attendance-details-hero attendance-details-hero--team"><div className="attendance-details-person is-team"><span className="attendance-avatar attendance-avatar--large">{selected.customer.slice(0, 2).toUpperCase()}</span><div><h3>{selected.customer}</h3><p>Comunicação interna da equipe</p></div></div></div><section><header><span>Equipe</span></header><dl><div><dt>Participantes</dt><dd>{selected.handle || 'Equipe Visa Fácil'}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div><div><dt>Ambiente</dt><dd>VisaChat interno</dd></div><div><dt>Criado por</dt><dd>{selected.assignee}</dd></div></dl></section><section><header><span>Chat interno</span></header><p className="attendance-team-note">Este espaço é separado dos atendimentos de clientes e leads. Nesta versão frontend, as mensagens ficam preservadas somente na sessão/local do navegador.</p></section><section><header><span>Tags</span></header><div className="attendance-tags">{selected.tags.length ? selected.tags.map((tag) => <b key={tag}>{tag}</b>) : <span>Sem tags</span>}</div></section></> : <><div className="attendance-details-hero"><div className="attendance-details-person"><span className="attendance-avatar attendance-avatar--large">{selected.customer.slice(0, 2).toUpperCase()}</span><div><h3>{selected.customer}</h3><p>{selected.crmType} de referência</p></div></div><a href={browserHref('/crm/relacionamento')}>Abrir CRM</a></div><section><header><span>Contato</span></header><dl><div><dt>E-mail</dt><dd>{selected.email || '—'}</dd></div><div><dt>Telefone</dt><dd>{selected.handle || '—'}</dd></div><div><dt>Serviço</dt><dd>{selected.service || '—'}</dd></div><div><dt>Destino</dt><dd>{selected.destination || '—'}</dd></div><div><dt>Tipo de visto</dt><dd>{selected.visaType || '—'}</dd></div></dl></section><section><header><span>Conversa</span></header><dl><div><dt>Canal</dt><dd>{selected.channel}</dd></div><div><dt>Protocolo</dt><dd>{selected.protocol}</dd></div><div><dt>Fila</dt><dd>{selected.queue}</dd></div><div><dt>Responsável</dt><dd>{selected.assignee}</dd></div></dl></section><section><header><span>Tags</span></header><div className="attendance-tags">{selected.tags.length ? selected.tags.map((tag) => <b key={tag}>{tag}</b>) : <span>Sem tags</span>}</div></section></>}</aside>
      </section></main>
    </div>

    {newConversationOpen && <div className="attendance-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && setNewConversationOpen(false)}><div className="attendance-modal" role="dialog" aria-modal="true"><header><div><span>{creatingTeamChat ? 'CHAT INTERNO' : 'NOVA CONVERSA'}</span><h2>{creatingTeamChat ? 'Novo chat da equipe' : 'Iniciar conversa'}</h2><p>{creatingTeamChat ? 'Crie uma conversa interna separada dos atendimentos de clientes e leads.' : 'A conversa é preservada nesta sessão do navegador. O vínculo automático com um registro do CRM ainda não está implementado.'}</p></div><button type="button" onClick={() => setNewConversationOpen(false)} aria-label="Fechar">×</button></header><div className="attendance-modal-body">{creatingTeamChat ? <><label><span>Nome do chat</span><input value={newConversation.customer} onChange={(event) => setNewConversation((current) => ({ ...current, customer: event.target.value }))} placeholder="Ex.: Equipe Geral, Comercial ou Financeiro" /></label><label><span>Participantes</span><input value={newConversation.handle} onChange={(event) => setNewConversation((current) => ({ ...current, handle: event.target.value }))} placeholder="Ex.: Administrador · Atendimento · Comercial" /></label><p className="attendance-team-help">Os participantes são informativos nesta versão. Sincronização em tempo real entre usuários dependerá do backend compartilhado.</p><label><span>Mensagem inicial</span><textarea rows={4} value={newConversation.message} onChange={(event) => setNewConversation((current) => ({ ...current, message: event.target.value }))} placeholder="Mensagem inicial opcional" /></label></> : <><label><span>Nome do contato / lead</span><input value={newConversation.customer} onChange={(event) => setNewConversation((current) => ({ ...current, customer: event.target.value }))} placeholder="Nome completo" /></label><label><span>Canal</span><select value={newConversation.channel} onChange={(event) => setNewConversation((current) => ({ ...current, channel: event.target.value }))}><option>WhatsApp</option><option>Instagram</option><option>Facebook</option><option>Website</option><option>E-mail</option></select></label><label><span>Telefone / usuário</span><input value={newConversation.handle} onChange={(event) => setNewConversation((current) => ({ ...current, handle: event.target.value }))} placeholder="Contato do canal" /></label><label><span>Mensagem inicial</span><textarea rows={4} value={newConversation.message} onChange={(event) => setNewConversation((current) => ({ ...current, message: event.target.value }))} placeholder="Mensagem inicial opcional" /></label></>}{newConversationError && <p className="attendance-empty" role="alert">{newConversationError}</p>}</div><footer><button className="crm-btn-secondary" type="button" onClick={() => setNewConversationOpen(false)}>Cancelar</button><button className="crm-btn-primary" type="button" onClick={createConversation}>{creatingTeamChat ? 'Criar chat interno' : 'Iniciar conversa'}</button></footer></div></div>}
  </div>;
}

export default AttendanceApp;
