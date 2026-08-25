import { useMemo, useState } from 'react';
import './agenda.css';
import { getAgendaInitialEvents, type AgendaEvent, type AgendaStatus, type AgendaViewMode } from './mocks/agendaMockProvider';

const TYPE_OPTIONS = ['Todos', 'Entrevista consular', 'Reunião', 'Follow-up', 'Prazo documental', 'Ligação', 'Outro'];
const STATUS_OPTIONS: Array<'Todos' | AgendaStatus> = ['Todos', 'Confirmado', 'Pendente', 'Realizado', 'Cancelado'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const WEEKDAY_INITIALS_MON = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

type ModalMode = 'create' | 'view' | 'edit';
type AgendaDraft = Omit<AgendaEvent, 'id'>;

const EMPTY_DRAFT: AgendaDraft = {
  title: '',
  type: 'Reunião',
  status: 'Pendente',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  city: '',
  relatedType: 'Cliente',
  relatedName: '',
  owner: 'Administrador',
  notes: '',
};

function base() {
  const value = import.meta.env.BASE_URL.replace(/\/$/, '');
  return value || '';
}

function href(path: string) {
  return `${base()}${path}` || path;
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

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}

function dateIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfToday() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return today;
}

function shiftDate(date: Date, view: AgendaViewMode, delta: number) {
  const next = new Date(date);
  if (view === 'dia') next.setDate(next.getDate() + delta);
  else if (view === 'semana') next.setDate(next.getDate() + delta * 7);
  else if (view === 'mes') next.setMonth(next.getMonth() + delta);
  else next.setFullYear(next.getFullYear() + delta);
  return next;
}

