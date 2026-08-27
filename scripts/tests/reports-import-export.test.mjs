import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const app=readFileSync(resolve(root,'apps/web/src/modules/reports/ReportsApp.tsx'),'utf8');
const adapter=readFileSync(resolve(root,'apps/web/src/modules/reports/reportDatasetAdapter.ts'),'utf8');

const getters=[
  'getCrmSessionRecords',
  'getAttendanceSessionConversations',
  'getTaskSessionRecords',
  'getAgendaSessionEvents',
  'getFinanceSessionRecords',
];
const savers=[
  'saveCrmSessionRecords',
  'saveAttendanceSessionConversations',
  'saveTaskSessionRecords',
  'saveAgendaSessionEvents',
  'saveFinanceSessionRecords',
];

test('reports exposes only the intended dataset import and export actions',()=>{
  assert.ok(app.includes('↑ Importar'));
  assert.ok(app.includes('↓ Exportar'));
  assert.equal(app.includes('↑ Validar CSV'),false);
  assert.equal(app.includes('↓ Exportar dados'),false);
  assert.equal(app.includes('Criar relatório'),false);
});

test('reports exports from and imports into canonical operational session stores',()=>{
  for(const token of getters)assert.ok(adapter.includes(token),`missing ${token}`);
  for(const token of savers)assert.ok(adapter.includes(token),`missing ${token}`);
  assert.ok(adapter.includes('assertPersisted'));
  assert.ok(adapter.includes('const saved=saveAttendanceSessionConversations(next)'));
  assert.ok(adapter.includes("assertPersisted(saved,getAttendanceSessionConversations(),'atendimentos')"));
});

test('reports protects CRM conversion integrity during CSV import',()=>{
  assert.ok(adapter.includes("lead convertido não pode ter o status alterado por importação"));
  assert.ok(adapter.includes("“Convertido” só pode ser criado pelo fluxo de conversão do CRM"));
  assert.ok(adapter.includes("leadStatus:convertedContactId?'Convertido':requestedStatus"));
  assert.ok(adapter.includes('convertedContactId,'));
  assert.ok(adapter.includes('convertedAt:previous?.convertedAt'));
});

test('reports CSV parser validates structure instead of blindly mutating data',()=>{
  assert.ok(app.includes('function parseDelimited'));
  assert.ok(app.includes('cabeçalhos duplicados'));
  assert.ok(app.includes('Campos ausentes:'));
  assert.ok(app.includes('aspas não fechadas'));
  assert.ok(app.includes('MAX_CSV_BYTES'));
  assert.ok(app.includes('importReportRows(importEntity.id,parsed.rows)'));
  assert.ok(app.includes('getReportRows(entity.id)'));
  assert.ok(app.includes('createDownload'));
});

test('reports remains truthful about prototype-local persistence',()=>{
  assert.ok(app.includes('operam sobre os dados locais atuais desta sessão do navegador'));
  assert.ok(app.includes('Não há sincronização com servidor externo enquanto o backend não estiver conectado'));
  assert.equal(app.includes('exportação de dados permanecem indisponíveis'),false);
  assert.equal(app.includes('importação persistente e exportação de dados permanecem indisponíveis'),false);
});
