import taskFixtures from '../../../mocks/tasks/tasks.dev.json';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';

export type TaskStatus = 'Pendente' | 'Em andamento' | 'Concluída';
export type TaskPriority = 'Baixa' | 'Média' | 'Alta';
export type RelatedType = 'Contato' | 'Lead';

export type TaskRecord = {
  id: string;
  title: string;
  description: string;
  relatedType: RelatedType;
  relatedName: string;
  owner: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  dueTime: string;
  reminder: string;
  createdAt: string;
  updatedAt: string;
};

const STATUSES = new Set<TaskStatus>(['Pendente', 'Em andamento', 'Concluída']);
const PRIORITIES = new Set<TaskPriority>(['Baixa', 'Média', 'Alta']);
const RELATED_TYPES = new Set<RelatedType>(['Contato', 'Lead']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isText(value: unknown): value is string { return typeof value === 'string'; }
export function isTaskRecord(value: unknown): value is TaskRecord {
  if (!isObject(value)) return false;
  if (typeof value.dueDate !== 'string' || (value.dueDate !== '' && !DATE_RE.test(value.dueDate))) return false;
  if (typeof value.dueTime !== 'string' || (value.dueTime !== '' && !TIME_RE.test(value.dueTime))) return false;
  if (!value.dueDate && (value.dueTime !== '' || value.reminder !== 'Sem lembrete')) return false;
  return typeof value.id === 'string' && value.id.trim().length > 0
    && typeof value.title === 'string' && value.title.trim().length > 0
    && isText(value.description)
    && typeof value.relatedType === 'string' && RELATED_TYPES.has(value.relatedType as RelatedType)
    && isText(value.relatedName)
    && isText(value.owner)
    && typeof value.priority === 'string' && PRIORITIES.has(value.priority as TaskPriority)
    && typeof value.status === 'string' && STATUSES.has(value.status as TaskStatus)
    && isText(value.reminder)
    && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt))
    && typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.updatedAt));
}

export function getTaskInitialRecords(): TaskRecord[] {
  if (!isMockDataEnabled()) return [];
  const clone: unknown = structuredClone(taskFixtures);
  if (!Array.isArray(clone)) return [];
  return clone.filter(isTaskRecord);
}
