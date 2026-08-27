import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { type InvoiceSeed } from './mocks/invoiceMockProvider';
import { getInvoiceSessionSeeds, saveInvoiceSessionSeeds } from './invoiceSessionStore';

type NoteDirection = 'Entrada' | 'Saída';
type InvoiceStatus = 'Rascunho' | 'Pronta' | 'Enviada' | 'Em aberto' | 'Parcialmente pago' | 'Pago' | 'Vencida' | 'Cancelada';
type SettlementStatus = 'Liquidado' | 'Pendente';
type Mode = 'create' | 'edit' | 'view' | 'payment' | 'document';
type Payment = { id: string; date: string; method: string; amount: number; processingFee: number; settlementStatus: SettlementStatus; notes: string };
type Invoice = {
  id: string; invoiceNumber: string; customer: string; billingContact: string; service: string; processRef: string; referenceNumbers: string;
  destination: string; visaType: string; processStage: string; appointmentDate: string; travelDate: string; noteDirection: NoteDirection;
  natureOfOperation: string; series: string; fiscalNumber: string; accessKey: string; issueDate: string; operationDate: string; dueDate: string;
  fiscalStatus: string; issuerName: string; issuerDocument: string; issuerStateRegistration: string; issuerMunicipalRegistration: string;
  issuerAddress: string; issuerCity: string; issuerState: string; issuerZip: string; recipientName: string; recipientDocument: string;
  recipientStateRegistration: string; recipientAddress: string; recipientCity: string; recipientState: string; recipientZip: string;
  supplierName: string; supplierDocument: string; supplierInvoiceNumber: string; supplierSeries: string; supplierAccessKey: string;
  purchaseOrderRef: string; receiptDate: string; entryPurpose: string; customerOrderRef: string; deliveryAddress: string; shippingMethod: string;
  departureDate: string; salePurpose: string; cfop: string; serviceCode: string; ncm: string; cstCsosn: string; quantity: number; unit: string;
  unitValue: number; serviceFee: number; consularFee: number; translationFee: number; courierFee: number; thirdPartyFee: number;
  otherCharges: number; discounts: number; tax: number; taxBase: number; icms: number; ipi: number; pis: number; cofins: number; iss: number;
  withheldTaxes: number; freight: number; insurance: number; otherFiscalExpenses: number; paymentTerms: string; relatedDocuments: string;
  notes: string; instructions: string; additionalInfo: string; status: InvoiceStatus; paid: number; payments: Payment[];
};
type Draft = Omit<Invoice, 'id' | 'payments'>;

const STATUS: InvoiceStatus[] = ['Rascunho', 'Pronta', 'Enviada', 'Em aberto', 'Parcialmente pago', 'Pago', 'Vencida', 'Cancelada'];
const DERIVED_STATUS = new Set<InvoiceStatus>(['Parcialmente pago', 'Pago', 'Vencida']);
const PAYMENT_METHODS = ['Pix', 'Cartão de crédito', 'Cartão de débito', 'Transferência bancária', 'Boleto', 'Dinheiro', 'Outro'];
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY: Draft = {
  invoiceNumber: '', customer: '', billingContact: '', service: '', processRef: '', referenceNumbers: '', destination: '', visaType: '', processStage: '',
  appointmentDate: '', travelDate: '', noteDirection: 'Saída', natureOfOperation: 'Prestação de serviços', series: '1', fiscalNumber: '', accessKey: '',
  issueDate: today(), operationDate: today(), dueDate: '', fiscalStatus: 'Não emitida', issuerName: 'VISA FÁCIL', issuerDocument: '', issuerStateRegistration: 'ISENTO',
  issuerMunicipalRegistration: '', issuerAddress: '', issuerCity: '', issuerState: '', issuerZip: '', recipientName: '', recipientDocument: '',
  recipientStateRegistration: 'ISENTO', recipientAddress: '', recipientCity: '', recipientState: '', recipientZip: '', supplierName: '', supplierDocument: '',
  supplierInvoiceNumber: '', supplierSeries: '', supplierAccessKey: '', purchaseOrderRef: '', receiptDate: today(), entryPurpose: 'Aquisição/recebimento de serviço',
  customerOrderRef: '', deliveryAddress: '', shippingMethod: '', departureDate: today(), salePurpose: 'Prestação de serviço ao cliente', cfop: '', serviceCode: '',
  ncm: '', cstCsosn: '', quantity: 1, unit: 'UN', unitValue: 0, serviceFee: 0, consularFee: 0, translationFee: 0, courierFee: 0, thirdPartyFee: 0,
  otherCharges: 0, discounts: 0, tax: 0, taxBase: 0, icms: 0, ipi: 0, pis: 0, cofins: 0, iss: 0, withheldTaxes: 0, freight: 0, insurance: 0,
  otherFiscalExpenses: 0, paymentTerms: '7 dias', relatedDocuments: '', notes: '', instructions: '', additionalInfo: '', status: 'Rascunho', paid: 0,
};

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const subtotal = (invoice: Draft | Invoice) => Math.max(0, invoice.serviceFee + invoice.consularFee + invoice.translationFee + invoice.courierFee + invoice.thirdPartyFee + invoice.otherCharges - invoice.discounts);
const total = (invoice: Draft | Invoice) => Math.max(0, subtotal(invoice) + invoice.tax + invoice.icms + invoice.ipi + invoice.pis + invoice.cofins + invoice.iss + invoice.freight + invoice.insurance + invoice.otherFiscalExpenses - invoice.withheldTaxes);
const balance = (invoice: Invoice) => Math.max(0, total(invoice) - invoice.paid);
const normalize = (record: InvoiceSeed): Invoice => ({
  ...EMPTY,
  ...record,
  id: record.id,
  payments: (record.payments ?? []).map((payment) => ({ ...payment })),
  recipientName: record.recipientName ?? record.customer ?? '',
  unitValue: record.unitValue ?? record.serviceFee ?? 0,
  noteDirection: record.noteDirection ?? 'Saída',
  status: record.status ?? EMPTY.status,
  paid: record.paid ?? 0,
});
const reconcileStatus = (invoice: Invoice): InvoiceStatus => {
  if (invoice.status === 'Cancelada') return 'Cancelada';
  const invoiceTotal = total(invoice);
  if (invoice.paid > 0 && invoiceTotal > 0) return invoice.paid >= invoiceTotal ? 'Pago' : 'Parcialmente pago';
  if (DERIVED_STATUS.has(invoice.status)) return 'Em aberto';
  return invoice.status;
};
const isOutstanding = (invoice: Invoice) => invoice.status !== 'Pago' && invoice.status !== 'Cancelada' && balance(invoice) > 0;
const isOverdue = (invoice: Invoice) => isOutstanding(invoice) && Boolean(invoice.dueDate) && invoice.dueDate < today();
const visibleStatus = (invoice: Invoice): InvoiceStatus => isOverdue(invoice) ? 'Vencida' : invoice.status;
const statusClass = (status: InvoiceStatus) => status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

function BellIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 21h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function PlusIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function PaymentIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M3 10h18M7 14h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function DocumentIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M14 3v5h5M10 12h5M10 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }

function useDialogEscape(close: () => void) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [close]);
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? 'is-wide' : ''}><span>{label}</span>{children}</label>;
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="finance-form-section"><h3>{title}</h3><div className="finance-invoice-form-grid">{children}</div></section>;
}

function InvoiceDocument({ record, close }: { record: Invoice; close: () => void }) {
  const titleId = useId();
  useDialogEscape(close);
  return <div className="finance-accounting-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}>
    <div className="fiscal-document-modal invoice-document-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="fiscal-document-actions"><button className="crm-btn-secondary" type="button" onClick={() => window.print()}>Imprimir / PDF</button><button className="crm-btn-secondary" type="button" onClick={close}>Fechar</button></div>
      <article className="fiscal-document-sheet">
        <header className="fiscal-doc-header"><div><small>DOCUMENTO FISCAL · PROTÓTIPO</small><h1 id={titleId}>Nota Fiscal de {record.noteDirection}</h1><p>{record.natureOfOperation || '—'}</p></div><div className="fiscal-doc-number"><span>Nº</span><strong>{record.fiscalNumber || record.invoiceNumber}</strong><small>Série {record.series || '—'}</small></div></header>
        <section className="fiscal-doc-key"><span>Chave de acesso</span><strong>{record.noteDirection === 'Entrada' ? (record.supplierAccessKey || record.accessKey || 'Não informada') : (record.accessKey || 'Não informada')}</strong><b>{record.fiscalStatus}</b></section>
        <section className="fiscal-doc-parties">{record.noteDirection === 'Entrada' ? <><div><h3>Fornecedor / remetente</h3><strong>{record.supplierName || record.issuerName || '—'}</strong><p>{record.supplierDocument || record.issuerDocument || '—'}</p><p>NF fornecedor {record.supplierInvoiceNumber || '—'} · Série {record.supplierSeries || '—'}</p></div><div><h3>Destinatário / estabelecimento</h3><strong>{record.recipientName || 'VISA FÁCIL'}</strong><p>{record.recipientDocument || '—'}</p><p>Recebimento {date(record.receiptDate)}</p></div></> : <><div><h3>Emitente</h3><strong>{record.issuerName || 'VISA FÁCIL'}</strong><p>{record.issuerDocument || '—'}</p><p>{record.issuerAddress || '—'}</p></div><div><h3>Destinatário / cliente</h3><strong>{record.recipientName || record.customer}</strong><p>{record.recipientDocument || '—'}</p><p>{record.recipientAddress || '—'}</p></div></>}</section>
        <section className="fiscal-doc-meta"><div><span>Emissão</span><b>{date(record.issueDate)}</b></div><div><span>{record.noteDirection === 'Entrada' ? 'Recebimento' : 'Saída'}</span><b>{date(record.noteDirection === 'Entrada' ? record.receiptDate : record.departureDate)}</b></div><div><span>CFOP</span><b>{record.cfop || '—'}</b></div><div><span>Cód. serviço</span><b>{record.serviceCode || '—'}</b></div></section>
        <section className="fiscal-doc-extra"><div><h3>{record.noteDirection === 'Entrada' ? 'Dados da entrada' : 'Dados da saída'}</h3>{record.noteDirection === 'Entrada' ? <><p>Finalidade: {record.entryPurpose || '—'}</p><p>Pedido/compra: {record.purchaseOrderRef || '—'}</p><p>Fornecedor: {record.supplierName || '—'}</p></> : <><p>Finalidade: {record.salePurpose || '—'}</p><p>Pedido/referência do cliente: {record.customerOrderRef || '—'}</p><p>Entrega: {record.deliveryAddress || '—'} · {record.shippingMethod || '—'}</p></>}</div><div><h3>Totais</h3><p>Subtotal {money(subtotal(record))}</p><p>Tributos/encargos {money(total(record) - subtotal(record))}</p><p><strong>Total {money(total(record))}</strong></p></div></section>
      </article>
    </div>
  </div>;
}

