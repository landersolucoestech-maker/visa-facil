import raw from '../../../mocks/attendance/attendance.dev.json';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';

export type AttendanceMessage = {
  id: string;
  sender: 'customer' | 'agent' | 'system';
  author: string;
  body: string;
  time: string;
};

export type AttendanceConversation = {
  id: string;
  customer: string;
  handle: string;
  email: string;
  channel: string;
  status: string;
  assignee: string;
  queue: string;
  protocol: string;
  tags: string[];
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  crmType: string;
  service: string;
  destination: string;
  visaType: string;
  messages: AttendanceMessage[];
};

const SENDERS = new Set<AttendanceMessage['sender']>(['customer', 'agent', 'system']);
const STATUSES = new Set(['Aguardando atendimento', 'Em atendimento', 'Aguardando cliente', 'Resolvida', 'Arquivada']);
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isText(value: unknown): value is string { return typeof value === 'string'; }
export function isAttendanceMessage(value: unknown): value is AttendanceMessage {
  if (!isObject(value)) return false;
  return typeof value.id === 'string' && value.id.trim().length > 0
    && typeof value.sender === 'string' && SENDERS.has(value.sender as AttendanceMessage['sender'])
    && isText(value.author)
    && isText(value.body)
    && isText(value.time);
}
export function isAttendanceConversation(value: unknown): value is AttendanceConversation {
  if (!isObject(value)) return false;
  return typeof value.id === 'string' && value.id.trim().length > 0
    && typeof value.customer === 'string' && value.customer.trim().length > 0
    && isText(value.handle)
    && isText(value.email)
    && typeof value.channel === 'string' && value.channel.trim().length > 0
    && typeof value.status === 'string' && STATUSES.has(value.status)
    && isText(value.assignee)
    && isText(value.queue)
    && typeof value.protocol === 'string' && value.protocol.trim().length > 0
    && Array.isArray(value.tags) && value.tags.every(isText)
    && isText(value.lastMessage)
    && isText(value.lastMessageAt)
    && typeof value.unread === 'number' && Number.isInteger(value.unread) && value.unread >= 0
    && isText(value.crmType)
    && isText(value.service)
    && isText(value.destination)
    && isText(value.visaType)
    && Array.isArray(value.messages) && value.messages.every(isAttendanceMessage)
    && new Set(value.messages.map((message) => message.id)).size === value.messages.length;
}

export function getAttendanceInitialConversations(): AttendanceConversation[] {
  if (!isMockDataEnabled()) return [];
  const clone: unknown = structuredClone(raw);
  if (!isObject(clone) || !Array.isArray(clone.conversations)) return [];
  return clone.conversations.filter(isAttendanceConversation);
}
