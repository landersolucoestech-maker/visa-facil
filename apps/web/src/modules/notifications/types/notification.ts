export type ManagementAlertSeverity = 'info' | 'warning' | 'critical';
export type ManagementAlertType = 'task' | 'chat' | 'document';

export interface ManagementAlert {
  id: string;
  type: ManagementAlertType;
  severity: ManagementAlertSeverity;
  title: string;
  description: string;
  href: string;
}
