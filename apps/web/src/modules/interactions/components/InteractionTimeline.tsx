import type { Client } from '../../clients/types/client';
import type { ServiceInteraction } from '../types/interaction';
import { INTERACTION_CHANNEL_LABELS } from './InteractionForm';

type InteractionTimelineProps = { clients: Client[]; interactions: ServiceInteraction[] };

export function InteractionTimeline({ clients, interactions }: InteractionTimelineProps) {
  if (interactions.length === 0) return <div className="management-empty-state interaction-empty-state"><span className="interaction-empty-state__icon">AT</span><strong>Nenhum atendimento na sessão.</strong><span>Registre o primeiro contato para começar a formar o histórico do cliente.</span></div>;
  return <div className="management-timeline">{interactions.map((interaction) => { const client = clients.find((item) => item.id === interaction.clientId); return <article className="management-timeline__item interaction-timeline__item" key={interaction.id}><span>{INTERACTION_CHANNEL_LABELS[interaction.channel]}</span><div><strong>{interaction.subject}</strong><small>{client?.fullName ?? 'Cliente não encontrado'} · {new Date(interaction.occurredAt).toLocaleString('pt-BR')}</small><p>{interaction.notes}</p></div></article>; })}</div>;
}
