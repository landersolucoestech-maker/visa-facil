import { useState } from 'react';
import type { Client } from '../../clients/types/client';
import { ProcessForm } from '../components/ProcessForm';
import { ProcessTable } from '../components/ProcessTable';
import { PROCESS_STAGE_LABELS, type VisaProcess } from '../types/process';

type ProcessesPageProps = {
  clients: Client[];
  processes: VisaProcess[];
  onCreateProcess: (input: Omit<VisaProcess, 'id' | 'createdAt' | 'updatedAt'>) => void;
};

export function ProcessesPage({ clients, processes, onCreateProcess }: ProcessesPageProps) {
  const [showForm, setShowForm] = useState(false);
  const inProgress = processes.filter((process) => !['completed', 'cancelled'].includes(process.stage)).length;
  const completed = processes.filter((process) => process.stage === 'completed').length;
  const urgent = processes.filter((process) => process.priority === 'urgent').length;

  function createProcess(input: Omit<VisaProcess, 'id' | 'createdAt' | 'updatedAt'>) {
    onCreateProcess(input);
    setShowForm(false);
  }

  return <section className="management-page process-page" aria-labelledby="processes-title">
    <div className="management-page__heading management-page__heading--row"><div><span className="management-eyebrow">Operação</span><h1 id="processes-title">Processos</h1><p>Acompanhe solicitações de visto desde o diagnóstico inicial até a conclusão do atendimento.</p></div><button className="management-primary-button" type="button" disabled={clients.length === 0} onClick={() => setShowForm((value) => !value)}>{showForm ? 'Fechar cadastro' : 'Novo processo'}</button></div>

    <div className="process-summary-grid" aria-label="Resumo de processos">
      <article><span>Total</span><strong>{processes.length}</strong><small>Processos criados nesta sessão</small></article>
      <article><span>Em andamento</span><strong>{inProgress}</strong><small>Processos ainda não concluídos</small></article>
      <article><span>Urgentes</span><strong>{urgent}</strong><small>Prioridade operacional máxima</small></article>
      <article><span>Concluídos</span><strong>{completed}</strong><small>Processos finalizados</small></article>
    </div>

    {clients.length === 0 && <div className="process-prerequisite"><div><span className="management-eyebrow">Pré-requisito</span><h2>Cadastre um cliente primeiro</h2><p>Todo processo precisa nascer vinculado a um cliente para evitar registros órfãos.</p></div><a className="management-primary-button" href="/app/clientes">Ir para Clientes</a></div>}
    {showForm && clients.length > 0 && <ProcessForm clients={clients} onCreateProcess={createProcess} onCancel={() => setShowForm(false)} />}

    <section className="process-list-card" aria-labelledby="process-list-title"><div className="process-list-card__heading"><div><span className="management-eyebrow">Acompanhamento</span><h2 id="process-list-title">Processos registrados</h2></div><span>{processes.length} registro(s)</span></div><div className="process-stage-strip" aria-label="Sequência de etapas">{Object.values(PROCESS_STAGE_LABELS).map((label) => <span key={label}>{label}</span>)}</div><ProcessTable clients={clients} processes={processes} /></section>
  </section>;
}
