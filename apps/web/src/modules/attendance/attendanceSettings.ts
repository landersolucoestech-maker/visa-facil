export const VISACHAT_SETTINGS_STORAGE_KEY = 'visa-facil.session.visachat.settings.v1';

export const ROUTING_STRATEGIES = ['manual', 'round-robin', 'least-loaded'] as const;
export const VISACHAT_PRIORITIES = ['Baixa', 'Normal', 'Alta', 'Urgente'] as const;

export type RoutingStrategy = typeof ROUTING_STRATEGIES[number];
export type VisaChatPriority = typeof VISACHAT_PRIORITIES[number];

export type BusinessHour = {
  id: string;
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

export type AutomaticMessage = {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  body: string;
};

export type MenuOption = {
  id: string;
  key: string;
  label: string;
  queueId: string;
};

export type SupportQueue = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  memberIds: string[];
  supervisorId: string;
  priority: VisaChatPriority;
};

export type SlaPolicy = {
  id: string;
  queueId: string;
  firstResponseMinutes: number;
  ongoingResponseMinutes: number;
  resolutionMinutes: number;
};

export type EscalationRule = {
  id: string;
  name: string;
  enabled: boolean;
  afterMinutes: number;
  queueId: string;
  action: 'notify-supervisor' | 'raise-priority' | 'transfer-supervisor';
};

export type ReplyTemplate = {
  id: string;
  name: string;
  shortcut: string;
  body: string;
  active: boolean;
};

export type TagDefinition = {
  id: string;
  name: string;
  active: boolean;
};

export type VisaChatSettings = {
  version: 1;
  general: {
    displayName: string;
    language: string;
    timezone: string;
    reopenOnCustomerReply: boolean;
    archiveAfterDays: number;
  };
  businessHours: BusinessHour[];
  automaticMessages: AutomaticMessage[];
  menu: {
    enabled: boolean;
    message: string;
    invalidOptionMessage: string;
    maxInvalidAttempts: number;
    options: MenuOption[];
  };
  queues: SupportQueue[];
  routing: {
    strategy: RoutingStrategy;
    keepPreviousAssignee: boolean;
  };
  slaPolicies: SlaPolicy[];
  escalationRules: EscalationRule[];
  templates: ReplyTemplate[];
  tags: TagDefinition[];
  priorities: VisaChatPriority[];
  notifications: {
    newInternalMessage: boolean;
    mention: boolean;
    newAssignment: boolean;
    customerReply: boolean;
    slaWarning: boolean;
    slaExpired: boolean;
  };
};

