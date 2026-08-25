import { useMemo, useState } from 'react';
import './tasks.css';
import { getTaskInitialRecords, type RelatedType, type TaskPriority, type TaskRecord, type TaskStatus } from './mocks/tasksMockProvider';

const STATUS_OPTIONS: TaskStatus[] = ['Pendente', 'Em andamento', 'Concluída'];
const PRIORITY_OPTIONS: TaskPriority[] = ['Baixa', 'Média', 'Alta'];
const RELATED_OPTIONS: RelatedType[] = ['Contato', 'Lead'];
const REMINDER_OPTIONS = ['Sem lembrete', '15 minutos antes', '30 minutos antes', '1 hora antes', '1 dia antes'];

type ModalMode = 'create' | 'view' | 'edit';
type TaskDraft = Omit<TaskRecord, 'id' | 'createdAt' | 'updatedAt'>;

const EMPTY_DRAFT: TaskDraft = {
  title: '',
  description: '',
  relatedType: 'Contato',
  relatedName: '',
  owner: 'Administrador',
  priority: 'Média',
  status: 'Pendente',
  dueDate: '',
  dueTime: '',
  reminder: '30 minutos antes',
};

function getBasePath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base || '';
}

function browserHref(path: string) {
  return `${getBasePath()}${path}` || path;
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

function formatDate(date: string) {
  if (!date) return '—';
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');
}

function TaskModal({ mode, task, onClose, onSave }: { mode: ModalMode; task?: TaskRecord; onClose: () => void; onSave: (draft: TaskDraft) => void }) {
  const [draft, setDraft] = useState<TaskDraft>(() => task ? {
    title: task.title,
    description: task.description,
    relatedType: task.relatedType,
    relatedName: task.relatedName,
    owner: task.owner,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    reminder: task.reminder,
  } : EMPTY_DRAFT);

  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  if (mode === 'view' && task) {
    return (
      <div className="tasks-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <div className="tasks-view-modal">
          <header>
            <div><span>TAREFA</span><h2>{task.title}</h2><p>{task.relatedType} · {task.relatedName || 'Sem vínculo'}</p></div>
            <button type="button" onClick={onClose} aria-label="Fechar">×</button>
          </header>
          <section className="tasks-view-summary">
            <div><span>Status</span><strong>{task.status}</strong></div>
            <div><span>Prioridade</span><strong>{task.priority}</strong></div>
            <div><span>Prazo</span><strong>{formatDate(task.dueDate)} {task.dueTime}</strong></div>
            <div><span>Responsável</span><strong>{task.owner}</strong></div>
          </section>
          <section className="tasks-view-body">
            <div className="tasks-view-grid">
              <div><span>Vinculado a</span><strong>{task.relatedType}: {task.relatedName || '—'}</strong></div>
              <div><span>Lembrete</span><strong>{task.reminder}</strong></div>
            </div>
            <div className="tasks-view-description"><span>Descrição</span><p>{task.description || 'Nenhuma descrição cadastrada.'}</p></div>
          </section>
          <footer>
            <div><small>Criada em {new Date(task.createdAt).toLocaleString('pt-BR')}</small><small>Atualizada em {new Date(task.updatedAt).toLocaleString('pt-BR')}</small></div>
            <button type="button" className="crm-btn-secondary" onClick={onClose}>Fechar</button>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="tasks-form-modal">
        <header>
          <div><span>{mode === 'create' ? 'NOVA TAREFA' : 'EDITAR TAREFA'}</span><h2>{mode === 'create' ? 'Criar tarefa' : 'Editar tarefa'}</h2><p>Defina a atividade, o responsável e o prazo.</p></div>
          <button type="button" onClick={onClose} aria-label="Fechar">×</button>
        </header>
        <form onSubmit={(event) => { event.preventDefault(); if (!draft.title.trim()) return; onSave(draft); }}>
          <div className="tasks-form-grid">
            <label><span>Título</span><input required value={draft.title} onChange={(event) => set('title', event.target.value)} /></label>
            <label><span>Responsável</span><input value={draft.owner} onChange={(event) => set('owner', event.target.value)} /></label>
            <label><span>Tipo de vínculo</span><select value={draft.relatedType} onChange={(event) => set('relatedType', event.target.value as RelatedType)}>{RELATED_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label><span>Contato / Lead relacionado</span><input value={draft.relatedName} onChange={(event) => set('relatedName', event.target.value)} placeholder="Nome do contato ou lead" /></label>
            <label><span>Prioridade</span><select value={draft.priority} onChange={(event) => set('priority', event.target.value as TaskPriority)}>{PRIORITY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label><span>Status</span><select value={draft.status} onChange={(event) => set('status', event.target.value as TaskStatus)}>{STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label><span>Data</span><input type="date" value={draft.dueDate} onChange={(event) => set('dueDate', event.target.value)} /></label>
            <label><span>Horário</span><input type="time" value={draft.dueTime} onChange={(event) => set('dueTime', event.target.value)} /></label>
            <label><span>Lembrete</span><select value={draft.reminder} onChange={(event) => set('reminder', event.target.value)}>{REMINDER_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label className="tasks-description-field"><span>Descrição</span><textarea rows={4} value={draft.description} onChange={(event) => set('description', event.target.value)} /></label>
          </div>
          <footer><button type="button" className="crm-btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="crm-btn-primary">Salvar tarefa</button></footer>
        </form>
      </div>
    </div>
  );
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
    return haystack.includes(query.trim().toLowerCase()) &&
      (statusFilter === 'Todos' || task.status === statusFilter) &&
      (priorityFilter === 'Todas' || task.priority === priorityFilter);
  }), [tasks, query, statusFilter, priorityFilter]);

  const saveTask = (draft: TaskDraft) => {
    const now = new Date().toISOString();
    if (modal?.task) {
      setTasks((current) => current.map((task) => task.id === modal.task?.id ? { ...task, ...draft, updatedAt: now } : task));
    } else {
      setTasks((current) => [{ ...draft, id: crypto.randomUUID(), createdAt: now, updatedAt: now }, ...current]);
    }
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
  const notificationCount = stats.overdue + stats.today;

  return (
    <div className="tasks-shell" onClick={() => { setOpenActionId(undefined); if (notificationsOpen) setNotificationsOpen(false); if (userOpen) setUserOpen(false); }}>
      <div className="crm-workspace tasks-workspace">
        <header className="crm-topbar tasks-topbar">
          <div><small>VISA FÁCIL · CRM</small><h1>Tarefas</h1><p>Atividades, prazos e acompanhamentos operacionais.</p></div>
          <div className="crm-topbar-actions tasks-topbar-actions" onClick={(event) => event.stopPropagation()}>
            <button className="crm-topbar-primary tasks-new-button" type="button" onClick={() => setModal({ mode: 'create' })}><PlusIcon /><span>Nova tarefa</span></button>
            <div className="tasks-topbar-menu">
              <button className="tasks-notification-button" type="button" aria-label="Notificações" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setUserOpen(false); }}>
                <BellIcon />
                {notificationCount > 0 && <span className="tasks-notification-count">{notificationCount}</span>}
              </button>
              {notificationsOpen && <div className="tasks-dropdown tasks-notifications"><strong>Notificações</strong>{notificationCount === 0 ? <p>Nenhuma tarefa requer atenção imediata.</p> : <div className="tasks-notification-list">{stats.overdue > 0 && <p><b>{stats.overdue}</b> tarefa{stats.overdue === 1 ? '' : 's'} vencida{stats.overdue === 1 ? '' : 's'}.</p>}{stats.today > 0 && <p><b>{stats.today}</b> tarefa{stats.today === 1 ? '' : 's'} com prazo hoje.</p>}</div>}</div>}
            </div>
            <div className="tasks-topbar-menu">
              <button className="crm-user" type="button" aria-expanded={userOpen} onClick={() => { setUserOpen((value) => !value); setNotificationsOpen(false); }}><span>VF</span><div><strong>Administrador</strong><small>Conta interna</small></div><span className="crm-user-caret" aria-hidden="true">⌄</span></button>
              {userOpen && <div className="tasks-dropdown tasks-user-dropdown"><button type="button">Perfil</button><a href={browserHref('/crm/configuracoes')}>Configurações</a><button type="button" className="is-danger">Logout</button></div>}
            </div>
          </div>
        </header>

        <main className="tasks-content">
          <section className="tasks-stats" aria-label="Indicadores de tarefas">
            <article><span>Total de tarefas</span><strong>{stats.total}</strong><small>Cadastradas</small></article>
            <article><span>Pendentes</span><strong>{stats.pending}</strong><small>Abertas ou em andamento</small></article>
            <article><span>Para hoje</span><strong>{stats.today}</strong><small>Com prazo hoje</small></article>
            <article className={stats.overdue ? 'is-alert' : ''}><span>Vencidas</span><strong>{stats.overdue}</strong><small>Precisam de atenção</small></article>
          </section>

          <section className="tasks-card">
            <div className="tasks-filters">
              <label className="tasks-search"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por tarefa, vínculo ou responsável" /></label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por status"><option>Todos</option>{STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} aria-label="Filtrar por prioridade"><option>Todas</option>{PRIORITY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>
            </div>

            <div className="tasks-table-scroll">
              <div className="tasks-table" role="table" aria-label="Lista de tarefas">
                <div className="tasks-table-head" role="row">
                  <span role="columnheader">Tarefa</span><span role="columnheader">Vínculo</span><span role="columnheader">Responsável</span><span role="columnheader">Prioridade</span><span role="columnheader">Prazo</span><span role="columnheader">Status</span><span role="columnheader">Ações</span>
                </div>
                {filtered.length === 0 ? <div className="tasks-empty">Nenhuma tarefa encontrada.</div> : filtered.map((task) => (
                  <div className="tasks-row" key={task.id} role="row">
                    <div className="tasks-task-cell" data-label="Tarefa" role="cell"><strong>{task.title}</strong><small>{task.description || 'Sem descrição'}</small></div>
                    <div className="tasks-related-cell" data-label="Vínculo" role="cell"><strong>{task.relatedName || '—'}</strong><small>{task.relatedType}</small></div>
                    <span className="tasks-owner-cell" data-label="Responsável" role="cell">{task.owner}</span>
                    <span className="tasks-priority-cell" data-label="Prioridade" role="cell"><b className={`tasks-priority is-${task.priority.toLowerCase().replace('é', 'e')}`}>{task.priority}</b></span>
                    <div className="tasks-due-cell" data-label="Prazo" role="cell"><strong>{formatDate(task.dueDate)}</strong><small>{task.dueTime || 'Sem horário'}</small></div>
                    <span className="tasks-status-cell" data-label="Status" role="cell"><b className={`tasks-status is-${task.status.toLowerCase().replace(' ', '-').replace('í', 'i')}`}>{task.status}</b></span>
                    <div className="tasks-row-actions" data-label="Ações" role="cell" onClick={(event) => event.stopPropagation()}>
                      <button type="button" className="tasks-actions-trigger" aria-label={`Ações da tarefa ${task.title}`} aria-expanded={openActionId === task.id} onClick={() => setOpenActionId((current) => current === task.id ? undefined : task.id)}><MoreIcon /></button>
                      {openActionId === task.id && <div className="tasks-actions-menu"><button type="button" onClick={() => { setOpenActionId(undefined); setModal({ mode: 'view', task }); }}>Ver</button><button type="button" onClick={() => { setOpenActionId(undefined); setModal({ mode: 'edit', task }); }}>Editar</button><button type="button" className="is-danger" onClick={() => { setOpenActionId(undefined); deleteTask(task); }}>Excluir</button></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
      {modal && <TaskModal mode={modal.mode} task={modal.task} onClose={() => setModal(undefined)} onSave={saveTask} />}
    </div>
  );
}
