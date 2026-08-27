import { getInvoiceMockSeeds, isInvoiceSeed, type InvoiceSeed } from './mocks/invoiceMockProvider';
import { readSessionRecords, SessionRecordPersistenceError, writeSessionRecords } from '../../shared/sessionRecords';
import { LOCAL_PERSISTENCE_ERROR_EVENT, type LocalPersistenceErrorDetail } from '../../shared/operationalSessionStore';

const INVOICE_SESSION_KEY='visa-facil.session.invoices.v2';
const EPSILON=0.0001;

function number(record:InvoiceSeed,key:string){
 const value=(record as Record<string,unknown>)[key];
 return typeof value==='number'&&Number.isFinite(value)?value:0;
}

function reportPersistenceError(error:unknown){
 if(typeof window==='undefined')return;
 const detail:LocalPersistenceErrorDetail={
  key:INVOICE_SESSION_KEY,
  message:error instanceof SessionRecordPersistenceError
   ? error.message
   : 'Não foi possível persistir as cobranças e notas fiscais neste navegador.',
 };
 window.dispatchEvent(new CustomEvent<LocalPersistenceErrorDetail>(LOCAL_PERSISTENCE_ERROR_EVENT,{detail}));
}

export function invoiceSeedTotal(record:InvoiceSeed){
 const subtotal=Math.max(0,number(record,'serviceFee')+number(record,'consularFee')+number(record,'translationFee')+number(record,'courierFee')+number(record,'thirdPartyFee')+number(record,'otherCharges')-number(record,'discounts'));
 return Math.max(0,subtotal+number(record,'tax')+number(record,'icms')+number(record,'ipi')+number(record,'pis')+number(record,'cofins')+number(record,'iss')+number(record,'freight')+number(record,'insurance')+number(record,'otherFiscalExpenses')-number(record,'withheldTaxes'));
}

export function isInvoiceSessionSeed(value:unknown):value is InvoiceSeed{
 if(!isInvoiceSeed(value))return false;
 const total=invoiceSeedTotal(value);
 const paid=value.paid??0;
 if(paid-total>EPSILON)return false;
 if(value.status==='Pago'&&(total<=0||Math.abs(paid-total)>EPSILON))return false;
 if(value.status==='Parcialmente pago'&&!(paid>0&&paid<total))return false;
 if(paid>0&&value.status!=='Pago'&&value.status!=='Parcialmente pago'&&value.status!=='Cancelada')return false;
 return true;
}

export function getInvoiceSessionSeeds(){
 return readSessionRecords<InvoiceSeed>(INVOICE_SESSION_KEY,getInvoiceMockSeeds,isInvoiceSessionSeed);
}

export function saveInvoiceSessionSeeds(records:InvoiceSeed[]){
 try{return writeSessionRecords<InvoiceSeed>(INVOICE_SESSION_KEY,records,isInvoiceSessionSeed)}
 catch(error){reportPersistenceError(error);return structuredClone(records)}
}