function InvoiceDetail({ record, close, edit, registerPayment, document }: { record: Invoice; close: () => void; edit: () => void; registerPayment: () => void; document: () => void }) {
  const titleId = useId();
  useDialogEscape(close);
  const currentStatus = visibleStatus(record);
  return <div className="finance-accounting-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}>
    <div className="invoice-detail-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="invoice-detail-header"><div><span>INVOICE</span><h2 id={titleId}>{record.invoiceNumber}</h2><p>{record.customer} · {record.service || 'Serviço não informado'}</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header>
      <section className="invoice-detail-summary"><div><span>Total</span><strong>{money(total(record))}</strong></div><div><span>Recebido</span><strong>{money(record.paid)}</strong></div><div><span>Saldo</span><strong className={balance(record) > 0 ? 'is-outstanding' : ''}>{money(balance(record))}</strong></div><div><span>Status</span><b className={`invoice-status is-${statusClass(currentStatus)}`}>{currentStatus}</b></div></section>
      <section className="invoice-detail-grid"><div><span>Cliente</span><strong>{record.customer || '—'}</strong><small>{record.billingContact || 'Contato de cobrança não informado'}</small></div><div><span>Processo</span><strong>{record.processRef || '—'}</strong><small>{record.referenceNumbers || 'Sem outras referências'}</small></div><div><span>Emissão</span><strong>{date(record.issueDate)}</strong><small>{record.noteDirection === 'Entrada' ? 'Nota de entrada' : 'Nota de saída'}</small></div><div><span>Vencimento</span><strong className={isOverdue(record) ? 'is-overdue' : ''}>{date(record.dueDate)}</strong><small>{isOverdue(record) ? 'Pagamento em atraso' : record.paymentTerms || 'Prazo não informado'}</small></div></section>
      <section className="invoice-payment-history"><header><div><h3>Pagamentos</h3><p>Histórico financeiro desta invoice.</p></div><strong>{record.payments.length}</strong></header>{record.payments.length ? <div>{record.payments.map((payment) => <article key={payment.id}><div><strong>{money(payment.amount)}</strong><small>{payment.method}</small></div><span>{date(payment.date)}</span><b>{payment.settlementStatus}</b></article>)}</div> : <p className="invoice-empty-copy">Nenhum pagamento registrado.</p>}</section>
      <footer><button className="crm-btn-secondary" type="button" onClick={document}><DocumentIcon />Documento fiscal</button><button className="crm-btn-secondary" type="button" onClick={edit}>Editar</button>{balance(record) > 0 && record.status !== 'Cancelada' && <button className="crm-btn-primary" type="button" onClick={registerPayment}><PaymentIcon />Registrar pagamento</button>}</footer>
    </div>
  </div>;
}

