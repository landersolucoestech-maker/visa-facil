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
import { NotificationCenter } from '../notifications/components/NotificationCenter';
import type { Client, ClientStatus } from '../clients/types/client';
import type { VisaProcess } from '../processes/types/process';
import type { DocumentItem } from '../documents/types/document';
import type { ServiceInteraction } from '../interactions/types/interaction';
import type { ChatConversation, ChatConversationStatus, ChatMessage } from '../chat/types/chat';
import type { ManagementTask } from '../tasks/types/task';
import type { FinancialEntry } from '../finance/types/finance';

const deploymentBase = import.meta.env.BASE_URL.replace(/\/$/, '');
function normalizePath(pathname = window.location.pathname) { let normalized = pathname.replace(/\/+$/, '') || '/'; if (deploymentBase && deploymentBase !== '/' && (normalized === deploymentBase || normalized.startsWith(`${deploymentBase}/`))) normalized = normalized.slice(deploymentBase.length) || '/'; return normalized === '/' ? '/app' : normalized; }
function toBrowserPath(appPath: string) { return !deploymentBase || deploymentBase === '/' ? appPath : `${deploymentBase}${appPath}`; }
type ClientUpdate = Partial<Pick<Client, 'fullName' | 'email' | 'phone' | 'status' | 'notes'>>;
type ProcessUpdate = Partial<Pick<VisaProcess, 'destination' | 'category' | 'stage' | 'priority' | 'targetDate' | 'notes'>>;
type TaskUpdate = Partial<Pick<ManagementTask, 'title' | 'clientId' | 'processId' | 'dueDate' | 'priority' | 'notes'>>;
type FinancialUpdate = Partial<Pick<FinancialEntry, 'description' | 'amountCents' | 'type' | 'status' | 'clientId' | 'processId' | 'dueDate'>>;

