import type { Client } from '../../clients/types/client';
import type { VisaProcess } from '../../processes/types/process';
import { InteractionForm } from '../components/InteractionForm';
import { InteractionTimeline } from '../components/InteractionTimeline';
import type { ServiceInteraction } from '../types/interaction';

type InteractionsPageProps = { clients: Client[]; processes: VisaProcess[]; interactions: ServiceInteraction[]; onCreateInteraction: (input: Omit<ServiceInteraction, 'id'>) => void; };

export function InteractionsPage({ clients, processes, interactions, onCreateInteraction }: InteractionsPageProps) {
  const whatsappCount = interactions.filter((interaction) => interaction.channel === 'whatsapp').length;
  const meetingCount = interactions.filter((interaction) => interaction.channel === 'meeting').length;
  const linkedToProcess = interactions.filter((interaction) => interaction.processId).length;

  return <section className="management-page interaction-page" aria-labelledby="interactions-title"><div className="management-page__heading"><span className="management-eyebrow">Relacionamento</span><h1 id="interactions-title">Atendimentos</h1><p>Centralize o histórico de contatos com cada cliente e mantenha os próximos passos do atendimento visíveis.</p></div>
  <div className="interaction-summary-grid"><article><span>Total</span><strong>{interactions.length}</strong><small>Atendimentos registrados na sessão</small></article><article><span>WhatsApp</span><strong>{whatsappCount}</strong><small>Contatos pelo principal canal</small></article><article><span>Reuniões</span><strong>{meetingCount}</strong><small>Atendimentos registrados como reunião</small></article><article><span>Com processo</span><strong>{linkedToProcess}</strong><small>Registros vinculados a um processo</small></article></div>
  {clients.length === 0 ? <div className="interaction-prerequisite"><div><span className="management-eyebrow">Pré-requisito</span><h2>Cadastre um cliente antes do atendimento</h2><p>O histórico precisa estar sempre associado à pessoa atendida.</p></div><a className="management-primary-button" href="/app/clientes">Ir para Clientes</a></div> : <InteractionForm clients={clients} processes={processes} onCreateInteraction={onCreateInteraction} />}
  <section className="interaction-history-card"><div className="interaction-history-card__heading"><div><span className="management-eyebrow">Histórico</span><h2>Linha do tempo</h2></div><span>{interactions.length} registro(s)</span></div><InteractionTimeline clients={clients} interactions={interactions} /></section></section>;
}
