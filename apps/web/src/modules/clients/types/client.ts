export type ClientStatus = 'lead' | 'active' | 'inactive';

export interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: ClientStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  lead: 'Lead',
  active: 'Ativo',
  inactive: 'Inativo',
};
