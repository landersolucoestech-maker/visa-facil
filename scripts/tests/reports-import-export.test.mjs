import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const app=readFileSync(resolve(root,'apps/web/src/modules/reports/ReportsApp.tsx'),'utf8');
const adapter=readFileSync(resolve(root,'apps/web/src/modules/reports/reportDatasetAdapter.ts'),'utf8');
const xlsx=readFileSync(resolve(root,'apps/web/src/modules/reports/xlsxWorkbook.ts'),'utf8');
const crm=readFileSync(resolve(root,'apps/web/src/modules/crm/CrmApp.tsx'),'utf8');
const attendance=readFileSync(resolve(root,'apps/web/src/modules/attendance/AttendanceApp.tsx'),'utf8');
const tasks=readFileSync(resolve(root,'apps/web/src/modules/tasks/TasksApp.tsx'),'utf8');
const agenda=readFileSync(resolve(root,'apps/web/src/modules/agenda/AgendaApp.tsx'),'utf8');
const finance=readFileSync(resolve(root,'apps/web/src/modules/finance/FinanceTransactionsApp.tsx'),'utf8');

const getters=['getCrmSessionRecords','getAttendanceSessionConversations','getTaskSessionRecords','getAgendaSessionEvents','getFinanceSessionRecords'];
const savers=['saveCrmSessionRecords','saveAttendanceSessionConversations','saveTaskSessionRecords','saveAgendaSessionEvents','saveFinanceSessionRecords'];

const schemas={
 contacts:['Nome completo','CPF','RG','Número do passaporte','Interesse / Serviço','Destino de interesse','Tipo de visto / Interesse','Relacionamento','E-mail','Telefone','WhatsApp','Cidade','Estado','País','Status','Origem do contato','Responsável','Observações'],
 leads:['Nome completo','CPF','RG','Número do passaporte','Interesse / Serviço','Destino de interesse','Tipo de visto / Interesse','Origem','E-mail','Telefone','WhatsApp','Cidade','Estado','País','Status do lead','Temperatura','Responsável','Próxima ação','Data da próxima ação','Observações'],
 attendance:['Nome do contato / lead','Canal','Telefone / usuário','Mensagem inicial'],
 tasks:['Título','Responsável','Área','Tipo de vínculo','Contato / Lead relacionado','Prioridade','Status','Data','Horário','Lembrete','Descrição'],
 agenda:['Título','Tipo','Status','Data','Início','Fim','Local','Cidade','Tipo de vínculo','Contato / Lead / Cliente','Responsável','Observações'],
 finance:['Descrição','Tipo','Categoria','Valor','Status','Data','Vencimento','Forma de pagamento','Cliente / contato relacionado','Observações'],
};

const attendanceModalLabelByReportColumn={
 'Nome do contato / lead':'Contato / Lead do CRM',
 'Canal':'Canal',
 'Telefone / usuário':'Telefone / usuário',
 'Mensagem inicial':'Mensagem inicial',
};

function arrayLiteral(name){
 const match=adapter.match(new RegExp(`const ${name}=\\[([\\s\\S]*?)\\] as const;`));
 assert.ok(match,`${name} not found`);
 return [...match[1].matchAll(/'([^']+)'/g)].map(item=>item[1]);
}

