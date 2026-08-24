import records from './finance.dev.json';

export type FinanceType = 'Receita' | 'Despesa';
export type FinanceStatus = 'Recebido' | 'A receber' | 'Pago' | 'A pagar';
export type FinanceRecord = {
  id:string; description:string; type:FinanceType; category:string; amount:number; date:string; dueDate:string;
  status:FinanceStatus; paymentMethod:string; relatedName:string; notes:string;
};

export function getFinanceInitialRecords(): FinanceRecord[] {
  return JSON.parse(JSON.stringify(records)) as FinanceRecord[];
}
