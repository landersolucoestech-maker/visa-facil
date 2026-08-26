import records from '../../../mocks/crm/crm-records.dev.json';
import type { CrmRecord, RecordKind } from '../types';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';

const RELATIONSHIPS=new Set(['Cliente','Parceiro','Outro']);
const CONTACT_STATUSES=new Set(['Ativo','Inativo']);
const SOURCES=new Set(['','Website','WhatsApp','Instagram','Facebook','Indicação','Google','Outro']);
const LEAD_STATUSES=new Set(['Novo','Em contato','Qualificado','Não qualificado','Convertido','Perdido']);
const TEMPERATURES=new Set(['Frio','Morno','Quente']);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isText(value: unknown): value is string { return typeof value === 'string'; }
function isOptionalText(value: unknown) { return value === undefined || typeof value === 'string'; }
function isKind(value: unknown): value is RecordKind { return value === 'contact' || value === 'lead'; }
export function isCrmRecord(value: unknown): value is CrmRecord {
  if (!isObject(value) || !isKind(value.kind)) return false;
  const validBase = typeof value.id === 'string' && value.id.trim().length > 0
    && typeof value.fullName === 'string' && value.fullName.trim().length > 0
    && isText(value.cpf)
    && isText(value.rg)
    && isText(value.passportNumber)
    && typeof value.email === 'string' && value.email.trim().length > 0
    && isText(value.phone)
    && isText(value.whatsapp)
    && isText(value.city)
    && isText(value.state)
    && isText(value.country)
    && isText(value.notes)
    && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt))
    && typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.updatedAt));
  if (!validBase) return false;
  for (const field of ['relationship', 'contactStatus', 'source', 'owner', 'interest', 'destination', 'visaType', 'leadStatus', 'temperature', 'nextAction', 'nextActionDate'] as const) {
    if (!isOptionalText(value[field])) return false;
  }
  if (typeof value.source==='string'&&!SOURCES.has(value.source)) return false;
  if (value.kind === 'contact') return typeof value.relationship === 'string' && RELATIONSHIPS.has(value.relationship) && typeof value.contactStatus === 'string' && CONTACT_STATUSES.has(value.contactStatus);
  return typeof value.leadStatus === 'string' && LEAD_STATUSES.has(value.leadStatus) && typeof value.temperature === 'string' && TEMPERATURES.has(value.temperature);
}

export function getCrmInitialRecords(): CrmRecord[] {
  if (!isMockDataEnabled()) return [];
  const clone: unknown = structuredClone(records);
  if (!Array.isArray(clone)) return [];
  const seen = new Set<string>();
  return clone.filter(isCrmRecord).filter((record) => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}
