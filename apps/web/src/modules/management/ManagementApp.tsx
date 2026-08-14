import { useEffect, useState } from 'react';
import { ManagementShell } from './components/ManagementShell';
import { ManagementDashboardPage } from './pages/ManagementDashboardPage';
import { ClientsPage } from '../clients/pages/ClientsPage';
import { ClientDetailPage } from '../clients/pages/ClientDetailPage';
import { ProcessesPage } from '../processes/pages/ProcessesPage';
import { ProcessDetailPage } from '../processes/pages/ProcessDetailPage';
import { DocumentsPage } from '../documents/pages/DocumentsPage';
import { InteractionsPage } from '../interactions/pages/InteractionsPage';
import { ChatPage } from '../chat/pages/ChatPage';
import { TasksPage } from '../tasks/pages/TasksPage';
import { CalendarPage } from '../calendar/pages/CalendarPage';
import { FinancePage } from '../finance/pages/FinancePage';
import { ReportsPage } from '../reports/pages/ReportsPage';
import { SettingsPage } from '../settings/pages/SettingsPage';
import { GlobalSearch } from '../search/components/GlobalSearch';
import type { Client } from '../clients/types/client';
import type { VisaProcess } from '../processes/types/process';
import type { DocumentItem } from '../documents/types/document';
import type { ServiceInteraction } from '../interactions/types/interaction';
import type { ChatConversation, ChatConversationStatus, ChatMessage } from '../chat/types/chat';
import type { ManagementTask } from '../tasks/types/task';
import type { FinancialEntry } from '../finance/types/finance';

function normalizePath() { return window.location.pathname.replace(/\/+$/, '') || '/app'; }

