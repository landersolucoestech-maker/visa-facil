import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const app=readFileSync(resolve(root,'apps/web/src/modules/attendance/AttendanceApp.tsx'),'utf8');
const domain=readFileSync(resolve(root,'apps/web/src/modules/attendance/attendanceDomain.ts'),'utf8');
const store=readFileSync(resolve(root,'apps/web/src/shared/operationalSessionStore.ts'),'utf8');
const reports=readFileSync(resolve(root,'apps/web/src/modules/reports/reportDatasetAdapter.ts'),'utf8');

test('VisaChat customer conversations support canonical CRM and assignee ids',()=>{
  assert.ok(domain.includes('crmRecordId?: string'));
  assert.ok(domain.includes('assigneeUserId?: string'));
  assert.ok(domain.includes("value.crmRecordId === undefined || isNonEmptyText(value.crmRecordId)"));
  assert.ok(domain.includes("value.assigneeUserId === undefined || isNonEmptyText(value.assigneeUserId)"));
});

test('new customer conversations start from a canonical Contact or Lead instead of a free-text name',()=>{
  assert.ok(app.includes('getCrmSessionRecords'));
  assert.ok(app.includes('<span>Contato / Lead do CRM</span>'));
  assert.ok(app.includes('crmRecordId: crmRecord.id'));
  assert.ok(app.includes('assigneeUserId: currentMember?.id'));
  assert.ok(app.includes("crmRecord.kind==='lead'?'Lead':crmRecord.relationship==='Cliente'?'Cliente':'Contato'"));
  assert.equal(app.includes('<span>Nome do contato / lead</span>\n<input'),false);
});

test('transfers preserve the canonical responsible user id',()=>{
  assert.ok(app.includes('const assignee = teamMemberById.get'));
  assert.ok(app.includes('assigneeUserId: assignee?.id'));
});

test('attendance persistence canonicalizes XLSX and other write paths without exposing technical ids as spreadsheet columns',()=>{
  assert.ok(store.includes('function canonicalizeAttendanceRecords'));
  assert.ok(store.includes('attendanceCrmMatch'));
  assert.ok(store.includes('attendanceAssigneeMatch'));
  assert.ok(store.includes('Não foi possível vincular a nova conversa'));
  assert.ok(store.includes('crmRecordId:crmRecord.id'));
  assert.ok(store.includes('assigneeUserId:assignee.id'));
  assert.ok(reports.includes("const ATTENDANCE_COLUMNS=['Nome do contato / lead','Canal','Telefone / usuário','Mensagem inicial']"));
  assert.equal(reports.includes("'crmRecordId'"),false);
});
