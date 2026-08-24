import records from './crm-records.dev.json';
import type { CrmRecord } from '../CrmApp';

export function getCrmInitialRecords(): CrmRecord[] {
  if (import.meta.env.VITE_CRM_MOCKS !== 'true') return [];
  return structuredClone(records) as CrmRecord[];
}
