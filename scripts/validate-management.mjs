import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const rootApplication = read('apps/web/src/RootApplication.tsx');
const main = read('apps/web/src/main.tsx');
const app = read('apps/web/src/modules/management/ManagementApp.tsx');
const shell = read('apps/web/src/modules/management/components/ManagementShell.tsx');
const domain = read('apps/web/src/modules/management/domain.ts');
const dashboard = read('apps/web/src/modules/management/pages/ManagementDashboardPage.tsx');

assert(rootApplication.includes("path === '/app'") && rootApplication.includes("path.startsWith('/app/')"), 'Management application must remain isolated under /app/*');
assert(rootApplication.includes('<ManagementApp />'), 'Root application must render ManagementApp for /app/*');
assert(main.includes("./modules/management/management.css"), 'Management stylesheet must remain loaded');
assert(!app.includes('localStorage') && !app.includes('sessionStorage'), 'Management foundation must not persist client data in browser storage');
assert(app.includes('history.pushState'), 'Management navigation must preserve SPA session state');
assert(app.includes("'/app/clientes'") && app.includes("'/app/processos'") && app.includes("'/app/documentos'") && app.includes("'/app/atendimentos'") && app.includes("'/app/tarefas'") && app.includes("'/app/financeiro'"), 'All management routes must remain registered');

for (const typeName of ['Client', 'VisaProcess', 'DocumentItem', 'ServiceInteraction', 'ManagementTask', 'FinancialEntry']) {
  assert(domain.includes(`interface ${typeName}`), `Missing management domain contract: ${typeName}`);
}

for (const page of ['ClientsPage.tsx', 'ProcessesPage.tsx', 'DocumentsPage.tsx', 'InteractionsPage.tsx', 'TasksPage.tsx', 'FinancePage.tsx']) {
  assert(existsSync(resolve(root, `apps/web/src/modules/management/pages/${page}`)), `Missing management page: ${page}`);
}

for (const route of ['/app/clientes', '/app/processos', '/app/documentos', '/app/atendimentos', '/app/tarefas', '/app/financeiro']) {
  assert(shell.includes(route) || dashboard.includes(route), `Management route is not exposed in navigation: ${route}`);
}

assert(domain.includes("'diagnosis'") && domain.includes("'documents'") && domain.includes("'forms'") && domain.includes("'scheduling'") && domain.includes("'preparation'") && domain.includes("'submitted'") && domain.includes("'completed'"), 'Visa process stage model is incomplete');
assert(!app.includes('fetch('), 'No backend endpoint should be simulated in the management foundation');

if (failures.length) {
  console.error('Visa Fácil management contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Visa Fácil management contract validation passed.');