const DEFAULT_SETTINGS: VisaChatSettings = {
  version: 1,
  general: {
    displayName: 'Visa Fácil',
    language: 'Português (Brasil)',
    timezone: 'America/Sao_Paulo',
    reopenOnCustomerReply: true,
    archiveAfterDays: 30,
  },
  businessHours: [
    { id: 'mon', day: 'Segunda-feira', enabled: true, start: '08:00', end: '18:00' },
    { id: 'tue', day: 'Terça-feira', enabled: true, start: '08:00', end: '18:00' },
    { id: 'wed', day: 'Quarta-feira', enabled: true, start: '08:00', end: '18:00' },
    { id: 'thu', day: 'Quinta-feira', enabled: true, start: '08:00', end: '18:00' },
    { id: 'fri', day: 'Sexta-feira', enabled: true, start: '08:00', end: '18:00' },
    { id: 'sat', day: 'Sábado', enabled: false, start: '08:00', end: '12:00' },
    { id: 'sun', day: 'Domingo', enabled: false, start: '08:00', end: '12:00' },
  ],
  automaticMessages: [
    { id: 'welcome', name: 'Boas-vindas', trigger: 'Nova conversa recebida', enabled: true, body: 'Olá, {{contact.first_name}}! 👋 Bem-vindo ao atendimento da {{company.name}}. Como podemos ajudar?' },
    { id: 'after-hours', name: 'Fora do horário', trigger: 'Mensagem recebida fora do horário', enabled: true, body: 'Olá, {{contact.first_name}}. Recebemos sua mensagem fora do nosso horário de atendimento. Retornaremos assim que a equipe estiver disponível.' },
    { id: 'queue-entry', name: 'Entrada na fila', trigger: 'Cliente encaminhado para uma fila', enabled: true, body: 'Certo. Encaminhei seu atendimento para {{queue.name}}. Nossa equipe continuará por aqui.' },
    { id: 'assigned', name: 'Atendente assumiu', trigger: 'Atendente assume a conversa', enabled: false, body: 'Olá! Meu nome é {{agent.name}} e vou seguir com o seu atendimento.' },
    { id: 'waiting-customer', name: 'Aguardando cliente', trigger: 'Conversa passa a aguardar cliente', enabled: false, body: 'Ficamos no aguardo do seu retorno para continuar o atendimento.' },
    { id: 'closing', name: 'Encerramento', trigger: 'Conversa resolvida', enabled: false, body: 'Atendimento concluído. Quando precisar, é só chamar novamente.' },
    { id: 'reopen', name: 'Reabertura', trigger: 'Cliente responde após resolução', enabled: false, body: 'Recebemos sua nova mensagem e reabrimos o atendimento.' },
  ],
  menu: {
    enabled: true,
    message: 'Olá! Como podemos ajudar?\n\n1 — Comercial\n2 — Financeiro\n3 — Documentação\n4 — Suporte\n5 — Falar com atendente',
    invalidOptionMessage: 'Não consegui identificar a opção escolhida. Digite um número válido do menu.',
    maxInvalidAttempts: 3,
    options: [
      { id: 'menu-1', key: '1', label: 'Comercial', queueId: 'commercial' },
      { id: 'menu-2', key: '2', label: 'Financeiro', queueId: 'finance' },
      { id: 'menu-3', key: '3', label: 'Documentação', queueId: 'documents' },
      { id: 'menu-4', key: '4', label: 'Suporte', queueId: 'support' },
      { id: 'menu-5', key: '5', label: 'Falar com atendente', queueId: 'general' },
    ],
  },
  queues: [
    { id: 'general', name: 'Atendimento Geral', description: 'Entrada padrão e fallback de triagem.', active: true, memberIds: ['u-1', 'u-2'], supervisorId: 'u-1', priority: 'Normal' },
    { id: 'commercial', name: 'Comercial', description: 'Novos serviços, propostas e conversão.', active: true, memberIds: ['u-1', 'u-2'], supervisorId: 'u-1', priority: 'Normal' },
    { id: 'finance', name: 'Financeiro', description: 'Pagamentos, cobranças e comprovantes.', active: true, memberIds: ['u-1'], supervisorId: 'u-1', priority: 'Normal' },
    { id: 'documents', name: 'Documentação', description: 'Documentos e pendências de processos.', active: true, memberIds: ['u-1', 'u-2'], supervisorId: 'u-1', priority: 'Normal' },
    { id: 'support', name: 'Suporte', description: 'Dúvidas e suporte operacional.', active: true, memberIds: ['u-1', 'u-2'], supervisorId: 'u-1', priority: 'Normal' },
    { id: 'legal', name: 'Jurídico', description: 'Assuntos jurídicos e contratuais.', active: true, memberIds: ['u-1'], supervisorId: 'u-1', priority: 'Alta' },
  ],
  routing: {
    strategy: 'manual',
    keepPreviousAssignee: true,
  },
  slaPolicies: [
    { id: 'sla-general', queueId: 'general', firstResponseMinutes: 10, ongoingResponseMinutes: 15, resolutionMinutes: 480 },
    { id: 'sla-commercial', queueId: 'commercial', firstResponseMinutes: 10, ongoingResponseMinutes: 20, resolutionMinutes: 480 },
    { id: 'sla-finance', queueId: 'finance', firstResponseMinutes: 20, ongoingResponseMinutes: 30, resolutionMinutes: 720 },
  ],
  escalationRules: [
    { id: 'esc-1', name: 'Primeira resposta atrasada', enabled: true, afterMinutes: 10, queueId: 'general', action: 'notify-supervisor' },
    { id: 'esc-2', name: 'Prioridade alta sem resposta', enabled: false, afterMinutes: 20, queueId: 'commercial', action: 'raise-priority' },
  ],
  templates: [
    { id: 'tpl-welcome', name: 'Apresentação do atendente', shortcut: '/ola', body: 'Olá, {{contact.first_name}}! Meu nome é {{agent.name}} e vou continuar seu atendimento.', active: true },
    { id: 'tpl-documents', name: 'Solicitação de documentos', shortcut: '/documentos', body: 'Olá, {{contact.first_name}}. Para prosseguirmos, preciso que envie os documentos solicitados para o seu processo.', active: true },
    { id: 'tpl-closing', name: 'Encerramento', shortcut: '/encerrar', body: 'Concluímos esta etapa do atendimento. Se surgir alguma dúvida, pode nos chamar novamente.', active: true },
  ],
  tags: [
    { id: 'tag-vip', name: 'VIP', active: true },
    { id: 'tag-urgent', name: 'Urgente', active: true },
    { id: 'tag-docs', name: 'Documentação', active: true },
    { id: 'tag-payment', name: 'Pagamento', active: true },
    { id: 'tag-contract', name: 'Contrato', active: true },
    { id: 'tag-return', name: 'Retorno', active: true },
  ],
  priorities: [...VISACHAT_PRIORITIES],
  notifications: {
    newInternalMessage: true,
    mention: true,
    newAssignment: true,
    customerReply: true,
    slaWarning: true,
    slaExpired: true,
  },
};

