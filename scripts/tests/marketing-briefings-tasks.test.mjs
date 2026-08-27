import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const briefingStore=readFileSync(resolve(root,'apps/web/src/modules/marketing/marketingBriefingStore.ts'),'utf8');
const briefings=readFileSync(resolve(root,'apps/web/src/modules/marketing/MarketingBriefingsApp.tsx'),'utf8');
const tasks=readFileSync(resolve(root,'apps/web/src/modules/tasks/TasksApp.tsx'),'utf8');
const taskDomain=readFileSync(resolve(root,'apps/web/src/modules/tasks/mocks/tasksMockProvider.ts'),'utf8');
const router=readFileSync(resolve(root,'apps/web/src/RootApplication.tsx'),'utf8');
const sidebar=readFileSync(resolve(root,'apps/web/src/components/CrmSidebar.tsx'),'utf8');
const reports=readFileSync(resolve(root,'apps/web/src/modules/reports/reportDatasetAdapter.ts'),'utf8');

test('marketing briefings use validated crash-safe local persistence and canonical active owners',()=>{
 assert.ok(briefingStore.includes('readSessionRecords'));
 assert.ok(briefingStore.includes('safeWriteSessionRecords'));
 assert.ok(briefingStore.includes('ownerUserId'));
 assert.ok(briefingStore.includes("value.status!=='Rascunho'"));
 assert.ok(briefings.includes('getOperationalTeamMembers'));
 assert.ok(briefings.includes('resolvedOwnerId'));
 assert.ok(briefings.includes('Selecione um responsável ativo antes de retirar o briefing de Rascunho.'));
 assert.ok(briefings.includes('Novo briefing'));
 assert.ok(briefings.includes('Mensagem-chave'));
 assert.ok(briefings.includes('Entregáveis'));
});

test('marketing tasks reuse the single canonical CRM task store instead of creating a parallel task domain',()=>{
 assert.ok(tasks.includes('getTaskSessionRecords'));
 assert.ok(tasks.includes('saveTaskSessionRecords'));
 assert.ok(tasks.includes("fixedArea?:TaskArea"));
 assert.ok(tasks.includes("fixedArea=\"Marketing\"")===false,'fixed area is supplied by the router, not hardcoded inside TasksApp');
 assert.ok(router.includes('<TasksApp fixedArea="Marketing"/>'));
 assert.equal(briefingStore.includes('marketing.tasks'),false);
 assert.equal(tasks.includes('marketing.tasks'),false);
});

test('task area preserves legacy records as Geral and remains round-trippable through Reports XLSX',()=>{
 assert.ok(taskDomain.includes("export type TaskArea = 'Geral' | 'Marketing'"));
 assert.ok(taskDomain.includes("return record.area??'Geral'"));
 assert.ok(reports.includes("'Área':taskArea(record)"));
 assert.ok(reports.includes("TASK_AREAS=['Geral','Marketing']"));
 assert.ok(reports.includes('area,relatedType'));
});

test('marketing briefings and tasks are first-class routed sidebar destinations',()=>{
 for(const path of ['/crm/marketing/briefings','/crm/marketing/tarefas']){
  assert.ok(router.includes(`path==='${path}'`),`router missing ${path}`);
  assert.ok(sidebar.includes(`href: '${path}'`),`sidebar missing ${path}`);
 }
 assert.ok(sidebar.includes("if(path.endsWith('/briefings'))return'briefings'"));
 assert.ok(sidebar.includes("if(path.endsWith('/tarefas'))return'tasks'"));
});
