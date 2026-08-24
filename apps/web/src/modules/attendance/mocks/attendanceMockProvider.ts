import raw from './attendance.dev.json';

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

export function getAttendanceInitialConversations(): AttendanceConversation[] {
  if (import.meta.env.VITE_CRM_MOCKS !== 'true') return [];
  return structuredClone(raw.conversations) as AttendanceConversation[];
}
