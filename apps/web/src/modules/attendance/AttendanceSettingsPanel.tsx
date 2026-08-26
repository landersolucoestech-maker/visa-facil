import { useEffect, useMemo, useState } from 'react';
import type { OperationalTeamMember } from '../../shared/operationalSessionStore';
import {
  ROUTING_STRATEGIES,
  VISACHAT_PRIORITIES,
  getVisaChatSettings,
  saveVisaChatSettings,
  type EscalationRule,
  type ReplyTemplate,
  type SlaPolicy,
  type SupportQueue,
  type VisaChatSettings,
} from './attendanceSettings';
import './attendanceSettings.css';

type SettingsSection = 'general' | 'hours' | 'messages' | 'menu' | 'queues' | 'routing' | 'escalation' | 'templates' | 'notifications';

type Props = {
  teamMembers: OperationalTeamMember[];
  onClose: () => void;
};

const SECTIONS: Array<{ id: SettingsSection; label: string; description: string }> = [
  { id: 'general', label: 'Geral', description: 'Identidade e comportamento básico' },
  { id: 'hours', label: 'Horários', description: 'Janelas de atendimento' },
  { id: 'messages', label: 'Mensagens automáticas', description: 'Textos e gatilhos configuráveis' },
  { id: 'menu', label: 'Menu inicial', description: 'Triagem e opções de entrada' },
  { id: 'queues', label: 'Filas', description: 'Setores, membros e supervisores' },
  { id: 'routing', label: 'Roteamento e SLA', description: 'Distribuição e metas de resposta' },
  { id: 'escalation', label: 'Escalonamento', description: 'Regras preparadas para execução backend' },
  { id: 'templates', label: 'Templates', description: 'Respostas rápidas dos atendentes' },
  { id: 'notifications', label: 'Notificações', description: 'Alertas operacionais do VisaChat' },
];

const routingLabel: Record<(typeof ROUTING_STRATEGIES)[number], string> = {
  manual: 'Manual',
  'round-robin': 'Round-robin',
  'least-loaded': 'Menor carga',
};

const escalationLabel: Record<EscalationRule['action'], string> = {
  'notify-supervisor': 'Notificar supervisor',
  'raise-priority': 'Elevar prioridade',
  'transfer-supervisor': 'Transferir para supervisor',
};

function SettingsSwitch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="visachat-settings-switch"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span aria-hidden="true" /><b>{label}</b></label>;
}

function SectionIntro({ title, description }: { title: string; description: string }) {
  return <div className="visachat-settings-section-intro"><div><span>VISACHAT</span><h2>{title}</h2><p>{description}</p></div></div>;
}