function InvoiceForm({ mode, record, close, save }: { mode: 'create' | 'edit'; record?: Invoice; close: () => void; save: (draft: Draft) => void }) {
  const titleId = useId();
  useDialogEscape(close);
  const [draft, setDraft] = useState<Draft>(() => record ? (({ id: _id, payments: _payments, ...rest }) => rest)(record) : EMPTY);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const invalidDates = Boolean(draft.issueDate && draft.dueDate && draft.dueDate < draft.issueDate);
  const invalidPaidBalance = draft.paid - total(draft) > 0.0001;
  const invalid = !draft.customer.trim() || invalidDates || invalidPaidBalance;
  return <div className="finance-accounting-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}>
    <div className="finance-invoice-form invoice-refined-form" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header><div><span>{mode === 'create' ? 'NOVA INVOICE' : 'EDITAR INVOICE'}</span><h2 id={titleId}>{mode === 'create' ? 'Criar invoice / nota fiscal' : record?.invoiceNumber}</h2><p>Organize os dados comerciais, fiscais e financeiros do documento.</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header>
      <form onSubmit={(event) => { event.preventDefault(); if (!invalid) save(draft); }}>
        <Section title="Identificação e cobrança"><Field label="Número da invoice"><input value={draft.invoiceNumber} onChange={(event) => set('invoiceNumber', event.target.value)} /></Field><Field label="Status"><select value={draft.status} onChange={(event) => set('status', event.target.value as InvoiceStatus)}>{STATUS.map((item) => <option key={item} disabled={DERIVED_STATUS.has(item)}>{item}</option>)}</select></Field><Field label="Cliente *"><input required value={draft.customer} onChange={(event) => set('customer', event.target.value)} /></Field><Field label="Contato de cobrança"><input value={draft.billingContact} onChange={(event) => set('billingContact', event.target.value)} /></Field><Field label="Serviço"><input value={draft.service} onChange={(event) => set('service', event.target.value)} /></Field><Field label="Processo"><input value={draft.processRef} onChange={(event) => set('processRef', event.target.value)} /></Field><Field label="Emissão"><input type="date" value={draft.issueDate} onChange={(event) => set('issueDate', event.target.value)} /></Field><Field label="Vencimento"><input type="date" min={draft.issueDate || undefined} value={draft.dueDate} onChange={(event) => set('dueDate', event.target.value)} /></Field></Section>
        <Section title="Tipo e identificação fiscal"><Field label="Tipo da nota"><select value={draft.noteDirection} onChange={(event) => set('noteDirection', event.target.value as NoteDirection)}><option>Entrada</option><option>Saída</option></select></Field><Field label="Natureza da operação"><input value={draft.natureOfOperation} onChange={(event) => set('natureOfOperation', event.target.value)} /></Field><Field label="Série"><input value={draft.series} onChange={(event) => set('series', event.target.value)} /></Field><Field label="Número fiscal"><input value={draft.fiscalNumber} onChange={(event) => set('fiscalNumber', event.target.value)} /></Field><Field label="Status fiscal"><select value={draft.fiscalStatus} onChange={(event) => set('fiscalStatus', event.target.value)}><option>Não emitida</option><option>Autorizada</option><option>Cancelada</option><option>Contingência</option></select></Field><Field label="Chave de acesso" wide><input maxLength={44} value={draft.accessKey} onChange={(event) => set('accessKey', event.target.value.replace(/\D/g, ''))} /></Field></Section>
        {draft.noteDirection === 'Entrada' ? <Section title="Nota de entrada"><Field label="Fornecedor / remetente"><input value={draft.supplierName} onChange={(event) => set('supplierName', event.target.value)} /></Field><Field label="CPF/CNPJ fornecedor"><input value={draft.supplierDocument} onChange={(event) => set('supplierDocument', event.target.value)} /></Field><Field label="NF do fornecedor"><input value={draft.supplierInvoiceNumber} onChange={(event) => set('supplierInvoiceNumber', event.target.value)} /></Field><Field label="Série fornecedor"><input value={draft.supplierSeries} onChange={(event) => set('supplierSeries', event.target.value)} /></Field><Field label="Recebimento"><input type="date" value={draft.receiptDate} onChange={(event) => set('receiptDate', event.target.value)} /></Field><Field label="Pedido / compra"><input value={draft.purchaseOrderRef} onChange={(event) => set('purchaseOrderRef', event.target.value)} /></Field><Field label="Chave de acesso de origem" wide><input maxLength={44} value={draft.supplierAccessKey} onChange={(event) => set('supplierAccessKey', event.target.value.replace(/\D/g, ''))} /></Field><Field label="Finalidade da entrada" wide><input value={draft.entryPurpose} onChange={(event) => set('entryPurpose', event.target.value)} /></Field></Section> : <Section title="Nota de saída"><Field label="Emitente"><input value={draft.issuerName} onChange={(event) => set('issuerName', event.target.value)} /></Field><Field label="CPF/CNPJ emitente"><input value={draft.issuerDocument} onChange={(event) => set('issuerDocument', event.target.value)} /></Field><Field label="Data de saída"><input type="date" value={draft.departureDate} onChange={(event) => set('departureDate', event.target.value)} /></Field><Field label="Referência do cliente"><input value={draft.customerOrderRef} onChange={(event) => set('customerOrderRef', event.target.value)} /></Field><Field label="Endereço de entrega"><input value={draft.deliveryAddress} onChange={(event) => set('deliveryAddress', event.target.value)} /></Field><Field label="Forma de entrega"><input value={draft.shippingMethod} onChange={(event) => set('shippingMethod', event.target.value)} /></Field><Field label="Finalidade da saída" wide><input value={draft.salePurpose} onChange={(event) => set('salePurpose', event.target.value)} /></Field></Section>}
        <Section title="Destinatário"><Field label="Nome / razão social"><input value={draft.recipientName} onChange={(event) => set('recipientName', event.target.value)} /></Field><Field label="CPF/CNPJ"><input value={draft.recipientDocument} onChange={(event) => set('recipientDocument', event.target.value)} /></Field><Field label="Inscrição estadual"><input value={draft.recipientStateRegistration} onChange={(event) => set('recipientStateRegistration', event.target.value)} /></Field><Field label="Endereço"><input value={draft.recipientAddress} onChange={(event) => set('recipientAddress', event.target.value)} /></Field></Section>
        <Section title="Classificação fiscal"><Field label="CFOP"><input value={draft.cfop} onChange={(event) => set('cfop', event.target.value)} /></Field><Field label="Código do serviço"><input value={draft.serviceCode} onChange={(event) => set('serviceCode', event.target.value)} /></Field><Field label="NCM"><input value={draft.ncm} onChange={(event) => set('ncm', event.target.value)} /></Field><Field label="CST/CSOSN"><input value={draft.cstCsosn} onChange={(event) => set('cstCsosn', event.target.value)} /></Field></Section>
        <Section title="Valores"><Field label="Serviço"><input type="number" min="0" step="0.01" value={draft.serviceFee || ''} onChange={(event) => set('serviceFee', Number(event.target.value))} /></Field><Field label="Taxa consular"><input type="number" min="0" step="0.01" value={draft.consularFee || ''} onChange={(event) => set('consularFee', Number(event.target.value))} /></Field><Field label="Tradução"><input type="number" min="0" step="0.01" value={draft.translationFee || ''} onChange={(event) => set('translationFee', Number(event.target.value))} /></Field><Field label="Terceiros"><input type="number" min="0" step="0.01" value={draft.thirdPartyFee || ''} onChange={(event) => set('thirdPartyFee', Number(event.target.value))} /></Field><Field label="Outros valores"><input type="number" min="0" step="0.01" value={draft.otherCharges || ''} onChange={(event) => set('otherCharges', Number(event.target.value))} /></Field><Field label="Descontos"><input type="number" min="0" step="0.01" value={draft.discounts || ''} onChange={(event) => set('discounts', Number(event.target.value))} /></Field></Section>
        <Section title="Tributos"><Field label="ICMS"><input type="number" min="0" step="0.01" value={draft.icms || ''} onChange={(event) => set('icms', Number(event.target.value))} /></Field><Field label="IPI"><input type="number" min="0" step="0.01" value={draft.ipi || ''} onChange={(event) => set('ipi', Number(event.target.value))} /></Field><Field label="PIS"><input type="number" min="0" step="0.01" value={draft.pis || ''} onChange={(event) => set('pis', Number(event.target.value))} /></Field><Field label="COFINS"><input type="number" min="0" step="0.01" value={draft.cofins || ''} onChange={(event) => set('cofins', Number(event.target.value))} /></Field><Field label="ISS"><input type="number" min="0" step="0.01" value={draft.iss || ''} onChange={(event) => set('iss', Number(event.target.value))} /></Field><Field label="Tributos retidos"><input type="number" min="0" step="0.01" value={draft.withheldTaxes || ''} onChange={(event) => set('withheldTaxes', Number(event.target.value))} /></Field></Section>
        <Section title="Referências e observações"><Field label="Outras referências" wide><input value={draft.referenceNumbers} onChange={(event) => set('referenceNumbers', event.target.value)} /></Field><Field label="Documentos relacionados" wide><input value={draft.relatedDocuments} onChange={(event) => set('relatedDocuments', event.target.value)} /></Field><Field label="Observações" wide><textarea rows={3} value={draft.notes} onChange={(event) => set('notes', event.target.value)} /></Field><Field label="Informações adicionais" wide><textarea rows={3} value={draft.additionalInfo} onChange={(event) => set('additionalInfo', event.target.value)} /></Field></Section>
        {invalidDates && <p className="finance-inline-error" role="alert">O vencimento não pode ser anterior à data de emissão.</p>}
        {invalidPaidBalance && <p className="finance-inline-error" role="alert">O total da invoice não pode ficar abaixo do valor já liquidado.</p>}
        <div className="finance-form-summary"><span>Total da invoice <b>{money(total(draft))}</b></span></div>
        <footer><button type="button" className="crm-btn-secondary" onClick={close}>Cancelar</button><button type="submit" className="crm-btn-primary" disabled={invalid}>Salvar invoice</button></footer>
      </form>
    </div>
  </div>;
}