export function ManagementApp() {
  const [path, setPath] = useState(normalizePath);
  const [clients, setClients] = useState<Client[]>([]);
  const [processes, setProcesses] = useState<VisaProcess[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [interactions, setInteractions] = useState<ServiceInteraction[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<ManagementTask[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);

  function navigate(nextPath: string) { if (nextPath === path) return; window.history.pushState({}, '', nextPath); setPath(normalizePath()); window.scrollTo({ top: 0, behavior: 'instant' }); }

  useEffect(() => {
    const handlePopState = () => setPath(normalizePath());
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const anchor = target?.closest('a[href^="/app"]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank') return;
      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      event.preventDefault(); window.history.pushState({}, '', url.pathname); setPath(normalizePath()); window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('popstate', handlePopState); document.addEventListener('click', handleDocumentClick);
    return () => { window.removeEventListener('popstate', handlePopState); document.removeEventListener('click', handleDocumentClick); };
  }, []);

  function createClient(input: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) { const now = new Date().toISOString(); setClients((current) => [{ ...input, id: `session-client-${current.length + 1}`, createdAt: now, updatedAt: now }, ...current]); }
  function createProcess(input: Omit<VisaProcess, 'id' | 'createdAt' | 'updatedAt'>) { const now = new Date().toISOString(); setProcesses((current) => [{ ...input, id: `session-process-${current.length + 1}`, createdAt: now, updatedAt: now }, ...current]); }
  function createDocument(input: Omit<DocumentItem, 'id' | 'updatedAt'>) { setDocuments((current) => [{ ...input, id: `session-document-${current.length + 1}`, updatedAt: new Date().toISOString() }, ...current]); }
  function toggleDocumentReceived(documentId: string) { setDocuments((current) => current.map((document) => document.id === documentId ? { ...document, received: !document.received, updatedAt: new Date().toISOString() } : document)); }
  function createInteraction(input: Omit<ServiceInteraction, 'id'>) { setInteractions((current) => [{ ...input, id: `session-interaction-${current.length + 1}` }, ...current]); }
  function createConversation(clientId: string, processId?: string) { const now = new Date().toISOString(); const id = `session-chat-${conversations.length + 1}-${Date.now()}`; setConversations((current) => [{ id, clientId, processId, status: 'open', unread: false, unreadCount: 0, favorite: false, createdAt: now, updatedAt: now }, ...current]); return id; }
  function sendChatMessage(conversationId: string, body: string) { const now = new Date().toISOString(); setMessages((current) => [...current, { id: `session-message-${current.length + 1}-${Date.now()}`, conversationId, direction: 'outgoing', body, sentAt: now }]); setConversations((current) => current.map((conversation) => conversation.id === conversationId ? { ...conversation, updatedAt: now, unread: false, unreadCount: 0 } : conversation)); }
  function toggleChatFavorite(conversationId: string) { setConversations((current) => current.map((conversation) => conversation.id === conversationId ? { ...conversation, favorite: !conversation.favorite } : conversation)); }
  function markChatRead(conversationId: string) { setConversations((current) => current.map((conversation) => conversation.id === conversationId ? { ...conversation, unread: false, unreadCount: 0 } : conversation)); }
  function setChatStatus(conversationId: string, status: ChatConversationStatus) { setConversations((current) => current.map((conversation) => conversation.id === conversationId ? { ...conversation, status, updatedAt: new Date().toISOString() } : conversation)); }
  function createTask(input: Omit<ManagementTask, 'id' | 'createdAt'>) { setTasks((current) => [{ ...input, id: `session-task-${current.length + 1}`, createdAt: new Date().toISOString() }, ...current]); }
  function toggleTask(taskId: string) { setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: task.status === 'open' ? 'done' : 'open' } : task)); }
  function createFinancialEntry(input: Omit<FinancialEntry, 'id' | 'createdAt'>) { setFinancialEntries((current) => [{ ...input, id: `session-finance-${current.length + 1}`, createdAt: new Date().toISOString() }, ...current]); }

  let content = <ManagementDashboardPage clients={clients} processes={processes} documents={documents} interactions={interactions} conversations={conversations} tasks={tasks} financialEntries={financialEntries} />;
  if (path === '/app/clientes') content = <ClientsPage clients={clients} onCreateClient={createClient} />;
  else if (path.startsWith('/app/clientes/')) {
    const clientId = decodeURIComponent(path.slice('/app/clientes/'.length));
    content = <ClientDetailPage client={clients.find((client) => client.id === clientId)} processes={processes} interactions={interactions} tasks={tasks} conversations={conversations} financialEntries={financialEntries} />;
  }
  else if (path === '/app/processos') content = <ProcessesPage clients={clients} processes={processes} onCreateProcess={createProcess} />;
  else if (path.startsWith('/app/processos/')) {
    const processId = decodeURIComponent(path.slice('/app/processos/'.length));
    const process = processes.find((item) => item.id === processId);
    content = <ProcessDetailPage process={process} client={clients.find((client) => client.id === process?.clientId)} documents={documents} interactions={interactions} tasks={tasks} financialEntries={financialEntries} />;
  }
  else if (path === '/app/documentos') content = <DocumentsPage processes={processes} documents={documents} onCreateDocument={createDocument} onToggleReceived={toggleDocumentReceived} />;
  else if (path === '/app/atendimentos') content = <InteractionsPage clients={clients} processes={processes} interactions={interactions} onCreateInteraction={createInteraction} />;
  else if (path === '/app/chat') content = <ChatPage clients={clients} processes={processes} conversations={conversations} messages={messages} onCreateConversation={createConversation} onSendMessage={sendChatMessage} onToggleFavorite={toggleChatFavorite} onMarkRead={markChatRead} onSetStatus={setChatStatus} />;
  else if (path === '/app/tarefas') content = <TasksPage clients={clients} processes={processes} tasks={tasks} onCreateTask={createTask} onToggleTask={toggleTask} />;
  else if (path === '/app/agenda') content = <CalendarPage clients={clients} processes={processes} tasks={tasks} />;
  else if (path === '/app/financeiro') content = <FinancePage clients={clients} processes={processes} entries={financialEntries} onCreateEntry={createFinancialEntry} />;
  else if (path === '/app/relatorios') content = <ReportsPage clients={clients} processes={processes} documents={documents} tasks={tasks} financialEntries={financialEntries} interactions={interactions} conversations={conversations} />;
  else if (path === '/app/configuracoes') content = <SettingsPage />;

  const search = <GlobalSearch clients={clients} processes={processes} tasks={tasks} onNavigate={navigate} />;
  return <ManagementShell path={path} onNavigate={navigate} search={search}>{content}</ManagementShell>;
}
