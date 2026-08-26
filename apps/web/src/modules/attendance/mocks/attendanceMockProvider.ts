import raw from '../../../mocks/attendance/attendance.dev.json';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';
import { isAttendanceConversation, type AttendanceConversation } from '../attendanceDomain';

export * from '../attendanceDomain';

export function getAttendanceInitialConversations(): AttendanceConversation[] {
  if (!isMockDataEnabled()) return [];
  const clone: unknown = structuredClone(raw);
  if (typeof clone !== 'object' || clone === null || Array.isArray(clone)) return [];
  const conversations = (clone as Record<string, unknown>).conversations;
  if (!Array.isArray(conversations)) return [];
  return conversations.filter(isAttendanceConversation);
}
