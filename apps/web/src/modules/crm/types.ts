export type CrmTab = 'contacts' | 'leads';
export type RecordKind = 'contact' | 'lead';
export type ModalMode = 'create' | 'view' | 'edit';

export type CrmRecord = {
  id: string;
  kind: RecordKind;
  fullName: string;
  cpf: string;
  rg: string;
  passportNumber: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
  country: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  relationship?: string;
  contactStatus?: string;
  source?: string;
  owner?: string;
  ownerUserId?: string;
  interest?: string;
  destination?: string;
  visaType?: string;
  leadStatus?: string;
  temperature?: string;
  nextAction?: string;
  nextActionDate?: string;
  convertedContactId?: string;
  convertedFromLeadId?: string;
  convertedAt?: string;
};

export type CrmRecordDraft = Omit<CrmRecord, 'id' | 'kind' | 'createdAt' | 'updatedAt' | 'convertedContactId' | 'convertedFromLeadId' | 'convertedAt'>;
