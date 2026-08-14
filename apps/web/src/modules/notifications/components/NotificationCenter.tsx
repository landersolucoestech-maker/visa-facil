import { useMemo, useState } from 'react';
import type { ChatConversation } from '../../chat/types/chat';
import type { DocumentItem } from '../../documents/types/document';
import type { ManagementTask } from '../../tasks/types/task';
import type { ManagementAlert } from '../types/notification';

type NotificationCenterProps = {
  tasks: ManagementTask[];
  conversations: ChatConversation[];
  documents: DocumentItem[];
  onNavigate: (path: string) => void;
};

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function NotificationCenter({ tasks, conversations, documents, onNavigate }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const today = todayKey();
  const alerts = useMemo<ManagementAlert[]>(() => {
    const taskAlerts = tasks.filter((task) => task.status === 'open' && task.dueDate && task.dueDate <= today).map((task) => ({ id: `task-${task.id}`, type: 'task' as const, severity: task.dueDate < today ? 'critical' as const : 'warning' as const, title: task.dueDate < today ? 'Tarefa atrasada' : 'Tarefa vence hoje', description: task.title, href: '/app/tarefas' }));
    const chatAlerts = conversations.filter((conversation) => conversation.unreadCount > 0).map((conversation) => ({ id: `chat-${conversation.id}`, type: 'chat' as const, severity: 'info' as const, title: 'Mensagem não lida', description: `${conversation.unreadCount} mensagem(ns) aguardando leitura`, href: '/app/chat' }));
    const documentAlerts = documents.filter((document) => document.required && !document.received).slice(0, 6).map((document) => ({ id: `document-${document.id}`, type: 'document' as const, severity: 'warning' as const, title: 'Documento obrigatório pendente', description: document.title, href: '/app/documentos' }));
    return [...taskAlerts, ...chatAlerts, ...documentAlerts].slice(0, 12);
  }, [conversations, documents, tasks, today]);

  function openAlert(alert: ManagementAlert) { setOpen(false); onNavigate(alert.href); }

  return <div className="notification-center"><button className="notification-center__trigger" type="button" aria-label="Abrir alertas" aria-expanded={open} onClick={() => setOpen((value) => !value)}>⌁{alerts.length > 0 && <b>{alerts.length}</b>}</button>{open && <div className="notification-center__popover"><div className="notification-center__heading"><div><span className="management-eyebrow">Central de alertas</span><strong>{alerts.length ? `${alerts.length} item(ns) exigem atenção` : 'Tudo em ordem nesta sessão'}</strong></div><button type="button" onClick={() => setOpen(false)}>×</button></div>{alerts.length === 0 ? <div className="notification-center__empty">Nenhuma tarefa crítica, mensagem não lida ou documento obrigatório pendente.</div> : <div className="notification-center__list">{alerts.map((alert) => <button type="button" key={alert.id} className={`notification-center__item notification-center__item--${alert.severity}`} onClick={() => openAlert(alert)}><span>{alert.type === 'task' ? 'TA' : alert.type === 'chat' ? 'CH' : 'DO'}</span><div><strong>{alert.title}</strong><small>{alert.description}</small></div><i>→</i></button>)}</div>}<div className="notification-center__footer"><span>Alertas derivados apenas dos dados temporários da sessão.</span></div></div>}</div>;
}
