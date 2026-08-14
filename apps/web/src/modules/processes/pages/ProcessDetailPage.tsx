import type { Client } from '../../clients/types/client';
import type { DocumentItem } from '../../documents/types/document';
import type { ServiceInteraction } from '../../interactions/types/interaction';
import type { ManagementTask } from '../../tasks/types/task';
import type { FinancialEntry } from '../../finance/types/finance';
import { DESTINATION_LABELS, PROCESS_PRIORITY_LABELS, PROCESS_STAGE_LABELS, type VisaProcess } from '../types/process';

type ProcessDetailPageProps = {
  process?: VisaProcess;
  client?: Client;
  documents: DocumentItem[];
  interactions: ServiceInteraction[];
  tasks: ManagementTask[];
  financialEntries: FinancialEntry[];
};

function money(valueCents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueCents / 100);
}

export function ProcessDetailPage({ process, client, documents, interactions, tasks, financialEntries }: ProcessDetailPageProps) {
  if (!process) return <section className="management-page process-detail-page"><div className="management-empty-state"><strong>Processo não encontrado nesta sessão.</strong><span>Os dados temporários são perdidos ao recarregar a página.</span><a className="management-primary-button" href="/app/processos">Voltar para Processos</a></div></section>;

  const processDocuments = documents.filter((item) => item.processId === process.id);
  const requiredDocuments = processDocuments.filter((item) => item.required);
  const receivedRequired = requiredDocuments.filter((item) => item.received).length;
  const documentRate = requiredDocuments.length ? Math.round((receivedRequired / requiredDocuments.length) * 100) : 0;
  const processTasks = tasks.filter((task) => task.processId === process.id);
  const openTasks = processTasks.filter((task) => task.status === 'open').length;
  const processInteractions = interactions.filter((interaction) => interaction.processId === process.id);
  const processFinancial = financialEntries.filter((entry) => entry.processId === process.id);
  const revenue = processFinancial.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amountCents, 0);
  const expense = processFinancial.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amountCents, 0);

  return <section className="management-page process-detail-page" aria-labelledby="process-detail-title">
    <div className="process-detail-hero"><div><span className="management-eyebrow">Processo</span><h1 id="process-detail-title">{process.category}</h1><p>{client?.fullName ?? 'Cliente não encontrado'} · {DESTINATION_LABELS[process.destination]}</p></div><div className="process-detail-actions"><span className="management-badge">{PROCESS_STAGE_LABELS[process.stage]}</span><a className="management-secondary-button" href="/app/processos">← Processos</a><a className="management-primary-button" href="/app/documentos">Documentos</a></div></div>

    <div className="process-detail-kpis"><article><span>Etapa atual</span><strong>{PROCESS_STAGE_LABELS[process.stage]}</strong><small>Prioridade {PROCESS_PRIORITY_LABELS[process.priority].toLowerCase()}</small></article><article><span>Documentação</span><strong>{documentRate}%</strong><small>{receivedRequired}/{requiredDocuments.length} obrigatórios recebidos</small></article><article><span>Tarefas abertas</span><strong>{openTasks}</strong><small>{processTasks.length} vinculada(s)</small></article><article><span>Resultado projetado</span><strong>{money(revenue - expense)}</strong><small>Receitas menos despesas vinculadas</small></article></div>

    <div className="process-detail-grid">
      <section className="process-detail-card"><span className="management-eyebrow">Dados do processo</span><h2>Visão geral</h2><dl className="process-detail-data"><div><dt>Destino</dt><dd>{DESTINATION_LABELS[process.destination]}</dd></div><div><dt>Categoria</dt><dd>{process.category}</dd></div><div><dt>Prioridade</dt><dd>{PROCESS_PRIORITY_LABELS[process.priority]}</dd></div><div><dt>Data-alvo</dt><dd>{process.targetDate ? new Date(`${process.targetDate}T00:00:00`).toLocaleDateString('pt-BR') : 'Sem data definida'}</dd></div></dl><p className="process-detail-notes">{process.notes || 'Nenhuma observação registrada.'}</p></section>

      <section className="process-detail-card"><div className="process-detail-card__heading"><div><span className="management-eyebrow">Checklist</span><h2>Documentos</h2></div><a href="/app/documentos">Abrir checklist →</a></div>{processDocuments.length ? <div className="process-detail-list">{processDocuments.map((document) => <div key={document.id}><span className={document.received ? 'is-complete' : ''}>{document.received ? '✓' : '!'}</span><div><strong>{document.title}</strong><small>{document.required ? 'Obrigatório' : 'Opcional'}</small></div></div>)}</div> : <div className="process-detail-empty">Nenhum documento adicionado ao checklist.</div>}</section>

      <section className="process-detail-card"><div className="process-detail-card__heading"><div><span className="management-eyebrow">Execução</span><h2>Tarefas</h2></div><a href="/app/tarefas">Abrir tarefas →</a></div>{processTasks.length ? <div className="process-detail-list">{processTasks.slice(0, 5).map((task) => <div key={task.id}><span className={task.status === 'done' ? 'is-complete' : ''}>{task.status === 'done' ? '✓' : '•'}</span><div><strong>{task.title}</strong><small>{task.dueDate ? new Date(`${task.dueDate}T00:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo'}</small></div></div>)}</div> : <div className="process-detail-empty">Nenhuma tarefa vinculada.</div>}</section>

      <section className="process-detail-card"><div className="process-detail-card__heading"><div><span className="management-eyebrow">Relacionamento</span><h2>Atendimentos</h2></div><a href="/app/atendimentos">Abrir histórico →</a></div>{processInteractions.length ? <div className="process-detail-list">{processInteractions.slice(0, 5).map((interaction) => <div key={interaction.id}><span>AT</span><div><strong>{interaction.subject}</strong><small>{new Date(interaction.occurredAt).toLocaleString('pt-BR')}</small></div></div>)}</div> : <div className="process-detail-empty">Nenhum atendimento vinculado.</div>}</section>
    </div>
  </section>;
}
