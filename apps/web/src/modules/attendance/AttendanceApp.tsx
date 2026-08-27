import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import './attendance.css';
import './attendanceSidebarKpis.css';
import './attendanceWorkflow.css';
import {
  canSendAttendanceMessage,
  CUSTOMER_STATUS_OPTIONS,
  getAttendanceConversationKind,
  getAttendanceParticipantIds,
  getAttendanceTeamType,
  sortAttendanceConversations,
  TEAM_CONVERSATION_TYPES,
  TEAM_STATUS_OPTIONS,
  type AttendanceConversation,
  type AttendanceMessage,
  type AttendanceTeamType,
  type CustomerConversationStatus,
  type TeamConversationStatus,
} from './attendanceDomain';
import {
  getAttendanceSessionConversations,
  getOperationalTeamMembers,
  saveAttendanceSessionConversations,
} from '../../shared/operationalSessionStore';
import { getVisaChatSettings } from './attendanceSettings';
import { AttendanceSettingsPanel } from './AttendanceSettingsPanel';

type ChatMode = 'customer' | 'team';
type TeamTypeFilter = 'all' | AttendanceTeamType;
type NewConversationDraft = {
  customer: string;
  handle: string;
  channel: string;
  message: string;
  participantIds: string[];
  teamType: AttendanceTeamType;
};
const EMPTY_NEW_CONVERSATION: NewConversationDraft = { customer: '', handle: '', channel: 'WhatsApp', message: '', participantIds: [], teamType: 'group' };
const EMPTY_TEAM_CONVERSATION: NewConversationDraft = { customer: '', handle: '', channel: 'Equipe', message: '', participantIds: [], teamType: 'group' };

