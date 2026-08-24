import records from './crm-records.dev.json';
import type { CrmRecord } from '../CrmApp';

export function getCrmInitialRecords(): CrmRecord[] {
  if (import.meta.env.VITE_CRM_MOCKS !== 'true') return [];

  return structuredClone(records).map((record) => ({
    id: record.id ?? crypto.randomUUID(),
    kind: record.kind ?? 'contact',
    fullName: record.fullName ?? '',
    email: record.email ?? '',
    phone: record.phone ?? '',
    whatsapp: record.whatsapp ?? '',
    city: record.city ?? '',
    state: record.state ?? '',
    country: record.country ?? 'Brasil',
    notes: record.notes ?? '',
    createdAt: record.createdAt ?? new Date().toISOString(),
    updatedAt: record.updatedAt ?? new Date().toISOString(),
    relationship: record.relationship,
    contactStatus: record.contactStatus,
    source: record.source,
    owner: record.owner,
    interest: record.interest,
    destination: record.destination,
    visaType: record.visaType,
    leadStatus: record.leadStatus,
    temperature: record.temperature,
    nextAction: record.nextAction,
    nextActionDate: record.nextActionDate,
  } satisfies CrmRecord));
}
