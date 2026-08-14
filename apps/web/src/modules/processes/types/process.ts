export type VisaDestination = 'usa' | 'canada' | 'australia' | 'europe-schengen' | 'other';
export type ProcessStage = 'diagnosis' | 'documents' | 'forms' | 'scheduling' | 'preparation' | 'submitted' | 'completed' | 'cancelled';
export type ProcessPriority = 'normal' | 'high' | 'urgent';

export interface VisaProcess {
  id: string;
  clientId: string;
  destination: VisaDestination;
  category: string;
  stage: ProcessStage;
  priority: ProcessPriority;
  targetDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const DESTINATION_LABELS: Record<VisaDestination, string> = {
  usa: 'Estados Unidos',
  canada: 'Canadá',
  australia: 'Austrália',
  'europe-schengen': 'Europa e Schengen',
  other: 'Outro destino',
};

export const PROCESS_STAGE_LABELS: Record<ProcessStage, string> = {
  diagnosis: 'Diagnóstico',
  documents: 'Documentos',
  forms: 'Formulários',
  scheduling: 'Agendamento',
  preparation: 'Preparação',
  submitted: 'Protocolado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const PROCESS_PRIORITY_LABELS: Record<ProcessPriority, string> = {
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};
