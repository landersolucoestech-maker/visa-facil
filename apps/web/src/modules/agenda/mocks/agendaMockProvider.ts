import data from './agenda.dev.json';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';

export type AgendaStatus = 'Confirmado' | 'Pendente' | 'Realizado' | 'Cancelado';
export type AgendaViewMode = 'dia' | 'semana' | 'mes' | 'ano';
export type AgendaEvent = {
  id: string;
  title: string;
  type: string;
  status: AgendaStatus;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  city: string;
  relatedType: 'Contato' | 'Lead' | 'Cliente';
  relatedName: string;
  owner: string;
  notes: string;
};

const STATUSES = new Set<AgendaStatus>(['Confirmado', 'Pendente', 'Realizado', 'Cancelado']);
const RELATED_TYPES = new Set<AgendaEvent['relatedType']>(['Contato', 'Lead', 'Cliente']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isText(value: unknown): value is string { return typeof value === 'string'; }
export function isAgendaEvent(value: unknown): value is AgendaEvent {
  if (!isObject(value)) return false;
  if (typeof value.startTime !== 'string' || typeof value.endTime !== 'string') return false;
  if ((value.startTime !== '' && !TIME_RE.test(value.startTime)) || (value.endTime !== '' && !TIME_RE.test(value.endTime))) return false;
  if (value.startTime && value.endTime && value.endTime <= value.startTime) return false;
  return typeof value.id === 'string' && value.id.trim().length > 0
    && typeof value.title === 'string' && value.title.trim().length > 0
    && isText(value.type)
    && typeof value.status === 'string' && STATUSES.has(value.status as AgendaStatus)
    && typeof value.date === 'string' && DATE_RE.test(value.date)
    && isText(value.location)
    && isText(value.city)
    && typeof value.relatedType === 'string' && RELATED_TYPES.has(value.relatedType as AgendaEvent['relatedType'])
    && isText(value.relatedName)
    && isText(value.owner)
    && isText(value.notes);
}

export function getAgendaInitialEvents(): AgendaEvent[] {
  if (!isMockDataEnabled()) return [];
  const clone: unknown = structuredClone(data);
  if (!Array.isArray(clone)) return [];
  return clone.filter(isAgendaEvent);
}
