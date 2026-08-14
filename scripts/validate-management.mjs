import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

function walkFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    return statSync(fullPath).isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

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
  notifications: 'apps/web/src/modules/notifications/types/notification.ts',
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
  calendar: 'apps/web/src/modules/calendar/pages/CalendarPage.tsx',
  finance: 'apps/web/src/modules/finance/pages/FinancePage.tsx',
  reports: 'apps/web/src/modules/reports/pages/ReportsPage.tsx',
  settings: 'apps/web/src/modules/settings/pages/SettingsPage.tsx',
};

assert(rootApplication.includes("path === '/app'") && rootApplication.includes("path.startsWith('/app/')"), 'Management application must remain isolated under /app/*');
assert(rootApplication.includes('<ManagementApp />'), 'Root application must render ManagementApp for /app/*');
assert(main.includes("./modules/management/management.css") && main.includes("./modules/management/dashboard.css") && main.includes("./modules/management/accessibility.css") && main.includes("./modules/management/forms.css"), 'Management visual, accessibility and form feedback styles must remain loaded');
assert(main.includes("./modules/clients/client-controls.css") && main.includes("./modules/processes/process-controls.css"), 'Client/process progression controls must remain styled');
assert(main.includes("./modules/chat/chat.css") && main.includes("./modules/calendar/calendar.css") && main.includes("./modules/search/search.css") && main.includes("./modules/notifications/notifications.css") && main.includes("./modules/reports/reports.css") && main.includes("./modules/settings/settings.css"), 'Chat/calendar/search/notifications/reports/settings visual styles must remain loaded');
assert(!app.includes('localStorage') && !app.includes('sessionStorage'), 'Management foundation must not persist client data in browser storage');
assert(app.includes('history.pushState'), 'Management navigation must preserve SPA session state');
assert(app.includes('GlobalSearch'), 'Global frontend search must remain connected to the management shell');
assert(app.includes('NotificationCenter'), 'Frontend alert center must remain connected to the management shell');
assert(app.includes('updateClientStatus') && app.includes('updateClient') && app.includes('updateProcess'), 'Existing session records must remain editable and evolvable in the frontend');
assert(existsSync(resolve(root, 'apps/web/src/modules/search/components/GlobalSearch.tsx')), 'Global search component must remain inside its own module');
assert(existsSync(resolve(root, 'apps/web/src/modules/notifications/components/NotificationCenter.tsx')), 'Alert center component must remain inside its own module');
assert(existsSync(resolve(root, 'apps/web/src/modules/clients/components/ClientEditForm.tsx')), 'Client edit form must remain inside the clients module');
assert(existsSync(resolve(root, 'apps/web/src/modules/processes/components/ProcessEditForm.tsx')), 'Process edit form must remain inside the processes module');
assert(existsSync(resolve(root, 'apps/web/src/modules/management/accessibility.css')), 'Management keyboard accessibility stylesheet must remain present');
assert(existsSync(resolve(root, 'apps/web/src/modules/management/forms.css')), 'Shared form feedback stylesheet must remain present');
assert(shell.includes('management-skip-link') && shell.includes('management-main'), 'Management shell must retain skip-link keyboard navigation');

const routes = ['/app/clientes','/app/processos','/app/documentos','/app/atendimentos','/app/chat','/app/tarefas','/app/agenda','/app/financeiro','/app/relatorios','/app/configuracoes'];
for (const route of routes) {
  assert(app.includes(`'${route}'`), `Management route must remain registered: ${route}`);
  assert(shell.includes(route) || dashboard.includes(route), `Management route is not exposed in navigation: ${route}`);
}
assert(app.includes("path.startsWith('/app/clientes/')") && app.includes('ClientDetailPage'), 'Client detail route must remain registered');
assert(app.includes("path.startsWith('/app/processos/')") && app.includes('ProcessDetailPage'), 'Process detail route must remain registered');

for (const [moduleName, file] of Object.entries(domainFiles)) assert(existsSync(resolve(root, file)), `Missing ${moduleName} domain type file: ${file}`);
for (const [moduleName, file] of Object.entries(pageFiles)) assert(existsSync(resolve(root, file)), `Missing ${moduleName} page inside its module: ${file}`);

