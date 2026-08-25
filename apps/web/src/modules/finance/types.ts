export type FinanceType = 'Receita' | 'Despesa';
export type FinanceStatus = 'Recebido' | 'A receber' | 'Pago' | 'A pagar';

export type FinanceRecord = {
  id: string;
  description: string;
  type: FinanceType;
  category: string;
  amount: number;
  date: string;
  dueDate: string;
  status: FinanceStatus;
  paymentMethod: string;
  relatedName: string;
  notes: string;
};
