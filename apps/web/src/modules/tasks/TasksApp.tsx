import { useMemo, useState } from 'react';
import './tasks.css';
import { getTaskInitialRecords, type RelatedType, type TaskPriority, type TaskRecord, type TaskStatus } from './mocks/tasksMockProvider';

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

const STATUS_OPTIONS: TaskStatus[] = ['Pendente', 'Em andamento', 'Concluída'];
const PRIORITY_OPTIONS: TaskPriority[] = ['Baixa', 'Média', 'Alta'];
const RELATED_OPTIONS: RelatedType[] = ['Contato', 'Lead'];
const REMINDER_OPTIONS = ['Sem lembrete', '15 minutos antes', '30 minutos antes', '1 hora antes', '1 dia antes'];

type ModalMode = 'create' | 'view' | 'edit';
type TaskDraft = Omit<TaskRecord, 'id' | 'createdAt' | 'updatedAt'>;

const EMPTY_DRAFT: TaskDraft = {
  title: '', description: '', relatedType: 'Contato', relatedName: '', owner: 'Administrador', priority: 'Média', status: 'Pendente', dueDate: '', dueTime: '', reminder: '30 minutos antes',
};

function getBasePath() { const base = import.meta.env.BASE_URL.replace(/\/$/, ''); return base || ''; }
function browserHref(path: string) { return `${getBasePath()}${path}` || path; }
function BrandMark() { return <span className="crm-brand-mark" aria-hidden="true"><i /><b /></span>; }
function FlagCard() { return <div className="crm-flag" aria-hidden="true"><span className="crm-flag__blue">✦ ✦ ✦<br /> ✦ ✦</span><span className="crm-flag__stripes" /></div>; }
function BellIcon() { return <span className="tasks-bell" aria-hidden="true" />; }
function formatDate(date: string) { if (!date) return '—'; return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR'); }

function TaskModal({ mode, task, onClose, onSave }: { mode: ModalMode; task?: TaskRecord; onClose: () => void; onSave: (draft: TaskDraft) => void }) {
  const [draft, setDraft] = useState<TaskDraft>(() => task ? { title: task.title, description: task.description, relatedType: task.relatedType, relatedName: task.relatedName, owner: task.owner, priority: task.priority, status: task.status, dueDate: task.dueDate, dueTime: task.dueTime, reminder: task.reminder } : EMPTY_DRAFT);
  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  if (mode === 'view' && task) return <div className="tasks-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="tasks-view-modal"><header><div><span>TAREFA</span><h2>{task.title}</h2><p>{task.relatedType} · {task.relatedName || 'Sem vínculo'}</p></div><button type="button" onClick={onClose}>×</button></header><section className="tasks-view-summary"><div><span>Status</span><strong>{task.status}</strong></div><div><span>Prioridade</span><strong>{task.priority}</strong></div><div><span>Prazo</span><strong>{formatDate(task.dueDate)} {task.dueTime}</strong></div><div><span>Responsável</span><strong>{task.owner}</strong></div></section><section className="tasks-view-body"><div className="tasks-view-grid"><div><span>Vinculado a</span><strong>{task.relatedType}: {task.relatedName || '—'}</strong></div><div><span>Lembrete</span><strong>{task.reminder}</strong></div></div><div className="tasks-view-description"><span>Descrição</span><p>{task.description || 'Nenhuma descrição cadastrada.'}</p></div></section><footer><div><small>Criada em {new Date(task.createdAt).toLocaleString('pt-BR')}</small><small>Atualizada em {new Date(task.updatedAt).toLocaleString('pt-BR')}</small></div><button type="button" className="crm-btn-secondary" onClick={onClose}>Fechar</button></footer></div></div>;

  return <div className="tasks-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="tasks-form-modal"><header><div><span>{mode === 'create' ? 'NOVA TAREFA' : 'EDITAR TAREFA'}</span><h2>{mode === 'create' ? 'Criar tarefa' : 'Editar tarefa'}</h2><p>Defina o que precisa ser feito, por quem e até quando.</p></div><button type="button" onClick={onClose}>×</button></header><form onSubmit={(event) => { event.preventDefault(); if (!draft.title.trim()) return; onSave(draft); }}><div className="tasks-form-grid"><label><span>Título</span><input required value={draft.title} onChange={(event) => set('title', event.target.value)} /></label><label><span>Responsável</span><input value={draft.owner} onChange={(event) => set('owner', event.target.value)} /></label><label><span>Tipo de vínculo</span><select value={draft.relatedType} onChange={(event) => set('relatedType', event.target.value as RelatedType)}>{RELATED_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label><label><span>Contato / Lead relacionado</span><input value={draft.relatedName} onChange={(event) => set('relatedName', event.target.value)} placeholder="Nome do contato ou lead" /></label><label><span>Prioridade</span><select value={draft.priority} onChange={(event) => set('priority', event.target.value as TaskPriority)}>{PRIORITY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label><label><span>Status</span><select value={draft.status} onChange={(event) => set('status', event.target.value as TaskStatus)}>{STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label><label><span>Data</span><input type="date" value={draft.dueDate} onChange={(event) => set('dueDate', event.target.value)} /></label><label><span>Horário</span><input type="time" value={draft.dueTime} onChange={(event) => set('dueTime', event.target.value)} /></label><label><span>Lembrete</span><select value={draft.reminder} onChange={(event) => set('reminder', event.target.value)}>{REMINDER_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label><label><span>Descrição</span><textarea rows={4} value={draft.description} onChange={(event) => set('description', event.target.value)} /></label></div><footer><button type="button" className="crm-btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="crm-btn-primary">Salvar tarefa</button></footer></form></div></div>;
}

export function TasksApp() {
  const [tasks, setTasks] = useState<TaskRecord[]>(() => getTaskInitialRecords());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [priorityFilter, setPriorityFilter] = useState('Todas');
  const [modal, setModal] = useState<{ mode: ModalMode; task?: TaskRecord }>();
  const [openActionId, setOpenActionId] = useState<string>();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const filtered = useMemo(() => tasks.filter((task) => {
    const haystack = `${task.title} ${task.relatedName} ${task.owner} ${task.description}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && (statusFilter === 'Todos' || task.status === statusFilter) && (priorityFilter === 'Todas' || task.priority === priorityFilter);
  }), [tasks, query, statusFilter, priorityFilter]);

  const saveTask = (draft: TaskDraft) => {
    const now = new Date().toISOString();
    if (modal?.task) setTasks((current) => current.map((task) => task.id === modal.task?.id ? { ...task, ...draft, updatedAt: now } : task));
    else setTasks((current) => [{ ...draft, id: crypto.randomUUID(), createdAt: now, updatedAt: now }, ...current]);
    setModal(undefined);
  };

  const deleteTask = (task: TaskRecord) => {
    if (!window.confirm(`Excluir a tarefa “${task.title}”?`)) return;
    setTasks((current) => current.filter((item) => item.id !== task.id));
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status !== 'Concluída').length,
    today: tasks.filter((task) => task.dueDate === today && task.status !== 'Concluída').length,
    overdue: tasks.filter((task) => task.dueDate && task.dueDate < today && task.status !== 'Concluída').length,
  };

  return <div className="crm-shell tasks-shell" onClick={() => { setOpenActionId(undefined); if (notificationsOpen) setNotificationsOpen(false); if (userOpen) setUserOpen(false); }}>
    <aside className="crm-sidebar"><a className="crm-brand" href={browserHref('/crm')}><BrandMark /><span><strong>VISA FÁCIL</strong><small>CRM · Relacionamento</small></span></a><div className="crm-sidebar-accent"><i /><i /><i /></div><span className="crm-sidebar-label">OPERAÇÃO</span><nav>{NAV_ITEMS.map((item) => <a key={item.href} className={item.href === '/crm/tarefas' ? 'is-active' : ''} href={browserHref(item.href)}><span>{item.icon}</span>{item.label}</a>)}</nav><div className="crm-sidebar-footer"><FlagCard /><a href={browserHref('/')}>← Voltar ao site</a><small>Protótipo · branch dev</small></div></aside>
    <div className="crm-workspace"><header className="crm-topbar"><div><small>VISA FÁCIL · CRM</small><h1>Tarefas</h1><p>Controle de atividades, prazos e acompanhamentos operacionais.</p></div><div className="crm-topbar-actions" onClick={(event) => event.stopPropagation()}><button className="crm-topbar-primary" type="button" onClick={() => setModal({ mode: 'create' })}>+ Nova tarefa</button><div className="tasks-topbar-menu"><button className="tasks-notification-button" type="button" aria-label="Alertas" onClick={() => { setNotificationsOpen((value) => !value); setUserOpen(false); }}><BellIcon /></button>{notificationsOpen && <div className="tasks-dropdown tasks-notifications"><strong>Notificações</strong><p>Nenhuma notificação no momento.</p></div>}</div><div className="tasks-topbar-menu"><button className="crm-user" type="button" onClick={() => { setUserOpen((value) => !value); setNotificationsOpen(false); }}><span>VF</span><div><strong>Administrador</strong><small>Protótipo frontend</small></div><span className="crm-user-caret">⌄</span></button>{userOpen && <div className="tasks-dropdown tasks-user-dropdown"><button type="button">Perfil</button><a href={browserHref('/crm/configuracoes')}>Configurações</a><button type="button" className="is-danger">Logout</button></div>}</div></div></header>
      <main className="tasks-content"><section className="tasks-stats"><article><span>Total de tarefas</span><strong>{stats.total}</strong><small>Cadastradas</small></article><article><span>Pendentes</span><strong>{stats.pending}</strong><small>Abertas ou em andamento</small></article><article><span>Para hoje</span><strong>{stats.today}</strong><small>Com prazo hoje</small></article><article className={stats.overdue ? 'is-alert' : ''}><span>Vencidas</span><strong>{stats.overdue}</strong><small>Precisam de atenção</small></article></section>
        <section className="tasks-card"><header><div><span>GESTÃO OPERACIONAL</span><h2>Lista de tarefas</h2><p>Sem Kanban. Visualização em tabela com filtros e ações.</p></div><button type="button" onClick={() => setModal({ mode: 'create' })}>+ Nova tarefa</button></header><div className="tasks-filters"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tarefa, contato, lead ou responsável" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos</option>{STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option>Todas</option>{PRIORITY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></div><div className="tasks-table"><div className="tasks-table-head"><span>Tarefa</span><span>Vínculo</span><span>Responsável</span><span>Prioridade</span><span>Prazo</span><span>Status</span><span>Ações</span></div>{filtered.length === 0 ? <div className="tasks-empty">Nenhuma tarefa encontrada.</div> : filtered.map((task) => <div className="tasks-row" key={task.id}><div><strong>{task.title}</strong><small>{task.description}</small></div><div><strong>{task.relatedName || '—'}</strong><small>{task.relatedType}</small></div><span>{task.owner}</span><span><b className={`tasks-priority is-${task.priority.toLowerCase().replace('é','e')}`}>{task.priority}</b></span><div><strong>{formatDate(task.dueDate)}</strong><small>{task.dueTime || 'Sem horário'}</small></div><span><b className={`tasks-status is-${task.status.toLowerCase().replace(' ','-').replace('í','i')}`}>{task.status}</b></span><div className="tasks-row-actions" onClick={(event) => event.stopPropagation()}><button type="button" className="tasks-actions-trigger" onClick={() => setOpenActionId((current) => current === task.id ? undefined : task.id)}>⋯</button>{openActionId === task.id && <div className="tasks-actions-menu"><button type="button" onClick={() => { setOpenActionId(undefined); setModal({ mode: 'view', task }); }}>Ver</button><button type="button" onClick={() => { setOpenActionId(undefined); setModal({ mode: 'edit', task }); }}>Editar</button><button type="button" className="is-danger" onClick={() => { setOpenActionId(undefined); deleteTask(task); }}>Excluir</button></div>}</div></div>)}</div></section>
      </main>
    </div>
    {modal && <TaskModal mode={modal.mode} task={modal.task} onClose={() => setModal(undefined)} onSave={saveTask} />}
  </div>;
}