assert(!existsSync(resolve(root, 'apps/web/src/modules/management/domain.ts')), 'Shared management/domain.ts must not return; domain types belong to their own modules');
for (const legacyPage of ['ClientsPage.tsx','ProcessesPage.tsx','DocumentsPage.tsx','InteractionsPage.tsx','ChatPage.tsx','TasksPage.tsx','CalendarPage.tsx','FinancePage.tsx','ReportsPage.tsx','SettingsPage.tsx','ManagementReservedPage.tsx']) {
  assert(!existsSync(resolve(root, `apps/web/src/modules/management/pages/${legacyPage}`)), `Legacy/domain page must not remain under management/pages: ${legacyPage}`);
}

assert(shell.includes('VisaFacilLogo') && shell.includes('seu visto, sem complicação'), 'Management shell must use the Visa Fácil public identity');
assert(dashboard.includes('Processos por Status') && dashboard.includes('Processos por Destino') && dashboard.includes('Financeiro (Resumo)') && dashboard.includes('Atendimentos Recentes') && dashboard.includes('Tarefas Pendentes'), 'Approved dashboard visual blocks must remain present');

const clientDetail = read(pageFiles.clientDetail);
assert(clientDetail.includes('client-status-control') && clientDetail.includes('onUpdateStatus') && clientDetail.includes('ClientEditForm'), 'Client detail must retain status and full edit controls');
const processDomain = read(domainFiles.processes);
assert(processDomain.includes("'diagnosis'") && processDomain.includes("'documents'") && processDomain.includes("'forms'") && processDomain.includes("'scheduling'") && processDomain.includes("'preparation'") && processDomain.includes("'submitted'") && processDomain.includes("'completed'"), 'Visa process stage model is incomplete');
const chatDomain = read(domainFiles.chat);
assert(chatDomain.includes("'open'") && chatDomain.includes("'waiting'") && chatDomain.includes("'closed'") && chatDomain.includes('unreadCount'), 'VisaChat lifecycle model is incomplete');
const notificationComponent = read('apps/web/src/modules/notifications/components/NotificationCenter.tsx');
assert(notificationComponent.includes('Tarefa atrasada') && notificationComponent.includes('Mensagem não lida') && notificationComponent.includes('Documento obrigatório pendente'), 'Alert center must derive operational alerts from session data');
const calendarPage = read(pageFiles.calendar);
assert(calendarPage.includes('Agenda') && calendarPage.includes('Tarefa') && calendarPage.includes('Processo'), 'Agenda must remain a temporal calendar/list view');
const processDetail = read(pageFiles.processDetail);
assert(processDetail.includes('process-stage-timeline') && processDetail.includes('operationalStages'), 'Process detail must retain its sequential stage timeline');
assert(processDetail.includes('process-update-card') && processDetail.includes('onUpdateProcess') && processDetail.includes('ProcessEditForm'), 'Process detail must retain progression and full edit controls');

const validatedForms = [
  'apps/web/src/modules/clients/components/ClientForm.tsx',
  'apps/web/src/modules/clients/components/ClientEditForm.tsx',
  'apps/web/src/modules/processes/components/ProcessForm.tsx',
  'apps/web/src/modules/processes/components/ProcessEditForm.tsx',
  'apps/web/src/modules/documents/components/DocumentChecklistForm.tsx',
  'apps/web/src/modules/interactions/components/InteractionForm.tsx',
  'apps/web/src/modules/tasks/pages/TasksPage.tsx',
  'apps/web/src/modules/finance/pages/FinancePage.tsx',
];
for (const file of validatedForms) assert(read(file).includes('management-form-error'), `Critical frontend form must retain visible validation feedback: ${file}`);

const internalModules = resolve(root, 'apps/web/src/modules');
for (const file of walkFiles(internalModules).filter((path) => /\.(tsx?|css|jsx?)$/.test(path))) {
  assert(!readFileSync(file, 'utf8').toLowerCase().includes('kanban'), `Kanban is prohibited in the Visa Fácil frontend: ${file.replace(`${root}/`, '')}`);
}
assert(!app.includes('fetch('), 'No backend endpoint should be simulated in the management foundation');

if (failures.length) {
  console.error('Visa Fácil management contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Visa Fácil management contract validation passed.');
