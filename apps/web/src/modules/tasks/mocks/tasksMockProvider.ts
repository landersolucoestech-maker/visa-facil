import taskFixtures from './tasks.dev.json';

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

const devMocksEnabled = import.meta.env.VITE_CRM_MOCKS === 'true';

export function getTaskInitialRecords(): TaskRecord[] {
  if (!devMocksEnabled) return [];
  return structuredClone(taskFixtures) as TaskRecord[];
}
