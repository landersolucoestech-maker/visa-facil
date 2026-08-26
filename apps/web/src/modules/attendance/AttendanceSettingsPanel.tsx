import { useMemo, useState } from 'react';
import type { OperationalTeamMember } from '../../shared/operationalSessionStore';
import {
  VISACHAT_NOTIFICATION_CHANNELS,
  VISACHAT_PRIORITIES,
  getVisaChatSettings,
  saveVisaChatSettings,
  type EscalationRule,
  type ReplyTemplate,
  type VisaChatMenuOption,
  type VisaChatNotificationChannel,
  type VisaChatPriority,
  type VisaChatSettings,
} from './attendanceSettings';
import './attendanceSettings.css';

type SettingsTab = 'messages' | 'menu' | 'escalation' | 'templates';
type Props = { teamMembers: OperationalTeamMember[]; onClose: () => void };

const PRIORITY_LABELS: Record<VisaChatPriority, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica' };
const CHANNEL_LABELS: Record<VisaChatNotificationChannel, string> = { in_app: 'Sistema', whatsapp: 'WhatsApp preparado', sms: 'SMS preparado' };
const RECIPIENT_LABELS: Record<string, string> = { supervisor: 'Supervisor', manager: 'Gestor', custom: 'Usuário específico' };

function BellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
}
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="visachat-ref-switch"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span aria-hidden="true" /><b>{label}</b></label>;
}
function parseList(value: string) { return value.split(',').map((item) => item.trim()).filter(Boolean); }
function uniqueCommands(commands: string[]) { return Array.from(new Set(commands.map((item) => item.trim()).filter(Boolean))); }
function splitReturnCommands(commands: string[] = []) {
  const normalized = uniqueCommands(commands);
  const quickCommand = normalized.find((command) => /^\d+$/.test(command)) ?? '';
  return { quickCommand, textCommands: normalized.filter((command) => command !== quickCommand) };
}

