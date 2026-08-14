import type { Client } from '../../clients/types/client';
import { DESTINATION_LABELS, PROCESS_PRIORITY_LABELS, PROCESS_STAGE_LABELS, type VisaProcess } from '../types/process';

type ProcessTableProps = { clients: Client[]; processes: VisaProcess[] };

export function ProcessTable({ clients, processes }: ProcessTableProps) {
  if (processes.length === 0) return <div className="management-empty-state process-empty-state"><span className="process-empty-state__icon">PR</span><strong>Nenhum processo na sessão.</strong><span>Crie o primeiro processo para validar o fluxo operacional vinculado a um cliente.</span></div>;

  return <div className="management-table-wrap"><table className="management-table"><thead><tr><th>Cliente</th><th>Destino</th><th>Etapa</th><th>Prioridade</th><th>Data-alvo</th><th>Ação</th></tr></thead><tbody>{processes.map((process) => { const client = clients.find((item) => item.id === process.clientId); return <tr key={process.id}><td><strong>{client?.fullName ?? 'Cliente não encontrado'}</strong><small>{process.category}</small></td><td>{DESTINATION_LABELS[process.destination]}</td><td><span className="management-badge">{PROCESS_STAGE_LABELS[process.stage]}</span></td><td>{PROCESS_PRIORITY_LABELS[process.priority]}</td><td>{process.targetDate ? new Date(`${process.targetDate}T00:00:00`).toLocaleDateString('pt-BR') : '—'}</td><td><a className="management-inline-link" href={`/app/processos/${encodeURIComponent(process.id)}`}>Abrir processo →</a></td></tr>; })}</tbody></table></div>;
}
