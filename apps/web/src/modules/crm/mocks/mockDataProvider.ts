import records from './crm-records.dev.json';
import type { CrmRecord } from '../types';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';

type RawMockRecord = Partial<CrmRecord>;

export function getCrmInitialRecords(): CrmRecord[] {
  if (!isMockDataEnabled()) return [];

  return structuredClone(records).map((record) => {
    const raw = record as RawMockRecord;
    const now = new Date().toISOString();

    return {
      id: raw.id ?? crypto.randomUUID(),
      kind: raw.kind ?? 'contact',
      fullName: raw.fullName ?? '',
      cpf: raw.cpf ?? '',
      rg: raw.rg ?? '',
      passportNumber: raw.passportNumber ?? '',
      email: raw.email ?? '',
      phone: raw.phone ?? '',
      whatsapp: raw.whatsapp ?? '',
      city: raw.city ?? '',
      state: raw.state ?? '',
      country: raw.country ?? 'Brasil',
      notes: raw.notes ?? '',
      createdAt: raw.createdAt ?? now,
      updatedAt: raw.updatedAt ?? now,
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