function getBasePath() { const base = import.meta.env.BASE_URL.replace(/\/$/, ''); return base || ''; }
function browserHref(path: string) { return `${getBasePath()}${path}` || path; }
function BellIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
<path d="M10 21h4"/>
</svg>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
<circle cx="11" cy="11" r="6"/>
<path d="m16 16 4 4"/>
</svg>; }
function PaperclipIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.6 9.6a2 2 0 1 1-2.8-2.8l8.9-8.9"/>
</svg>; }
function PlusIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
<path d="M12 5v14M5 12h14"/>
</svg>; }
function SettingsIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<circle cx="12" cy="12" r="3"/>
<path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4a1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.36.34.7.6 1 .3.3.7.4 1.1.4H21v4h-.09a1.7 1.7 0 0 0-1.51.6Z"/>
</svg>; }
function ArrowRightLeftIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
<path d="M7 7h11l-3-3"/>
<path d="m18 7-3 3"/>
<path d="M17 17H6l3 3"/>
<path d="m6 17 3-3"/>
</svg>; }
function timeNow() { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
function teamTypeLabel(type: AttendanceTeamType) { return type === 'direct' ? 'Conversa' : type === 'group' ? 'Grupo' : 'Canal'; }
function normalizeChannelSlug(value: string) { return value.trim().toLowerCase().replace(/^#+/, '').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, ''); }

export function AttendanceApp() {
  const [conversations, setConversations] = useState<AttendanceConversation[]>(() => getAttendanceSessionConversations());
  const [mode, setMode] = useState<ChatMode>('customer');
  const [selectedId, setSelectedId] = useState<string>(() => conversations.find((item) => getAttendanceConversationKind(item) === 'customer')?.id ?? '');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [queueFilter, setQueueFilter] = useState('Todos');
  const [teamTypeFilter, setTeamTypeFilter] = useState<TeamTypeFilter>('all');
  const [message, setMessage] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [newConversationKind, setNewConversationKind] = useState<ChatMode>('customer');
  const [newConversation, setNewConversation] = useState<NewConversationDraft>(EMPTY_NEW_CONVERSATION);
  const [newConversationError, setNewConversationError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsRevision, setSettingsRevision] = useState(0);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const transferButtonRef = useRef<HTMLButtonElement>(null);
  const quickRepliesButtonRef = useRef<HTMLButtonElement>(null);
  const newConversationTriggerRef = useRef<HTMLButtonElement>(null);
  const teamMembers = useMemo(() => getOperationalTeamMembers(), []);
  const teamMemberById = useMemo(() => new Map(teamMembers.map((member) => [member.id, member])), [teamMembers]);
  const currentMember = teamMembers.find((member) => member.role === 'Administrador') ?? teamMembers[0];
  const currentAuthor = currentMember?.name ?? 'Administrador';
  const selectableTeamMembers = teamMembers.filter((member) => member.id !== currentMember?.id);
  const activeTemplates = useMemo(() => getVisaChatSettings().templates.filter((template) => template.active), [settingsRevision]);
  const quickReplyOptions = useMemo(() => activeTemplates.slice(0, 3), [activeTemplates]);
  const transferOptions = useMemo(() => getVisaChatSettings().menu_options
    .filter((option) => option.active && option.queue.trim().length > 0)
    .sort((left, right) => left.order - right.order), [settingsRevision]);

  useEffect(() => { saveAttendanceSessionConversations(conversations); }, [conversations]);
  useEffect(() => {
    if (!newConversationOpen && !transferOpen && !quickRepliesOpen && !notificationsOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (newConversationOpen) {
        event.preventDefault();
        setNewConversationOpen(false);
        requestAnimationFrame(() => newConversationTriggerRef.current?.focus());
        return;
      }
      if (transferOpen) {
        event.preventDefault();
        setTransferOpen(false);
        setTransferTarget('');
        requestAnimationFrame(() => transferButtonRef.current?.focus());
        return;
      }
      if (quickRepliesOpen) {
        event.preventDefault();
        setQuickRepliesOpen(false);
        requestAnimationFrame(() => quickRepliesButtonRef.current?.focus());
        return;
      }
      if (notificationsOpen) {
        event.preventDefault();
        setNotificationsOpen(false);
        requestAnimationFrame(() => notificationButtonRef.current?.focus());
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [newConversationOpen, notificationsOpen, quickRepliesOpen, transferOpen]);

  const customerConversations = useMemo(() => sortAttendanceConversations(conversations.filter((item) => getAttendanceConversationKind(item) === 'customer')), [conversations]);
  const teamConversations = useMemo(() => sortAttendanceConversations(conversations.filter((item) => getAttendanceConversationKind(item) === 'team')), [conversations]);
  const modeConversations = mode === 'team' ? teamConversations : customerConversations;
  const selected = modeConversations.find((item) => item.id === selectedId) ?? modeConversations[0];
  const selectedKind = selected ? getAttendanceConversationKind(selected) : mode;
  const selectedArchived = selected?.status === 'Arquivada';
  const selectedClosed = selected?.status === 'Resolvida' || selectedArchived;

  const participantLabel = (conversation: AttendanceConversation) => {
    if (getAttendanceConversationKind(conversation) !== 'team') return conversation.handle;
    const names = getAttendanceParticipantIds(conversation)
      .map((id) => teamMemberById.get(id)?.name)
      .filter((name): name is string => Boolean(name));
    return names.length ? names.join(' · ') : conversation.handle || 'Equipe Visa Fácil';
  };

  const customerQueues = useMemo(() => ['Todos', ...new Set(customerConversations.map((item) => item.queue).filter(Boolean))], [customerConversations]);
  const filtered = useMemo(() => modeConversations.filter((item) => {
    const haystack = `${item.customer} ${item.handle} ${item.email} ${item.protocol} ${item.channel} ${item.tags.join(' ')} ${participantLabel(item)}`.toLowerCase();
    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    const matchesStatus = mode === 'team' || statusFilter === 'Todos' || item.status === statusFilter;
    const matchesQueue = mode === 'team' || queueFilter === 'Todos' || item.queue === queueFilter;
    const matchesTeamType = mode === 'customer' || teamTypeFilter === 'all' || getAttendanceTeamType(item) === teamTypeFilter;
    return matchesQuery && matchesStatus && matchesQueue && matchesTeamType;
  }), [modeConversations, mode, query, statusFilter, queueFilter, teamTypeFilter, teamMemberById]);

  const waitingCount = customerConversations.filter((item) => item.status === 'Aguardando atendimento').length;
  const activeCount = customerConversations.filter((item) => item.status === 'Em atendimento').length;
  const teamActiveCount = teamConversations.filter((item) => item.status === 'Ativo').length;
  const teamArchivedCount = teamConversations.filter((item) => item.status === 'Arquivada').length;
  const teamUnreadCount = teamConversations.reduce((sum, item) => sum + item.unread, 0);
  const unreadCount = conversations.reduce((sum, item) => sum + item.unread, 0);

  const updateSelectedCustomerStatus = (status: CustomerConversationStatus) => {
    if (!selected || selected.kind === 'team') return;
    const updatedAt = new Date().toISOString();
    setConversations((current) => current.map((item) => item.id === selected.id && item.kind !== 'team' ? { ...item, status, updatedAt } : item));
  };

  const transferSelectedCustomer = () => {
    if (!selected || selected.kind === 'team' || selectedClosed || !transferTarget) return;
    const option = transferOptions.find((item) => item.id === transferTarget);
    if (!option || option.queue === selected.queue) return;
    const priority = option.priority === 'baixa' ? 'Baixa' : option.priority === 'alta' ? 'Alta' : option.priority === 'critica' ? 'Urgente' : 'Normal';
    const updatedAt = new Date().toISOString();
    setConversations((current) => current.map((item) => item.id === selected.id && item.kind !== 'team' ? {
      ...item,
      queue: option.queue,
      assignee: teamMemberById.get(option.defaultAssignee?.trim() ?? '')?.name ?? 'Não atribuído',
      priority,
      tags: [...new Set([...item.tags, ...option.tags])],
      status: 'Em atendimento',
      updatedAt,
    } : item));
    setQueueFilter('Todos');
    setTransferOpen(false);
    setTransferTarget('');
  };

  const updateSelectedTeamStatus = (status: TeamConversationStatus) => {
    if (!selected || selected.kind !== 'team') return;
    const updatedAt = new Date().toISOString();
    setConversations((current) => current.map((item) => item.id === selected.id && item.kind === 'team' ? { ...item, status, updatedAt } : item));
  };

  const sendMessage = () => {
    if (!selected || !message.trim() || !canSendAttendanceMessage(selected)) return;
    const body = message.trim();
    const nextMessage: AttendanceMessage = {
      id: crypto.randomUUID(),
      sender: 'agent',
      author: currentAuthor,
      body,
      time: timeNow(),
      ...(selectedKind === 'customer' ? { visibility: 'external' as const, deliveryStatus: 'local' as const } : { visibility: 'internal' as const }),
    };
    const updatedAt = new Date().toISOString();
    setConversations((current) => current.map((item) => {
      if (item.id !== selected.id) return item;
      if (item.kind === 'team') {
        return { ...item, messages: [...item.messages, nextMessage], lastMessage: body, lastMessageAt: nextMessage.time, updatedAt };
      }
      return {
        ...item,
        messages: [...item.messages, nextMessage],
        lastMessage: body,
        lastMessageAt: nextMessage.time,
        updatedAt,
        status: item.status === 'Aguardando atendimento' ? 'Em atendimento' : item.status,
      };
    }));
    setMessage('');
  };

  const applyTemplate = (body: string) => {
    setMessage(body);
    setQuickRepliesOpen(false);
  };

  const selectConversation = (conversation: AttendanceConversation) => {
    setSelectedId(conversation.id);
    setMessage('');
    setTransferOpen(false);
    setTransferTarget('');
    setQuickRepliesOpen(false);
    setConversations((current) => current.map((item) => item.id === conversation.id ? { ...item, unread: 0 } : item));
  };

  const changeMode = (nextMode: ChatMode) => {
    setSettingsOpen(false);
    setMode(nextMode);
    setQuery('');
    setStatusFilter('Todos');
    setQueueFilter('Todos');
    setTeamTypeFilter('all');
    setMessage('');
    const first = sortAttendanceConversations(conversations.filter((item) => getAttendanceConversationKind(item) === nextMode))[0];
    if (first) selectConversation(first); else setSelectedId('');
  };

  const handleModeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextMode: ChatMode = event.key === 'ArrowLeft' || event.key === 'Home' ? 'customer' : 'team';
    changeMode(nextMode);
    requestAnimationFrame(() => document.getElementById(`visachat-tab-${nextMode}`)?.focus());
  };

  const openNewConversation = (trigger?: HTMLButtonElement) => {
    if (trigger) newConversationTriggerRef.current = trigger;
    setNewConversationKind(mode);
    setNewConversation(mode === 'team' ? { ...EMPTY_TEAM_CONVERSATION } : { ...EMPTY_NEW_CONVERSATION });
    setNewConversationError('');
    setNewConversationOpen(true);
  };

  const toggleTeamParticipant = (id: string) => {
    setNewConversation((current) => ({
      ...current,
      participantIds: current.participantIds.includes(id)
        ? current.participantIds.filter((participantId) => participantId !== id)
        : [...current.participantIds, id],
    }));
  };

  const createConversation = () => {
    const handle = newConversation.handle.trim();
    const now = timeNow();
    const updatedAt = new Date().toISOString();
    const initialBody = newConversation.message.trim();
    if (newConversationKind === 'team') {
      const selectedMembers = selectableTeamMembers.filter((member) => newConversation.participantIds.includes(member.id));
      if (newConversation.teamType === 'direct' && selectedMembers.length !== 1) { setNewConversationError('Selecione exatamente um usuário para a conversa direta.'); return; }
      if (newConversation.teamType !== 'direct' && selectedMembers.length === 0) { setNewConversationError('Selecione pelo menos um participante ativo.'); return; }
      if (selectedMembers.length !== newConversation.participantIds.length) { setNewConversationError('Há participante inválido ou inativo. Revise a seleção.'); return; }
      const requestedName = newConversation.customer.trim();
      const channelSlug = newConversation.teamType === 'channel' ? normalizeChannelSlug(requestedName) : '';
      if (newConversation.teamType !== 'direct' && !requestedName) { setNewConversationError(newConversation.teamType === 'channel' ? 'Informe o nome do canal.' : 'Informe o nome do grupo.'); return; }
      if (newConversation.teamType === 'channel' && !channelSlug) { setNewConversationError('Informe um nome de canal válido.'); return; }
      const title = newConversation.teamType === 'direct' ? selectedMembers[0].name : newConversation.teamType === 'channel' ? `#${channelSlug}` : requestedName;
      const participantIds = currentMember ? [currentMember.id, ...newConversation.participantIds] : [...newConversation.participantIds];
      const id = crypto.randomUUID();
      const initialMessage: AttendanceMessage[] = initialBody ? [{ id: crypto.randomUUID(), sender: 'agent', author: currentAuthor, body: initialBody, time: now, visibility: 'internal' }] : [];
      const record: AttendanceConversation = {
        id,
        kind: 'team',
        teamType: newConversation.teamType,
        ...(newConversation.teamType === 'channel' ? { channelSlug } : {}),
        customer: title,
        handle: [currentAuthor, ...selectedMembers.map((member) => member.name)].join(' · '),
        email: '',
        channel: 'Equipe',
        status: 'Ativo',
        assignee: currentAuthor,
        queue: 'Equipe',
        protocol: `INT-${Date.now().toString(36).toUpperCase()}`,
        tags: ['Interno', teamTypeLabel(newConversation.teamType)],
        lastMessage: initialBody || `${teamTypeLabel(newConversation.teamType)} criado`,
        lastMessageAt: now,
        updatedAt,
        participantIds,
        unread: 0,
        crmType: 'Equipe',
        service: '',
        destination: '',
        visaType: '',
        messages: initialMessage,
      };
      setConversations((current) => [record, ...current]);
      setMode('team');
      setTeamTypeFilter('all');
      setSelectedId(id);
      setNewConversationOpen(false);
      setNewConversation(EMPTY_TEAM_CONVERSATION);
      setNewConversationError('');
      return;
    }
    const customer = newConversation.customer.trim();
    if (!customer || !handle) { setNewConversationError('Informe o nome e o telefone/usuário do contato.'); return; }
    const initialMessage: AttendanceMessage[] = initialBody ? [{ id: crypto.randomUUID(), sender: 'agent', author: currentAuthor, body: initialBody, time: now, visibility: 'external', deliveryStatus: 'local' }] : [];
    const id = crypto.randomUUID();
    const record: AttendanceConversation = {
      id,
      kind: 'customer',
      customer,
      handle,
      email: '',
      channel: newConversation.channel,
      status: 'Em atendimento',
      assignee: currentAuthor,
      queue: 'Atendimento',
      protocol: `VF-${Date.now().toString(36).toUpperCase()}`,
      tags: [],
      priority: 'Normal',
      lastMessage: initialBody || 'Conversa iniciada',
      lastMessageAt: now,
      updatedAt,
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
  const selectedParticipants = selected ? participantLabel(selected) : '';
  const selectedTeamType = selected ? getAttendanceTeamType(selected) : undefined;

  if (settingsOpen) {
    return <div className="attendance-shell">
<div className="crm-workspace attendance-workspace">
<AttendanceSettingsPanel teamMembers={teamMembers} onClose={() => { setSettingsOpen(false); setSettingsRevision((value) => value + 1); }} />
</div>
</div>;
  }

  return <div className="attendance-shell" onClick={() => { setNotificationsOpen(false); setTransferOpen(false); setQuickRepliesOpen(false); }}>
    <div className="crm-workspace attendance-workspace">
      <header className="crm-topbar attendance-topbar">
        <div>
<small>VISA FÁCIL · CRM</small>
<h1>VisaChat</h1>
<p>Atendimento multicanal e comunicação interna da equipe.</p>
</div>
        <div className="crm-topbar-actions attendance-topbar-actions" onClick={(event) => event.stopPropagation()}>
          <button className="attendance-settings-button" type="button" onClick={() => setSettingsOpen(true)}>
<SettingsIcon/>
<span>Configurações</span>
</button>
          <button className="crm-topbar-primary attendance-new-conversation" type="button" aria-label={mode === 'team' ? 'Novo chat interno' : 'Nova conversa'} aria-haspopup="dialog" aria-expanded={newConversationOpen} aria-controls="visachat-new-conversation" onClick={(event) => openNewConversation(event.currentTarget)}>
<PlusIcon/>
<span>{mode === 'team' ? 'Novo chat interno' : 'Nova conversa'}
</span>
</button>
          <div className="attendance-topbar-menu">
<button ref={notificationButtonRef} className="attendance-notification-button" type="button" aria-label="Notificações" aria-haspopup="true" aria-expanded={notificationsOpen} aria-controls="visachat-notifications" onClick={() => setNotificationsOpen((value) => !value)}>
<BellIcon />{unreadCount > 0 && <span className="attendance-notification-dot" aria-label={`${unreadCount} mensagens não lidas`}>{unreadCount}
</span>}
</button>{notificationsOpen && <div className="attendance-dropdown attendance-notifications" id="visachat-notifications" role="region" aria-label="Notificações do VisaChat">
<strong>Notificações</strong>
<p>{unreadCount > 0 ? `${unreadCount} mensagem${unreadCount === 1 ? '' : 's'} não lida${unreadCount === 1 ? '' : 's'} no VisaChat.` : 'Nenhuma notificação no momento.'}
</p>
</div>}
</div>
        </div>
      </header>

      <main className="attendance-content">
<section className="attendance-inbox">
        <aside className="attendance-list-panel">
<div className="attendance-list-header">
<div>
<span>{mode === 'team' ? 'EQUIPE' : 'ATENDIMENTO'}
</span>
<h2>{mode === 'team' ? 'Comunicação interna' : 'Inbox'}
</h2>
</div>
<button type="button" aria-label={mode === 'team' ? 'Novo chat interno' : 'Nova conversa'} aria-haspopup="dialog" aria-expanded={newConversationOpen} aria-controls="visachat-new-conversation" onClick={(event) => openNewConversation(event.currentTarget)}>
<PlusIcon/>
</button>
</div>
          <div className="attendance-mode-tabs" role="tablist" aria-label="Tipo de conversa" onKeyDown={handleModeKeyDown}>
<button id="visachat-tab-customer" type="button" role="tab" aria-selected={mode === 'customer'} aria-controls="visachat-mode-panel" tabIndex={mode === 'customer' ? 0 : -1} className={mode === 'customer' ? 'is-active' : ''} onClick={() => changeMode('customer')}>Atendimento <small>{customerConversations.length}
</small>
</button>
<button id="visachat-tab-team" type="button" role="tab" aria-selected={mode === 'team'} aria-controls="visachat-mode-panel" tabIndex={mode === 'team' ? 0 : -1} className={mode === 'team' ? 'is-active' : ''} onClick={() => changeMode('team')}>Equipe <small>{teamConversations.length}
</small>
</button>
</div>
          <div className="attendance-mode-panel" id="visachat-mode-panel" role="tabpanel" aria-labelledby={`visachat-tab-${mode}`}>
            {mode === 'customer' ? <div className="attendance-support-nav" aria-label="Filas de atendimento">{customerQueues.map((queue) => <button key={queue} type="button" className={queueFilter === queue ? 'is-active' : ''} onClick={() => setQueueFilter(queue)}>{queue === 'Todos' ? 'Todos' : queue}
</button>)}
</div> : <div className="attendance-team-type-tabs" aria-label="Tipos de chat interno">
<button type="button" className={teamTypeFilter === 'all' ? 'is-active' : ''} onClick={() => setTeamTypeFilter('all')}>Todos</button>{TEAM_CONVERSATION_TYPES.map((type) => <button key={type} type="button" className={teamTypeFilter === type ? 'is-active' : ''} onClick={() => setTeamTypeFilter(type)}>{teamTypeLabel(type)}
</button>)}
</div>}
            <div className={`attendance-filters ${mode === 'team' ? 'is-team' : ''}`}>
<label>
<SearchIcon/>
<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === 'team' ? 'Buscar na equipe' : 'Buscar atendimento'} aria-label={mode === 'team' ? 'Buscar chat interno' : 'Buscar conversa'} />
</label>{mode === 'customer' && <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar conversas por status">
<option>Todos</option>{CUSTOMER_STATUS_OPTIONS.map((status) => <option key={status}>{status}
</option>)}
</select>}
</div>
            <div className="attendance-sidebar-stats">{mode === 'customer' ? <>
<article>
<span>Conversas</span>
<strong>{customerConversations.length}
</strong>
</article>
<article>
<span>Aguardando</span>
<strong>{waitingCount}
</strong>
</article>
<article>
<span>Em atendimento</span>
<strong>{activeCount}
</strong>
</article>
<article>
<span>Não lidas</span>
<strong>{customerConversations.reduce((sum, item) => sum + item.unread, 0)}
</strong>
</article>
</> : <>
<article>
<span>Chats internos</span>
<strong>{teamConversations.length}
</strong>
</article>
<article>
<span>Ativos</span>
<strong>{teamActiveCount}
</strong>
</article>
<article>
<span>Arquivados</span>
<strong>{teamArchivedCount}
</strong>
</article>
<article>
<span>Não lidas</span>
<strong>{teamUnreadCount}
</strong>
</article>
</>}
</div>
            <div className="attendance-conversation-list">{filtered.length === 0 ? <p className="attendance-empty">{mode === 'team' ? 'Nenhum chat interno encontrado.' : 'Nenhuma conversa encontrada.'}
</p> : filtered.map((conversation) => { const kind = getAttendanceConversationKind(conversation); const type = getAttendanceTeamType(conversation); return <button key={conversation.id} type="button" className={`${conversation.id === selected?.id ? 'is-active' : ''} ${kind === 'team' ? 'is-team' : ''}`.trim()} onClick={() => selectConversation(conversation)}>
<span className="attendance-avatar">{conversation.customer.replace(/^#/, '').slice(0, 2).toUpperCase()}
</span>
<span className="attendance-conversation-copy">
<span className="attendance-conversation-line">
<strong>{conversation.customer}
</strong>
<small>{conversation.lastMessageAt}
</small>
</span>
<span className="attendance-meta">
<b>{kind === 'team' ? teamTypeLabel(type ?? 'group') : conversation.channel}
</b>
<em>{conversation.status}
</em>
</span>
<span className="attendance-preview">{conversation.lastMessage}
</span>
</span>{conversation.unread > 0 && <span className="attendance-unread">{conversation.unread}
</span>}
</button>; })}
</div>
          </div>
        </aside>

        <section className="attendance-chat-panel">{!selected ? <div className="attendance-no-selection">
<strong>{mode === 'team' ? 'Nenhum chat interno selecionado' : 'Nenhuma conversa selecionada'}
</strong>
<p>{mode === 'team' ? 'Selecione uma conversa, grupo ou canal da equipe.' : 'Selecione uma conversa ou inicie um novo atendimento.'}
</p>
</div> : <>
          <header className="attendance-chat-header">
<div className={`attendance-chat-person ${selectedKind === 'team' ? 'is-team' : ''}`}>
<span className="attendance-avatar attendance-avatar--large">{selected.customer.replace(/^#/, '').slice(0, 2).toUpperCase()}
</span>
<div>
<h2>{selected.customer}
</h2>
<p>{selectedKind === 'team' ? selectedParticipants : selected.handle} <span>·</span> {selectedKind === 'team' ? teamTypeLabel(selectedTeamType ?? 'group') : selected.channel}
</p>
</div>
</div>
<div className="attendance-chat-actions">{selected.kind === 'team' ? <>
<select value={selected.status} onChange={(event) => updateSelectedTeamStatus(event.target.value as TeamConversationStatus)} aria-label="Status do chat interno">{TEAM_STATUS_OPTIONS.map((status) => <option key={status}>{status}
</option>)}
</select>
<button type="button" onClick={() => updateSelectedTeamStatus(selected.status === 'Arquivada' ? 'Ativo' : 'Arquivada')}>{selected.status === 'Arquivada' ? 'Reabrir' : 'Arquivar'}
</button>
</> : <>
<div className="attendance-transfer" onClick={(event) => event.stopPropagation()}>
<button ref={transferButtonRef} type="button" className="attendance-transfer-trigger" disabled={selectedClosed || transferOptions.every((option) => option.queue === selected.queue)} aria-haspopup="dialog" aria-expanded={transferOpen} aria-controls="visachat-transfer-dialog" onClick={() => { setTransferOpen((value) => !value); setQuickRepliesOpen(false); setTransferTarget(''); }}>
<ArrowRightLeftIcon/>
<span>Transferir</span>
</button>{transferOpen && <div className="attendance-transfer-popover" id="visachat-transfer-dialog" role="dialog" aria-label="Transferir atendimento">
<label>
<span>Transferir para</span>
<select value={transferTarget} onChange={(event) => setTransferTarget(event.target.value)} aria-label="Selecionar departamento">
<option value="">Selecionar departamento</option>{transferOptions.filter((option) => option.queue !== selected.queue).map((option) => <option key={option.id} value={option.id}>{option.sector && option.sector !== option.queue ? `${option.sector} · ${option.queue}` : option.label}
</option>)}
</select>
</label>
<button type="button" className="attendance-transfer-confirm" disabled={!transferTarget} onClick={transferSelectedCustomer}>Confirmar transferência</button>
</div>}
</div>
<select value={selected.status} onChange={(event) => updateSelectedCustomerStatus(event.target.value as CustomerConversationStatus)} aria-label="Status da conversa">{CUSTOMER_STATUS_OPTIONS.map((status) => <option key={status}>{status}
</option>)}
</select>
<button type="button" onClick={() => updateSelectedCustomerStatus(selected.status === 'Arquivada' ? 'Em atendimento' : 'Resolvida')}>{selected.status === 'Arquivada' ? 'Reabrir' : 'Finalizar'}
</button>
</>}
</div>
</header>
          <div className="attendance-chat-context">{selectedKind === 'team' ? <>
<span>Tipo <strong>{teamTypeLabel(selectedTeamType ?? 'group')}
</strong>
</span>
<span>Participantes <strong>{selectedParticipants}
</strong>
</span>
<span>Criado por <strong>{selected.assignee}
</strong>
</span>
</> : <>
<span>Protocolo <strong>{selected.protocol}
</strong>
</span>
<span>Fila <strong>{selected.queue}
</strong>
</span>
<span>Responsável <strong>{selected.assignee}
</strong>
</span>
</>}
</div>
          <div className="attendance-messages">{selected.messages.length ? selected.messages.map((item) => <div key={item.id} className={`attendance-message attendance-message--${item.sender}`}>
<div>
<small>{item.author}
</small>
<p>{item.body}
</p>
<time>{item.time}{item.deliveryStatus === 'local' && item.visibility === 'external' ? ' · somente local' : ''}
</time>
</div>
</div>) : <p className="attendance-empty">{selectedKind === 'team' ? 'Chat interno criado. Envie a primeira mensagem para a equipe.' : 'Conversa iniciada. Envie a primeira mensagem.'}
</p>}
</div>
          <footer className={`attendance-composer ${selectedArchived ? 'is-archived' : ''}`}>
<div className="attendance-composer-tools">
<button type="button" disabled title="Anexos indisponíveis sem armazenamento compartilhado" aria-label="Anexos indisponíveis">
<PaperclipIcon/>
</button>{selectedArchived ? <span className="attendance-archived-composer-label">Chat arquivado</span> : selectedKind === 'team' ? <span className="attendance-internal-composer-label">Mensagem interna</span> : <div className="attendance-quick-replies" onClick={(event) => event.stopPropagation()}>
<button ref={quickRepliesButtonRef} type="button" className="attendance-quick-replies-trigger" aria-haspopup="menu" aria-expanded={quickRepliesOpen} aria-controls="visachat-quick-replies" onClick={() => { setQuickRepliesOpen((value) => !value); setTransferOpen(false); }}>Resposta rápida</button>{quickRepliesOpen && <div className="attendance-quick-replies-menu" id="visachat-quick-replies" role="menu" aria-label="Respostas rápidas">
<strong>Respostas rápidas</strong>
<span className="attendance-quick-replies-separator" />{quickReplyOptions.map((template) => <button key={template.id} type="button" role="menuitem" onClick={() => applyTemplate(template.body)}>{template.body}
</button>)}
</div>}
</div>}
</div>
<div className="attendance-composer-field">
<textarea value={message} disabled={selectedArchived} aria-label={selectedKind === 'team' ? 'Mensagem interna para a equipe' : 'Mensagem para o contato'} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder={selectedArchived ? 'Reabra a conversa para enviar mensagens.' : selectedKind === 'team' ? 'Escreva uma mensagem para a equipe...' : 'Digite uma mensagem...'} />
<small>{selectedArchived ? 'Conversa arquivada · reabra para continuar' : selectedKind === 'customer' ? 'Entrega externa ainda não configurada · mensagem fica local no protótipo' : 'Enter para enviar · Shift + Enter para quebrar linha'}
</small>
</div>
<button className="attendance-send" type="button" onClick={sendMessage} disabled={selectedArchived || !message.trim()}>Enviar</button>
</footer>
        </>}
</section>

        <aside className="attendance-details-panel">{!selected ? null : selected.kind === 'team' ? <>
<div className="attendance-details-hero attendance-details-hero--team">
<div className="attendance-details-person is-team">
<span className="attendance-avatar attendance-avatar--large">{selected.customer.replace(/^#/, '').slice(0, 2).toUpperCase()}
</span>
<div>
<h3>{selected.customer}
</h3>
<p>{teamTypeLabel(selectedTeamType ?? 'group')} interno</p>
</div>
</div>
</div>
<section>
<header>
<span>Equipe</span>
</header>
<dl>
<div>
<dt>Participantes</dt>
<dd>{selectedParticipants}
</dd>
</div>
<div>
<dt>Status</dt>
<dd>{selected.status}
</dd>
</div>
<div>
<dt>Tipo</dt>
<dd>{teamTypeLabel(selectedTeamType ?? 'group')}
</dd>
</div>
<div>
<dt>Criado por</dt>
<dd>{selected.assignee}
</dd>
</div>
</dl>
</section>
<section>
<header>
<span>Infraestrutura</span>
</header>
<p className="attendance-team-note">Identidade por usuário, sem número telefônico. A sessão local preserva o protótipo; presença, entrega simultânea, leitura e sincronização entre usuários ficam preparadas para backend/realtime compartilhado.</p>
</section>
<section>
<header>
<span>Tags</span>
</header>
<div className="attendance-tags">{selected.tags.length ? selected.tags.map((tag) => <b key={tag}>{tag}
</b>) : <span>Sem tags</span>}
</div>
</section>
</> : <>
<div className="attendance-details-hero">
<div className="attendance-details-person">
<span className="attendance-avatar attendance-avatar--large">{selected.customer.slice(0, 2).toUpperCase()}
</span>
<div>
<h3>{selected.customer}
</h3>
<p>{selected.crmType} de referência</p>
</div>
</div>
<a href={browserHref('/crm/relacionamento')}>Abrir CRM</a>
</div>
<section>
<header>
<span>Contato</span>
</header>
<dl>
<div>
<dt>E-mail</dt>
<dd>{selected.email || '—'}
</dd>
</div>
<div>
<dt>Telefone / usuário</dt>
<dd>{selected.handle || '—'}
</dd>
</div>
<div>
<dt>Serviço</dt>
<dd>{selected.service || '—'}
</dd>
</div>
<div>
<dt>Destino</dt>
<dd>{selected.destination || '—'}
</dd>
</div>
<div>
<dt>Tipo de visto</dt>
<dd>{selected.visaType || '—'}
</dd>
</div>
</dl>
</section>
<section>
<header>
<span>Atendimento</span>
</header>
<dl>
<div>
<dt>Canal</dt>
<dd>{selected.channel}
</dd>
</div>
<div>
<dt>Protocolo</dt>
<dd>{selected.protocol}
</dd>
</div>
<div>
<dt>Fila</dt>
<dd>{selected.queue}
</dd>
</div>
<div>
<dt>Responsável</dt>
<dd>{selected.assignee}
</dd>
</div>
<div>
<dt>Prioridade</dt>
<dd>{selected.priority ?? 'Normal'}
</dd>
</div>
<div>
<dt>SLA</dt>
<dd>{selected.slaDueAt ? 'Rastreado' : 'Não rastreado sem backend'}
</dd>
</div>
</dl>
</section>
<section>
<header>
<span>Tags</span>
</header>
<div className="attendance-tags">{selected.tags.length ? selected.tags.map((tag) => <b key={tag}>{tag}
</b>) : <span>Sem tags</span>}
</div>
</section>
</>}
</aside>
      </section>
</main>
    </div>

    {newConversationOpen && <div className="attendance-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && setNewConversationOpen(false)}>
<div className="attendance-modal" id="visachat-new-conversation" role="dialog" aria-modal="true" aria-labelledby="visachat-new-conversation-title">
<header>
<div>
<span>{creatingTeamChat ? 'CHAT INTERNO' : 'NOVA CONVERSA'}
</span>
<h2 id="visachat-new-conversation-title">{creatingTeamChat ? 'Novo espaço da equipe' : 'Iniciar conversa'}
</h2>
<p>{creatingTeamChat ? 'Crie uma conversa direta, grupo ou canal usando somente usuários ativos de Configurações.' : 'O vínculo com canal externo continua local até a integração específica de mensagens existir.'}
</p>
</div>
<button type="button" onClick={() => setNewConversationOpen(false)} aria-label="Fechar">×</button>
</header>
<div className="attendance-modal-body">{creatingTeamChat ? <>
<label>
<span>Tipo</span>
<select value={newConversation.teamType} onChange={(event) => setNewConversation((current) => ({ ...current, teamType: event.target.value as AttendanceTeamType, participantIds: [], customer: '' }))}>
<option value="direct">Conversa direta</option>
<option value="group">Grupo</option>
<option value="channel">Canal</option>
</select>
</label>{newConversation.teamType !== 'direct' && <label>
<span>{newConversation.teamType === 'channel' ? 'Nome do canal' : 'Nome do grupo'}
</span>
<input value={newConversation.customer} onChange={(event) => setNewConversation((current) => ({ ...current, customer: event.target.value }))} placeholder={newConversation.teamType === 'channel' ? 'Ex.: geral, comercial ou financeiro' : 'Ex.: Diretoria ou Equipe Comercial'} />
</label>}
<fieldset className="attendance-team-members">
<legend>{newConversation.teamType === 'direct' ? 'Usuário' : 'Participantes'}
</legend>{selectableTeamMembers.length ? selectableTeamMembers.map((member) => <label key={member.id} className="attendance-team-member-option">
<input type={newConversation.teamType === 'direct' ? 'radio' : 'checkbox'} name={newConversation.teamType === 'direct' ? 'direct-participant' : undefined} checked={newConversation.participantIds.includes(member.id)} onChange={() => newConversation.teamType === 'direct' ? setNewConversation((current) => ({ ...current, participantIds: [member.id] })) : toggleTeamParticipant(member.id)} />
<span>
<strong>{member.name}
</strong>
<small>{member.role} · {member.email}
</small>
</span>
</label>) : <p className="attendance-team-help">Nenhum outro usuário ativo está disponível em Configurações → Usuários.</p>}
</fieldset>
<p className="attendance-team-help">Você ({currentAuthor}) é incluído automaticamente. Nenhum número de telefone é necessário para comunicação interna.</p>
<label>
<span>Mensagem inicial</span>
<textarea rows={4} value={newConversation.message} onChange={(event) => setNewConversation((current) => ({ ...current, message: event.target.value }))} placeholder="Mensagem inicial opcional" />
</label>
</> : <>
<label>
<span>Nome do contato / lead</span>
<input value={newConversation.customer} onChange={(event) => setNewConversation((current) => ({ ...current, customer: event.target.value }))} placeholder="Nome completo" />
</label>
<label>
<span>Canal</span>
<select value={newConversation.channel} onChange={(event) => setNewConversation((current) => ({ ...current, channel: event.target.value }))}>
<option>WhatsApp</option>
<option>Instagram</option>
<option>Facebook</option>
<option>Website</option>
<option>E-mail</option>
</select>
</label>
<label>
<span>Telefone / usuário</span>
<input value={newConversation.handle} onChange={(event) => setNewConversation((current) => ({ ...current, handle: event.target.value }))} placeholder="Contato do canal" />
</label>
<label>
<span>Mensagem inicial</span>
<textarea rows={4} value={newConversation.message} onChange={(event) => setNewConversation((current) => ({ ...current, message: event.target.value }))} placeholder="Mensagem inicial opcional" />
</label>
<p className="attendance-team-help">A conversa será criada no VisaChat, mas mensagens externas só podem ser marcadas como entregues quando o canal estiver realmente integrado.</p>
</>}{newConversationError && <p className="attendance-empty" role="alert">{newConversationError}
</p>}
</div>
<footer>
<button className="crm-btn-secondary" type="button" onClick={() => setNewConversationOpen(false)}>Cancelar</button>
<button className="crm-btn-primary" type="button" onClick={createConversation}>{creatingTeamChat ? 'Criar' : 'Iniciar conversa'}
</button>
</footer>
</div>
</div>}
  </div>;
}

export default AttendanceApp;
