export const VISACHAT_SETTINGS_STORAGE_KEY = 'visa-facil.session.visachat.settings.v2';
export const VISACHAT_PRIORITIES = ['baixa', 'media', 'alta', 'critica'] as const;
export const VISACHAT_NOTIFICATION_CHANNELS = ['in_app', 'whatsapp', 'sms'] as const;

export type VisaChatPriority = typeof VISACHAT_PRIORITIES[number];
export type VisaChatNotificationChannel = typeof VISACHAT_NOTIFICATION_CHANNELS[number];

export type VisaChatMenuOption = {
  id: string;
  order: number;
  label: string;
  responseTemplateId: string;
  queue: string;
  sector: string;
  defaultAssignee?: string | null;
  tags: string[];
  priority: VisaChatPriority;
  active: boolean;
  required_fields?: string[];
  optional_fields?: string[];
};

export type ReplyTemplate = {
  id: string;
  name: string;
  shortcut: string;
  body: string;
  active: boolean;
};

export type EscalationRule = {
  id: string;
  afterMinutes: number;
  level: string;
  recipientRole: 'supervisor' | 'manager' | 'custom' | string;
  recipientUserId?: string | null;
  channels: VisaChatNotificationChannel[];
  active: boolean;
};

export type VisaChatSettings = {
  version: 2;
  enabled: boolean;
  welcome_message: string;
  main_menu_message: string;
  menu_options: VisaChatMenuOption[];
  templates: ReplyTemplate[];
  required_fields: string[];
  optional_fields: string[];
  invalid_option_message: string;
  absence_message: string;
  out_of_hours_message: string;
  closing_message: string;
  return_to_menu_rule: {
    enabled?: boolean;
    commands?: string[];
  };
  escalation_rules: EscalationRule[];
  notification_channels: Record<string, unknown>;
  supervisor_user_id?: string | null;
  manager_user_id?: string | null;
};

const INITIAL_REQUIRED_FIELDS = [
  'Nome completo',
  'Telefone para contato',
  'E-mail',
  'Serviço de interesse',
  'País de destino',
  'Tipo de visto',
];

const DEFAULT_SETTINGS: VisaChatSettings = {
  version: 2,
  enabled: true,
  welcome_message: 'Olá! Seja bem-vindo(a) à Central de Atendimento da Visa Fácil. Para direcionarmos seu atendimento, escolha uma das opções abaixo respondendo com o número correspondente.',
  main_menu_message: '1. Comercial\n2. Financeiro\n3. Documentação\n4. Suporte\n5. Falar com atendente',
  menu_options: [
    { id: 'commercial', order: 1, label: 'Comercial', responseTemplateId: 'commercial', queue: 'Comercial', sector: 'Comercial', defaultAssignee: null, tags: ['Comercial'], priority: 'media', active: true, required_fields: INITIAL_REQUIRED_FIELDS, optional_fields: [] },
    { id: 'finance', order: 2, label: 'Financeiro', responseTemplateId: 'finance', queue: 'Financeiro', sector: 'Financeiro', defaultAssignee: null, tags: ['Financeiro'], priority: 'alta', active: true },
    { id: 'documents', order: 3, label: 'Documentação', responseTemplateId: 'documents', queue: 'Documentação', sector: 'Documentação', defaultAssignee: null, tags: ['Documentação'], priority: 'alta', active: true },
    { id: 'support', order: 4, label: 'Suporte', responseTemplateId: 'support', queue: 'Suporte', sector: 'Suporte', defaultAssignee: null, tags: ['Suporte'], priority: 'media', active: true },
    { id: 'general', order: 5, label: 'Falar com atendente', responseTemplateId: 'general', queue: 'Atendimento', sector: 'Triagem', defaultAssignee: null, tags: ['Atendimento'], priority: 'media', active: true },
  ],
  templates: [
    { id: 'commercial', name: 'Comercial', shortcut: '/comercial', body: 'Perfeito. Vamos direcionar seu atendimento para a equipe comercial, que dará sequência por aqui.', active: true },
    { id: 'finance', name: 'Financeiro', shortcut: '/financeiro', body: 'Vamos encaminhar seu atendimento para o financeiro. Para agilizar, envie o máximo de detalhes sobre sua solicitação.', active: true },
    { id: 'documents', name: 'Documentação', shortcut: '/documentacao', body: 'Recebemos sua solicitação sobre documentação. A equipe responsável irá continuar o atendimento por aqui.', active: true },
    { id: 'support', name: 'Suporte', shortcut: '/suporte', body: 'Sua solicitação de suporte foi recebida e direcionada para a equipe responsável.', active: true },
    { id: 'general', name: 'Falar com atendente', shortcut: '/atendente', body: 'Certo. Vamos direcionar seu atendimento para um atendente.', active: true },
  ],
  required_fields: INITIAL_REQUIRED_FIELDS,
  optional_fields: [],
  invalid_option_message: 'Não consegui identificar essa opção. Responda apenas com o número de uma das opções do menu principal.',
  absence_message: 'No momento não identificamos uma resposta válida. Você pode responder com o número da opção desejada para continuar.',
  out_of_hours_message: 'Recebemos sua mensagem fora do horário de atendimento. Sua solicitação foi registrada e será tratada no próximo período útil.',
  closing_message: 'Atendimento encerrado. Obrigado por falar com a Visa Fácil.',
  return_to_menu_rule: { enabled: true, commands: ['0', 'menu', 'voltar', 'inicio'] },
  escalation_rules: [
    { id: 'supervisor-5m', afterMinutes: 5, level: 'supervisor', recipientRole: 'supervisor', recipientUserId: null, channels: ['in_app'], active: true },
    { id: 'manager-10m', afterMinutes: 10, level: 'manager', recipientRole: 'manager', recipientUserId: null, channels: ['in_app'], active: true },
  ],
  notification_channels: { in_app: true, whatsapp: false, sms: false },
  supervisor_user_id: null,
  manager_user_id: null,
};

