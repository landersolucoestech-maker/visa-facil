import type { Client } from '../../clients/types/client';
import type { VisaProcess } from '../../processes/types/process';
import type { DocumentItem } from '../../documents/types/document';
import type { ManagementTask } from '../../tasks/types/task';
import type { FinancialEntry } from '../../finance/types/finance';
import type { ServiceInteraction } from '../../interactions/types/interaction';
import type { ChatConversation } from '../../chat/types/chat';
import { DESTINATION_LABELS, PROCESS_STAGE_LABELS } from '../../processes/types/process';

type ReportsPageProps = { clients: Client[]; processes: VisaProcess[]; documents: DocumentItem[]; tasks: ManagementTask[]; financialEntries: FinancialEntry[]; interactions: ServiceInteraction[]; conversations: ChatConversation[] };
function money(valueCents: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueCents / 100); }

export function ReportsPage({ clients, processes, documents, tasks, financialEntries, interactions, conversations }: ReportsPageProps) {
  const openProcesses = processes.filter((process) => !['completed', 'cancelled'].includes(process.stage)).length;
  const pendingDocuments = documents.filter((item) => item.required && !item.received).length;
  const requiredDocuments = documents.filter((item) => item.required).length;
  const receivedRequired = requiredDocuments - pendingDocuments;
  const documentRate = requiredDocuments ? Math.round((receivedRequired / requiredDocuments) * 100) : 0;
  const openTasks = tasks.filter((task) => task.status === 'open').length;
  const doneTasks = tasks.filter((task) => task.status === 'done').length;
  const taskRate = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const revenue = financialEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amountCents, 0);
  const expense = financialEntries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amountCents, 0);
  const realizedRevenue = financialEntries.filter((entry) => entry.type === 'income' && entry.status === 'paid').reduce((sum, entry) => sum + entry.amountCents, 0);
  const realizedExpense = financialEntries.filter((entry) => entry.type === 'expense' && entry.status === 'paid').reduce((sum, entry) => sum + entry.amountCents, 0);
  const unreadChats = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  const stageDistribution = Object.entries(PROCESS_STAGE_LABELS).map(([stage, label]) => ({ label, count: processes.filter((process) => process.stage === stage).length })).filter((item) => item.count > 0);
  const destinationDistribution = Object.entries(DESTINATION_LABELS).map(([destination, label]) => ({ label, count: processes.filter((process) => process.destination === destination).length })).filter((item) => item.count > 0);
  const maxStage = Math.max(1, ...stageDistribution.map((item) => item.count));
  const maxDestination = Math.max(1, ...destinationDistribution.map((item) => item.count));

  return <section className="management-page reports-page" aria-labelledby="reports-title">
    <div className="management-page__heading management-page__heading--row"><div><span className="management-eyebrow">Análise</span><h1 id="reports-title">Relatórios</h1><p>Leitura consolidada do estado atual da operação registrada no frontend desta sessão.</p></div><span className="management-status">Visão consolidada</span></div>

    <div className="reports-hero"><div><span className="management-eyebrow">Pulso operacional</span><strong>{openProcesses} processo(s) em andamento</strong><p>{pendingDocuments} documento(s) obrigatório(s) pendente(s), {openTasks} tarefa(s) aberta(s) e {unreadChats} mensagem(ns) não lida(s) no VisaChat.</p></div><div className="reports-hero__rates"><article><span>Documentação</span><strong>{documentRate}%</strong><small>Obrigatórios recebidos</small></article><article><span>Execução</span><strong>{taskRate}%</strong><small>Tarefas concluídas</small></article><article><span>Atendimentos</span><strong>{interactions.length}</strong><small>Marcos registrados</small></article></div></div>

    <div className="reports-grid"><article><span>Clientes</span><strong>{clients.length}</strong><small>Cadastros da sessão</small></article><article><span>Processos abertos</span><strong>{openProcesses}</strong><small>{processes.length} processo(s) no total</small></article><article><span>Docs. pendentes</span><strong>{pendingDocuments}</strong><small>{requiredDocuments} obrigatório(s)</small></article><article><span>Tarefas abertas</span><strong>{openTasks}</strong><small>{doneTasks} concluída(s)</small></article></div>

    <div className="reports-analysis-grid">
      <section className="reports-panel"><div className="reports-panel__heading"><div><span className="management-eyebrow">Pipeline</span><h2>Processos por etapa</h2></div><a href="/app/processos">Abrir processos →</a></div>{stageDistribution.length ? <div className="reports-bars">{stageDistribution.map((item) => <div key={item.label}><span>{item.label}</span><div><i style={{ width: `${Math.max(8, (item.count / maxStage) * 100)}%` }} /></div><strong>{item.count}</strong></div>)}</div> : <div className="reports-empty">Nenhum processo registrado.</div>}</section>
      <section className="reports-panel"><div className="reports-panel__heading"><div><span className="management-eyebrow">Destinos</span><h2>Distribuição por país/região</h2></div></div>{destinationDistribution.length ? <div className="reports-bars reports-bars--red">{destinationDistribution.map((item) => <div key={item.label}><span>{item.label}</span><div><i style={{ width: `${Math.max(8, (item.count / maxDestination) * 100)}%` }} /></div><strong>{item.count}</strong></div>)}</div> : <div className="reports-empty">Nenhum destino registrado.</div>}</section>
    </div>

    <section className="reports-finance-card"><div className="reports-panel__heading"><div><span className="management-eyebrow">Financeiro</span><h2>Projetado x realizado</h2></div><a href="/app/financeiro">Abrir financeiro →</a></div><div className="reports-finance"><div><span>Receitas projetadas</span><strong>{money(revenue)}</strong><small>Inclui previsto e pago</small></div><div><span>Despesas projetadas</span><strong>{money(expense)}</strong><small>Inclui previsto e pago</small></div><div><span>Resultado projetado</span><strong>{money(revenue - expense)}</strong><small>Receitas menos despesas</small></div><div><span>Resultado realizado</span><strong>{money(realizedRevenue - realizedExpense)}</strong><small>Somente movimentações pagas</small></div></div></section>

    <div className="management-session-note">Os relatórios refletem exclusivamente os dados temporários desta sessão. Exportação, histórico persistente e comparativos por período ficam reservados para uma futura camada de dados autorizada.</div>
  </section>;
}
