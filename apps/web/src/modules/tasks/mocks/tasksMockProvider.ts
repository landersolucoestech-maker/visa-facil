import taskFixtures from './tasks.dev.json';
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

export function getTaskInitialRecords(): TaskRecord[] {
  if (!isMockDataEnabled()) return [];
  return structuredClone(taskFixtures) as TaskRecord[];
}
