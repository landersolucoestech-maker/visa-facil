import records from './finance.dev.json';
import type { FinanceRecord, FinanceStatus, FinanceType } from '../types';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';

export type { FinanceRecord, FinanceStatus, FinanceType } from '../types';

const STATUS_BY_TYPE: Record<FinanceType, Set<FinanceStatus>> = {
  Receita: new Set<FinanceStatus>(['Recebido', 'A receber']),
  Despesa: new Set<FinanceStatus>(['Pago', 'A pagar']),
};
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isText(value: unknown): value is string { return typeof value === 'string'; }
function isFinanceType(value: unknown): value is FinanceType { return value === 'Receita' || value === 'Despesa'; }
function isFinanceStatus(value: unknown): value is FinanceStatus { return value === 'Recebido' || value === 'A receber' || value === 'Pago' || value === 'A pagar'; }
function isFinanceRecord(value: unknown): value is FinanceRecord {
  if (!isObject(value) || !isFinanceType(value.type) || !isFinanceStatus(value.status) || !STATUS_BY_TYPE[value.type].has(value.status)) return false;
  return typeof value.id === 'string' && value.id.trim().length > 0
    && typeof value.description === 'string' && value.description.trim().length > 0
    && typeof value.category === 'string' && value.category.trim().length > 0
    && typeof value.amount === 'number' && Number.isFinite(value.amount) && value.amount > 0
    && typeof value.date === 'string' && DATE_RE.test(value.date)
    && typeof value.dueDate === 'string' && (value.dueDate === '' || DATE_RE.test(value.dueDate))
    && isText(value.paymentMethod)
    && isText(value.relatedName)
    && isText(value.notes);
}

export function getFinanceInitialRecords(): FinanceRecord[] {
  if (!isMockDataEnabled()) return [];
  const clone: unknown = structuredClone(records);
  if (!Array.isArray(clone)) return [];
  return clone.filter(isFinanceRecord);
}
