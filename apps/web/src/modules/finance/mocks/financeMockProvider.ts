import records from './finance.dev.json';
import type { FinanceRecord, FinanceStatus, FinanceType } from '../types';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';

export type { FinanceRecord, FinanceStatus, FinanceType } from '../types';

export function getFinanceInitialRecords(): FinanceRecord[] {
  if (!isMockDataEnabled()) return [];
  return structuredClone(records) as FinanceRecord[];
}
