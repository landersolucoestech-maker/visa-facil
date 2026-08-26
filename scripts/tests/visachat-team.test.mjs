import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const read=(path)=>readFileSync(resolve(root,path),'utf8');

test('VisaChat exposes a separated internal team chat workspace',()=>{
  const app=read('apps/web/src/modules/attendance/AttendanceApp.tsx');
  for(const token of ["type ChatMode = 'customer' | 'team'",'Atendimento','Equipe','Novo chat interno','Novo chat da equipe','Criar chat interno','Chat interno','Mensagem interna'])assert.ok(app.includes(token),`missing ${token}`);
  assert.ok(app.includes("kind: 'team'"));
  assert.ok(app.includes("getAttendanceConversationKind(item) === 'team'"));
  assert.ok(app.includes("selectedKind === 'team'"));
  assert.ok(app.includes("Sincronização em tempo real entre usuários dependerá do backend compartilhado."));
  assert.equal(app.includes('getAttendanceInitialConversations'),false);
});

test('VisaChat team conversations remain compatible with existing customer sessions',()=>{
  const provider=read('apps/web/src/modules/attendance/mocks/attendanceMockProvider.ts');
  for(const token of ["AttendanceConversationKind = 'customer' | 'team'","'customer' | 'agent' | 'team' | 'system'","value.kind === undefined","return value.kind === 'team' ? 'team' : 'customer'","'Ativo'"])assert.ok(provider.includes(token),`missing ${token}`);
  const store=read('apps/web/src/shared/operationalSessionStore.ts');
  for(const token of ['getAttendanceSessionConversations','teamSeeds','getAttendanceInitialConversations','getAttendanceConversationKind','knownIds'])assert.ok(store.includes(token),`missing canonical migration ${token}`);
  const fixture=read('apps/web/src/mocks/attendance/attendance.dev.json');
  assert.ok(fixture.includes('"kind": "team"'));
  assert.ok(fixture.includes('"channel": "Equipe"'));
  assert.ok(fixture.includes('"sender":"team"'));
});

test('VisaChat team chat has dedicated presentation rules',()=>{
  const app=read('apps/web/src/modules/attendance/AttendanceApp.tsx');
  const css=read('apps/web/src/modules/attendance/attendanceTeamChat.css');
  assert.ok(app.includes("import './attendanceTeamChat.css'"));
  for(const token of ['.attendance-mode-tabs','.attendance-filters.is-team','.attendance-message--team','.attendance-team-badge','.attendance-details-hero--team'])assert.ok(css.includes(token),`missing ${token}`);
});