function periodLabel(date: Date, view: AgendaViewMode) {
  if (view === 'dia') return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  if (view === 'mes') return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
  if (view === 'ano') return String(date.getFullYear());

  const monday = new Date(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getDate()} — ${sunday.getDate()} de ${MONTHS[sunday.getMonth()].toLowerCase()} de ${sunday.getFullYear()}`;
  }

  return `${monday.getDate()} de ${MONTHS[monday.getMonth()].toLowerCase()} — ${sunday.getDate()} de ${MONTHS[sunday.getMonth()].toLowerCase()} de ${sunday.getFullYear()}`;
}

function eventStatusClass(status: AgendaStatus) {
  return `is-${status.toLowerCase()}`;
}

function AgendaModal({
  mode,
  event,
  defaultDate,
  onClose,
  onSave,
  onEdit,
}: {
  mode: ModalMode;
  event?: AgendaEvent;
  defaultDate?: string;
  onClose: () => void;
  onSave: (draft: AgendaDraft) => void;
  onEdit?: () => void;
}) {
  const [draft, setDraft] = useState<AgendaDraft>(() => event ? { ...event } : { ...EMPTY_DRAFT, date: defaultDate || '' });
  const set = (key: keyof AgendaDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  if (mode === 'view' && event) {
    return (
      <div className="agenda-modal-backdrop" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onClose(); }}>
        <div className="agenda-view-modal" role="dialog" aria-modal="true" aria-label={`Evento ${event.title}`}>
          <header>
            <div><span>{event.type}</span><h2>{event.title}</h2><p>Detalhes do compromisso</p></div>
            <button type="button" aria-label="Fechar" onClick={onClose}>×</button>
          </header>
          <div className="agenda-view-status"><b className={eventStatusClass(event.status)}>{event.status}</b></div>
          <section>
            <h3>Data e horário</h3>
            <div className="agenda-view-grid agenda-view-grid--four">
              <div><span>Data</span><strong>{new Date(`${event.date}T12:00:00`).toLocaleDateString('pt-BR')}</strong></div>
              <div><span>Início</span><strong>{event.startTime || '—'}</strong></div>
              <div><span>Fim</span><strong>{event.endTime || '—'}</strong></div>
              <div><span>Responsável</span><strong>{event.owner}</strong></div>
            </div>
          </section>
          <section>
            <h3>Local</h3>
            <div className="agenda-view-grid">
              <div><span>Local</span><strong>{event.location || '—'}</strong></div>
              <div><span>Cidade</span><strong>{event.city || '—'}</strong></div>
            </div>
          </section>
          <section>
            <h3>Vínculo com CRM</h3>
            <div className="agenda-view-grid">
              <div><span>Tipo</span><strong>{event.relatedType}</strong></div>
              <div><span>Registro</span><strong>{event.relatedName || '—'}</strong></div>
            </div>
          </section>
          <section className="agenda-view-notes"><h3>Observações</h3><p>{event.notes || 'Nenhuma observação cadastrada.'}</p></section>
          <footer><button type="button" className="crm-btn-secondary" onClick={onClose}>Fechar</button><button type="button" className="crm-btn-primary" onClick={onEdit}>Editar</button></footer>
        </div>
      </div>
    );
  }

  return (
    <div className="agenda-modal-backdrop" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onClose(); }}>
      <div className="agenda-form-modal" role="dialog" aria-modal="true" aria-label={mode === 'create' ? 'Novo evento' : 'Editar evento'}>
        <header>
          <div><span>{mode === 'create' ? 'NOVO EVENTO' : 'EDITAR EVENTO'}</span><h2>{mode === 'create' ? 'Novo evento na agenda' : 'Editar evento'}</h2><p>Defina data, horário, vínculo e responsável.</p></div>
          <button type="button" aria-label="Fechar" onClick={onClose}>×</button>
        </header>
        <form onSubmit={(submitEvent) => { submitEvent.preventDefault(); if (!draft.title.trim() || !draft.date) return; onSave(draft); }}>
          <div className="agenda-form-grid">
            <label className="agenda-form-span-2"><span>Título</span><input required value={draft.title} onChange={(changeEvent) => set('title', changeEvent.target.value)} /></label>
            <label><span>Tipo</span><select value={draft.type} onChange={(changeEvent) => set('type', changeEvent.target.value)}>{TYPE_OPTIONS.filter((option) => option !== 'Todos').map((option) => <option key={option}>{option}</option>)}</select></label>
            <label><span>Status</span><select value={draft.status} onChange={(changeEvent) => set('status', changeEvent.target.value)}>{STATUS_OPTIONS.filter((option) => option !== 'Todos').map((option) => <option key={option}>{option}</option>)}</select></label>
            <label><span>Data</span><input required type="date" value={draft.date} onChange={(changeEvent) => set('date', changeEvent.target.value)} /></label>
            <div className="agenda-form-time"><label><span>Início</span><input type="time" value={draft.startTime} onChange={(changeEvent) => set('startTime', changeEvent.target.value)} /></label><label><span>Fim</span><input type="time" value={draft.endTime} onChange={(changeEvent) => set('endTime', changeEvent.target.value)} /></label></div>
            <label><span>Local</span><input value={draft.location} onChange={(changeEvent) => set('location', changeEvent.target.value)} /></label>
            <label><span>Cidade</span><input value={draft.city} onChange={(changeEvent) => set('city', changeEvent.target.value)} /></label>
            <label><span>Tipo de vínculo</span><select value={draft.relatedType} onChange={(changeEvent) => set('relatedType', changeEvent.target.value)}><option>Cliente</option><option>Contato</option><option>Lead</option></select></label>
            <label><span>Contato / Lead / Cliente</span><input value={draft.relatedName} onChange={(changeEvent) => set('relatedName', changeEvent.target.value)} /></label>
            <label><span>Responsável</span><input value={draft.owner} onChange={(changeEvent) => set('owner', changeEvent.target.value)} /></label>
            <label className="agenda-form-span-2"><span>Observações</span><textarea rows={4} value={draft.notes} onChange={(changeEvent) => set('notes', changeEvent.target.value)} /></label>
          </div>
          <footer><button type="button" className="crm-btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="crm-btn-primary">Salvar evento</button></footer>
        </form>
      </div>
    </div>
  );
}

function AgendaCalendar({ events, view, referenceDate, open }: { events: AgendaEvent[]; view: AgendaViewMode; referenceDate: Date; open: (event: AgendaEvent) => void }) {
  const today = dateIso(startOfToday());

  if (view === 'dia') {
    const iso = dateIso(referenceDate);
    return (
      <section className="agenda-calendar agenda-day-view">
        <div className="agenda-calendar-caption"><span>{referenceDate.toLocaleDateString('pt-BR', { weekday: 'long' })}</span><strong>{events.filter((event) => event.date === iso).length} compromissos</strong></div>
        <div className="agenda-day-scroll">
          {Array.from({ length: 12 }, (_, index) => index + 8).map((hour) => (
            <div className="agenda-hour-row" key={hour}>
              <time>{String(hour).padStart(2, '0')}:00</time>
              <div>{events.filter((event) => event.date === iso && Number((event.startTime || '00').slice(0, 2)) === hour).map((event) => <button className={eventStatusClass(event.status)} key={event.id} onClick={() => open(event)}><strong>{event.startTime || `${String(hour).padStart(2, '0')}:00`} · {event.title}</strong><small>{event.type} · {event.status}</small></button>)}</div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (view === 'semana') {
    const monday = new Date(referenceDate);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const days = Array.from({ length: 7 }, (_, index) => { const day = new Date(monday); day.setDate(monday.getDate() + index); return day; });

    return (
      <section className="agenda-calendar agenda-week-view">
        <div className="agenda-week-scroll">
          <div className="agenda-week-head"><span />{days.map((day) => <div className={dateIso(day) === today ? 'is-today' : ''} key={dateIso(day)}><small>{day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</small><strong>{day.getDate()}</strong></div>)}</div>
          {Array.from({ length: 11 }, (_, index) => index + 8).map((hour) => (
            <div className="agenda-week-row" key={hour}>
              <time>{String(hour).padStart(2, '0')}:00</time>
              {days.map((day) => <div className={dateIso(day) === today ? 'is-today' : ''} key={dateIso(day)}>{events.filter((event) => event.date === dateIso(day) && Number((event.startTime || '00').slice(0, 2)) === hour).map((event) => <button className={eventStatusClass(event.status)} key={event.id} onClick={() => open(event)}><strong>{event.startTime} · {event.title}</strong><small>{event.type}</small></button>)}</div>)}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (view === 'ano') return <YearView referenceDate={referenceDate} events={events} />;

  const first = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const cells = Array.from({ length: 42 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; });

  return (
    <section className="agenda-calendar agenda-month-view">
      <div className="agenda-month-head">{WEEKDAYS.map((weekday) => <b key={weekday}>{weekday}</b>)}</div>
      <div className="agenda-month-grid">{cells.map((day) => {
        const iso = dateIso(day);
        const dayEvents = events.filter((event) => event.date === iso);
        const classes = [day.getMonth() !== referenceDate.getMonth() ? 'is-outside' : '', iso === today ? 'is-today' : ''].filter(Boolean).join(' ');
        return <div key={iso} className={classes}><span>{day.getDate()}</span><div>{dayEvents.slice(0, 3).map((event) => <button className={eventStatusClass(event.status)} key={event.id} onClick={() => open(event)}><strong>{event.startTime ? `${event.startTime} · ` : ''}{event.title}</strong><small>{event.type}</small></button>)}{dayEvents.length > 3 && <small className="agenda-more-events">+ {dayEvents.length - 3} eventos</small>}</div></div>;
      })}</div>
    </section>
  );
}

function YearView({ referenceDate, events }: { referenceDate: Date; events: AgendaEvent[] }) {
  const year = referenceDate.getFullYear();
  const today = dateIso(startOfToday());

  return (
    <section className="agenda-year-view">
      <div className="agenda-year-grid">{MONTHS.map((name, month) => {
        const firstWeekday = new Date(year, month, 1).getDay();
        const lead = (firstWeekday + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: Array<number | null> = [];
        for (let index = 0; index < lead; index += 1) cells.push(null);
        for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
        const monthEvents = events.filter((event) => { const date = new Date(`${event.date}T00:00:00`); return date.getFullYear() === year && date.getMonth() === month; });

        return (
          <article key={name}>
            <header><h3>{name}</h3><span>{monthEvents.length ? `${monthEvents.length} ${monthEvents.length === 1 ? 'evento' : 'eventos'}` : 'Sem eventos'}</span></header>
            <div className="agenda-mini-weekdays">{WEEKDAY_INITIALS_MON.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}</div>
            <div className="agenda-mini-days">{cells.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} className="is-empty" />;
              const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasEvent = events.some((event) => event.date === iso);
              return <span key={iso} className={`${iso === today ? 'is-today' : ''} ${hasEvent ? 'has-event' : ''}`}>{day}</span>;
            })}</div>
          </article>
        );
      })}</div>
    </section>
  );
}

export function AgendaApp() {
  const [events, setEvents] = useState<AgendaEvent[]>(() => getAgendaInitialEvents());
  const [viewMode, setViewMode] = useState<AgendaViewMode>('semana');
  const [currentDate, setCurrentDate] = useState<Date>(() => startOfToday());
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [modal, setModal] = useState<{ mode: ModalMode; event?: AgendaEvent }>();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const filtered = useMemo(() => events.filter((event) => {
    const needle = query.trim().toLowerCase();
    const haystack = `${event.title} ${event.type} ${event.relatedName} ${event.location} ${event.city} ${event.owner}`.toLowerCase();
    return (!needle || haystack.includes(needle)) && (typeFilter === 'Todos' || event.type === typeFilter) && (statusFilter === 'Todos' || event.status === statusFilter);
  }), [events, query, typeFilter, statusFilter]);

  const todayIso = dateIso(startOfToday());
  const notificationEvents = useMemo(() => events.filter((event) => event.status !== 'Realizado' && event.status !== 'Cancelado' && (event.date === todayIso || event.status === 'Pendente')).sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)), [events, todayIso]);
  const todayCount = events.filter((event) => event.date === todayIso && event.status !== 'Cancelado').length;
  const pendingCount = events.filter((event) => event.status === 'Pendente').length;

  const save = (draft: AgendaDraft) => {
    if (modal?.event) setEvents((current) => current.map((event) => event.id === modal.event?.id ? { ...event, ...draft } : event));
    else setEvents((current) => [...current, { ...draft, id: crypto.randomUUID() }]);
    setModal(undefined);
  };

  return (
    <div className="agenda-shell" onClick={() => { if (notificationsOpen) setNotificationsOpen(false); if (userOpen) setUserOpen(false); }}>
      <div className="crm-workspace agenda-workspace">
        <header className="crm-topbar agenda-topbar">
          <div><small>VISA FÁCIL · CRM</small><h1>Agenda</h1><p>Compromissos, entrevistas, reuniões e prazos da operação.</p></div>
          <div className="crm-topbar-actions agenda-topbar-actions" onClick={(clickEvent) => clickEvent.stopPropagation()}>
            <button className="crm-topbar-primary agenda-new-event" type="button" onClick={() => setModal({ mode: 'create' })}><PlusIcon /><span>Novo evento</span></button>
            <div className="agenda-topbar-menu">
              <button className="agenda-notification-button" type="button" aria-label="Notificações" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setUserOpen(false); }}><BellIcon />{notificationEvents.length > 0 && <span className="agenda-notification-count">{notificationEvents.length}</span>}</button>
              {notificationsOpen && <div className="agenda-dropdown agenda-notifications"><header><strong>Notificações</strong><span>{notificationEvents.length}</span></header>{notificationEvents.length ? <div>{notificationEvents.slice(0, 4).map((event) => <button type="button" key={event.id} onClick={() => { setModal({ mode: 'view', event }); setNotificationsOpen(false); }}><strong>{event.title}</strong><small>{new Date(`${event.date}T12:00:00`).toLocaleDateString('pt-BR')} · {event.startTime || 'Sem horário'} · {event.status}</small></button>)}</div> : <p>Nenhum compromisso exige atenção.</p>}</div>}
            </div>
            <div className="agenda-topbar-menu">
              <button className="crm-user" type="button" aria-expanded={userOpen} onClick={() => { setUserOpen((value) => !value); setNotificationsOpen(false); }}><span>VF</span><div><strong>Administrador</strong><small>Conta interna</small></div><span className="crm-user-caret" aria-hidden="true">⌄</span></button>
              {userOpen && <div className="agenda-dropdown agenda-user-dropdown"><button type="button">Perfil</button><a href={href('/crm/configuracoes')}>Configurações</a><button type="button" className="is-danger">Logout</button></div>}
            </div>
          </div>
        </header>

        <main className="agenda-content">
          <section className="agenda-toolbar">
            <div className="agenda-toolbar-main">
              <div className="agenda-period-controls"><button type="button" onClick={() => setCurrentDate(startOfToday())}>Hoje</button><button type="button" aria-label="Período anterior" onClick={() => setCurrentDate(shiftDate(currentDate, viewMode, -1))}><ChevronIcon direction="left" /></button><button type="button" aria-label="Próximo período" onClick={() => setCurrentDate(shiftDate(currentDate, viewMode, 1))}><ChevronIcon direction="right" /></button></div>
              <strong className="agenda-period-label">{periodLabel(currentDate, viewMode)}</strong>
              <div className="agenda-view-switch">{(['dia', 'semana', 'mes', 'ano'] as AgendaViewMode[]).map((view) => <button type="button" key={view} className={viewMode === view ? 'is-active' : ''} onClick={() => setViewMode(view)}>{view === 'mes' ? 'Mês' : view[0].toUpperCase() + view.slice(1)}</button>)}</div>
            </div>
            <div className="agenda-toolbar-filters">
              <label><SearchIcon /><input value={query} onChange={(changeEvent) => setQuery(changeEvent.target.value)} placeholder="Buscar por evento, contato, local ou responsável" /></label>
              <select value={typeFilter} onChange={(changeEvent) => setTypeFilter(changeEvent.target.value)} aria-label="Filtrar por tipo">{TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>
              <select value={statusFilter} onChange={(changeEvent) => setStatusFilter(changeEvent.target.value)} aria-label="Filtrar por status">{STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>
              <div className="agenda-toolbar-summary"><span><strong>{todayCount}</strong> hoje</span><span><strong>{pendingCount}</strong> pendentes</span><span><strong>{filtered.length}</strong> exibidos</span></div>
            </div>
          </section>

          <AgendaCalendar events={filtered} view={viewMode} referenceDate={currentDate} open={(event) => setModal({ mode: 'view', event })} />
        </main>
      </div>

      {modal && <AgendaModal mode={modal.mode} event={modal.event} defaultDate={dateIso(currentDate)} onClose={() => setModal(undefined)} onSave={save} onEdit={() => setModal((current) => current?.event ? { mode: 'edit', event: current.event } : current)} />}
    </div>
  );
}
