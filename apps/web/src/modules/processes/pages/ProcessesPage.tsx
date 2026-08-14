import { useMemo, useState } from 'react';
import type { Client } from '../../clients/types/client';
import { ProcessForm } from '../components/ProcessForm';
import { ProcessTable } from '../components/ProcessTable';
import { DESTINATION_LABELS, PROCESS_PRIORITY_LABELS, PROCESS_STAGE_LABELS, type ProcessPriority, type ProcessStage, type VisaDestination, type VisaProcess } from '../types/process';

type ProcessesPageProps = {
  clients: Client[];
  processes: VisaProcess[];
  onCreateProcess: (input: Omit<VisaProcess, 'id' | 'createdAt' | 'updatedAt'>) => void;
  showForm: boolean;
  onCloseForm: () => void;
};

export function ProcessesPage({ clients, processes, onCreateProcess, showForm, onCloseForm }: ProcessesPageProps) {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<ProcessStage | 'all'>('all');
  const [destination, setDestination] = useState<VisaDestination | 'all'>('all');
  const [priority, setPriority] = useState<ProcessPriority | 'all'>('all');
  const inProgress = processes.filter((process) => !['completed', 'cancelled'].includes(process.stage)).length;
  const completed = processes.filter((process) => process.stage === 'completed').length;
  const urgent = processes.filter((process) => process.priority === 'urgent').length;
  const filteredProcesses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return processes.filter((process) => {
      const client = clients.find((item) => item.id === process.clientId);
      const matchesQuery = !normalized || `${client?.fullName ?? ''} ${process.category} ${DESTINATION_LABELS[process.destination]} ${PROCESS_STAGE_LABELS[process.stage]}`.toLowerCase().includes(normalized);
      return matchesQuery && (stage === 'all' || process.stage === stage) && (destination === 'all' || process.destination === destination) && (priority === 'all' || process.priority === priority);
    });
  }, [clients, destination, priority, processes, query, stage]);

  function createProcess(input: Omit<VisaProcess, 'id' | 'createdAt' | 'updatedAt'>) {
    onCreateProcess(input);
    onCloseForm();
  }

  return <section className="management-page process-page" aria-labelledby="processes-title">
    <div className="management-page__heading"><div><span className="management-eyebrow">Operação</span><h1 id="processes-title">Processos</h1><p>Acompanhe solicitações de visto desde o diagnóstico inicial até a conclusão do atendimento.</p></div></div>

    <div className="process-summary-grid" aria-label="Resumo de processos">
      <article><span>Total</span><strong>{processes.length}</strong><small>Processos criados nesta sessão</small></article>
      <article><span>Em andamento</span><strong>{inProgress}</strong><small>Processos ainda não concluídos</small></article>
      <article><span>Urgentes</span><strong>{urgent}</strong><small>Prioridade operacional máxima</small></article>
      <article><span>Concluídos</span><strong>{completed}</strong><small>Processos finalizados</small></article>
    </div>

    {clients.length === 0 && <div className="process-prerequisite"><div><span className="management-eyebrow">Pré-requisito</span><h2>Cadastre um cliente primeiro</h2><p>Todo processo precisa nascer vinculado a um cliente para evitar registros órfãos.</p></div><a className="management-primary-button" href="/app/clientes">Ir para Clientes</a></div>}
    {showForm && clients.length > 0 && <ProcessForm clients={clients} onCreateProcess={createProcess} onCancel={onCloseForm} />}

    <section className="process-list-card" aria-labelledby="process-list-title"><div className="process-list-card__heading"><div><span className="management-eyebrow">Acompanhamento</span><h2 id="process-list-title">Processos registrados</h2></div><span>{filteredProcesses.length} resultado(s)</span></div><div className="process-filter-bar"><label><span>Buscar</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cliente, categoria, destino ou etapa" /></label><label><span>Etapa</span><select value={stage} onChange={(event) => setStage(event.target.value as ProcessStage | 'all')}><option value="all">Todas</option>{Object.entries(PROCESS_STAGE_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Destino</span><select value={destination} onChange={(event) => setDestination(event.target.value as VisaDestination | 'all')}><option value="all">Todos</option>{Object.entries(DESTINATION_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Prioridade</span><select value={priority} onChange={(event) => setPriority(event.target.value as ProcessPriority | 'all')}><option value="all">Todas</option>{Object.entries(PROCESS_PRIORITY_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><div className="process-stage-strip" aria-label="Sequência de etapas">{Object.values(PROCESS_STAGE_LABELS).map((label) => <span key={label}>{label}</span>)}</div><ProcessTable clients={clients} processes={filteredProcesses} /></section>
  </section>;
}
