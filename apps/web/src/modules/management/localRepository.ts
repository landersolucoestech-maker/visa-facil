import type { Client, DocumentItem, ServiceInteraction, VisaProcess } from './domain';

const KEYS = {
  clients: 'visa-facil.management.clients.v1',
  processes: 'visa-facil.management.processes.v1',
  documents: 'visa-facil.management.documents.v1',
  interactions: 'visa-facil.management.interactions.v1',
} as const;

function readCollection<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCollection<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('visa-facil-management-change'));
}

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const managementRepository = {
  clients: {
    list: () => readCollection<Client>(KEYS.clients),
    create(input: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString();
      const client: Client = { ...input, id: createId('cli'), createdAt: now, updatedAt: now };
      writeCollection(KEYS.clients, [client, ...readCollection<Client>(KEYS.clients)]);
      return client;
    },
  },
  processes: {
    list: () => readCollection<VisaProcess>(KEYS.processes),
    create(input: Omit<VisaProcess, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString();
      const process: VisaProcess = { ...input, id: createId('pro'), createdAt: now, updatedAt: now };
      writeCollection(KEYS.processes, [process, ...readCollection<VisaProcess>(KEYS.processes)]);
      return process;
    },
  },
  documents: {
    list: () => readCollection<DocumentItem>(KEYS.documents),
  },
  interactions: {
    list: () => readCollection<ServiceInteraction>(KEYS.interactions),
  },
};

export function subscribeToManagementRepository(callback: () => void) {
  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener('visa-facil-management-change', handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('visa-facil-management-change', handler);
  };
}