function clone<T>(value: T): T { return structuredClone(value); }
function isObject(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function isString(value: unknown): value is string { return typeof value === 'string'; }
function isNonEmpty(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }
function isBoolean(value: unknown): value is boolean { return typeof value === 'boolean'; }
function isNonNegativeInteger(value: unknown): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= 0; }
function uniqueIds(values: Array<{ id: string }>) { return new Set(values.map((item) => item.id)).size === values.length; }
function validPriority(value: unknown): value is VisaChatPriority { return typeof value === 'string' && (VISACHAT_PRIORITIES as readonly string[]).includes(value); }
function validRouting(value: unknown): value is RoutingStrategy { return typeof value === 'string' && (ROUTING_STRATEGIES as readonly string[]).includes(value); }

export function isVisaChatSettings(value: unknown): value is VisaChatSettings {
  if (!isObject(value) || value.version !== 1) return false;
  const general = value.general;
  const menu = value.menu;
  const routing = value.routing;
  const notifications = value.notifications;
  if (!isObject(general) || !isNonEmpty(general.displayName) || !isNonEmpty(general.language) || !isNonEmpty(general.timezone)
    || !isBoolean(general.reopenOnCustomerReply) || !isNonNegativeInteger(general.archiveAfterDays)) return false;
  if (!Array.isArray(value.businessHours) || !uniqueIds(value.businessHours as BusinessHour[]) || !value.businessHours.every((hour) => isObject(hour)
    && isNonEmpty(hour.id) && isNonEmpty(hour.day) && isBoolean(hour.enabled) && isString(hour.start) && isString(hour.end))) return false;
  if (!Array.isArray(value.automaticMessages) || !uniqueIds(value.automaticMessages as AutomaticMessage[]) || !value.automaticMessages.every((message) => isObject(message)
    && isNonEmpty(message.id) && isNonEmpty(message.name) && isNonEmpty(message.trigger) && isBoolean(message.enabled) && isString(message.body))) return false;
  if (!isObject(menu) || !isBoolean(menu.enabled) || !isString(menu.message) || !isString(menu.invalidOptionMessage)
    || !isNonNegativeInteger(menu.maxInvalidAttempts) || !Array.isArray(menu.options) || !uniqueIds(menu.options as MenuOption[])
    || !menu.options.every((option) => isObject(option) && isNonEmpty(option.id) && isNonEmpty(option.key) && isNonEmpty(option.label) && isNonEmpty(option.queueId))) return false;
  if (!Array.isArray(value.queues) || !uniqueIds(value.queues as SupportQueue[]) || !value.queues.every((queue) => isObject(queue)
    && isNonEmpty(queue.id) && isNonEmpty(queue.name) && isString(queue.description) && isBoolean(queue.active)
    && Array.isArray(queue.memberIds) && queue.memberIds.every(isNonEmpty) && new Set(queue.memberIds).size === queue.memberIds.length
    && isString(queue.supervisorId) && validPriority(queue.priority))) return false;
  if (!isObject(routing) || !validRouting(routing.strategy) || !isBoolean(routing.keepPreviousAssignee)) return false;
  if (!Array.isArray(value.slaPolicies) || !uniqueIds(value.slaPolicies as SlaPolicy[]) || !value.slaPolicies.every((policy) => isObject(policy)
    && isNonEmpty(policy.id) && isNonEmpty(policy.queueId) && isNonNegativeInteger(policy.firstResponseMinutes)
    && isNonNegativeInteger(policy.ongoingResponseMinutes) && isNonNegativeInteger(policy.resolutionMinutes))) return false;
  if (!Array.isArray(value.escalationRules) || !uniqueIds(value.escalationRules as EscalationRule[]) || !value.escalationRules.every((rule) => isObject(rule)
    && isNonEmpty(rule.id) && isNonEmpty(rule.name) && isBoolean(rule.enabled) && isNonNegativeInteger(rule.afterMinutes)
    && isNonEmpty(rule.queueId) && ['notify-supervisor', 'raise-priority', 'transfer-supervisor'].includes(String(rule.action)))) return false;
  if (!Array.isArray(value.templates) || !uniqueIds(value.templates as ReplyTemplate[]) || !value.templates.every((template) => isObject(template)
    && isNonEmpty(template.id) && isNonEmpty(template.name) && isNonEmpty(template.shortcut) && isString(template.body) && isBoolean(template.active))) return false;
  if (!Array.isArray(value.tags) || !uniqueIds(value.tags as TagDefinition[]) || !value.tags.every((tag) => isObject(tag)
    && isNonEmpty(tag.id) && isNonEmpty(tag.name) && isBoolean(tag.active))) return false;
  if (!Array.isArray(value.priorities) || value.priorities.length !== VISACHAT_PRIORITIES.length || !value.priorities.every(validPriority)) return false;
  if (!isObject(notifications) || !['newInternalMessage', 'mention', 'newAssignment', 'customerReply', 'slaWarning', 'slaExpired'].every((key) => isBoolean(notifications[key]))) return false;
  return true;
}

