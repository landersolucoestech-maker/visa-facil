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
const dashboard = read('apps/web/src/modules/management/pages/ManagementDashboardPage.tsx');

const domainFiles = {
  clients: 'apps/web/src/modules/clients/types/client.ts',
  processes: 'apps/web/src/modules/processes/types/process.ts',
  documents: 'apps/web/src/modules/documents/types/document.ts',
  interactions: 'apps/web/src/modules/interactions/types/interaction.ts',
  tasks: 'apps/web/src/modules/tasks/types/task.ts',
  finance: 'apps/web/src/modules/finance/types/finance.ts',
};

const pageFiles = {
  clients: 'apps/web/src/modules/clients/pages/ClientsPage.tsx',
  processes: 'apps/web/src/modules/processes/pages/ProcessesPage.tsx',
  documents: 'apps/web/src/modules/documents/pages/DocumentsPage.tsx',
  interactions: 'apps/web/src/modules/interactions/pages/InteractionsPage.tsx',
  tasks: 'apps/web/src/modules/tasks/pages/TasksPage.tsx',
  finance: 'apps/web/src/modules/finance/pages/FinancePage.tsx',
};

assert(rootApplication.includes("path === '/app'") && rootApplication.includes("path.startsWith('/app/')"), 'Management application must remain isolated under /app/*');
assert(rootApplication.includes('<ManagementApp />'), 'Root application must render ManagementApp for /app/*');
assert(main.includes("./modules/management/management.css"), 'Management stylesheet must remain loaded');
assert(!app.includes('localStorage') && !app.includes('sessionStorage'), 'Management foundation must not persist client data in browser storage');
assert(app.includes('history.pushState'), 'Management navigation must preserve SPA session state');
assert(app.includes("'/app/clientes'") && app.includes("'/app/processos'") && app.includes("'/app/documentos'") && app.includes("'/app/atendimentos'") && app.includes("'/app/tarefas'") && app.includes("'/app/financeiro'"), 'All management routes must remain registered');

for (const [moduleName, file] of Object.entries(domainFiles)) {
  assert(existsSync(resolve(root, file)), `Missing ${moduleName} domain type file: ${file}`);
}
for (const [moduleName, file] of Object.entries(pageFiles)) {
  assert(existsSync(resolve(root, file)), `Missing ${moduleName} page inside its module: ${file}`);
}

assert(!existsSync(resolve(root, 'apps/web/src/modules/management/domain.ts')), 'Shared management/domain.ts must not return; domain types belong to their own modules');
for (const legacyPage of ['ClientsPage.tsx', 'ProcessesPage.tsx', 'DocumentsPage.tsx', 'InteractionsPage.tsx', 'TasksPage.tsx', 'FinancePage.tsx', 'ManagementReservedPage.tsx']) {
  assert(!existsSync(resolve(root, `apps/web/src/modules/management/pages/${legacyPage}`)), `Legacy page must not remain under management/pages: ${legacyPage}`);
}

for (const route of ['/app/clientes', '/app/processos', '/app/documentos', '/app/atendimentos', '/app/tarefas', '/app/financeiro']) {
  assert(shell.includes(route) || dashboard.includes(route), `Management route is not exposed in navigation: ${route}`);
}

const processDomain = read(domainFiles.processes);
assert(processDomain.includes("'diagnosis'") && processDomain.includes("'documents'") && processDomain.includes("'forms'") && processDomain.includes("'scheduling'") && processDomain.includes("'preparation'") && processDomain.includes("'submitted'") && processDomain.includes("'completed'"), 'Visa process stage model is incomplete');
assert(!app.includes('fetch('), 'No backend endpoint should be simulated in the management foundation');

if (failures.length) {
  console.error('Visa Fácil management contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Visa Fácil management contract validation passed.');
