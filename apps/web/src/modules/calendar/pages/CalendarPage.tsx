import { useMemo, useState } from 'react';
import type { Client } from '../../clients/types/client';
import { PROCESS_STAGE_LABELS, type VisaProcess } from '../../processes/types/process';
import type { ManagementTask } from '../../tasks/types/task';

type CalendarPageProps = { clients: Client[]; processes: VisaProcess[]; tasks: ManagementTask[] };
type CalendarEvent = { id: string; date: string; type: 'task' | 'process'; title: string; subtitle: string; href?: string; urgent?: boolean };

const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const monthLabels = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function dateKey(date: Date) { const year=date.getFullYear(); const month=String(date.getMonth()+1).padStart(2,'0'); const day=String(date.getDate()).padStart(2,'0'); return `${year}-${month}-${day}`; }
function parseDate(value:string){ return new Date(`${value}T12:00:00`); }

export function CalendarPage({ clients, processes, tasks }: CalendarPageProps) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const events = useMemo<CalendarEvent[]>(() => {
    const taskEvents = tasks.filter((task)=>task.status==='open' && task.dueDate).map((task)=>{ const client=clients.find((item)=>item.id===task.clientId); return { id:`task-${task.id}`, date:task.dueDate, type:'task' as const, title:task.title, subtitle:client?.fullName ?? 'Tarefa interna', href:'/app/tarefas', urgent:task.priority==='urgent' }; });
    const processEvents = processes.filter((process)=>process.targetDate && !['completed','cancelled'].includes(process.stage)).map((process)=>{ const client=clients.find((item)=>item.id===process.clientId); return { id:`process-${process.id}`, date:process.targetDate, type:'process' as const, title:process.category, subtitle:`${client?.fullName ?? 'Cliente'} · ${PROCESS_STAGE_LABELS[process.stage]}`, href:`/app/processos/${encodeURIComponent(process.id)}` }; });
    return [...taskEvents,...processEvents].sort((a,b)=>a.date.localeCompare(b.date));
  },[clients,processes,tasks]);

  const year=cursor.getFullYear(); const month=cursor.getMonth();
  const firstDay=new Date(year,month,1).getDay(); const daysInMonth=new Date(year,month+1,0).getDate();
  const cells=Array.from({length:42},(_,index)=>{ const day=index-firstDay+1; if(day<1||day>daysInMonth)return null; const date=new Date(year,month,day); const key=dateKey(date); return {day,key,events:events.filter((event)=>event.date===key),isToday:key===dateKey(today)}; });
  const upcoming=events.filter((event)=>parseDate(event.date).getTime()>=new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime()).slice(0,8);
  const overdue=events.filter((event)=>parseDate(event.date).getTime()<new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime()).length;
  function moveMonth(offset:number){setCursor(new Date(year,month+offset,1));}

  return <section className="management-page calendar-page" aria-labelledby="calendar-title">
    <div className="management-page__heading management-page__heading--row"><div><span className="management-eyebrow">Planejamento</span><h1 id="calendar-title">Agenda</h1><p>Visão temporal de prazos de tarefas e datas-alvo dos processos. Sem Kanban e sem calendário externo nesta fase.</p></div><button className="management-secondary-button" type="button" onClick={()=>setCursor(new Date(today.getFullYear(),today.getMonth(),1))}>Hoje</button></div>
    <div className="calendar-summary"><article><span>Compromissos</span><strong>{events.length}</strong><small>Tarefas + processos com data</small></article><article><span>Próximos</span><strong>{upcoming.length}</strong><small>Primeiros compromissos futuros</small></article><article><span>Atrasados</span><strong>{overdue}</strong><small>Datas anteriores a hoje</small></article></div>
    <div className="calendar-layout">
      <section className="calendar-card"><header className="calendar-card__header"><button type="button" aria-label="Mês anterior" onClick={()=>moveMonth(-1)}>‹</button><h2>{monthLabels[month]} <strong>{year}</strong></h2><button type="button" aria-label="Próximo mês" onClick={()=>moveMonth(1)}>›</button></header><div className="calendar-weekdays">{weekdayLabels.map((label)=><span key={label}>{label}</span>)}</div><div className="calendar-grid">{cells.map((cell,index)=>cell ? <div className={`calendar-day ${cell.isToday?'is-today':''}`} key={cell.key}><span>{cell.day}</span><div>{cell.events.slice(0,3).map((event)=><a className={`calendar-event calendar-event--${event.type} ${event.urgent?'is-urgent':''}`} href={event.href} key={event.id} title={`${event.title} — ${event.subtitle}`}>{event.title}</a>)}{cell.events.length>3&&<small>+{cell.events.length-3} item(ns)</small>}</div></div> : <div className="calendar-day is-empty" key={`empty-${index}`} />)}</div></section>
      <aside className="calendar-upcoming"><div className="calendar-upcoming__heading"><span className="management-eyebrow">Próximos passos</span><h2>Compromissos</h2></div>{upcoming.length===0?<div className="calendar-upcoming__empty">Nenhum compromisso futuro na sessão.</div>:<div className="calendar-upcoming__list">{upcoming.map((event)=><a href={event.href} key={event.id}><span className={`calendar-upcoming__date calendar-upcoming__date--${event.type}`}>{parseDate(event.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span><div><strong>{event.title}</strong><small>{event.subtitle}</small></div></a>)}</div>}<div className="calendar-legend"><span><i className="is-task"/>Tarefa</span><span><i className="is-process"/>Processo</span></div></aside>
    </div>
  </section>;
}
