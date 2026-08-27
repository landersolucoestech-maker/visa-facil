import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { type InvoiceSeed } from './mocks/invoiceMockProvider';
import { getInvoiceSessionSeeds, saveInvoiceSessionSeeds } from './invoiceSessionStore';
import { activeFinanceCategories } from './financeConfigStore';
import { getCrmSessionRecords, getFinanceSessionRecords, saveFinanceSessionRecords } from '../../shared/operationalSessionStore';
import { localDateIso } from '../../shared/localDate';
import type { FinanceRecord } from './types';
import type { CrmRecord } from '../crm/types';

type NoteDirection = 'Entrada' | 'Saída';
type InvoiceStatus = 'Rascunho' | 'Pronta' | 'Enviada' | 'Em aberto' | 'Parcialmente pago' | 'Pago' | 'Vencida' | 'Cancelada';
type SettlementStatus = 'Liquidado' | 'Pendente' | 'Cancelado';
type Mode = 'create' | 'edit' | 'view' | 'payment' | 'document';
type Payment = { id: string; date: string; method: string; amount: number; processingFee: number; settlementStatus: SettlementStatus; notes: string; financeTransactionId?: string };
type Invoice = {
  id: string; invoiceNumber: string; customer: string; customerRecordId: string; billingContact: string; service: string; processRef: string; referenceNumbers: string;
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
const LOCAL_FISCAL_STATUSES = ['Não emitida', 'Preparada localmente', 'Aguardando integração'] as const;
const today = () => localDateIso();
const EMPTY: Draft = {
  invoiceNumber: '', customer: '', customerRecordId: '', billingContact: '', service: '', processRef: '', referenceNumbers: '', destination: '', visaType: '', processStage: '',
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
const settledTotal = (payments: Payment[]) => payments.filter((payment) => payment.settlementStatus === 'Liquidado').reduce((sum, payment) => sum + payment.amount, 0);
const balance = (invoice: Invoice) => Math.max(0, total(invoice) - invoice.paid);
const normalize = (record: InvoiceSeed): Invoice => ({
  ...EMPTY,
  ...record,
  id: record.id,
  customerRecordId: record.customerRecordId ?? '',
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
const normalizedName = (value:string) => value.trim().toLocaleLowerCase('pt-BR');
const isLocalFiscalStatus = (value:string) => (LOCAL_FISCAL_STATUSES as readonly string[]).includes(value);

function clientRecords(records:CrmRecord[]){return records.filter((record)=>record.kind==='contact'&&record.relationship==='Cliente')}
function uniqueClientId(records:CrmRecord[],name:string){
 const normalized=normalizedName(name);
 if(!normalized)return'';
 const matches=clientRecords(records).filter((record)=>normalizedName(record.fullName)===normalized);
 return matches.length===1?matches[0].id:'';
}
function migrateInvoiceCustomerLinks(invoices:Invoice[],crmRecords:CrmRecord[]):Invoice[]{
 const clients=clientRecords(crmRecords);
 return invoices.map((invoice)=>{
  if(invoice.customerRecordId&&clients.some((record)=>record.id===invoice.customerRecordId))return invoice;
  const customerRecordId=uniqueClientId(clients,invoice.customer);
  return customerRecordId?{...invoice,customerRecordId}:invoice;
 });
}

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
        <header className="fiscal-doc-header"><div><small>PRÉVIA FISCAL LOCAL · NÃO COMPROVA AUTORIZAÇÃO FISCAL</small><h1 id={titleId}>Nota Fiscal de {record.noteDirection}</h1><p>{record.natureOfOperation || '—'}</p></div><div className="fiscal-doc-number"><span>Nº / referência</span><strong>{record.fiscalNumber || record.invoiceNumber}</strong><small>Série {record.series || '—'}</small></div></header>
        <section className="fiscal-doc-key"><span>Chave de acesso / referência</span><strong>{record.noteDirection === 'Entrada' ? (record.supplierAccessKey || record.accessKey || 'Não informada') : (record.accessKey || 'Não informada')}</strong><b>{record.fiscalStatus}</b></section>
        <section className="fiscal-doc-parties">{record.noteDirection === 'Entrada' ? <><div><h3>Fornecedor / remetente</h3><strong>{record.supplierName || record.issuerName || '—'}</strong><p>{record.supplierDocument || record.issuerDocument || '—'}</p><p>NF fornecedor {record.supplierInvoiceNumber || '—'} · Série {record.supplierSeries || '—'}</p></div><div><h3>Destinatário / estabelecimento</h3><strong>{record.recipientName || 'VISA FÁCIL'}</strong><p>{record.recipientDocument || '—'}</p><p>Recebimento {date(record.receiptDate)}</p></div></> : <><div><h3>Emitente</h3><strong>{record.issuerName || 'VISA FÁCIL'}</strong><p>{record.issuerDocument || '—'}</p><p>{record.issuerAddress || '—'}</p></div><div><h3>Destinatário / cliente</h3><strong>{record.recipientName || record.customer}</strong><p>{record.recipientDocument || '—'}</p><p>{record.recipientAddress || '—'}</p></div></>}</section>
        <section className="fiscal-doc-meta"><div><span>Emissão</span><b>{date(record.issueDate)}</b></div><div><span>{record.noteDirection === 'Entrada' ? 'Recebimento' : 'Saída'}</span><b>{date(record.noteDirection === 'Entrada' ? record.receiptDate : record.departureDate)}</b></div><div><span>CFOP</span><b>{record.cfop || '—'}</b></div><div><span>Cód. serviço</span><b>{record.serviceCode || '—'}</b></div></section>
        <section className="fiscal-doc-extra"><div><h3>{record.noteDirection === 'Entrada' ? 'Dados da entrada' : 'Dados da saída'}</h3>{record.noteDirection === 'Entrada' ? <><p>Finalidade: {record.entryPurpose || '—'}</p><p>Pedido/compra: {record.purchaseOrderRef || '—'}</p><p>Fornecedor: {record.supplierName || '—'}</p></> : <><p>Finalidade: {record.salePurpose || '—'}</p><p>Pedido/referência do cliente: {record.customerOrderRef || '—'}</p><p>Entrega: {record.deliveryAddress || '—'} · {record.shippingMethod || '—'}</p></>}</div><div><h3>Totais</h3><p>Subtotal {money(subtotal(record))}</p><p>Tributos/encargos {money(total(record) - subtotal(record))}</p><p><strong>Total {money(total(record))}</strong></p></div></section>
      </article>
    </div>
  </div>;
}

function InvoiceDetail({ record, close, edit, registerPayment, document, settlePayment }: { record: Invoice; close: () => void; edit: () => void; registerPayment: () => void; document: () => void; settlePayment:(paymentId:string,status:'Liquidado'|'Cancelado')=>void }) {
  const titleId = useId();
  useDialogEscape(close);
  const currentStatus = visibleStatus(record);
  return <div className="finance-accounting-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}>
    <div className="invoice-detail-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="invoice-detail-header"><div><span>COBRANÇA</span><h2 id={titleId}>{record.invoiceNumber || 'Sem número'}</h2><p>{record.customer} · {record.service || 'Serviço não informado'}</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header>
      <section className="invoice-detail-summary"><div><span>Total</span><strong>{money(total(record))}</strong></div><div><span>Recebido</span><strong>{money(record.paid)}</strong></div><div><span>Saldo</span><strong className={balance(record) > 0 ? 'is-outstanding' : ''}>{money(balance(record))}</strong></div><div><span>Status</span><b className={`invoice-status is-${statusClass(currentStatus)}`}>{currentStatus}</b></div></section>
      <section className="invoice-detail-grid"><div><span>Cliente</span><strong>{record.customer || '—'}</strong><small>{record.billingContact || 'Contato de cobrança não informado'}</small></div><div><span>Processo</span><strong>{record.processRef || '—'}</strong><small>{record.referenceNumbers || 'Sem outras referências'}</small></div><div><span>Emissão</span><strong>{date(record.issueDate)}</strong><small>{record.noteDirection === 'Entrada' ? 'Nota de entrada' : 'Nota de saída'}</small></div><div><span>Vencimento</span><strong className={isOverdue(record) ? 'is-overdue' : ''}>{date(record.dueDate)}</strong><small>{isOverdue(record) ? 'Pagamento em atraso' : record.paymentTerms || 'Prazo não informado'}</small></div></section>
      <section className="invoice-payment-history"><header><div><h3>Pagamentos</h3><p>Liquidações vinculadas ao financeiro; pagamentos pendentes exigem confirmação posterior.</p></div><strong>{record.payments.length}</strong></header>{record.payments.length ? <div>{record.payments.map((payment) => <article key={payment.id}><div><strong>{money(payment.amount)}</strong><small>{payment.method}{payment.financeTransactionId ? ` · lançamento ${payment.financeTransactionId}` : payment.settlementStatus === 'Liquidado' ? ' · sem vínculo legado' : ''}</small></div><span>{date(payment.date)}</span><b>{payment.settlementStatus}</b>{payment.settlementStatus === 'Pendente' && <div className="invoice-payment-lifecycle-actions"><button type="button" onClick={()=>settlePayment(payment.id,'Liquidado')}>Liquidar</button><button type="button" onClick={()=>settlePayment(payment.id,'Cancelado')}>Cancelar</button></div>}</article>)}</div> : <p className="invoice-empty-copy">Nenhum pagamento registrado.</p>}</section>
      <footer><button className="crm-btn-secondary" type="button" onClick={document}><DocumentIcon />Prévia fiscal</button><button className="crm-btn-secondary" type="button" onClick={edit}>Editar cobrança</button>{balance(record) > 0 && record.status !== 'Cancelada' && <button className="crm-btn-primary" type="button" onClick={registerPayment}><PaymentIcon />Registrar pagamento</button>}</footer>
    </div>
  </div>;
}

function InvoiceForm({ mode, record, crmRecords, close, save }: { mode: 'create' | 'edit'; record?: Invoice; crmRecords:CrmRecord[]; close: () => void; save: (draft: Draft) => void }) {
  const titleId = useId();
  useDialogEscape(close);
  const [draft, setDraft] = useState<Draft>(() => record ? (({ id: _id, payments: _payments, ...rest }) => rest)(record) : EMPTY);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const clients=clientRecords(crmRecords);
  const resolvedCustomerId=draft.customerRecordId&&clients.some((client)=>client.id===draft.customerRecordId)?draft.customerRecordId:uniqueClientId(clients,draft.customer);
  const customerUnavailable=Boolean(draft.customer)&&!resolvedCustomerId;
  const changeCustomer=(id:string)=>{
    if(id==='__legacy__')return;
    const client=clients.find((item)=>item.id===id);
    setDraft((current)=>client?{
      ...current,
      customerRecordId:client.id,
      customer:client.fullName,
      billingContact:client.email||client.whatsapp||client.phone,
      recipientName:client.fullName,
      recipientDocument:client.cpf||'',
      recipientCity:client.city,
      recipientState:client.state,
    }:{...current,customerRecordId:'',customer:'',billingContact:'',recipientName:'',recipientDocument:'',recipientCity:'',recipientState:''});
  };
  const invalidDates = Boolean(draft.issueDate && draft.dueDate && draft.dueDate < draft.issueDate);
  const invalidPaidBalance = draft.paid - total(draft) > 0.0001;
  const invalidCustomer=!draft.customer.trim()||(!resolvedCustomerId&&!record);
  const invalid = invalidCustomer || invalidDates || invalidPaidBalance;
  return <div className="finance-accounting-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}>
    <div className="finance-invoice-form invoice-refined-form" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header><div><span>{mode === 'create' ? 'NOVA COBRANÇA' : 'EDITAR COBRANÇA'}</span><h2 id={titleId}>{mode === 'create' ? 'Criar cobrança / documento fiscal' : record?.invoiceNumber || 'Cobrança'}</h2><p>A cobrança financeira e o estado fiscal são relacionados, mas permanecem independentes.</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header>
      <form onSubmit={(event) => { event.preventDefault(); if (!invalid) save({...draft,customerRecordId:resolvedCustomerId||draft.customerRecordId}); }}>
        <Section title="Identificação e cobrança"><Field label="Número da cobrança"><input value={draft.invoiceNumber} onChange={(event) => set('invoiceNumber', event.target.value)} /></Field><Field label="Status da cobrança"><select value={draft.status} onChange={(event) => set('status', event.target.value as InvoiceStatus)}>{STATUS.map((item) => <option key={item} disabled={DERIVED_STATUS.has(item)}>{item}</option>)}</select></Field><Field label="Cliente *"><select required value={customerUnavailable?'__legacy__':resolvedCustomerId} onChange={(event)=>changeCustomer(event.target.value)}><option value="">Selecione um cliente</option>{customerUnavailable&&<option value="__legacy__">{draft.customer} · legado/indisponível</option>}{clients.map((client)=><option key={client.id} value={client.id}>{client.fullName}{client.email?` · ${client.email}`:''}</option>)}</select></Field><Field label="Contato de cobrança"><input value={draft.billingContact} onChange={(event) => set('billingContact', event.target.value)} /></Field><Field label="Serviço"><input value={draft.service} onChange={(event) => set('service', event.target.value)} /></Field><Field label="Processo"><input value={draft.processRef} onChange={(event) => set('processRef', event.target.value)} /></Field><Field label="Emissão"><input type="date" value={draft.issueDate} onChange={(event) => set('issueDate', event.target.value)} /></Field><Field label="Vencimento"><input type="date" min={draft.issueDate || undefined} value={draft.dueDate} onChange={(event) => set('dueDate', event.target.value)} /></Field></Section>
        <Section title="Documento fiscal"><Field label="Tipo da nota"><select value={draft.noteDirection} onChange={(event) => set('noteDirection', event.target.value as NoteDirection)}><option>Entrada</option><option>Saída</option></select></Field><Field label="Natureza da operação"><input value={draft.natureOfOperation} onChange={(event) => set('natureOfOperation', event.target.value)} /></Field><Field label="Série"><input value={draft.series} onChange={(event) => set('series', event.target.value)} /></Field><Field label="Número fiscal / referência"><input value={draft.fiscalNumber} onChange={(event) => set('fiscalNumber', event.target.value)} /></Field><Field label="Estado fiscal"><select value={draft.fiscalStatus} onChange={(event) => set('fiscalStatus', event.target.value)}>{!isLocalFiscalStatus(draft.fiscalStatus) && <option value={draft.fiscalStatus} disabled>{draft.fiscalStatus} · somente integração</option>}{LOCAL_FISCAL_STATUSES.map((item)=><option key={item}>{item}</option>)}</select></Field><Field label="Chave de acesso / referência" wide><input maxLength={44} value={draft.accessKey} onChange={(event) => set('accessKey', event.target.value.replace(/\D/g, ''))} /></Field></Section>
        <p className="finance-inline-error" role="status">Estados oficiais como “Autorizada”, “Cancelada fiscalmente” e contingência só poderão vir da integração fiscal/backend. O frontend não fabrica autorização.</p>
        {draft.noteDirection === 'Entrada' ? <Section title="Nota de entrada"><Field label="Fornecedor / remetente"><input value={draft.supplierName} onChange={(event) => set('supplierName', event.target.value)} /></Field><Field label="CPF/CNPJ fornecedor"><input value={draft.supplierDocument} onChange={(event) => set('supplierDocument', event.target.value)} /></Field><Field label="NF do fornecedor"><input value={draft.supplierInvoiceNumber} onChange={(event) => set('supplierInvoiceNumber', event.target.value)} /></Field><Field label="Série fornecedor"><input value={draft.supplierSeries} onChange={(event) => set('supplierSeries', event.target.value)} /></Field><Field label="Recebimento"><input type="date" value={draft.receiptDate} onChange={(event) => set('receiptDate', event.target.value)} /></Field><Field label="Pedido / compra"><input value={draft.purchaseOrderRef} onChange={(event) => set('purchaseOrderRef', event.target.value)} /></Field><Field label="Chave de acesso de origem" wide><input maxLength={44} value={draft.supplierAccessKey} onChange={(event) => set('supplierAccessKey', event.target.value.replace(/\D/g, ''))} /></Field><Field label="Finalidade da entrada" wide><input value={draft.entryPurpose} onChange={(event) => set('entryPurpose', event.target.value)} /></Field></Section> : <Section title="Nota de saída"><Field label="Emitente"><input value={draft.issuerName} onChange={(event) => set('issuerName', event.target.value)} /></Field><Field label="CPF/CNPJ emitente"><input value={draft.issuerDocument} onChange={(event) => set('issuerDocument', event.target.value)} /></Field><Field label="Data de saída"><input type="date" value={draft.departureDate} onChange={(event) => set('departureDate', event.target.value)} /></Field><Field label="Referência do cliente"><input value={draft.customerOrderRef} onChange={(event) => set('customerOrderRef', event.target.value)} /></Field><Field label="Endereço de entrega"><input value={draft.deliveryAddress} onChange={(event) => set('deliveryAddress', event.target.value)} /></Field><Field label="Forma de entrega"><input value={draft.shippingMethod} onChange={(event) => set('shippingMethod', event.target.value)} /></Field><Field label="Finalidade da saída" wide><input value={draft.salePurpose} onChange={(event) => set('salePurpose', event.target.value)} /></Field></Section>}
        <Section title="Destinatário"><Field label="Nome / razão social"><input value={draft.recipientName} onChange={(event) => set('recipientName', event.target.value)} /></Field><Field label="CPF/CNPJ"><input value={draft.recipientDocument} onChange={(event) => set('recipientDocument', event.target.value)} /></Field><Field label="Inscrição estadual"><input value={draft.recipientStateRegistration} onChange={(event) => set('recipientStateRegistration', event.target.value)} /></Field><Field label="Endereço"><input value={draft.recipientAddress} onChange={(event) => set('recipientAddress', event.target.value)} /></Field></Section>
        <Section title="Classificação fiscal"><Field label="CFOP"><input value={draft.cfop} onChange={(event) => set('cfop', event.target.value)} /></Field><Field label="Código do serviço"><input value={draft.serviceCode} onChange={(event) => set('serviceCode', event.target.value)} /></Field><Field label="NCM"><input value={draft.ncm} onChange={(event) => set('ncm', event.target.value)} /></Field><Field label="CST/CSOSN"><input value={draft.cstCsosn} onChange={(event) => set('cstCsosn', event.target.value)} /></Field></Section>
        <Section title="Valores"><Field label="Serviço"><input type="number" min="0" step="0.01" value={draft.serviceFee || ''} onChange={(event) => set('serviceFee', Number(event.target.value))} /></Field><Field label="Taxa consular"><input type="number" min="0" step="0.01" value={draft.consularFee || ''} onChange={(event) => set('consularFee', Number(event.target.value))} /></Field><Field label="Tradução"><input type="number" min="0" step="0.01" value={draft.translationFee || ''} onChange={(event) => set('translationFee', Number(event.target.value))} /></Field><Field label="Terceiros"><input type="number" min="0" step="0.01" value={draft.thirdPartyFee || ''} onChange={(event) => set('thirdPartyFee', Number(event.target.value))} /></Field><Field label="Outros valores"><input type="number" min="0" step="0.01" value={draft.otherCharges || ''} onChange={(event) => set('otherCharges', Number(event.target.value))} /></Field><Field label="Descontos"><input type="number" min="0" step="0.01" value={draft.discounts || ''} onChange={(event) => set('discounts', Number(event.target.value))} /></Field></Section>
        <Section title="Tributos"><Field label="ICMS"><input type="number" min="0" step="0.01" value={draft.icms || ''} onChange={(event) => set('icms', Number(event.target.value))} /></Field><Field label="IPI"><input type="number" min="0" step="0.01" value={draft.ipi || ''} onChange={(event) => set('ipi', Number(event.target.value))} /></Field><Field label="PIS"><input type="number" min="0" step="0.01" value={draft.pis || ''} onChange={(event) => set('pis', Number(event.target.value))} /></Field><Field label="COFINS"><input type="number" min="0" step="0.01" value={draft.cofins || ''} onChange={(event) => set('cofins', Number(event.target.value))} /></Field><Field label="ISS"><input type="number" min="0" step="0.01" value={draft.iss || ''} onChange={(event) => set('iss', Number(event.target.value))} /></Field><Field label="Tributos retidos"><input type="number" min="0" step="0.01" value={draft.withheldTaxes || ''} onChange={(event) => set('withheldTaxes', Number(event.target.value))} /></Field></Section>
        <Section title="Referências e observações"><Field label="Outras referências" wide><input value={draft.referenceNumbers} onChange={(event) => set('referenceNumbers', event.target.value)} /></Field><Field label="Documentos relacionados" wide><input value={draft.relatedDocuments} onChange={(event) => set('relatedDocuments', event.target.value)} /></Field><Field label="Observações" wide><textarea rows={3} value={draft.notes} onChange={(event) => set('notes', event.target.value)} /></Field><Field label="Informações adicionais" wide><textarea rows={3} value={draft.additionalInfo} onChange={(event) => set('additionalInfo', event.target.value)} /></Field></Section>
        {customerUnavailable&&<p className="finance-inline-error" role="status">O cliente histórico “{draft.customer}” não corresponde a um cliente atual do CRM. O registro foi preservado; selecione um cliente canônico para relincar a cobrança.</p>}
        {invalidDates && <p className="finance-inline-error" role="alert">O vencimento não pode ser anterior à data de emissão.</p>}
        {invalidPaidBalance && <p className="finance-inline-error" role="alert">O total da cobrança não pode ficar abaixo do valor já liquidado.</p>}
        <div className="finance-form-summary"><span>Total da cobrança <b>{money(total(draft))}</b></span></div>
        <footer><button type="button" className="crm-btn-secondary" onClick={close}>Cancelar</button><button type="submit" className="crm-btn-primary" disabled={invalid}>Salvar cobrança</button></footer>
      </form>
    </div>
  </div>;
}

function PaymentModal({ record, close, pay }: { record: Invoice; close: () => void; pay: (payment: Payment) => void }) {
  const titleId = useId();
  useDialogEscape(close);
  const [payment, setPayment] = useState<{method:string;amount:number;date:string;processingFee:number;settlementStatus:'Liquidado'|'Pendente';notes:string}>({ method: 'Pix', amount: balance(record), date: today(), processingFee: 0, settlementStatus: 'Liquidado', notes: '' });
  return <div className="finance-accounting-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}><div className="finance-small-modal invoice-payment-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}><header><div><span>REGISTRAR PAGAMENTO</span><h2 id={titleId}>{record.invoiceNumber || 'Cobrança'}</h2><p>{record.customer} · saldo {money(balance(record))}</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header><div className="finance-payment-grid"><Field label="Valor"><input type="number" min="0.01" max={balance(record)} step="0.01" value={payment.amount || ''} onChange={(event) => setPayment((current) => ({ ...current, amount: Number(event.target.value) }))} /></Field><Field label="Método"><select value={payment.method} onChange={(event) => setPayment((current) => ({ ...current, method: event.target.value }))}>{PAYMENT_METHODS.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Data"><input type="date" value={payment.date} onChange={(event) => setPayment((current) => ({ ...current, date: event.target.value }))} /></Field><Field label="Liquidação"><select value={payment.settlementStatus} onChange={(event) => setPayment((current) => ({ ...current, settlementStatus: event.target.value as 'Liquidado'|'Pendente' }))}><option>Liquidado</option><option>Pendente</option></select></Field><Field label="Observações" wide><textarea rows={3} value={payment.notes} onChange={(event) => setPayment((current) => ({ ...current, notes: event.target.value }))} /></Field></div><footer><button className="crm-btn-secondary" type="button" onClick={close}>Cancelar</button><button className="crm-btn-primary" type="button" disabled={payment.amount <= 0 || payment.amount > balance(record) || !payment.date} onClick={() => pay({ id: `PAY-${Date.now()}`, ...payment })}>Registrar pagamento</button></footer></div></div>;
}

function PaymentPicker({ records, close, pick }: { records: Invoice[]; close: () => void; pick: (record: Invoice) => void }) {
  const titleId = useId();
  useDialogEscape(close);
  const [id, setId] = useState(records[0]?.id || '');
  return <div className="finance-accounting-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}><div className="finance-small-modal invoice-payment-picker" role="dialog" aria-modal="true" aria-labelledby={titleId}><header><div><span>PAGAMENTO</span><h2 id={titleId}>Selecionar cobrança</h2><p>Escolha qual cobrança receberá o pagamento.</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header><div className="invoice-picker-body"><label><span>Cobrança</span><select value={id} onChange={(event) => setId(event.target.value)}>{records.map((record) => <option key={record.id} value={record.id}>{record.invoiceNumber || 'Sem número'} · {record.customer} · {money(balance(record))}</option>)}</select></label></div><footer><button className="crm-btn-secondary" type="button" onClick={close}>Cancelar</button><button className="crm-btn-primary" type="button" disabled={!id} onClick={() => { const record = records.find((item) => item.id === id); if (record) pick(record); }}>Continuar</button></footer></div></div>;
}

function matchLegacyFinanceTransaction(invoice:Invoice,payment:Payment,records:FinanceRecord[]){
 return records.find((record)=>{
  if(record.type!=='Receita'||record.status!=='Recebido'||Math.abs(record.amount-payment.amount)>=0.0001)return false;
  if(invoice.customerRecordId){
   if(record.relatedRecordId)return record.relatedRecordId===invoice.customerRecordId;
   return normalizedName(record.relatedName)===normalizedName(invoice.customer);
  }
  return normalizedName(record.relatedName)===normalizedName(invoice.customer);
 });
}

function ensureFinanceTransaction(invoice:Invoice,payment:Payment):string|undefined{
 const current=getFinanceSessionRecords();
 if(payment.financeTransactionId&&current.some((record)=>record.id===payment.financeTransactionId))return payment.financeTransactionId;
 const legacy=matchLegacyFinanceTransaction(invoice,payment,current);
 if(legacy){
  if(invoice.customerRecordId&&!legacy.relatedRecordId){
   saveFinanceSessionRecords(current.map((record)=>record.id===legacy.id?{...record,relatedRecordId:invoice.customerRecordId}:record));
  }
  return legacy.id;
 }
 const id=`invoice-payment-${payment.id}`;
 if(current.some((record)=>record.id===id))return id;
 const category=activeFinanceCategories('Receita')[0]?.name||'Receita de serviços';
 const record:FinanceRecord={
  id,
  description:`Recebimento ${invoice.invoiceNumber||'cobrança'} - ${invoice.customer}`,
  type:'Receita',
  category,
  amount:payment.amount,
  date:payment.date,
  dueDate:payment.date,
  status:'Recebido',
  paymentMethod:payment.method,
  relatedName:invoice.customer,
  relatedRecordId:invoice.customerRecordId||undefined,
  notes:`Origem automática: cobrança ${invoice.invoiceNumber||invoice.id}; pagamento ${payment.id}${payment.notes?` · ${payment.notes}`:''}`,
 };
 saveFinanceSessionRecords([record,...current]);
 return getFinanceSessionRecords().some((item)=>item.id===id)?id:undefined;
}

function migratePaymentLinks(invoices:Invoice[]):Invoice[]{
 const finance=getFinanceSessionRecords();
 return invoices.map((invoice)=>{
  let changed=false;
  const payments=invoice.payments.map((payment)=>{
   if(payment.settlementStatus!=='Liquidado'||payment.financeTransactionId)return payment;
   const match=matchLegacyFinanceTransaction(invoice,payment,finance);
   if(!match)return payment;
   changed=true;
   return {...payment,financeTransactionId:match.id};
  });
  return changed?{...invoice,payments}:invoice;
 });
}

export function FinanceInvoicesWorkspace() {
  const crmRecords=useMemo(()=>getCrmSessionRecords(),[]);
  const [items, setItems] = useState<Invoice[]>(() => migratePaymentLinks(migrateInvoiceCustomerLinks(getInvoiceSessionSeeds().map(normalize),getCrmSessionRecords())));
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
    const invoice=modal?.record;
    if (!invoice) return;
    let nextPayment=payment;
    if(payment.settlementStatus==='Liquidado'){
      const financeTransactionId=ensureFinanceTransaction(invoice,payment);
      if(!financeTransactionId)return;
      nextPayment={...payment,financeTransactionId};
    }
    const payments=[nextPayment,...invoice.payments];
    const nextPaid=Math.min(total(invoice),settledTotal(payments));
    const merged:Invoice={...invoice,payments,paid:nextPaid};
    const updated={...merged,status:reconcileStatus(merged)};
    setItems((current)=>current.map((item)=>item.id===invoice.id?updated:item));
    setModal({mode:'view',record:updated});
  };
  const settlePayment=(invoiceId:string,paymentId:string,nextSettlement:'Liquidado'|'Cancelado')=>{
    const invoice=items.find((item)=>item.id===invoiceId);
    const payment=invoice?.payments.find((item)=>item.id===paymentId);
    if(!invoice||!payment||payment.settlementStatus!=='Pendente')return;
    let nextPayment:Payment={...payment,settlementStatus:nextSettlement};
    if(nextSettlement==='Liquidado'){
      const financeTransactionId=ensureFinanceTransaction(invoice,nextPayment);
      if(!financeTransactionId)return;
      nextPayment={...nextPayment,financeTransactionId};
    }
    const payments=invoice.payments.map((item)=>item.id===paymentId?nextPayment:item);
    const paid=Math.min(total(invoice),settledTotal(payments));
    const merged:Invoice={...invoice,payments,paid};
    const updated={...merged,status:reconcileStatus(merged)};
    setItems((current)=>current.map((item)=>item.id===invoice.id?updated:item));
    setModal({mode:'view',record:updated});
  };
  const openAction = (mode: Mode, record: Invoice) => { setMenu(undefined); setNotifications(false); setModal({ mode, record }); };
  const remove = (record: Invoice) => { setMenu(undefined); if (window.confirm(`Excluir a cobrança ${record.invoiceNumber || record.id}?`)) setItems((current) => current.filter((item) => item.id !== record.id)); };
  const startPayment = () => {
    if (!openInvoices.length) return;
    if (openInvoices.length === 1) setModal({ mode: 'payment', record: openInvoices[0] });
    else setPaymentPicker(true);
  };

  return <div className="crm-shell finance-accounting-shell invoice-workspace" onClick={() => { setMenu(undefined); setNotifications(false); }}>
    <div className="crm-workspace invoice-workspace-main">
      <header className="crm-topbar invoice-topbar">
        <div><small>VISA FÁCIL · CRM · FINANCEIRO</small><h1>Faturamento e Notas Fiscais</h1><p>Cobranças, pagamentos e documentos fiscais relacionados, com estados independentes.</p></div>
        <div className="crm-topbar-actions invoice-topbar-actions" onClick={(event) => event.stopPropagation()}>
          <button className="invoice-secondary-action" type="button" disabled={!openInvoices.length} onClick={startPayment}><PaymentIcon />Registrar pagamento</button>
          <button className="crm-topbar-primary invoice-primary-action" type="button" onClick={() => setModal({ mode: 'create' })}><PlusIcon />Nova cobrança</button>
          <div className="invoice-notification-wrap">
            <button ref={notificationButtonRef} className="invoice-notification-button" type="button" aria-label="Notificações de faturamento" aria-haspopup="true" aria-expanded={notifications} aria-controls="invoice-notifications" onClick={() => setNotifications((current) => !current)}><BellIcon />{notificationRecords.length > 0 && <span>{notificationRecords.length}</span>}</button>
            {notifications && <div className="invoice-notification-menu" id="invoice-notifications" role="region" aria-label="Notificações de faturamento"><header><strong>Notificações</strong><span>{notificationRecords.length}</span></header>{notificationRecords.length ? <div>{notificationRecords.map((invoice) => <button key={invoice.id} type="button" onClick={() => openAction('view', invoice)}><strong>{invoice.invoiceNumber || 'Sem número'} · {invoice.customer}</strong><small>{isOverdue(invoice) ? 'Vencida' : 'Vence hoje'} · saldo {money(balance(invoice))}</small></button>)}</div> : <p>Nenhuma cobrança exige atenção hoje.</p>}</div>}
          </div>
        </div>
      </header>

      <main className="finance-content invoice-content">
        <section className="finance-invoice-kpis invoice-kpis"><article><span>Faturado</span><strong>{money(billed)}</strong><small>Total ativo</small></article><article><span>Recebido</span><strong>{money(received)}</strong><small>Pagamentos liquidados</small></article><article><span>Em aberto</span><strong>{money(outstanding)}</strong><small>{openInvoices.length} {openInvoices.length === 1 ? 'cobrança pendente' : 'cobranças pendentes'}</small></article><article className={overdueRecords.length ? 'is-alert' : ''}><span>Vencido</span><strong>{money(overdue)}</strong><small>{overdueRecords.length} {overdueRecords.length === 1 ? 'cobrança vencida' : 'cobranças vencidas'}</small></article></section>

        <section className="invoice-list-card">
          <div className="invoice-filters"><label className="invoice-search"><SearchIcon /><input aria-label="Buscar cobranças" placeholder="Buscar cobrança, cliente, serviço ou processo" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option>{STATUS.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="invoice-table-meta"><span>{rows.length} {rows.length === 1 ? 'cobrança' : 'cobranças'}</span>{overdueRecords.length > 0 && <strong>{overdueRecords.length} {overdueRecords.length === 1 ? 'vencida' : 'vencidas'}</strong>}</div>
          <div className="invoice-table-scroll"><div className="invoice-table">
            <div className="invoice-table-head"><span>Cobrança</span><span>Cliente</span><span>Emissão</span><span>Vencimento</span><span>Total</span><span>Saldo</span><span>Status</span><span>Ações</span></div>
            {rows.length ? rows.map((invoice) => { const currentStatus = visibleStatus(invoice); return <div className="invoice-table-row" key={invoice.id}>
              <button className="invoice-number-cell" type="button" data-label="Cobrança" onClick={() => openAction('view', invoice)}><strong>{invoice.invoiceNumber || 'Sem número'}</strong><small>{invoice.noteDirection === 'Entrada' ? 'Entrada' : 'Saída'} · {invoice.fiscalNumber ? `NF/ref. ${invoice.fiscalNumber}` : invoice.fiscalStatus}</small></button>
              <div className="invoice-customer-cell" data-label="Cliente"><strong>{invoice.customer || '—'}</strong><small>{invoice.processRef || invoice.service || 'Sem processo vinculado'}</small></div>
              <span data-label="Emissão">{date(invoice.issueDate)}</span>
              <span data-label="Vencimento" className={isOverdue(invoice) ? 'invoice-overdue-date' : ''}>{date(invoice.dueDate)}</span>
              <strong className="invoice-money" data-label="Total">{money(total(invoice))}</strong>
              <div className="invoice-balance-cell" data-label="Saldo"><strong className={balance(invoice) > 0 ? 'is-outstanding' : ''}>{money(balance(invoice))}</strong><small>{invoice.paid > 0 ? `${money(invoice.paid)} recebido` : 'Sem pagamentos liquidados'}</small></div>
              <span data-label="Status"><b className={`invoice-status is-${statusClass(currentStatus)}`}>{currentStatus}</b></span>
              <div className="invoice-row-actions" data-label="Ações" onClick={(event) => event.stopPropagation()}><button className="invoice-action-trigger" type="button" aria-label={`Ações da cobrança ${invoice.invoiceNumber || invoice.id}`} aria-haspopup="menu" aria-expanded={menu === invoice.id} onClick={() => setMenu((current) => current === invoice.id ? undefined : invoice.id)}>⋯</button>{menu === invoice.id && <div className="invoice-actions-menu" role="menu"><button role="menuitem" type="button" onClick={() => openAction('view', invoice)}>Ver detalhes</button><button role="menuitem" type="button" onClick={() => openAction('edit', invoice)}>Editar cobrança</button><button role="menuitem" type="button" onClick={() => openAction('document', invoice)}>Prévia fiscal / PDF</button><button role="menuitem" type="button" disabled={balance(invoice) <= 0 || invoice.status === 'Cancelada'} onClick={() => openAction('payment', invoice)}>Registrar pagamento</button><div role="separator" /><button role="menuitem" className="is-danger" type="button" onClick={() => remove(invoice)}>Excluir</button></div>}</div>
            </div>; }) : <div className="invoice-empty"><strong>Nenhuma cobrança encontrada</strong><span>Ajuste a busca ou o filtro de status.</span></div>}
          </div></div>
        </section>
      </main>
    </div>

    {modal?.mode === 'view' && modal.record && <InvoiceDetail record={modal.record} close={() => setModal(undefined)} edit={() => setModal({ mode: 'edit', record: modal.record })} registerPayment={() => setModal({ mode: 'payment', record: modal.record })} document={() => setModal({ mode: 'document', record: modal.record })} settlePayment={(paymentId,nextStatus)=>settlePayment(modal.record!.id,paymentId,nextStatus)} />}
    {modal?.mode === 'document' && modal.record && <InvoiceDocument record={modal.record} close={() => setModal(undefined)} />}
    {(modal?.mode === 'create' || modal?.mode === 'edit') && <InvoiceForm mode={modal.mode} record={modal.record} crmRecords={crmRecords} close={() => setModal(undefined)} save={save} />}
    {modal?.mode === 'payment' && modal.record && <PaymentModal record={modal.record} close={() => setModal(undefined)} pay={pay} />}
    {paymentPicker && <PaymentPicker records={openInvoices} close={() => setPaymentPicker(false)} pick={(record) => { setPaymentPicker(false); setModal({ mode: 'payment', record }); }} />}
  </div>;
}

export default FinanceInvoicesWorkspace;