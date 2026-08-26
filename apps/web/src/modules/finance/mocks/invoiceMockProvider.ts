import records from '../../../mocks/finance/invoices.dev.json';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';

export type InvoiceSeedStatus = 'Rascunho' | 'Pronta' | 'Enviada' | 'Em aberto' | 'Parcialmente pago' | 'Pago' | 'Vencida' | 'Cancelada';
export type InvoiceSeedDirection = 'Entrada' | 'Saída';
export type InvoiceSeedSettlementStatus = 'Liquidado' | 'Pendente';

export type InvoiceSeedPayment = {
  id: string;
  date: string;
  method: string;
  amount: number;
  processingFee: number;
  settlementStatus: InvoiceSeedSettlementStatus;
  notes: string;
};

export type InvoiceSeed = {
  id: string;
  invoiceNumber?: string;
  customer?: string;
  billingContact?: string;
  service?: string;
  processRef?: string;
  referenceNumbers?: string;
  destination?: string;
  visaType?: string;
  processStage?: string;
  appointmentDate?: string;
  travelDate?: string;
  noteDirection?: InvoiceSeedDirection;
  serviceFee?: number;
  consularFee?: number;
  translationFee?: number;
  courierFee?: number;
  thirdPartyFee?: number;
  otherCharges?: number;
  discounts?: number;
  tax?: number;
  paymentTerms?: string;
  issueDate?: string;
  dueDate?: string;
  relatedDocuments?: string;
  notes?: string;
  instructions?: string;
  status?: InvoiceSeedStatus;
  paid?: number;
  payments?: InvoiceSeedPayment[];
  recipientName?: string;
  unitValue?: number;
};

const VALID_STATUSES = new Set<InvoiceSeedStatus>(['Rascunho', 'Pronta', 'Enviada', 'Em aberto', 'Parcialmente pago', 'Pago', 'Vencida', 'Cancelada']);
const VALID_DIRECTIONS = new Set<InvoiceSeedDirection>(['Entrada', 'Saída']);
const VALID_SETTLEMENT_STATUSES = new Set<InvoiceSeedSettlementStatus>(['Liquidado', 'Pendente']);
const NUMERIC_FIELDS = ['quantity', 'unitValue', 'serviceFee', 'consularFee', 'translationFee', 'courierFee', 'thirdPartyFee', 'otherCharges', 'discounts', 'tax', 'taxBase', 'icms', 'ipi', 'pis', 'cofins', 'iss', 'withheldTaxes', 'freight', 'insurance', 'otherFiscalExpenses', 'paid'] as const;
const TEXT_FIELDS = ['invoiceNumber', 'customer', 'billingContact', 'service', 'processRef', 'referenceNumbers', 'destination', 'visaType', 'processStage', 'appointmentDate', 'travelDate', 'natureOfOperation', 'series', 'fiscalNumber', 'accessKey', 'issueDate', 'operationDate', 'dueDate', 'fiscalStatus', 'issuerName', 'issuerDocument', 'issuerStateRegistration', 'issuerMunicipalRegistration', 'issuerAddress', 'issuerCity', 'issuerState', 'issuerZip', 'recipientName', 'recipientDocument', 'recipientStateRegistration', 'recipientAddress', 'recipientCity', 'recipientState', 'recipientZip', 'supplierName', 'supplierDocument', 'supplierInvoiceNumber', 'supplierSeries', 'supplierAccessKey', 'purchaseOrderRef', 'receiptDate', 'entryPurpose', 'customerOrderRef', 'deliveryAddress', 'shippingMethod', 'departureDate', 'salePurpose', 'cfop', 'serviceCode', 'ncm', 'cstCsosn', 'unit', 'paymentTerms', 'relatedDocuments', 'notes', 'instructions', 'additionalInfo'] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPayment(value: unknown): value is InvoiceSeedPayment {
  if (!isObject(value)) return false;
  return typeof value.id === 'string'
    && value.id.trim().length > 0
    && typeof value.date === 'string'
    && typeof value.method === 'string'
    && value.method.trim().length > 0
    && isFiniteNumber(value.amount)
    && value.amount > 0
    && isFiniteNumber(value.processingFee)
    && value.processingFee >= 0
    && typeof value.settlementStatus === 'string'
    && VALID_SETTLEMENT_STATUSES.has(value.settlementStatus as InvoiceSeedSettlementStatus)
    && typeof value.notes === 'string';
}

export function isInvoiceSeed(value: unknown): value is InvoiceSeed {
  if (!isObject(value) || typeof value.id !== 'string' || !value.id.trim()) return false;
  if (value.status !== undefined && (typeof value.status !== 'string' || !VALID_STATUSES.has(value.status as InvoiceSeedStatus))) return false;
  if (value.noteDirection !== undefined && (typeof value.noteDirection !== 'string' || !VALID_DIRECTIONS.has(value.noteDirection as InvoiceSeedDirection))) return false;
  for (const field of TEXT_FIELDS) {
    const candidate = value[field];
    if (candidate !== undefined && typeof candidate !== 'string') return false;
  }
  for (const field of NUMERIC_FIELDS) {
    const candidate = value[field];
    if (candidate !== undefined && (!isFiniteNumber(candidate) || candidate < 0)) return false;
  }
  const paid = value.paid;
  if (paid !== undefined && !isFiniteNumber(paid)) return false;
  if (value.payments !== undefined) {
    if (!Array.isArray(value.payments) || !value.payments.every(isPayment)) return false;
    const ids = value.payments.map((payment) => payment.id);
    if (new Set(ids).size !== ids.length) return false;
    if (paid !== undefined) {
      const liquidated = value.payments.filter((payment) => payment.settlementStatus === 'Liquidado').reduce((sum, payment) => sum + payment.amount, 0);
      if (Math.abs(liquidated - paid) > 0.0001) return false;
    }
  } else if (paid !== undefined && paid !== 0) {
    return false;
  }
  return true;
}

export function getInvoiceMockSeeds(): InvoiceSeed[] {
  if (!isMockDataEnabled()) return [];
  const clone: unknown = structuredClone(records);
  if (!Array.isArray(clone)) return [];
  return clone.filter(isInvoiceSeed);
}
