import type { ProcessPriority } from '../../processes/types/process';

export type TaskStatus = 'open' | 'done';

export interface ManagementTask {
  id: string;
  title: string;
  clientId?: string;
  processId?: string;
  dueDate: string;
  priority: ProcessPriority;
  status: TaskStatus;
  notes: string;
  createdAt: string;
}
