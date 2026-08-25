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

export function getAgendaInitialEvents(): AgendaEvent[] {
  if (!isMockDataEnabled()) return [];
  return structuredClone(data) as AgendaEvent[];
}