export function AttendanceSettingsPanel({ teamMembers: _teamMembers, onClose }: Props) {
  const [tab, setTab] = useState<SettingsTab>('messages');
  const [draft, setDraft] = useState<VisaChatSettings>(() => getVisaChatSettings());
  const [openMenuIds, setOpenMenuIds] = useState<Record<string, boolean>>({});
  const [openEscalationIds, setOpenEscalationIds] = useState<Record<string, boolean>>({});
  const [openQuestionnaireIds, setOpenQuestionnaireIds] = useState<Record<string, boolean>>(() => ({ [getVisaChatSettings().menu_options[0]?.id ?? 'commercial']: true }));
  const [newFields, setNewFields] = useState<Record<string, string>>({});
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const patch = (updates: Partial<VisaChatSettings>) => setDraft((current) => ({ ...current, ...updates }));
  const previewMenu = useMemo(() => [...draft.menu_options].filter((option) => option.active).sort((a, b) => a.order - b.order).map((option) => `${option.order}. ${option.label}`).join('\n'), [draft.menu_options]);
  const { quickCommand, textCommands } = splitReturnCommands(draft.return_to_menu_rule.commands);

  const updateMenuOption = (id: string, optionPatch: Partial<VisaChatMenuOption>) => patch({ menu_options: draft.menu_options.map((option) => option.id === id ? { ...option, ...optionPatch } : option), main_menu_message: '' });
  const addMenuOption = () => {
    const order = Math.max(0, ...draft.menu_options.map((option) => option.order)) + 1;
    const id = `opcao-${Date.now()}`;
    patch({ menu_options: [...draft.menu_options, { id, order, label: 'Nova opção', responseTemplateId: draft.templates[0]?.id ?? '', queue: 'Atendimento', sector: 'Triagem', defaultAssignee: null, tags: [], priority: 'media', active: true }], main_menu_message: '' });
    setOpenMenuIds((current) => ({ ...current, [id]: true }));
  };
  const removeMenuOption = (id: string) => {
    patch({ menu_options: draft.menu_options.filter((item) => item.id !== id), main_menu_message: '' });
    setOpenMenuIds((current) => { const next = { ...current }; delete next[id]; return next; });
  };
  const addServiceQuestionnaire = () => {
    const id = `questionario-${Date.now()}`;
    const order = Math.max(0, ...draft.menu_options.map((option) => option.order)) + 1;
    const option: VisaChatMenuOption = { id, order, label: 'Novo questionário', responseTemplateId: id, queue: 'Atendimento', sector: 'Triagem', defaultAssignee: null, tags: [], priority: 'media', active: true, required_fields: [], optional_fields: [] };
    const template: ReplyTemplate = { id, name: option.label, shortcut: `/${id}`, body: '', active: true };
    patch({ menu_options: [...draft.menu_options, option], templates: [...draft.templates, template], main_menu_message: '' });
    setOpenQuestionnaireIds((current) => ({ ...current, [id]: true }));
  };
  const removeServiceQuestionnaire = (id: string) => {
    const option = draft.menu_options.find((item) => item.id === id);
    if (!option) return;
    patch({ menu_options: draft.menu_options.filter((item) => item.id !== id), templates: draft.templates.filter((template) => template.id !== option.responseTemplateId), main_menu_message: '' });
    setOpenQuestionnaireIds((current) => { const next = { ...current }; delete next[id]; return next; });
  };
  const addEscalation = () => {
    const id = `escalonamento-${Date.now()}`;
    patch({ escalation_rules: [...draft.escalation_rules, { id, afterMinutes: 15, level: 'supervisor', recipientRole: 'supervisor', recipientUserId: null, channels: ['in_app'], active: true }] });
    setOpenEscalationIds((current) => ({ ...current, [id]: true }));
  };
  const updateEscalation = (id: string, rulePatch: Partial<EscalationRule>) => patch({ escalation_rules: draft.escalation_rules.map((rule) => rule.id === id ? { ...rule, ...rulePatch } : rule) });
  const toggleRuleChannel = (rule: EscalationRule, channel: VisaChatNotificationChannel, checked: boolean) => {
    const channels = new Set(rule.channels); if (checked) channels.add(channel); else channels.delete(channel); updateEscalation(rule.id, { channels: Array.from(channels) });
  };
  const getTemplate = (option: VisaChatMenuOption) => draft.templates.find((template) => template.id === option.responseTemplateId) ?? { id: option.responseTemplateId, name: option.label, shortcut: `/${option.id}`, body: '', active: true };
  const updateTemplateForOption = (option: VisaChatMenuOption, body: string) => {
    const template = getTemplate(option); const next = { ...template, body, name: option.label };
    patch({ templates: draft.templates.some((item) => item.id === template.id) ? draft.templates.map((item) => item.id === template.id ? next : item) : [...draft.templates, next] });
  };
  const updateRequiredFields = (optionId: string, fields: string[]) => updateMenuOption(optionId, { required_fields: fields });
  const addField = (optionId: string, fields: string[]) => { const value = (newFields[optionId] ?? '').trim(); if (!value) return; updateRequiredFields(optionId, [...fields, value]); setNewFields((current) => ({ ...current, [optionId]: '' })); };
  const save = () => { saveVisaChatSettings({ ...draft, main_menu_message: draft.main_menu_message || previewMenu, required_fields: draft.required_fields.map((field) => field.trim()).filter(Boolean), optional_fields: draft.optional_fields.map((field) => field.trim()).filter(Boolean), return_to_menu_rule: { ...draft.return_to_menu_rule, commands: uniqueCommands(draft.return_to_menu_rule.commands ?? []) } }); };

  return <div className="visachat-ref-screen" onClick={() => setNotificationsOpen(false)}>
    <header className="crm-topbar attendance-topbar visachat-ref-header">
      <div><small>VISA FÁCIL · CRM</small><h1>Automações do VisaChat</h1><p>Configure mensagens automáticas, triagem, campos coletados, filas, templates, notificações e escalonamentos.</p></div>
      <div className="crm-topbar-actions attendance-topbar-actions visachat-ref-actions" onClick={(event) => event.stopPropagation()}><button type="button" className="crm-btn-secondary" disabled title="Indisponível sem executor backend">⚡ Testar escalonamento</button><button type="button" className="crm-btn-primary" onClick={save}>Salvar configuração</button><button type="button" className="crm-btn-secondary" onClick={onClose}>Voltar ao VisaChat</button><div className="attendance-topbar-menu visachat-ref-topbar-menu"><button className="attendance-notification-button visachat-ref-notification-button" type="button" aria-label="Notificações" aria-haspopup="true" aria-expanded={notificationsOpen} aria-controls="visachat-settings-notifications" onClick={() => setNotificationsOpen((value) => !value)}><BellIcon /></button>{notificationsOpen && <div className="visachat-ref-notifications" id="visachat-settings-notifications" role="region" aria-label="Notificações do VisaChat"><strong>Notificações</strong><p>Nenhuma notificação no momento.</p></div>}</div></div>
    </header>

    <main className="attendance-content visachat-ref-page" aria-label="Automações do VisaChat">
      <nav className="visachat-ref-tabs" aria-label="Configurações de atendimento">
        {([['messages','Mensagens'],['menu','Menu e filas'],['escalation','Escalonamento'],['templates','Templates']] as const).map(([id,label]) => <button key={id} type="button" className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </nav>

      {tab === 'messages' && <div className="visachat-ref-stack">
        <article className="visachat-ref-card"><header><h2>Fluxo inicial</h2><Switch checked={draft.enabled} onChange={(enabled) => patch({ enabled })} label="Automação ativa" /></header><div className="visachat-ref-fields"><label><span>Mensagem inicial de boas-vindas</span><textarea rows={4} value={draft.welcome_message} onChange={(e) => patch({ welcome_message: e.target.value })} /></label><label><span>Menu principal de triagem</span><textarea rows={8} value={draft.main_menu_message || previewMenu} onChange={(e) => patch({ main_menu_message: e.target.value })} /></label></div></article>
        <article className="visachat-ref-card"><header><h2>Mensagens de exceção e encerramento</h2></header><div className="visachat-ref-grid2"><label><span>Opção inválida</span><textarea rows={3} value={draft.invalid_option_message} onChange={(e) => patch({ invalid_option_message: e.target.value })} /></label><label><span>Ausência de resposta</span><textarea rows={3} value={draft.absence_message} onChange={(e) => patch({ absence_message: e.target.value })} /></label><label><span>Fora do horário de atendimento</span><textarea rows={3} value={draft.out_of_hours_message} onChange={(e) => patch({ out_of_hours_message: e.target.value })} /></label><label><span>Encerramento</span><textarea rows={3} value={draft.closing_message} onChange={(e) => patch({ closing_message: e.target.value })} /></label></div></article>
      </div>}

      {tab === 'menu' && <div className="visachat-ref-stack">
        <article className="visachat-ref-card"><header><div><h2>Menu principal de triagem</h2><p>Configure ordem, fila, setor, prioridade e template de cada opção.</p></div><button type="button" className="crm-btn-primary" onClick={addMenuOption}>+ Adicionar opção</button></header><div className="visachat-ref-accordion">{[...draft.menu_options].sort((a,b)=>a.order-b.order).map((option) => { const open = openMenuIds[option.id] ?? false; return <div key={option.id} className="visachat-ref-accordion-item"><button type="button" className="visachat-ref-accordion-trigger" onClick={() => setOpenMenuIds((current) => ({ ...current, [option.id]: !open }))}><span className="visachat-ref-number">{option.order}</span><strong>{option.label || 'Sem texto'}</strong><small>Fila {option.queue || '—'} · Setor {option.sector || '—'}</small><em>{PRIORITY_LABELS[option.priority]}</em><em>{option.active ? 'Ativa' : 'Inativa'}</em><b>{open ? '⌄' : '›'}</b></button>{open && <div className="visachat-ref-accordion-content"><div className="visachat-ref-menu-row"><label><span>Ordem</span><input type="number" min="1" value={option.order} onChange={(e)=>updateMenuOption(option.id,{order:Number(e.target.value)||1})}/></label><label><span>Texto da opção</span><input value={option.label} onChange={(e)=>updateMenuOption(option.id,{label:e.target.value})}/></label><label><span>Fila</span><input value={option.queue} onChange={(e)=>updateMenuOption(option.id,{queue:e.target.value})}/></label><label><span>Setor</span><input value={option.sector} onChange={(e)=>updateMenuOption(option.id,{sector:e.target.value})}/></label><div className="visachat-ref-inline-actions"><Switch checked={option.active} onChange={(active)=>updateMenuOption(option.id,{active})} label="Ativa"/><button type="button" className="visachat-ref-delete" onClick={()=>removeMenuOption(option.id)}>Excluir</button></div></div><div className="visachat-ref-grid4"><label><span>Template</span><select value={option.responseTemplateId} onChange={(e)=>updateMenuOption(option.id,{responseTemplateId:e.target.value})}>{draft.templates.map((template)=><option key={template.id} value={template.id}>{template.name}</option>)}</select></label><label><span>Responsável padrão</span><input value={option.defaultAssignee ?? ''} onChange={(e)=>updateMenuOption(option.id,{defaultAssignee:e.target.value||null})} placeholder="ID do usuário"/></label><label><span>Prioridade</span><select value={option.priority} onChange={(e)=>updateMenuOption(option.id,{priority:e.target.value as VisaChatPriority})}>{VISACHAT_PRIORITIES.map((priority)=><option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}</select></label><label><span>Tags automáticas</span><input value={option.tags.join(', ')} onChange={(e)=>updateMenuOption(option.id,{tags:parseList(e.target.value)})}/></label></div></div>}</div>; })}</div></article>
        <article className="visachat-ref-card"><header><h2>Retorno ao menu principal</h2></header><div className="visachat-ref-return-row"><label><span>Número</span><input inputMode="numeric" value={quickCommand} onChange={(e)=>patch({return_to_menu_rule:{...draft.return_to_menu_rule,commands:uniqueCommands([e.target.value,...textCommands])}})} placeholder="0"/></label><label><span>Comandos textuais aceitos</span><input value={textCommands.join(', ')} onChange={(e)=>patch({return_to_menu_rule:{...draft.return_to_menu_rule,commands:uniqueCommands([quickCommand,...parseList(e.target.value)])}})} placeholder="menu, voltar, inicio"/></label><Switch checked={draft.return_to_menu_rule.enabled !== false} onChange={(enabled)=>patch({return_to_menu_rule:{...draft.return_to_menu_rule,enabled}})} label="Ativo"/></div></article>
      </div>}

      {tab === 'escalation' && <div className="visachat-ref-stack">
        <article className="visachat-ref-card"><header><h2>Responsáveis padrão</h2></header><div className="visachat-ref-grid2"><label><span>Supervisor padrão</span><input value={draft.supervisor_user_id ?? ''} onChange={(e)=>patch({supervisor_user_id:e.target.value||null})} placeholder="ID do usuário supervisor"/></label><label><span>Gestor padrão</span><input value={draft.manager_user_id ?? ''} onChange={(e)=>patch({manager_user_id:e.target.value||null})} placeholder="ID do usuário gestor"/></label></div></article>
        <article className="visachat-ref-card"><header><div><h2>Regras de escalonamento</h2><p>Defina o tempo-limite e o destino de cada nível. Estas regras são avaliadas quando o escalonamento é executado manualmente; não há disparo automático por temporizador nesta versão.</p></div><button type="button" className="crm-btn-primary" onClick={addEscalation}>+ Adicionar regra</button></header><div className="visachat-ref-accordion">{[...draft.escalation_rules].sort((a,b)=>a.afterMinutes-b.afterMinutes).map((rule)=>{const open=openEscalationIds[rule.id]??false;return <div key={rule.id} className="visachat-ref-accordion-item"><button type="button" className="visachat-ref-accordion-trigger" onClick={()=>setOpenEscalationIds((current)=>({...current,[rule.id]:!open}))}><span className="visachat-ref-number">{rule.afterMinutes} min</span><strong>{rule.level||'Sem nível'}</strong><small>Destino: {RECIPIENT_LABELS[rule.recipientRole]??rule.recipientRole}</small><em>{rule.active?'Ativa':'Inativa'}</em><b>{open?'⌄':'›'}</b></button>{open&&<div className="visachat-ref-accordion-content"><div className="visachat-ref-escalation-row"><label><span>Minutos</span><input type="number" min="1" value={rule.afterMinutes} onChange={(e)=>updateEscalation(rule.id,{afterMinutes:Number(e.target.value)||1})}/></label><label><span>Nível</span><input value={rule.level} onChange={(e)=>updateEscalation(rule.id,{level:e.target.value})}/></label><label><span>Destino</span><select value={rule.recipientRole} onChange={(e)=>updateEscalation(rule.id,{recipientRole:e.target.value})}><option value="supervisor">Supervisor</option><option value="manager">Gestor</option><option value="custom">Usuário específico</option></select></label><label><span>Usuário específico opcional</span><input value={rule.recipientUserId??''} onChange={(e)=>updateEscalation(rule.id,{recipientUserId:e.target.value||null})} placeholder="ID do usuário"/></label><div className="visachat-ref-inline-actions"><Switch checked={rule.active} onChange={(active)=>updateEscalation(rule.id,{active})} label="Ativa"/><button type="button" className="visachat-ref-delete" onClick={()=>patch({escalation_rules:draft.escalation_rules.filter((item)=>item.id!==rule.id)})}>Excluir</button></div></div><div className="visachat-ref-channel-row">{VISACHAT_NOTIFICATION_CHANNELS.map((channel)=><label key={channel}><input type="checkbox" checked={rule.channels.includes(channel)} onChange={(e)=>toggleRuleChannel(rule,channel,e.target.checked)}/><span>{CHANNEL_LABELS[channel]}</span></label>)}</div></div>}</div>})}</div></article>
      </div>}

      {tab === 'templates' && <article className="visachat-ref-card"><header><div><h2>Questionários por serviço</h2><p>Abra um serviço do menu e configure quais perguntas serão coletadas inicialmente para ele.</p></div><button type="button" className="crm-btn-primary" onClick={addServiceQuestionnaire}>+ Adicionar questionário</button></header><div className="visachat-ref-questionnaires">{[...draft.menu_options].sort((a,b)=>a.order-b.order).map((option)=>{const open=openQuestionnaireIds[option.id]??false;const fields=option.required_fields?.length?option.required_fields:draft.required_fields;const template=getTemplate(option);return <div key={option.id} className="visachat-ref-questionnaire"><button type="button" className="visachat-ref-questionnaire-trigger" onClick={()=>setOpenQuestionnaireIds((current)=>({...current,[option.id]:!open}))}><div><strong>{option.order}. {option.label}</strong><span>{fields.length} campo(s)</span>{!option.active&&<span>Inativa</span>}<small>Fila {option.queue} / Setor {option.sector}</small></div><b>{open?'⌄':'›'}</b></button>{open&&<div className="visachat-ref-questionnaire-content"><div className="visachat-ref-questionnaire-actions"><button type="button" className="visachat-ref-delete" onClick={()=>removeServiceQuestionnaire(option.id)}>Excluir questionário</button></div><section className="visachat-ref-inner-card"><h3>Campos obrigatórios</h3><p>Perguntas que precisam ser respondidas para este tipo de serviço.</p><div className="visachat-ref-field-list">{fields.length?fields.map((field,index)=><div key={`${field}-${index}`}><input value={field} onChange={(e)=>updateRequiredFields(option.id,fields.map((item,i)=>i===index?e.target.value:item))}/><button type="button" className="visachat-ref-delete" onClick={()=>updateRequiredFields(option.id,fields.filter((_,i)=>i!==index))}>Excluir</button></div>):<p>Nenhum campo obrigatório configurado para este serviço.</p>}</div><div className="visachat-ref-add-field"><input value={newFields[option.id]??''} onChange={(e)=>setNewFields((current)=>({...current,[option.id]:e.target.value}))} onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();addField(option.id,fields)}}} placeholder="Ex.: Nome completo"/><button type="button" className="crm-btn-primary" onClick={()=>addField(option.id,fields)}>+ Adicionar</button></div></section><section className="visachat-ref-inner-card"><h3>Mensagem Automática</h3><textarea rows={4} value={template.body} onChange={(e)=>updateTemplateForOption(option,e.target.value)}/></section></div>}</div>})}</div></article>}
    </main>
  </div>;
}

export default AttendanceSettingsPanel;