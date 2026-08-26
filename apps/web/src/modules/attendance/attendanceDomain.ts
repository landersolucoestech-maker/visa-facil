export const CUSTOMER_STATUS_OPTIONS = ['Aguardando atendimento', 'Em atendimento', 'Aguardando cliente', 'Resolvida', 'Arquivada'] as const;
export const TEAM_STATUS_OPTIONS = ['Ativo', 'Arquivada'] as const;

export type CustomerConversationStatus = typeof CUSTOMER_STATUS_OPTIONS[number];
export type TeamConversationStatus = typeof TEAM_STATUS_OPTIONS[number];
export type AttendanceConversationStatus = CustomerConversationStatus | TeamConversationStatus;
export type AttendanceConversationKind = 'customer' | 'team';
export type AttendanceMessageSender = 'customer' | 'agent' | 'team' | 'system';

export type AttendanceMessage = {
  id: string;
  sender: AttendanceMessageSender;
  author: string;
  body: string;
  time: string;
};

type AttendanceConversationBase<Status extends AttendanceConversationStatus> = {
  id: string;
  customer: string;
  handle: string;
  email: string;
  channel: string;
  status: Status;
  assignee: string;
  queue: string;
  protocol: string;
  tags: string[];
  lastMessage: string;
  lastMessageAt: string;
  updatedAt?: string;
  unread: number;
  crmType: string;
  service: string;
  destination: string;
  visaType: string;
  messages: AttendanceMessage[];
};

export type CustomerAttendanceConversation = AttendanceConversationBase<CustomerConversationStatus> & {
  kind?: 'customer';
};

export type TeamAttendanceConversation = AttendanceConversationBase<TeamConversationStatus> & {
  kind: 'team';
  channel: 'Equipe';
  queue: 'Equipe';
  crmType: 'Equipe';
  email: '';
  service: '';
  destination: '';
  visaType: '';
  participantIds?: string[];
};

export type AttendanceConversation = CustomerAttendanceConversation | TeamAttendanceConversation;

const CUSTOMER_STATUSES = new Set<string>(CUSTOMER_STATUS_OPTIONS);
const TEAM_STATUSES = new Set<string>(TEAM_STATUS_OPTIONS);
const CUSTOMER_SENDERS = new Set<AttendanceMessageSender>(['customer', 'agent', 'system']);
const TEAM_SENDERS = new Set<AttendanceMessageSender>(['agent', 'team', 'system']);
const ALL_SENDERS = new Set<AttendanceMessageSender>(['customer', 'agent', 'team', 'system']);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function hasUniqueStrings(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.every((item) => typeof item === 'string' && item.trim().length > 0)
    && new Set(value).size === value.length;
}

export function getAttendanceConversationKind(value: Pick<AttendanceConversation, 'kind'> | { kind?: unknown }): AttendanceConversationKind {
  return value.kind === 'team' ? 'team' : 'customer';
}

export function isAttendanceMessage(value: unknown): value is AttendanceMessage {
  if (!isObject(value)) return false;
  return isNonEmptyText(value.id)
    && typeof value.sender === 'string'
    && ALL_SENDERS.has(value.sender as AttendanceMessageSender)
    && isText(value.author)
    && isText(value.body)
    && isText(value.time);
}

function hasCommonConversationShape(value: Record<string, unknown>) {
  return isNonEmptyText(value.id)
    && isNonEmptyText(value.customer)
    && isText(value.handle)
    && isText(value.email)
    && isNonEmptyText(value.channel)
    && isText(value.assignee)
    && isText(value.queue)
    && isNonEmptyText(value.protocol)
    && Array.isArray(value.tags)
    && value.tags.every(isText)
    && isText(value.lastMessage)
    && isText(value.lastMessageAt)
    && (value.updatedAt === undefined || isIsoTimestamp(value.updatedAt))
    && typeof value.unread === 'number'
    && Number.isInteger(value.unread)
    && value.unread >= 0
    && isText(value.crmType)
    && isText(value.service)
    && isText(value.destination)
    && isText(value.visaType)
    && Array.isArray(value.messages)
    && value.messages.every(isAttendanceMessage)
    && new Set(value.messages.map((message) => message.id)).size === value.messages.length;
}

export function isAttendanceConversation(value: unknown): value is AttendanceConversation {
  if (!isObject(value) || !hasCommonConversationShape(value)) return false;
  const kind = getAttendanceConversationKind(value);
  if (kind === 'team') {
    return value.kind === 'team'
      && typeof value.status === 'string'
      && TEAM_STATUSES.has(value.status)
      && value.channel === 'Equipe'
      && value.queue === 'Equipe'
      && value.crmType === 'Equipe'
      && value.email === ''
      && value.service === ''
      && value.destination === ''
      && value.visaType === ''
      && (value.participantIds === undefined || (hasUniqueStrings(value.participantIds) && value.participantIds.length > 0))
      && (value.messages as AttendanceMessage[]).every((message) => TEAM_SENDERS.has(message.sender));
  }
  return (value.kind === undefined || value.kind === 'customer')
    && typeof value.status === 'string'
    && CUSTOMER_STATUSES.has(value.status)
    && value.channel !== 'Equipe'
    && (value.messages as AttendanceMessage[]).every((message) => CUSTOMER_SENDERS.has(message.sender));
}

export function getAttendanceParticipantIds(conversation: AttendanceConversation): string[] {
  if (getAttendanceConversationKind(conversation) !== 'team') return [];
  return Array.isArray((conversation as TeamAttendanceConversation).participantIds)
    ? [...((conversation as TeamAttendanceConversation).participantIds ?? [])]
    : [];
}

export function canSendAttendanceMessage(conversation: AttendanceConversation | undefined): boolean {
  return Boolean(conversation && conversation.status !== 'Arquivada');
}

export function sortAttendanceConversations<T extends AttendanceConversation>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index, time: item.updatedAt ? Date.parse(item.updatedAt) : Number.NaN }))
    .sort((left, right) => {
      const leftTime = Number.isFinite(left.time) ? left.time : Number.NEGATIVE_INFINITY;
      const rightTime = Number.isFinite(right.time) ? right.time : Number.NEGATIVE_INFINITY;
      return rightTime - leftTime || left.index - right.index;
    })
    .map(({ item }) => item);
}

export function normalizeAttendanceConversation(
  conversation: AttendanceConversation,
  seed?: AttendanceConversation,
): AttendanceConversation {
  const kind = getAttendanceConversationKind(conversation);
  const seedUpdatedAt = seed?.updatedAt && Number.isFinite(Date.parse(seed.updatedAt)) ? seed.updatedAt : undefined;
  const updatedAt = conversation.updatedAt && Number.isFinite(Date.parse(conversation.updatedAt))
    ? conversation.updatedAt
    : seedUpdatedAt;

  if (kind === 'team') {
    const current = conversation as TeamAttendanceConversation;
    const seedParticipants = seed && getAttendanceConversationKind(seed) === 'team'
      ? getAttendanceParticipantIds(seed)
      : [];
    const participantIds = getAttendanceParticipantIds(current);
    return {
      ...current,
      kind: 'team',
      ...(updatedAt ? { updatedAt } : {}),
      ...(participantIds.length ? { participantIds } : seedParticipants.length ? { participantIds: seedParticipants } : {}),
    };
  }

  return {
    ...conversation,
    kind: 'customer',
    ...(updatedAt ? { updatedAt } : {}),
  } as CustomerAttendanceConversation;
}
