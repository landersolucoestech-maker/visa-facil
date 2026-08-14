import type { Client } from '../../clients/types/client';
import type { VisaProcess } from '../../processes/types/process';
import type { DocumentItem } from '../../documents/types/document';
import type { ManagementTask } from '../../tasks/types/task';
import type { FinancialEntry } from '../../finance/types/finance';

type ReportsPageProps = { clients: Client[]; processes: VisaProcess[]; documents: DocumentItem[]; tasks: ManagementTask[]; financialEntries: FinancialEntry[] };

export function ReportsPage({ clients, processes, documents, tasks, financialEntries }: ReportsPageProps) {
  const revenue = financialEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amountCents, 0);
  const expense = financialEntries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amountCents, 0);
  const cards = [
    ['Clientes cadastrados', clients.length],
    ['Processos abertos', processes.filter((process) => !['completed','cancelled'].includes(process.stage)).length],
    ['Documentos pendentes', documents.filter((item) => item.required && !item.received).length],
    ['Tarefas abertas', tasks.filter((task) => task.status === 'open').length],
  ];
  return <section className="management-page reports-page" aria-labelledby="reports-title">
    <div className="management-page__heading"><span className="management-eyebrow">Análise</span><h1 id="reports-title">Relatórios</h1><p>Resumo consolidado do que foi registrado na sessão atual do frontend.</p></div>
    <div className="reports-grid">{cards.map(([label,value]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <div className="reports-finance"><div><span>Receitas</span><strong>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(revenue/100)}</strong></div><div><span>Despesas</span><strong>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(expense/100)}</strong></div><div><span>Resultado</span><strong>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((revenue-expense)/100)}</strong></div></div>
    <div className="management-session-note">Exportação, filtros avançados e relatórios persistentes serão conectados somente quando existir backend autorizado.</div>
  </section>;
}
