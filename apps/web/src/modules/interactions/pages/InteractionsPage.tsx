import type { Client } from '../../clients/types/client';
import type { VisaProcess } from '../../processes/types/process';
import { InteractionForm } from '../components/InteractionForm';
import { InteractionTimeline } from '../components/InteractionTimeline';
import type { ServiceInteraction } from '../types/interaction';

type InteractionsPageProps = { clients: Client[]; processes: VisaProcess[]; interactions: ServiceInteraction[]; onCreateInteraction: (input: Omit<ServiceInteraction, 'id'>) => void; };

export function InteractionsPage({ clients, processes, interactions, onCreateInteraction }: InteractionsPageProps) {
  const whatsappCount = interactions.filter((interaction) => interaction.channel === 'whatsapp').length;
  const meetingCount = interactions.filter((interaction) => interaction.channel === 'meeting').length;
  const emailCount = interactions.filter((interaction) => interaction.channel === 'email').length;
  const linkedToProcess = interactions.filter((interaction) => interaction.processId).length;
  const linkedRate = interactions.length ? Math.round((linkedToProcess / interactions.length) * 100) : 0;
  const latest = interactions[0];
  const latestClient = clients.find((client) => client.id === latest?.clientId);

  return <section className="management-page interaction-page" aria-labelledby="interactions-title">
    <div className="management-page__heading management-page__heading--row">
      <div><span className="management-eyebrow">Relacionamento</span><h1 id="interactions-title">Atendimentos</h1><p>Use esta área para registrar contatos relevantes fora do fluxo contínuo do VisaChat: reuniões, ligações, e-mails, orientações e decisões importantes.</p></div>
      <div className="interaction-heading-actions"><a className="management-primary-button" href="/app/chat">Abrir VisaChat</a><span className="interaction-live-pill">Histórico da sessão</span></div>
    </div>

    <div className="interaction-channel-banner"><div><span className="management-eyebrow">Dois contextos, uma operação</span><h2>Conversa contínua no VisaChat. Marcos importantes em Atendimentos.</h2><p>O chat concentra troca de mensagens. Esta tela mantém o histórico resumido de eventos que precisam continuar visíveis no processo do cliente.</p></div><a href="/app/chat">Ir para a central de conversas →</a></div>

    <div className="interaction-summary-grid" aria-label="Resumo dos atendimentos">
      <article><span>Total</span><strong>{interactions.length}</strong><small>Registros manuais nesta sessão</small></article>
      <article><span>WhatsApp</span><strong>{whatsappCount}</strong><small>Contatos documentados deste canal</small></article>
      <article><span>Reuniões + e-mail</span><strong>{meetingCount + emailCount}</strong><small>{meetingCount} reunião(ões) · {emailCount} e-mail(s)</small></article>
      <article><span>Vinculados</span><strong>{linkedRate}%</strong><small>{linkedToProcess} registro(s) ligado(s) a processo</small></article>
    </div>

    <div className="interaction-overview-grid">
      <article className="interaction-overview-card"><span className="management-eyebrow">Última movimentação</span>{latest ? <><strong>{latest.subject}</strong><p>{latestClient?.fullName ?? 'Cliente não encontrado'} · {new Date(latest.occurredAt).toLocaleString('pt-BR')}</p></> : <><strong>Nenhum registro manual ainda</strong><p>O histórico começa assim que um atendimento relevante é registrado.</p></>}</article>
      <article className="interaction-overview-card interaction-overview-card--dark"><span className="management-eyebrow">Cobertura operacional</span><strong>{processes.length ? `${linkedToProcess}/${interactions.length || 0}` : '—'}</strong><p>Atendimentos vinculados a processos ajudam a preservar contexto entre relacionamento, documentos e execução.</p></article>
      <article className="interaction-overview-card"><span className="management-eyebrow">Próxima ação</span><strong>{clients.length ? 'Cliente pronto para atendimento' : 'Cadastre o primeiro cliente'}</strong><p>{clients.length ? 'Abra o VisaChat para conversar ou registre abaixo um marco relevante.' : 'Clientes são o ponto de partida para chat, processos e histórico.'}</p></article>
    </div>

    <div className="interaction-workspace-grid">
      <div>{clients.length === 0 ? <div className="interaction-prerequisite"><div><span className="management-eyebrow">Pré-requisito</span><h2>Cadastre um cliente antes do atendimento</h2><p>O histórico precisa estar sempre associado à pessoa atendida.</p></div><a className="management-primary-button" href="/app/clientes">Ir para Clientes</a></div> : <InteractionForm clients={clients} processes={processes} onCreateInteraction={onCreateInteraction} />}</div>
      <aside className="interaction-guide-card" aria-label="Fluxo recomendado"><span className="management-eyebrow">Quando registrar aqui?</span><h2>Marcos que merecem histórico</h2><p>Não replique cada mensagem do chat. Registre apenas fatos que precisam continuar visíveis para a operação.</p><div className="interaction-guide-list"><span><b>1</b> Reuniões e ligações</span><span><b>2</b> Decisões e orientações</span><span><b>3</b> Próximos passos relevantes</span><span><b>4</b> Contato por canal externo</span></div></aside>
    </div>

    <section className="interaction-history-card"><div className="interaction-history-card__heading"><div><span className="management-eyebrow">Histórico</span><h2>Linha do tempo operacional</h2></div><span>{interactions.length} registro(s)</span></div><InteractionTimeline clients={clients} processes={processes} interactions={interactions} /></section>
  </section>;
}