test('reports is XLSX-only in UI, validation, templates and exports',()=>{
 assert.ok(app.includes('↑ Importar XLSX'));
 assert.ok(app.includes('↓ Exportar XLSX'));
 assert.ok(app.includes('Baixar template XLSX completo'));
 assert.ok(app.includes("endsWith('.xlsx')"));
 assert.ok(app.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
 assert.ok(app.includes('readXlsxFile(file)'));
 assert.ok(app.includes('createXlsxBlob'));
 assert.equal(app.includes("endsWith('.csv')"),false);
 assert.equal(app.includes('text/csv'),false);
 assert.equal(app.includes('parseCsv'),false);
 assert.equal(app.includes('parseDelimited'),false);
 assert.equal(/\.csv[\s'"`]/i.test(app),false);
});

test('every report dataset exactly matches the user-facing data fields from its create modal',()=>{
 assert.deepEqual(arrayLiteral('CONTACT_COLUMNS'),schemas.contacts);
 assert.deepEqual(arrayLiteral('LEAD_COLUMNS'),schemas.leads);
 assert.deepEqual(arrayLiteral('ATTENDANCE_COLUMNS'),schemas.attendance);
 assert.deepEqual(arrayLiteral('TASK_COLUMNS'),schemas.tasks);
 assert.deepEqual(arrayLiteral('AGENDA_COLUMNS'),schemas.agenda);
 assert.deepEqual(arrayLiteral('FINANCE_COLUMNS'),schemas.finance);

 for(const label of schemas.contacts)assert.ok(crm.includes(label),`contact modal missing ${label}`);
 for(const label of schemas.leads)assert.ok(crm.includes(label),`lead modal missing ${label}`);
 for(const label of schemas.attendance){const modalLabel=attendanceModalLabelByReportColumn[label]??label;assert.ok(attendance.includes(modalLabel),`attendance modal missing ${modalLabel}`)}
 for(const label of schemas.tasks)assert.ok(tasks.includes(label),`task modal missing ${label}`);
 for(const label of schemas.agenda)assert.ok(agenda.includes(label),`agenda modal missing ${label}`);
 for(const label of schemas.finance)assert.ok(finance.includes(label),`finance modal missing ${label}`);
});

test('attendance XLSX keeps the human-readable contact-name column while the UI resolves it to a canonical CRM record internally',()=>{
 assert.ok(schemas.attendance.includes('Nome do contato / lead'));
 assert.equal(schemas.attendance.includes('crmRecordId'),false);
 assert.ok(attendance.includes('Contato / Lead do CRM'));
 assert.ok(attendance.includes('crmRecordId: crmRecord.id'));
});

test('reports exports from and imports into canonical operational session stores',()=>{
 for(const token of getters)assert.ok(adapter.includes(token),`missing ${token}`);
 for(const token of savers)assert.ok(adapter.includes(token),`missing ${token}`);
 assert.ok(adapter.includes('assertPersisted'));
 assert.ok(adapter.includes('const saved=saveAttendanceSessionConversations(next)'));
 assert.ok(adapter.includes("assertPersisted(saved,getAttendanceSessionConversations(),'atendimentos')"));
});

test('XLSX import requires the exact modal schema with no missing or extra columns',()=>{
 assert.ok(app.includes('Campos ausentes:'));
 assert.ok(app.includes('Campos não permitidos:'));
 assert.ok(app.includes('O arquivo precisa conter exatamente os campos do modal correspondente.'));
 assert.ok(app.includes('headers.length!==entity.columns.length'));
});

test('XLSX implementation is dependency-free and supports standard workbook ZIP compression',()=>{
 assert.ok(xlsx.includes('export function createXlsxBlob'));
 assert.ok(xlsx.includes('export async function readXlsxFile'));
 assert.ok(xlsx.includes("new DecompressionStream('deflate-raw' as never)"));
 assert.ok(xlsx.includes("entry.method===0"));
 assert.ok(xlsx.includes("entry.method===8"));
 assert.ok(xlsx.includes('xl/sharedStrings.xml'));
 assert.ok(xlsx.includes('autoFilter'));
});

test('reports accepts Excel serial dates and times without weakening field validation',()=>{
 assert.ok(adapter.includes('Date.UTC(1899,11,30)'));
 assert.ok(adapter.includes('serial*1440'));
 assert.ok(adapter.includes('deve ser uma data válida'));
 assert.ok(adapter.includes('deve ser um horário válido'));
});

test('reports protects CRM conversion integrity during XLSX import',()=>{
 assert.ok(adapter.includes('lead convertido não pode ter o status alterado por importação'));
 assert.ok(adapter.includes('“Convertido” só pode ser criado pelo fluxo de conversão do CRM'));
 assert.ok(adapter.includes("leadStatus:convertedContactId?'Convertido':requestedStatus"));
 assert.ok(adapter.includes('convertedContactId'));
 assert.ok(adapter.includes('convertedAt:previous?.convertedAt'));
});

test('reports remains truthful about prototype-local persistence',()=>{
 assert.ok(app.includes('operam sobre os dados locais atuais desta sessão do navegador'));
 assert.ok(app.includes('Não há schema reduzido, CSV ou omissão de campos'));
 assert.equal(app.includes('sincronização com servidor externo'),false);
});
