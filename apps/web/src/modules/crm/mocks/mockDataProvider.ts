import records from './crm-records.dev.json';
import type { CrmRecord } from '../CrmApp';

type RawMockRecord = Partial<CrmRecord> & { company?: string };

export function getCrmInitialRecords(): CrmRecord[] {
  if (import.meta.env.VITE_CRM_MOCKS !== 'true') return [];

  return structuredClone(records).map((record) => {
    const raw = record as RawMockRecord;
    const isCompany = raw.personType === 'Pessoa Jurídica';

    return {
      id: raw.id ?? crypto.randomUUID(),
      kind: raw.kind ?? 'contact',
      personType: raw.personType ?? 'Pessoa Física',
      fullName: isCompany ? '' : raw.fullName ?? '',
      legalName: isCompany ? raw.legalName ?? raw.company ?? raw.fullName ?? '' : '',
      tradeName: raw.tradeName ?? '',
      cnpj: raw.cnpj ?? '',
      contactPerson: raw.contactPerson ?? '',
      role: raw.role ?? '',
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
