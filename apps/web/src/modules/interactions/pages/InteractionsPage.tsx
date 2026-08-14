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
  const linkedRate = interactions.length ? Math.round((linkedToProcess / interactions.length) * 100) : 0;

  return <section className="management-page interaction-page" aria-labelledby="interactions-title">
    <div className="management-page__heading management-page__heading--row"><div><span className="management-eyebrow">Relacionamento</span><h1 id="interactions-title">Atendimentos</h1><p>Centralize contatos, reuniões e próximos passos do cliente em uma linha do tempo operacional.</p></div><span className="interaction-live-pill">Histórico da sessão</span></div>

    <div className="interaction-summary-grid" aria-label="Resumo dos atendimentos">
      <article><span>Total</span><strong>{interactions.length}</strong><small>Atendimentos registrados na sessão</small></article>
      <article><span>WhatsApp</span><strong>{whatsappCount}</strong><small>Contatos pelo principal canal</small></article>
      <article><span>Reuniões</span><strong>{meetingCount}</strong><small>Conversas registradas como reunião</small></article>
      <article><span>Vinculados</span><strong>{linkedRate}%</strong><small>{linkedToProcess} atendimento(s) ligado(s) a processo</small></article>
    </div>

    <div className="interaction-workspace-grid">
      <div>
        {clients.length === 0 ? <div className="interaction-prerequisite"><div><span className="management-eyebrow">Pré-requisito</span><h2>Cadastre um cliente antes do atendimento</h2><p>O histórico precisa estar sempre associado à pessoa atendida.</p></div><a className="management-primary-button" href="/app/clientes">Ir para Clientes</a></div> : <InteractionForm clients={clients} processes={processes} onCreateInteraction={onCreateInteraction} />}
      </div>
      <aside className="interaction-guide-card" aria-label="Fluxo recomendado"><span className="management-eyebrow">Fluxo recomendado</span><h2>Próximo passo sempre visível</h2><p>Registre o canal, o resumo da conversa e associe o processo quando houver. Isso mantém o atendimento rastreável sem inventar automações.</p><div className="interaction-guide-list"><span><b>1</b> Identifique o cliente</span><span><b>2</b> Registre o contato</span><span><b>3</b> Vincule o processo</span></div></aside>
    </div>

    <section className="interaction-history-card"><div className="interaction-history-card__heading"><div><span className="management-eyebrow">Histórico</span><h2>Linha do tempo</h2></div><span>{interactions.length} registro(s)</span></div><InteractionTimeline clients={clients} interactions={interactions} /></section>
  </section>;
}
