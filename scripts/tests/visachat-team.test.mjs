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

const domain = await vite.ssrLoadModule('/src/modules/attendance/attendanceDomain.ts');
const store = await vite.ssrLoadModule('/src/shared/operationalSessionStore.ts');
const sessionRecords = await vite.ssrLoadModule('/src/shared/sessionRecords.ts');

const customer = {
  id: 'customer-test', kind: 'customer', customer: 'Cliente Teste', handle: '+55 11 99999-0000', email: 'cliente@example.com',
  channel: 'WhatsApp', status: 'Em atendimento', assignee: 'Administrador', queue: 'Atendimento', protocol: 'VF-TEST',
  tags: [], lastMessage: 'Olá', lastMessageAt: '10:00', updatedAt: '2026-08-26T10:00:00-03:00', unread: 0,
  crmType: 'Contato', service: '', destination: '', visaType: '',
  messages: [{ id: 'cm-1', sender: 'customer', author: 'Cliente', body: 'Olá', time: '10:00' }],
};

const team = {
  id: 'team-test', kind: 'team', customer: 'Equipe Teste', handle: 'Administrador', email: '', channel: 'Equipe', status: 'Ativo',
  assignee: 'Administrador', queue: 'Equipe', protocol: 'INT-TEST', tags: ['Interno'], lastMessage: 'Interno', lastMessageAt: '11:00',
  updatedAt: '2026-08-26T11:00:00-03:00', participantIds: ['u-1'], unread: 0, crmType: 'Equipe', service: '', destination: '', visaType: '',
  messages: [{ id: 'tm-1', sender: 'team', author: 'Administrador', body: 'Interno', time: '11:00' }],
};

function memoryStorage(initial = new Map()) {
  const values = new Map(initial);
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
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

test('VisaChat enforces distinct customer and team conversation invariants', () => {
  assert.equal(domain.isAttendanceConversation(customer), true);
  assert.equal(domain.isAttendanceConversation(team), true);
  assert.equal(domain.isAttendanceConversation({ ...customer, status: 'Ativo' }), false);
  assert.equal(domain.isAttendanceConversation({ ...customer, messages: [{ ...customer.messages[0], sender: 'team' }] }), false);
  assert.equal(domain.isAttendanceConversation({ ...team, status: 'Em atendimento' }), false);
  assert.equal(domain.isAttendanceConversation({ ...team, channel: 'WhatsApp' }), false);
  assert.equal(domain.isAttendanceConversation({ ...team, messages: [{ ...team.messages[0], sender: 'customer' }] }), false);
  assert.equal(domain.isAttendanceConversation({ ...team, participantIds: [] }), false);
});

test('archived VisaChat conversations cannot send until reopened', () => {
  assert.equal(domain.canSendAttendanceMessage(customer), true);
  assert.equal(domain.canSendAttendanceMessage(team), true);
  assert.equal(domain.canSendAttendanceMessage({ ...customer, status: 'Arquivada' }), false);
  assert.equal(domain.canSendAttendanceMessage({ ...team, status: 'Arquivada' }), false);
});

test('VisaChat sorts conversations by canonical updatedAt instead of display labels', () => {
  const sorted = domain.sortAttendanceConversations([customer, team]);
  assert.deepEqual(sorted.map((item) => item.id), ['team-test', 'customer-test']);
  const updatedCustomer = { ...customer, updatedAt: '2026-08-26T12:00:00-03:00', lastMessageAt: '12:00' };
  assert.deepEqual(domain.sortAttendanceConversations([team, updatedCustomer]).map((item) => item.id), ['customer-test', 'team-test']);
});

test('legacy VisaChat records are normalized without losing old customer sessions', () => {
  const legacyCustomer = { ...customer };
  delete legacyCustomer.kind;
  delete legacyCustomer.updatedAt;
  const normalized = domain.normalizeAttendanceConversation(legacyCustomer, customer);
  assert.equal(normalized.kind, 'customer');
  assert.equal(normalized.updatedAt, customer.updatedAt);

  const legacyTeam = { ...team };
  delete legacyTeam.participantIds;
  const normalizedTeam = domain.normalizeAttendanceConversation(legacyTeam, team);
  assert.deepEqual(normalizedTeam.participantIds, ['u-1']);
});

test('canonical session migration adds team seeds and preserves legacy customer data', () => {
  const legacyCustomer = { ...customer };
  delete legacyCustomer.kind;
  delete legacyCustomer.updatedAt;
  const storage = memoryStorage(new Map([['visa-facil.session.attendance.v2', JSON.stringify([legacyCustomer])]]));
  withSessionStorage(storage, () => {
    const conversations = store.getAttendanceSessionConversations();
    assert.equal(conversations.some((item) => item.id === 'customer-test' && item.kind === 'customer'), true);
    assert.equal(conversations.some((item) => item.kind === 'team'), true);
  });
});

test('VisaChat team participants come from active canonical settings users', () => {
  const members = store.getOperationalTeamMembers();
  assert.ok(members.length > 0);
  assert.ok(members.every((member) => member.id && member.name && member.email && member.role));
  assert.equal(members.some((member) => member.id === 'u-1'), true);
});

test('strict session writes expose quota failures while the operational UI layer stays alive', () => {
  const throwingStorage = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {}, clear: () => {} };
  withSessionStorage(throwingStorage, () => {
    assert.throws(
      () => sessionRecords.writeSessionRecords('quota-test', [{ id: 'x' }], (value) => Boolean(value && typeof value === 'object' && value.id === 'x')),
      (error) => error instanceof sessionRecords.SessionRecordPersistenceError,
    );
    assert.doesNotThrow(() => store.saveAttendanceSessionConversations([team]));
  });
});

test('VisaChat UI wires accessible tabs, structured participants and archived composer state', () => {
  const app = read('apps/web/src/modules/attendance/AttendanceApp.tsx');
  for (const token of ['aria-controls="visachat-mode-panel"', 'role="tabpanel"', 'handleModeKeyDown', 'getOperationalTeamMembers', 'participantIds', 'selectedArchived', 'Reabra a conversa para enviar mensagens.', 'aria-labelledby="visachat-new-conversation-title"']) {
    assert.ok(app.includes(token), `missing ${token}`);
  }
  assert.equal(app.includes("import './attendanceTeamChat.css'"), false);
});

test('VisaChat team CSS wins over the refinement layer for team-specific states', () => {
  const css = read('apps/web/src/modules/attendance/attendanceTeamChat.css');
  for (const token of ['.crm-global-page .attendance-filters.is-team', 'grid-template-columns:minmax(0,1fr)!important', '.attendance-message--team>div', '.attendance-team-members', '.attendance-composer.is-archived textarea']) {
    assert.ok(css.includes(token), `missing ${token}`);
  }
});
