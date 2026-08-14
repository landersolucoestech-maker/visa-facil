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
  chat: 'apps/web/src/modules/chat/types/chat.ts',
  tasks: 'apps/web/src/modules/tasks/types/task.ts',
  finance: 'apps/web/src/modules/finance/types/finance.ts',
};

const pageFiles = {
  clients: 'apps/web/src/modules/clients/pages/ClientsPage.tsx',
  clientDetail: 'apps/web/src/modules/clients/pages/ClientDetailPage.tsx',
  processes: 'apps/web/src/modules/processes/pages/ProcessesPage.tsx',
  processDetail: 'apps/web/src/modules/processes/pages/ProcessDetailPage.tsx',
  documents: 'apps/web/src/modules/documents/pages/DocumentsPage.tsx',
  interactions: 'apps/web/src/modules/interactions/pages/InteractionsPage.tsx',
  chat: 'apps/web/src/modules/chat/pages/ChatPage.tsx',
  tasks: 'apps/web/src/modules/tasks/pages/TasksPage.tsx',
  finance: 'apps/web/src/modules/finance/pages/FinancePage.tsx',
  reports: 'apps/web/src/modules/reports/pages/ReportsPage.tsx',
  settings: 'apps/web/src/modules/settings/pages/SettingsPage.tsx',
};

assert(rootApplication.includes("path === '/app'") && rootApplication.includes("path.startsWith('/app/')"), 'Management application must remain isolated under /app/*');
assert(rootApplication.includes('<ManagementApp />'), 'Root application must render ManagementApp for /app/*');
assert(main.includes("./modules/management/management.css") && main.includes("./modules/management/dashboard.css"), 'Management visual styles must remain loaded');
assert(main.includes("./modules/chat/chat.css") && main.includes("./modules/reports/reports.css") && main.includes("./modules/settings/settings.css"), 'Chat/reports/settings visual styles must remain loaded');
assert(!app.includes('localStorage') && !app.includes('sessionStorage'), 'Management foundation must not persist client data in browser storage');
assert(app.includes('history.pushState'), 'Management navigation must preserve SPA session state');

const routes = ['/app/clientes','/app/processos','/app/documentos','/app/atendimentos','/app/chat','/app/tarefas','/app/financeiro','/app/relatorios','/app/configuracoes'];
for (const route of routes) {
  assert(app.includes(`'${route}'`), `Management route must remain registered: ${route}`);
  assert(shell.includes(route) || dashboard.includes(route), `Management route is not exposed in navigation: ${route}`);
}
assert(app.includes("path.startsWith('/app/clientes/')") && app.includes('ClientDetailPage'), 'Client detail route must remain registered');
assert(app.includes("path.startsWith('/app/processos/')") && app.includes('ProcessDetailPage'), 'Process detail route must remain registered');

for (const [moduleName, file] of Object.entries(domainFiles)) assert(existsSync(resolve(root, file)), `Missing ${moduleName} domain type file: ${file}`);
for (const [moduleName, file] of Object.entries(pageFiles)) assert(existsSync(resolve(root, file)), `Missing ${moduleName} page inside its module: ${file}`);

assert(!existsSync(resolve(root, 'apps/web/src/modules/management/domain.ts')), 'Shared management/domain.ts must not return; domain types belong to their own modules');
for (const legacyPage of ['ClientsPage.tsx','ProcessesPage.tsx','DocumentsPage.tsx','InteractionsPage.tsx','ChatPage.tsx','TasksPage.tsx','FinancePage.tsx','ReportsPage.tsx','SettingsPage.tsx','ManagementReservedPage.tsx']) {
  assert(!existsSync(resolve(root, `apps/web/src/modules/management/pages/${legacyPage}`)), `Legacy/domain page must not remain under management/pages: ${legacyPage}`);
}

assert(shell.includes('VisaFacilLogo') && shell.includes('seu visto, sem complicação'), 'Management shell must use the Visa Fácil public identity');
assert(dashboard.includes('Processos por Status') && dashboard.includes('Processos por Destino') && dashboard.includes('Financeiro (Resumo)') && dashboard.includes('Atendimentos Recentes') && dashboard.includes('Tarefas Pendentes'), 'Approved dashboard visual blocks must remain present');

const processDomain = read(domainFiles.processes);
assert(processDomain.includes("'diagnosis'") && processDomain.includes("'documents'") && processDomain.includes("'forms'") && processDomain.includes("'scheduling'") && processDomain.includes("'preparation'") && processDomain.includes("'submitted'") && processDomain.includes("'completed'"), 'Visa process stage model is incomplete');
const chatDomain = read(domainFiles.chat);
assert(chatDomain.includes("'open'") && chatDomain.includes("'waiting'") && chatDomain.includes("'closed'") && chatDomain.includes('unreadCount'), 'VisaChat lifecycle model is incomplete');
assert(!app.includes('fetch('), 'No backend endpoint should be simulated in the management foundation');

if (failures.length) {
  console.error('Visa Fácil management contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Visa Fácil management contract validation passed.');
