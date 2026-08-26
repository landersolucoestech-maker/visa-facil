import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const webRoot = resolve(root, 'apps/web');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const vite = await createServer({ root: webRoot, logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom' });

after(async () => { await vite.close(); });

const settingsDomain = await vite.ssrLoadModule('/src/modules/attendance/attendanceSettings.ts');
const attendanceDomain = await vite.ssrLoadModule('/src/modules/attendance/attendanceDomain.ts');

function memoryStorage(initial = new Map(), throwOnSet = false) {
  const values = new Map(initial);
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => { if (throwOnSet) throw new Error('quota'); values.set(key, String(value)); },
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

function withSessionStorage(storage, callback) {
  const previous = globalThis.sessionStorage;
  globalThis.sessionStorage = storage;
  try { return callback(); }
  finally {
    if (previous === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = previous;
  }
}

test('VisaChat settings ship complete and valid operational defaults without integration ownership', () => {
  const settings = settingsDomain.getDefaultVisaChatSettings();
  assert.equal(settingsDomain.isVisaChatSettings(settings), true);
  assert.equal(settings.general.timezone, 'America/Sao_Paulo');
  assert.equal(Object.hasOwn(settings, 'channels'), false);
  assert.ok(settings.automaticMessages.some((message) => message.id === 'welcome'));
  assert.ok(settings.automaticMessages.some((message) => message.id === 'after-hours'));
  assert.ok(settings.menu.options.length >= 5);
  assert.ok(settings.queues.some((queue) => queue.id === 'commercial'));
  assert.ok(settings.slaPolicies.length > 0);
  assert.ok(settings.escalationRules.length > 0);
  assert.ok(settings.templates.some((template) => template.shortcut === '/documentos'));
});

test('VisaChat strips legacy channel settings because integrations belong to Configurações → Integrações', () => {
  const legacy = {
    ...settingsDomain.getDefaultVisaChatSettings(),
    channels: [{ id: 'whatsapp', label: 'WhatsApp', state: 'connected', inbound: true, outbound: true }],
  };
  const storage = memoryStorage(new Map([[settingsDomain.VISACHAT_SETTINGS_STORAGE_KEY, JSON.stringify(legacy)]]));
  withSessionStorage(storage, () => {
    const migrated = settingsDomain.getVisaChatSettings();
    assert.equal(Object.hasOwn(migrated, 'channels'), false);
  });
});

test('VisaChat settings recover from corrupt storage and quota failures', () => {
  withSessionStorage(memoryStorage(new Map([[settingsDomain.VISACHAT_SETTINGS_STORAGE_KEY, '{bad-json']])), () => {
    assert.doesNotThrow(() => settingsDomain.getVisaChatSettings());
    assert.equal(settingsDomain.isVisaChatSettings(settingsDomain.getVisaChatSettings()), true);
  });
  withSessionStorage(memoryStorage(new Map(), true), () => {
    const settings = settingsDomain.getDefaultVisaChatSettings();
    assert.doesNotThrow(() => settingsDomain.saveVisaChatSettings(settings));
  });
});

test('VisaChat internal domain supports direct, group and channel without phone identities', () => {
  const base = {
    id: 'team-settings-test', kind: 'team', customer: 'Equipe', handle: 'Administrador · Consultor', email: '', channel: 'Equipe', status: 'Ativo',
    assignee: 'Administrador', queue: 'Equipe', protocol: 'INT-SETTINGS', tags: ['Interno'], lastMessage: 'Olá', lastMessageAt: '10:00',
    updatedAt: '2026-08-26T10:00:00-03:00', participantIds: ['u-1', 'u-2'], unread: 0, crmType: 'Equipe', service: '', destination: '', visaType: '',
    messages: [{ id: 'msg-1', sender: 'agent', author: 'Administrador', body: 'Olá', time: '10:00', visibility: 'internal' }],
  };
  for (const teamType of ['direct', 'group', 'channel']) {
    const conversation = { ...base, teamType, ...(teamType === 'channel' ? { channelSlug: 'geral' } : {}) };
    assert.equal(attendanceDomain.isAttendanceConversation(conversation), true);
    assert.equal(attendanceDomain.getAttendanceTeamType(conversation), teamType);
  }
  assert.equal(attendanceDomain.isAttendanceConversation({ ...base, messages: [{ ...base.messages[0], visibility: 'external' }] }), false);
});

test('VisaChat atendimento supports internal notes without pretending external delivery', () => {
  const customer = {
    id: 'customer-note-test', kind: 'customer', customer: 'Cliente', handle: '+55 11 90000-0000', email: 'cliente@example.com', channel: 'WhatsApp',
    status: 'Em atendimento', assignee: 'Administrador', queue: 'Atendimento', protocol: 'VF-NOTE', tags: [], lastMessage: 'Nota', lastMessageAt: '10:00',
    updatedAt: '2026-08-26T10:00:00-03:00', unread: 0, crmType: 'Contato', service: '', destination: '', visaType: '', priority: 'Normal',
    messages: [{ id: 'note-1', sender: 'agent', author: 'Administrador', body: 'Somente equipe', time: '10:00', visibility: 'internal', deliveryStatus: 'local' }],
  };
  assert.equal(attendanceDomain.isAttendanceConversation(customer), true);
});

test('VisaChat UI exposes atendimento configuration and structured team spaces without channel integration settings', () => {
  const app = read('apps/web/src/modules/attendance/AttendanceApp.tsx');
  const panel = read('apps/web/src/modules/attendance/AttendanceSettingsPanel.tsx');
  const settings = read('apps/web/src/modules/attendance/attendanceSettings.ts');
  for (const token of ['AttendanceSettingsPanel', 'Configurações', 'TEAM_CONVERSATION_TYPES', 'Conversa direta', 'Grupo', 'Canal', 'Nota interna', 'Resposta rápida', 'Não rastreado sem backend']) {
    assert.ok(app.includes(token), `AttendanceApp missing ${token}`);
  }
  for (const token of ['Mensagens automáticas', 'Menu inicial', 'Filas', 'Roteamento e SLA', 'Escalonamento', 'Templates', 'Notificações', 'Configurações → Usuários']) {
    assert.ok(panel.includes(token), `settings panel missing ${token}`);
  }
  assert.equal(panel.includes("id: 'channels'"), false);
  assert.equal(panel.includes('Canais de atendimento'), false);
  assert.equal(settings.includes('VISACHAT_CHANNEL_IDS'), false);
  assert.equal(settings.includes('channels: ChannelConfig[]'), false);
  for (const token of ['welcome', 'after-hours', 'queue-entry', 'invalidOptionMessage', 'round-robin', 'least-loaded', 'slaPolicies', 'escalationRules']) {
    assert.ok(settings.includes(token), `settings domain missing ${token}`);
  }
});