function clone<T>(value: T): T { return structuredClone(value); }
function isObject(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function isString(value: unknown): value is string { return typeof value === 'string'; }
function isBoolean(value: unknown): value is boolean { return typeof value === 'boolean'; }
function isNonEmpty(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }
function isPositiveInteger(value: unknown): value is number { return typeof value === 'number' && Number.isInteger(value) && value > 0; }
function uniqueIds(values: Array<{ id: string }>) { return new Set(values.map((item) => item.id)).size === values.length; }
function validPriority(value: unknown): value is VisaChatPriority { return typeof value === 'string' && (VISACHAT_PRIORITIES as readonly string[]).includes(value); }
function validNotificationChannel(value: unknown): value is VisaChatNotificationChannel { return typeof value === 'string' && (VISACHAT_NOTIFICATION_CHANNELS as readonly string[]).includes(value); }

export function isVisaChatSettings(value: unknown): value is VisaChatSettings {
  if (!isObject(value) || value.version !== 2 || !isBoolean(value.enabled)) return false;
  for (const key of ['welcome_message', 'main_menu_message', 'invalid_option_message', 'absence_message', 'out_of_hours_message', 'closing_message']) if (!isString(value[key])) return false;
  if (!Array.isArray(value.required_fields) || !value.required_fields.every(isString) || !Array.isArray(value.optional_fields) || !value.optional_fields.every(isString)) return false;
  if (!Array.isArray(value.menu_options) || !uniqueIds(value.menu_options as VisaChatMenuOption[]) || !value.menu_options.every((option) => isObject(option)
    && isNonEmpty(option.id) && isPositiveInteger(option.order) && isString(option.label) && isNonEmpty(option.responseTemplateId)
    && isString(option.queue) && isString(option.sector) && (option.defaultAssignee == null || isString(option.defaultAssignee))
    && Array.isArray(option.tags) && option.tags.every(isString) && validPriority(option.priority) && isBoolean(option.active)
    && (option.required_fields === undefined || (Array.isArray(option.required_fields) && option.required_fields.every(isString)))
    && (option.optional_fields === undefined || (Array.isArray(option.optional_fields) && option.optional_fields.every(isString))))) return false;
  if (!Array.isArray(value.templates) || !uniqueIds(value.templates as ReplyTemplate[]) || !value.templates.every((template) => isObject(template)
    && isNonEmpty(template.id) && isNonEmpty(template.name) && isNonEmpty(template.shortcut) && isString(template.body) && isBoolean(template.active))) return false;
  if (!isObject(value.return_to_menu_rule) || (value.return_to_menu_rule.enabled !== undefined && !isBoolean(value.return_to_menu_rule.enabled))
    || (value.return_to_menu_rule.commands !== undefined && (!Array.isArray(value.return_to_menu_rule.commands) || !value.return_to_menu_rule.commands.every(isString)))) return false;
  if (!Array.isArray(value.escalation_rules) || !uniqueIds(value.escalation_rules as EscalationRule[]) || !value.escalation_rules.every((rule) => isObject(rule)
    && isNonEmpty(rule.id) && isPositiveInteger(rule.afterMinutes) && isString(rule.level) && isNonEmpty(rule.recipientRole)
    && (rule.recipientUserId == null || isString(rule.recipientUserId)) && Array.isArray(rule.channels) && rule.channels.every(validNotificationChannel) && isBoolean(rule.active))) return false;
  if (!isObject(value.notification_channels)) return false;
  if (value.supervisor_user_id != null && !isString(value.supervisor_user_id)) return false;
  if (value.manager_user_id != null && !isString(value.manager_user_id)) return false;
  return true;
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
    return clone(parsed);
  } catch {
    return fallback();
  }
}

export function saveVisaChatSettings(settings: VisaChatSettings): VisaChatSettings {
  if (!isVisaChatSettings(settings)) throw new Error('Invalid VisaChat settings');
  const next = clone(settings);
  if (typeof sessionStorage !== 'undefined') {
    try { sessionStorage.setItem(VISACHAT_SETTINGS_STORAGE_KEY, JSON.stringify(next)); } catch {}
  }
  return next;
}