function PaymentModal({ record, close, pay }: { record: Invoice; close: () => void; pay: (payment: Payment) => void }) {
  const titleId = useId();
  useDialogEscape(close);
  const [payment, setPayment] = useState<{method:string;amount:number;date:string;processingFee:number;settlementStatus:SettlementStatus;notes:string}>({ method: 'Pix', amount: balance(record), date: today(), processingFee: 0, settlementStatus: 'Liquidado', notes: '' });
  return <div className="finance-accounting-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}><div className="finance-small-modal invoice-payment-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}><header><div><span>REGISTRAR PAGAMENTO</span><h2 id={titleId}>{record.invoiceNumber}</h2><p>{record.customer} · saldo {money(balance(record))}</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header><div className="finance-payment-grid"><Field label="Valor"><input type="number" min="0.01" max={balance(record)} step="0.01" value={payment.amount || ''} onChange={(event) => setPayment((current) => ({ ...current, amount: Number(event.target.value) }))} /></Field><Field label="Método"><select value={payment.method} onChange={(event) => setPayment((current) => ({ ...current, method: event.target.value }))}>{PAYMENT_METHODS.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Data"><input type="date" value={payment.date} onChange={(event) => setPayment((current) => ({ ...current, date: event.target.value }))} /></Field><Field label="Liquidação"><select value={payment.settlementStatus} onChange={(event) => setPayment((current) => ({ ...current, settlementStatus: event.target.value as SettlementStatus }))}><option>Liquidado</option><option>Pendente</option></select></Field><Field label="Observações" wide><textarea rows={3} value={payment.notes} onChange={(event) => setPayment((current) => ({ ...current, notes: event.target.value }))} /></Field></div><footer><button className="crm-btn-secondary" type="button" onClick={close}>Cancelar</button><button className="crm-btn-primary" type="button" disabled={payment.amount <= 0 || payment.amount > balance(record) || !payment.date} onClick={() => pay({ id: `PAY-${Date.now()}`, ...payment })}>Registrar pagamento</button></footer></div></div>;
}

