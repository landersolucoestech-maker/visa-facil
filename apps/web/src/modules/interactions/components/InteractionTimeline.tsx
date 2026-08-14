import type { Client } from '../../clients/types/client';
import { PROCESS_STAGE_LABELS, type VisaProcess } from '../../processes/types/process';
import type { ServiceInteraction } from '../types/interaction';
import { INTERACTION_CHANNEL_LABELS } from './InteractionForm';

type InteractionTimelineProps = { clients: Client[]; processes: VisaProcess[]; interactions: ServiceInteraction[] };

export function InteractionTimeline({ clients, processes, interactions }: InteractionTimelineProps) {
  if (interactions.length === 0) return <div className="management-empty-state interaction-empty-state"><span className="interaction-empty-state__icon">AT</span><strong>Nenhum atendimento na sessão.</strong><span>Use o VisaChat para conversas contínuas ou registre aqui reuniões, ligações, e-mails e outros contatos relevantes.</span></div>;

  return <div className="interaction-timeline">{interactions.map((interaction) => {
    const client = clients.find((item) => item.id === interaction.clientId);
    const process = processes.find((item) => item.id === interaction.processId);
    return <article className="interaction-timeline__item" key={interaction.id}>
      <div className="interaction-timeline__rail"><span>{INTERACTION_CHANNEL_LABELS[interaction.channel]}</span><i /></div>
      <div className="interaction-timeline__content">
        <div className="interaction-timeline__header"><div><strong>{interaction.subject}</strong><small>{client?.fullName ?? 'Cliente não encontrado'} · {new Date(interaction.occurredAt).toLocaleString('pt-BR')}</small></div>{process && <span className="interaction-process-pill">{process.category} · {PROCESS_STAGE_LABELS[process.stage]}</span>}</div>
        <p>{interaction.notes}</p>
      </div>
    </article>;
  })}</div>;
}
