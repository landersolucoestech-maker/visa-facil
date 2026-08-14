export type FinancialEntryType = 'income' | 'expense';
export type FinancialEntryStatus = 'planned' | 'paid';

export interface FinancialEntry {
  id: string;
  processId?: string;
  clientId?: string;
  type: FinancialEntryType;
  status: FinancialEntryStatus;
  description: string;
  amountCents: number;
  dueDate: string;
  createdAt: string;
}

export const FINANCIAL_ENTRY_TYPE_LABELS: Record<FinancialEntryType, string> = {
  income: 'Receita',
  expense: 'Despesa',
};

export const FINANCIAL_ENTRY_STATUS_LABELS: Record<FinancialEntryStatus, string> = {
  planned: 'Previsto',
  paid: 'Pago',
};
