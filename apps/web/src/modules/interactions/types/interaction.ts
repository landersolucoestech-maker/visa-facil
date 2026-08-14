export interface ServiceInteraction {
  id: string;
  clientId: string;
  processId?: string;
  channel: 'whatsapp' | 'email' | 'phone' | 'meeting' | 'other';
  subject: string;
  notes: string;
  occurredAt: string;
}