function PaymentPicker({ records, close, pick }: { records: Invoice[]; close: () => void; pick: (record: Invoice) => void }) {
  const titleId = useId();
  useDialogEscape(close);
  const [id, setId] = useState(records[0]?.id || '');
  return <div className="finance-accounting-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}><div className="finance-small-modal invoice-payment-picker" role="dialog" aria-modal="true" aria-labelledby={titleId}><header><div><span>PAGAMENTO</span><h2 id={titleId}>Selecionar invoice</h2><p>Escolha qual invoice receberá o pagamento.</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header><div className="invoice-picker-body"><label><span>Invoice</span><select value={id} onChange={(event) => setId(event.target.value)}>{records.map((record) => <option key={record.id} value={record.id}>{record.invoiceNumber} · {record.customer} · {money(balance(record))}</option>)}</select></label></div><footer><button className="crm-btn-secondary" type="button" onClick={close}>Cancelar</button><button className="crm-btn-primary" type="button" disabled={!id} onClick={() => { const record = records.find((item) => item.id === id); if (record) pick(record); }}>Continuar</button></footer></div></div>;
}

export function FinanceInvoicesWorkspace() {
  const [items, setItems] = useState<Invoice[]>(() => getInvoiceSessionSeeds().map(normalize));
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Todos');
  const [modal, setModal] = useState<{ mode: Mode; record?: Invoice }>();
  const [menu, setMenu] = useState<string>();
  const [notifications, setNotifications] = useState(false);
  const [paymentPicker, setPaymentPicker] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { saveInvoiceSessionSeeds(items); }, [items]);
  useEffect(() => {
    if (!menu && !notifications) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenu(undefined);
      if (notifications) {
        setNotifications(false);
        requestAnimationFrame(() => notificationButtonRef.current?.focus());
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menu, notifications]);

  const rows = useMemo(() => items.filter((invoice) => {
    const searchable = `${invoice.invoiceNumber} ${invoice.customer} ${invoice.billingContact} ${invoice.service} ${invoice.processRef}`.toLowerCase();
    const currentStatus = visibleStatus(invoice);
    return searchable.includes(query.trim().toLowerCase()) && (status === 'Todos' || currentStatus === status);
  }), [items, query, status]);

  const billed = items.filter((invoice) => invoice.status !== 'Cancelada').reduce((sum, invoice) => sum + total(invoice), 0);
  const received = items.reduce((sum, invoice) => sum + invoice.paid, 0);
  const outstanding = items.reduce((sum, invoice) => sum + (isOutstanding(invoice) ? balance(invoice) : 0), 0);
  const overdueRecords = items.filter(isOverdue);
  const overdue = overdueRecords.reduce((sum, invoice) => sum + balance(invoice), 0);
  const openInvoices = items.filter(isOutstanding);
  const notificationRecords = [...overdueRecords, ...items.filter((invoice) => isOutstanding(invoice) && invoice.dueDate === today())].filter((invoice, index, list) => list.findIndex((item) => item.id === invoice.id) === index).slice(0, 6);

  const save = (draft: Draft) => {
    if (modal?.record) setItems((current) => current.map((invoice) => {
      if (invoice.id !== modal.record!.id) return invoice;
      const merged: Invoice = { ...invoice, ...draft };
      return { ...merged, status: reconcileStatus(merged) };
    }));
    else setItems((current) => [{ ...draft, id: crypto.randomUUID(), paid: 0, payments: [], status: DERIVED_STATUS.has(draft.status) ? 'Em aberto' : draft.status }, ...current]);
    setModal(undefined);
  };
  const pay = (payment: Payment) => {
    if (!modal?.record) return;
    setItems((current) => current.map((invoice) => {
      if (invoice.id !== modal.record!.id) return invoice;
      const isSettled = payment.settlementStatus === 'Liquidado';
      const nextPaid = isSettled ? Math.min(total(invoice), invoice.paid + payment.amount) : invoice.paid;
      const nextStatus: InvoiceStatus = isSettled ? (nextPaid >= total(invoice) ? 'Pago' : 'Parcialmente pago') : invoice.status;
      return { ...invoice, paid: nextPaid, payments: [payment, ...invoice.payments], status: nextStatus };
    }));
    setModal(undefined);
  };
  const openAction = (mode: Mode, record: Invoice) => { setMenu(undefined); setNotifications(false); setModal({ mode, record }); };
  const remove = (record: Invoice) => { setMenu(undefined); if (window.confirm(`Excluir ${record.invoiceNumber}?`)) setItems((current) => current.filter((item) => item.id !== record.id)); };
  const startPayment = () => {
    if (!openInvoices.length) return;
    if (openInvoices.length === 1) setModal({ mode: 'payment', record: openInvoices[0] });
    else setPaymentPicker(true);
  };

  return <div className="crm-shell finance-accounting-shell invoice-workspace" onClick={() => { setMenu(undefined); setNotifications(false); }}>
    <div className="crm-workspace invoice-workspace-main">
      <header className="crm-topbar invoice-topbar">
        <div><small>VISA FÁCIL · CRM · FINANCEIRO</small><h1>Invoices</h1><p>Faturamento, cobrança, pagamentos e documentos fiscais.</p></div>
        <div className="crm-topbar-actions invoice-topbar-actions" onClick={(event) => event.stopPropagation()}>
          <button className="invoice-secondary-action" type="button" disabled={!openInvoices.length} onClick={startPayment}><PaymentIcon />Registrar pagamento</button>
          <button className="crm-topbar-primary invoice-primary-action" type="button" onClick={() => setModal({ mode: 'create' })}><PlusIcon />Nova invoice</button>
          <div className="invoice-notification-wrap">
            <button ref={notificationButtonRef} className="invoice-notification-button" type="button" aria-label="Notificações de invoices" aria-haspopup="true" aria-expanded={notifications} aria-controls="invoice-notifications" onClick={() => setNotifications((current) => !current)}><BellIcon />{notificationRecords.length > 0 && <span>{notificationRecords.length}</span>}</button>
            {notifications && <div className="invoice-notification-menu" id="invoice-notifications" role="region" aria-label="Notificações de invoices"><header><strong>Notificações</strong><span>{notificationRecords.length}</span></header>{notificationRecords.length ? <div>{notificationRecords.map((invoice) => <button key={invoice.id} type="button" onClick={() => openAction('view', invoice)}><strong>{invoice.invoiceNumber} · {invoice.customer}</strong><small>{isOverdue(invoice) ? 'Vencida' : 'Vence hoje'} · saldo {money(balance(invoice))}</small></button>)}</div> : <p>Nenhuma invoice exige atenção hoje.</p>}</div>}
          </div>
        </div>
      </header>

      <main className="finance-content invoice-content">
        <section className="finance-invoice-kpis invoice-kpis"><article><span>Faturado</span><strong>{money(billed)}</strong><small>Total ativo</small></article><article><span>Recebido</span><strong>{money(received)}</strong><small>Pagamentos liquidados</small></article><article><span>Em aberto</span><strong>{money(outstanding)}</strong><small>{openInvoices.length} {openInvoices.length === 1 ? 'invoice pendente' : 'invoices pendentes'}</small></article><article className={overdueRecords.length ? 'is-alert' : ''}><span>Vencido</span><strong>{money(overdue)}</strong><small>{overdueRecords.length} {overdueRecords.length === 1 ? 'invoice vencida' : 'invoices vencidas'}</small></article></section>

        <section className="invoice-list-card">
          <div className="invoice-filters"><label className="invoice-search"><SearchIcon /><input aria-label="Buscar invoices" placeholder="Buscar invoice, cliente, serviço ou processo" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option>{STATUS.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="invoice-table-meta"><span>{rows.length} {rows.length === 1 ? 'invoice' : 'invoices'}</span>{overdueRecords.length > 0 && <strong>{overdueRecords.length} {overdueRecords.length === 1 ? 'vencida' : 'vencidas'}</strong>}</div>
          <div className="invoice-table-scroll"><div className="invoice-table">
            <div className="invoice-table-head"><span>Invoice</span><span>Cliente</span><span>Emissão</span><span>Vencimento</span><span>Total</span><span>Saldo</span><span>Status</span><span>Ações</span></div>
            {rows.length ? rows.map((invoice) => { const currentStatus = visibleStatus(invoice); return <div className="invoice-table-row" key={invoice.id}>
              <button className="invoice-number-cell" type="button" data-label="Invoice" onClick={() => openAction('view', invoice)}><strong>{invoice.invoiceNumber || 'Sem número'}</strong><small>{invoice.noteDirection === 'Entrada' ? 'Entrada' : 'Saída'} · {invoice.fiscalNumber ? `NF ${invoice.fiscalNumber}` : 'Fiscal pendente'}</small></button>
              <div className="invoice-customer-cell" data-label="Cliente"><strong>{invoice.customer || '—'}</strong><small>{invoice.processRef || invoice.service || 'Sem processo vinculado'}</small></div>
              <span data-label="Emissão">{date(invoice.issueDate)}</span>
              <span data-label="Vencimento" className={isOverdue(invoice) ? 'invoice-overdue-date' : ''}>{date(invoice.dueDate)}</span>
              <strong className="invoice-money" data-label="Total">{money(total(invoice))}</strong>
              <div className="invoice-balance-cell" data-label="Saldo"><strong className={balance(invoice) > 0 ? 'is-outstanding' : ''}>{money(balance(invoice))}</strong><small>{invoice.paid > 0 ? `${money(invoice.paid)} recebido` : 'Sem pagamentos liquidados'}</small></div>
              <span data-label="Status"><b className={`invoice-status is-${statusClass(currentStatus)}`}>{currentStatus}</b></span>
              <div className="invoice-row-actions" data-label="Ações" onClick={(event) => event.stopPropagation()}><button className="invoice-action-trigger" type="button" aria-label={`Ações da invoice ${invoice.invoiceNumber}`} aria-haspopup="menu" aria-expanded={menu === invoice.id} onClick={() => setMenu((current) => current === invoice.id ? undefined : invoice.id)}>⋯</button>{menu === invoice.id && <div className="invoice-actions-menu" role="menu"><button role="menuitem" type="button" onClick={() => openAction('view', invoice)}>Ver detalhes</button><button role="menuitem" type="button" onClick={() => openAction('edit', invoice)}>Editar</button><button role="menuitem" type="button" onClick={() => openAction('document', invoice)}>Documento fiscal / PDF</button><button role="menuitem" type="button" disabled={balance(invoice) <= 0 || invoice.status === 'Cancelada'} onClick={() => openAction('payment', invoice)}>Registrar pagamento</button><div role="separator" /><button role="menuitem" className="is-danger" type="button" onClick={() => remove(invoice)}>Excluir</button></div>}</div>
            </div>; }) : <div className="invoice-empty"><strong>Nenhuma invoice encontrada</strong><span>Ajuste a busca ou o filtro de status.</span></div>}
          </div></div>
        </section>
      </main>
    </div>

    {modal?.mode === 'view' && modal.record && <InvoiceDetail record={modal.record} close={() => setModal(undefined)} edit={() => setModal({ mode: 'edit', record: modal.record })} registerPayment={() => setModal({ mode: 'payment', record: modal.record })} document={() => setModal({ mode: 'document', record: modal.record })} />}
    {modal?.mode === 'document' && modal.record && <InvoiceDocument record={modal.record} close={() => setModal(undefined)} />}
    {(modal?.mode === 'create' || modal?.mode === 'edit') && <InvoiceForm mode={modal.mode} record={modal.record} close={() => setModal(undefined)} save={save} />}
    {modal?.mode === 'payment' && modal.record && <PaymentModal record={modal.record} close={() => setModal(undefined)} pay={pay} />}
    {paymentPicker && <PaymentPicker records={openInvoices} close={() => setPaymentPicker(false)} pick={(record) => { setPaymentPicker(false); setModal({ mode: 'payment', record }); }} />}
  </div>;
}

export default FinanceInvoicesWorkspace;