function stripLegacyChannelSettings(settings: VisaChatSettings): VisaChatSettings {
  const next = clone(settings) as VisaChatSettings & { channels?: unknown };
  delete next.channels;
  return next;
}

export function getDefaultVisaChatSettings(): VisaChatSettings { return clone(DEFAULT_SETTINGS); }

export function getVisaChatSettings(): VisaChatSettings {
  const fallback = () => getDefaultVisaChatSettings();
  if (typeof sessionStorage === 'undefined') return fallback();
  try {
    const raw = sessionStorage.getItem(VISACHAT_SETTINGS_STORAGE_KEY);
    if (!raw) {
      const next = fallback();
      try { sessionStorage.setItem(VISACHAT_SETTINGS_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isVisaChatSettings(parsed)) {
      const next = fallback();
      try { sessionStorage.setItem(VISACHAT_SETTINGS_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    }
    const next = stripLegacyChannelSettings(parsed);
    try { sessionStorage.setItem(VISACHAT_SETTINGS_STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  } catch {
    return fallback();
  }
}

export function saveVisaChatSettings(settings: VisaChatSettings): VisaChatSettings {
  if (!isVisaChatSettings(settings)) throw new Error('Invalid VisaChat settings');
  const next = stripLegacyChannelSettings(settings);
  if (typeof sessionStorage !== 'undefined') {
    try { sessionStorage.setItem(VISACHAT_SETTINGS_STORAGE_KEY, JSON.stringify(next)); } catch {}
  }
  return next;
}