export function ManagementApp() {
  const [path, setPath] = useState(normalizePath);
  const [clients, setClients] = useState<Client[]>([]); const [processes, setProcesses] = useState<VisaProcess[]>([]); const [documents, setDocuments] = useState<DocumentItem[]>([]); const [interactions, setInteractions] = useState<ServiceInteraction[]>([]); const [conversations, setConversations] = useState<ChatConversation[]>([]); const [messages, setMessages] = useState<ChatMessage[]>([]); const [tasks, setTasks] = useState<ManagementTask[]>([]); const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [showClientForm, setShowClientForm] = useState(false); const [showProcessForm, setShowProcessForm] = useState(false); const [showTaskForm, setShowTaskForm] = useState(false); const [showFinanceForm, setShowFinanceForm] = useState(false);
  function navigate(nextPath: string) { if (nextPath === path) return; window.history.pushState({}, '', toBrowserPath(nextPath)); setPath(nextPath); window.scrollTo({ top: 0, behavior: 'instant' }); }
  useEffect(() => { const handlePopState = () => setPath(normalizePath()); const handleDocumentClick = (event: MouseEvent) => { if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; const target = event.target as Element | null; const anchor = target?.closest('a[href^="/app"]') as HTMLAnchorElement | null; if (!anchor || anchor.target === '_blank') return; const url = new URL(anchor.href, window.location.origin); if (url.origin !== window.location.origin) return; const nextPath = normalizePath(url.pathname); if (!nextPath.startsWith('/app')) return; event.preventDefault(); window.history.pushState({}, '', toBrowserPath(nextPath)); setPath(nextPath); window.scrollTo({ top: 0, behavior: 'instant' }); }; window.addEventListener('popstate', handlePopState); document.addEventListener('click', handleDocumentClick); return () => { window.removeEventListener('popstate', handlePopState); document.removeEventListener('click', handleDocumentClick); }; }, []);
  function createClient(input: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) { const now = new Date().toISOString(); setClients((current) => [{ ...input, id: `session-client-${current.length + 1}`, createdAt: now, updatedAt: now }, ...current]); }
  function updateClient(clientId: string, patch: ClientUpdate) { const now = new Date().toISOString(); setClients((current) => current.map((client) => client.id === clientId ? { ...client, ...patch, updatedAt: now } : client)); }
  function updateClientStatus(clientId: string, status: ClientStatus) { updateClient(clientId, { status }); }
  function createProcess(input: Omit<VisaProcess, 'id' | 'createdAt' | 'updatedAt'>) { const now = new Date().toISOString(); setProcesses((current) => [{ ...input, id: `session-process-${current.length + 1}`, createdAt: now, updatedAt: now }, ...current]); }
  function updateProcess(processId: string, patch: ProcessUpdate) { const now = new Date().toISOString(); setProcesses((current) => current.map((process) => process.id === processId ? { ...process, ...patch, updatedAt: now } : process)); }
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
  function updateTask(taskId: string, patch: TaskUpdate) { setTasks((current) => current.map((task) => task.id === taskId ? { ...task, ...patch } : task)); }
  function createFinancialEntry(input: Omit<FinancialEntry, 'id' | 'createdAt'>) { setFinancialEntries((current) => [{ ...input, id: `session-finance-${current.length + 1}`, createdAt: new Date().toISOString() }, ...current]); }
  function updateFinancialEntry(entryId: string, patch: FinancialUpdate) { setFinancialEntries((current) => current.map((entry) => entry.id === entryId ? { ...entry, ...patch } : entry)); }

  let content = <ManagementDashboardPage clients={clients} processes={processes} documents={documents} interactions={interactions} conversations={conversations} tasks={tasks} financialEntries={financialEntries} />;
  if (path === '/app/clientes') content = <ClientsPage clients={clients} onCreateClient={createClient} onUpdateClient={updateClient} showForm={showClientForm} onCloseForm={() => setShowClientForm(false)} />;
  else if (path.startsWith('/app/clientes/')) { const clientId = decodeURIComponent(path.slice('/app/clientes/'.length)); content = <ClientDetailPage client={clients.find((client) => client.id === clientId)} processes={processes} interactions={interactions} tasks={tasks} conversations={conversations} financialEntries={financialEntries} onUpdateStatus={updateClientStatus} onUpdateClient={updateClient} />; }
  else if (path === '/app/processos') content = <ProcessesPage clients={clients} processes={processes} onCreateProcess={createProcess} onUpdateProcess={updateProcess} showForm={showProcessForm} onCloseForm={() => setShowProcessForm(false)} />;
  else if (path.startsWith('/app/processos/')) { const processId = decodeURIComponent(path.slice('/app/processos/'.length)); const process = processes.find((item) => item.id === processId); content = <ProcessDetailPage process={process} client={clients.find((client) => client.id === process?.clientId)} documents={documents} interactions={interactions} tasks={tasks} financialEntries={financialEntries} onUpdateProcess={updateProcess} />; }
  else if (path === '/app/documentos') content = <DocumentsPage processes={processes} documents={documents} onCreateDocument={createDocument} onToggleReceived={toggleDocumentReceived} />;
  else if (path === '/app/atendimentos') content = <InteractionsPage clients={clients} processes={processes} interactions={interactions} onCreateInteraction={createInteraction} />;
  else if (path === '/app/chat') content = <ChatPage clients={clients} processes={processes} conversations={conversations} messages={messages} onCreateConversation={createConversation} onSendMessage={sendChatMessage} onToggleFavorite={toggleChatFavorite} onMarkRead={markChatRead} onSetStatus={setChatStatus} />;
  else if (path === '/app/tarefas') content = <TasksPage clients={clients} processes={processes} tasks={tasks} onCreateTask={createTask} onToggleTask={toggleTask} onUpdateTask={updateTask} showForm={showTaskForm} onCloseForm={() => setShowTaskForm(false)} />;
  else if (path === '/app/agenda') content = <CalendarPage clients={clients} processes={processes} tasks={tasks} />;
  else if (path === '/app/financeiro') content = <FinancePage clients={clients} processes={processes} entries={financialEntries} onCreateEntry={createFinancialEntry} onUpdateEntry={updateFinancialEntry} showForm={showFinanceForm} onCloseForm={() => setShowFinanceForm(false)} />;
  else if (path === '/app/relatorios') content = <ReportsPage clients={clients} processes={processes} documents={documents} tasks={tasks} financialEntries={financialEntries} interactions={interactions} conversations={conversations} />;
  else if (path === '/app/configuracoes') content = <SettingsPage />;

  let createAction = null;
  if (path === '/app/clientes') createAction = <button className="management-primary-button" type="button" onClick={() => setShowClientForm(true)}>Novo cliente</button>;
  else if (path === '/app/processos') createAction = <button className="management-primary-button" type="button" disabled={clients.length === 0} onClick={() => setShowProcessForm(true)}>Novo processo</button>;
  else if (path === '/app/tarefas') createAction = <button className="management-primary-button" type="button" onClick={() => setShowTaskForm(true)}>Adicionar tarefa</button>;
  else if (path === '/app/financeiro') createAction = <button className="management-primary-button" type="button" onClick={() => setShowFinanceForm(true)}>Adicionar lançamento</button>;
  const topbarTools = <div className="management-topbar__actions">{createAction}<NotificationCenter tasks={tasks} conversations={conversations} documents={documents} onNavigate={navigate} /></div>;
  return <ManagementShell path={path} onNavigate={navigate} tools={topbarTools}>{content}</ManagementShell>;
}