export function AttendanceSettingsPanel({ teamMembers, onClose }: Props) {
  const [section, setSection] = useState<SettingsSection>('general');
  const [settings, setSettings] = useState<VisaChatSettings>(() => getVisaChatSettings());
  const [saveState, setSaveState] = useState<'saved' | 'invalid'>('saved');

  const teamMemberById = useMemo(() => new Map(teamMembers.map((member) => [member.id, member])), [teamMembers]);
  const queueById = useMemo(() => new Map(settings.queues.map((queue) => [queue.id, queue])), [settings.queues]);

  useEffect(() => {
    try {
      saveVisaChatSettings(settings);
      setSaveState('saved');
    } catch {
      setSaveState('invalid');
    }
  }, [settings]);

  const patchGeneral = (patch: Partial<VisaChatSettings['general']>) => setSettings((current) => ({ ...current, general: { ...current.general, ...patch } }));
  const patchMenu = (patch: Partial<VisaChatSettings['menu']>) => setSettings((current) => ({ ...current, menu: { ...current.menu, ...patch } }));
  const patchRouting = (patch: Partial<VisaChatSettings['routing']>) => setSettings((current) => ({ ...current, routing: { ...current.routing, ...patch } }));
  const patchQueue = (id: string, patch: Partial<SupportQueue>) => setSettings((current) => ({ ...current, queues: current.queues.map((queue) => queue.id === id ? { ...queue, ...patch } : queue) }));
  const patchSla = (id: string, patch: Partial<SlaPolicy>) => setSettings((current) => ({ ...current, slaPolicies: current.slaPolicies.map((policy) => policy.id === id ? { ...policy, ...patch } : policy) }));
  const patchEscalation = (id: string, patch: Partial<EscalationRule>) => setSettings((current) => ({ ...current, escalationRules: current.escalationRules.map((rule) => rule.id === id ? { ...rule, ...patch } : rule) }));
  const patchTemplate = (id: string, patch: Partial<ReplyTemplate>) => setSettings((current) => ({ ...current, templates: current.templates.map((template) => template.id === id ? { ...template, ...patch } : template) }));

  return <section className="visachat-settings-page" aria-label="Configurações do VisaChat">
    <header className="visachat-settings-header">
      <div><small>VISA FÁCIL · CRM · VISACHAT</small><h1>Configurações</h1><p>Configure atendimento, triagem, filas, SLA e respostas do VisaChat.</p></div>
      <div className="visachat-settings-header-actions"><span className={saveState === 'saved' ? 'is-saved' : 'is-invalid'}>{saveState === 'saved' ? 'Alterações salvas nesta sessão' : 'Revise os campos obrigatórios'}</span><button type="button" className="crm-btn-secondary" onClick={onClose}>Voltar ao VisaChat</button></div>
    </header>

    <div className="visachat-settings-layout">
      <nav className="visachat-settings-nav" aria-label="Seções das configurações">{SECTIONS.map((item) => <button key={item.id} type="button" className={section === item.id ? 'is-active' : ''} onClick={() => setSection(item.id)}><strong>{item.label}</strong><small>{item.description}</small></button>)}</nav>

      <div className="visachat-settings-content">
        {section === 'general' && <>
          <SectionIntro title="Configurações gerais" description="Defina a identidade do atendimento e os comportamentos gerais do VisaChat." />
          <div className="visachat-settings-card visachat-settings-form-grid">
            <label><span>Nome exibido</span><input value={settings.general.displayName} onChange={(event) => patchGeneral({ displayName: event.target.value })} /></label>
            <label><span>Idioma</span><input value={settings.general.language} onChange={(event) => patchGeneral({ language: event.target.value })} /></label>
            <label><span>Fuso horário</span><input value={settings.general.timezone} onChange={(event) => patchGeneral({ timezone: event.target.value })} /></label>
            <label><span>Arquivar resolvidas após</span><div className="visachat-settings-number"><input type="number" min="0" value={settings.general.archiveAfterDays} onChange={(event) => patchGeneral({ archiveAfterDays: Math.max(0, Number(event.target.value) || 0) })} /><em>dias</em></div></label>
            <div className="visachat-settings-wide"><SettingsSwitch checked={settings.general.reopenOnCustomerReply} onChange={(value) => patchGeneral({ reopenOnCustomerReply: value })} label="Reabrir conversa quando o cliente responder após resolução" /></div>
          </div>
          <div className="visachat-settings-notice"><strong>Fronteira atual</strong><p>As configurações são funcionais dentro do protótipo e persistem na sessão do navegador. Execução simultânea entre usuários e timers automáticos continuam dependentes de backend compartilhado.</p></div>
        </>}

        {section === 'hours' && <>
          <SectionIntro title="Horários de atendimento" description="Esses horários alimentam as regras de fora do expediente quando houver executor backend." />
          <div className="visachat-settings-card"><div className="visachat-hours-list">{settings.businessHours.map((hour) => <div key={hour.id} className="visachat-hours-row"><SettingsSwitch checked={hour.enabled} onChange={(enabled) => setSettings((current) => ({ ...current, businessHours: current.businessHours.map((item) => item.id === hour.id ? { ...item, enabled } : item) }))} label={hour.day} /><div className="visachat-hours-times"><input type="time" disabled={!hour.enabled} value={hour.start} onChange={(event) => setSettings((current) => ({ ...current, businessHours: current.businessHours.map((item) => item.id === hour.id ? { ...item, start: event.target.value } : item) }))} /><span>até</span><input type="time" disabled={!hour.enabled} value={hour.end} onChange={(event) => setSettings((current) => ({ ...current, businessHours: current.businessHours.map((item) => item.id === hour.id ? { ...item, end: event.target.value } : item) }))} /></div></div>)}</div></div>
        </>}

        {section === 'messages' && <>
          <SectionIntro title="Mensagens automáticas" description="Configure o conteúdo e ative somente os gatilhos que deverão ser executados quando existir backend/worker." />
          <div className="visachat-settings-stack">{settings.automaticMessages.map((message) => <article key={message.id} className="visachat-settings-card visachat-automation-card"><header><div><h3>{message.name}</h3><p>{message.trigger}</p></div><SettingsSwitch checked={message.enabled} onChange={(enabled) => setSettings((current) => ({ ...current, automaticMessages: current.automaticMessages.map((item) => item.id === message.id ? { ...item, enabled } : item) }))} label={message.enabled ? 'Ativa' : 'Inativa'} /></header><label><span>Mensagem</span><textarea rows={4} value={message.body} onChange={(event) => setSettings((current) => ({ ...current, automaticMessages: current.automaticMessages.map((item) => item.id === message.id ? { ...item, body: event.target.value } : item) }))} /></label><small>Variáveis: {'{{contact.first_name}}'} · {'{{agent.name}}'} · {'{{company.name}}'} · {'{{queue.name}}'}</small></article>)}</div>
        </>}

        {section === 'menu' && <>
          <SectionIntro title="Menu inicial e triagem" description="Monte o menu recebido pelo cliente e direcione cada opção para uma fila configurada." />
          <div className="visachat-settings-card visachat-settings-stack"><SettingsSwitch checked={settings.menu.enabled} onChange={(enabled) => patchMenu({ enabled })} label="Menu inicial ativo" /><label><span>Mensagem do menu</span><textarea rows={7} value={settings.menu.message} onChange={(event) => patchMenu({ message: event.target.value })} /></label><label><span>Mensagem de opção inválida</span><textarea rows={3} value={settings.menu.invalidOptionMessage} onChange={(event) => patchMenu({ invalidOptionMessage: event.target.value })} /></label><label className="visachat-settings-compact"><span>Tentativas inválidas antes do fallback</span><input type="number" min="0" max="10" value={settings.menu.maxInvalidAttempts} onChange={(event) => patchMenu({ maxInvalidAttempts: Math.max(0, Number(event.target.value) || 0) })} /></label></div>
          <div className="visachat-settings-card"><h3>Opções do menu</h3><div className="visachat-menu-options">{settings.menu.options.map((option) => <div key={option.id}><input aria-label={`Tecla ${option.label}`} value={option.key} onChange={(event) => patchMenu({ options: settings.menu.options.map((item) => item.id === option.id ? { ...item, key: event.target.value } : item) })} /><input aria-label={`Rótulo ${option.key}`} value={option.label} onChange={(event) => patchMenu({ options: settings.menu.options.map((item) => item.id === option.id ? { ...item, label: event.target.value } : item) })} /><select aria-label={`Fila ${option.label}`} value={option.queueId} onChange={(event) => patchMenu({ options: settings.menu.options.map((item) => item.id === option.id ? { ...item, queueId: event.target.value } : item) })}>{settings.queues.filter((queue) => queue.active).map((queue) => <option key={queue.id} value={queue.id}>{queue.name}</option>)}</select></div>)}</div></div>
        </>}

        {section === 'queues' && <>
          <SectionIntro title="Filas e setores" description="Os participantes são os mesmos usuários ativos cadastrados em Configurações → Usuários." />
          <div className="visachat-settings-stack">{settings.queues.map((queue) => <article key={queue.id} className="visachat-settings-card visachat-queue-card"><header><div><h3>{queue.name}</h3><p>{queue.description}</p></div><SettingsSwitch checked={queue.active} onChange={(active) => patchQueue(queue.id, { active })} label={queue.active ? 'Ativa' : 'Inativa'} /></header><div className="visachat-settings-form-grid"><label><span>Nome</span><input value={queue.name} onChange={(event) => patchQueue(queue.id, { name: event.target.value })} /></label><label><span>Prioridade padrão</span><select value={queue.priority} onChange={(event) => patchQueue(queue.id, { priority: event.target.value as SupportQueue['priority'] })}>{VISACHAT_PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></label><label><span>Supervisor</span><select value={queue.supervisorId} onChange={(event) => patchQueue(queue.id, { supervisorId: event.target.value })}><option value="">Sem supervisor</option>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label></div><fieldset className="visachat-queue-members"><legend>Participantes</legend>{teamMembers.length ? teamMembers.map((member) => <label key={member.id}><input type="checkbox" checked={queue.memberIds.includes(member.id)} onChange={(event) => patchQueue(queue.id, { memberIds: event.target.checked ? [...queue.memberIds, member.id] : queue.memberIds.filter((id) => id !== member.id) })} /><span><strong>{member.name}</strong><small>{member.role}</small></span></label>) : <p>Nenhum usuário ativo disponível.</p>}</fieldset></article>)}</div>
        </>}

        {section === 'routing' && <>
          <SectionIntro title="Roteamento e SLA" description="A configuração fica pronta no frontend; distribuição concorrente e relógio de SLA só devem ser executados por backend/worker." />
          <div className="visachat-settings-card visachat-settings-form-grid"><label><span>Estratégia de distribuição</span><select value={settings.routing.strategy} onChange={(event) => patchRouting({ strategy: event.target.value as VisaChatSettings['routing']['strategy'] })}>{ROUTING_STRATEGIES.map((strategy) => <option key={strategy} value={strategy}>{routingLabel[strategy]}</option>)}</select></label><div className="visachat-settings-wide"><SettingsSwitch checked={settings.routing.keepPreviousAssignee} onChange={(keepPreviousAssignee) => patchRouting({ keepPreviousAssignee })} label="Preferir responsável anterior quando aplicável" /></div></div>
          <div className="visachat-settings-stack">{settings.slaPolicies.map((policy) => <article key={policy.id} className="visachat-settings-card"><header><div><h3>{queueById.get(policy.queueId)?.name ?? policy.queueId}</h3><p>Metas de atendimento</p></div></header><div className="visachat-sla-grid"><label><span>Primeira resposta</span><div className="visachat-settings-number"><input type="number" min="0" value={policy.firstResponseMinutes} onChange={(event) => patchSla(policy.id, { firstResponseMinutes: Math.max(0, Number(event.target.value) || 0) })} /><em>min</em></div></label><label><span>Durante atendimento</span><div className="visachat-settings-number"><input type="number" min="0" value={policy.ongoingResponseMinutes} onChange={(event) => patchSla(policy.id, { ongoingResponseMinutes: Math.max(0, Number(event.target.value) || 0) })} /><em>min</em></div></label><label><span>Resolução</span><div className="visachat-settings-number"><input type="number" min="0" value={policy.resolutionMinutes} onChange={(event) => patchSla(policy.id, { resolutionMinutes: Math.max(0, Number(event.target.value) || 0) })} /><em>min</em></div></label></div></article>)}</div>
        </>}

        {section === 'escalation' && <>
          <SectionIntro title="Escalonamento" description="Regras declarativas preparadas para futura execução automática. O frontend não dispara cronômetros sozinho." />
          <div className="visachat-settings-stack">{settings.escalationRules.map((rule) => <article key={rule.id} className="visachat-settings-card visachat-escalation-card"><header><div><h3>{rule.name}</h3><p>{queueById.get(rule.queueId)?.name ?? rule.queueId}</p></div><SettingsSwitch checked={rule.enabled} onChange={(enabled) => patchEscalation(rule.id, { enabled })} label={rule.enabled ? 'Ativa' : 'Inativa'} /></header><div className="visachat-settings-form-grid"><label><span>Após</span><div className="visachat-settings-number"><input type="number" min="0" value={rule.afterMinutes} onChange={(event) => patchEscalation(rule.id, { afterMinutes: Math.max(0, Number(event.target.value) || 0) })} /><em>min</em></div></label><label><span>Fila</span><select value={rule.queueId} onChange={(event) => patchEscalation(rule.id, { queueId: event.target.value })}>{settings.queues.map((queue) => <option key={queue.id} value={queue.id}>{queue.name}</option>)}</select></label><label><span>Ação</span><select value={rule.action} onChange={(event) => patchEscalation(rule.id, { action: event.target.value as EscalationRule['action'] })}>{Object.entries(escalationLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></article>)}</div>
          <div className="visachat-settings-notice warning"><strong>Não simulado</strong><p>Estas regras não são apresentadas como automáticas enquanto não houver scheduler/worker compartilhado. A configuração já fica pronta para essa camada futura.</p></div>
        </>}

        {section === 'templates' && <>
          <SectionIntro title="Templates e respostas rápidas" description="Atalhos ficam disponíveis para o atendimento sem misturar a configuração operacional do VisaChat com integrações externas." />
          <div className="visachat-settings-stack">{settings.templates.map((template) => <article key={template.id} className="visachat-settings-card visachat-template-card"><header><div><h3>{template.name}</h3><p>{template.shortcut}</p></div><SettingsSwitch checked={template.active} onChange={(active) => patchTemplate(template.id, { active })} label={template.active ? 'Ativo' : 'Inativo'} /></header><div className="visachat-settings-form-grid"><label><span>Nome</span><input value={template.name} onChange={(event) => patchTemplate(template.id, { name: event.target.value })} /></label><label><span>Atalho</span><input value={template.shortcut} onChange={(event) => patchTemplate(template.id, { shortcut: event.target.value })} /></label><label className="visachat-settings-wide"><span>Mensagem</span><textarea rows={4} value={template.body} onChange={(event) => patchTemplate(template.id, { body: event.target.value })} /></label></div></article>)}</div>
          <div className="visachat-settings-card"><h3>Tags e prioridades</h3><div className="visachat-taxonomy-grid"><div><strong>Tags</strong>{settings.tags.map((tag) => <SettingsSwitch key={tag.id} checked={tag.active} onChange={(active) => setSettings((current) => ({ ...current, tags: current.tags.map((item) => item.id === tag.id ? { ...item, active } : item) }))} label={tag.name} />)}</div><div><strong>Prioridades</strong>{settings.priorities.map((priority) => <span key={priority} className="visachat-priority-chip">{priority}</span>)}</div></div></div>
        </>}

        {section === 'notifications' && <>
          <SectionIntro title="Notificações" description="Defina quais eventos internos devem gerar alertas na interface." />
          <div className="visachat-settings-card visachat-notification-list">
            <SettingsSwitch checked={settings.notifications.newInternalMessage} onChange={(newInternalMessage) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, newInternalMessage } }))} label="Nova mensagem interna" />
            <SettingsSwitch checked={settings.notifications.mention} onChange={(mention) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, mention } }))} label="Nova @menção" />
            <SettingsSwitch checked={settings.notifications.newAssignment} onChange={(newAssignment) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, newAssignment } }))} label="Nova atribuição de atendimento" />
            <SettingsSwitch checked={settings.notifications.customerReply} onChange={(customerReply) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, customerReply } }))} label="Cliente respondeu" />
            <SettingsSwitch checked={settings.notifications.slaWarning} onChange={(slaWarning) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, slaWarning } }))} label="SLA próximo do limite" />
            <SettingsSwitch checked={settings.notifications.slaExpired} onChange={(slaExpired) => setSettings((current) => ({ ...current, notifications: { ...current.notifications, slaExpired } }))} label="SLA vencido" />
          </div>
          <div className="visachat-settings-notice"><strong>Usuários ativos</strong><p>{teamMembers.length ? teamMembers.map((member) => `${member.name} (${member.role})`).join(' · ') : 'Nenhum usuário ativo cadastrado.'}</p></div>
        </>}
      </div>
    </div>
  </section>;
}

export default AttendanceSettingsPanel;