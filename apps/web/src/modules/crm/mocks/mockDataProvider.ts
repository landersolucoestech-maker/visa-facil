import records from './crm-records.dev.json';
import type { CrmRecord } from '../CrmApp';

type RawMockRecord = Partial<CrmRecord>;

export function getCrmInitialRecords(): CrmRecord[] {
  if (import.meta.env.VITE_CRM_MOCKS !== 'true') return [];

  return structuredClone(records).map((record) => {
    const raw = record as RawMockRecord;

    return {
      id: raw.id ?? crypto.randomUUID(),
      kind: raw.kind ?? 'contact',
      fullName: raw.fullName ?? '',
      email: raw.email ?? '',
      phone: raw.phone ?? '',
      whatsapp: raw.whatsapp ?? '',
      city: raw.city ?? '',
      state: raw.state ?? '',
      country: raw.country ?? 'Brasil',
      notes: raw.notes ?? '',
      createdAt: raw.createdAt ?? new Date().toISOString(),
      updatedAt: raw.updatedAt ?? new Date().toISOString(),
      relationship: raw.relationship,
      contactStatus: raw.contactStatus,
      source: raw.source,
      owner: raw.owner,
      interest: raw.interest,
      destination: raw.destination,
      visaType: raw.visaType,
      leadStatus: raw.leadStatus,
      temperature: raw.temperature,
      nextAction: raw.nextAction,
      nextActionDate: raw.nextActionDate,
    } satisfies CrmRecord;
  });
}
