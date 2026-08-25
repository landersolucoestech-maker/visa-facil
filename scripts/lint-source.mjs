import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root=process.cwd();
const failures=[];
const fail=(message)=>failures.push(message);
const read=(path)=>readFileSync(resolve(root,path),'utf8');

function walk(path){
  const absolute=resolve(root,path);
  return readdirSync(absolute).flatMap((name)=>{
    const full=resolve(absolute,name);
    const repoPath=relative(root,full).replaceAll('\\','/');
    return statSync(full).isDirectory()?walk(repoPath):[repoPath];
  });
}

const sourceFiles=walk('apps/web/src').filter((path)=>/\.(ts|tsx)$/.test(path));
for(const path of sourceFiles){
  const source=read(path);
  if(/\bas\s+any\b/.test(source)||/:\s*any\b/.test(source))fail(`${path}: explicit any is forbidden; model the contract instead.`);
  if(source.includes('dangerouslySetInnerHTML'))fail(`${path}: dangerouslySetInnerHTML is forbidden.`);
  if(source.includes('<iframe'))fail(`${path}: iframe embedding is forbidden.`);
  if(source.includes('.dev.json')){
    if(!path.includes('/mocks/'))fail(`${path}: development fixtures may only be imported by canonical mock providers under /mocks/.`);
    else{
      if(!source.includes('isMockDataEnabled'))fail(`${path}: mock provider imports a development fixture without centralized runtime mock policy.`);
      if(/structuredClone\([^;\n]+\)\s+as\s+/m.test(source))fail(`${path}: development fixture must be runtime-validated; unchecked structuredClone casts are forbidden.`);
      if(/return\s+structuredClone\([^;\n]+\)\s+as\s+/m.test(source))fail(`${path}: development fixture must not be returned through an unchecked type assertion.`);
    }
  }
  if(path.endsWith('.tsx')){
    for(const match of source.matchAll(/<button\b[^>]*>/g)){
      const tag=match[0];
      if(/className=["'][^"']*\bcrm-user\b/.test(tag)&&!tag.includes('onClick='))fail(`${path}: crm-user button has no action; render static identity or a real action instead.`);
      if(/aria-label=["'](?:Alertas|Notifica(?:ç|c)ões)/i.test(tag)&&!tag.includes('onClick=')&&!/\bdisabled\b/.test(tag))fail(`${path}: notification control has no behavior and is not explicitly disabled.`);
    }
  }
}

const sidebarOwners=sourceFiles.filter((path)=>read(path).includes('<aside className="crm-sidebar'));
if(sidebarOwners.length!==1||sidebarOwners[0]!=='apps/web/src/components/CrmSidebar.tsx')fail(`CRM sidebar must have one canonical owner; found: ${sidebarOwners.join(', ')||'none'}.`);

const auth=read('apps/web/src/modules/auth/auth.ts');
const authenticationDisabled=auth.includes('export const AUTHENTICATION_ENABLED = false');
if(!authenticationDisabled)fail('Authentication must remain explicitly disabled until a real provider is introduced and approved.');
if(auth.includes("AUTH_PROVIDER = 'local'"))fail('Frontend-local authentication provider must not return.');
if(authenticationDisabled){
  for(const path of sourceFiles){
    const source=read(path);
    if(/>\s*Logout\s*</i.test(source))fail(`${path}: fake Logout action is forbidden while authentication is disabled.`);
    if(/>\s*Perfil\s*</i.test(source))fail(`${path}: fake profile action is forbidden while authentication is disabled.`);
  }
}

const operationalStore=read('apps/web/src/shared/operationalSessionStore.ts');
const sessionStore=read('apps/web/src/shared/sessionRecords.ts');
if(!operationalStore.includes('readSessionRecords')||!operationalStore.includes('writeSessionRecords'))fail('Operational session domains must use the validated shared session record store.');
if(!sessionStore.includes('uniqueIds')||!sessionStore.includes('sessionStorage'))fail('Shared session record store must validate identity and remain browser-session scoped.');
const operationalConsumers=[
  ['apps/web/src/modules/crm/CrmApp.tsx','getCrmSessionRecords','saveCrmSessionRecords','getCrmInitialRecords'],
  ['apps/web/src/modules/tasks/TasksApp.tsx','getTaskSessionRecords','saveTaskSessionRecords','getTaskInitialRecords'],
  ['apps/web/src/modules/agenda/AgendaApp.tsx','getAgendaSessionEvents','saveAgendaSessionEvents','getAgendaInitialEvents'],
  ['apps/web/src/modules/finance/FinanceTransactionsApp.tsx','getFinanceSessionRecords','saveFinanceSessionRecords','getFinanceInitialRecords'],
  ['apps/web/src/modules/attendance/AttendanceApp.tsx','getAttendanceSessionConversations','saveAttendanceSessionConversations','getAttendanceInitialConversations'],
];
for(const [path,getter,saver,legacyGetter] of operationalConsumers){
  const source=read(path);
  if(!source.includes(getter)||!source.includes(saver))fail(`${path}: operational records must read and write the canonical browser-session source.`);
  if(source.includes(legacyGetter))fail(`${path}: UI must not initialize directly from development fixtures; use the canonical session source.`);
}
const dashboard=read('apps/web/src/modules/crm/CrmDashboardApp.tsx');
for(const getter of ['getCrmSessionRecords','getTaskSessionRecords','getAgendaSessionEvents','getFinanceSessionRecords','getAttendanceSessionConversations'])if(!dashboard.includes(getter))fail(`Dashboard must derive operational data from ${getter}.`);
for(const legacyGetter of ['getCrmInitialRecords','getTaskInitialRecords','getAgendaInitialEvents','getFinanceInitialRecords','getAttendanceInitialConversations'])if(dashboard.includes(legacyGetter))fail(`Dashboard must not bypass canonical session state through ${legacyGetter}.`);

const invoiceWorkspace=read('apps/web/src/modules/finance/FinanceInvoicesWorkspace.tsx');
const invoiceSessionStore=read('apps/web/src/modules/finance/invoiceSessionStore.ts');
if(!invoiceWorkspace.includes('getInvoiceSessionSeeds')||!invoiceWorkspace.includes('saveInvoiceSessionSeeds')||!invoiceWorkspace.includes('useEffect'))fail('Invoices must persist mutations through the validated invoice session source.');
if(invoiceWorkspace.includes('getInvoiceMockSeeds'))fail('Invoices UI must not initialize directly from mock seeds.');
if(!invoiceWorkspace.includes('DERIVED_STATUS')||!invoiceWorkspace.includes('invalidPaidBalance')||!invoiceWorkspace.includes('reconcileStatus'))fail('Invoices must derive settlement statuses and prevent paid values from exceeding the document total.');
if(!invoiceSessionStore.includes('readSessionRecords')||!invoiceSessionStore.includes('writeSessionRecords')||!invoiceSessionStore.includes('isInvoiceSessionSeed')||!invoiceSessionStore.includes('invoiceSeedTotal'))fail('Invoice session storage must validate ledger and total consistency.');

const marketing=read('apps/web/src/modules/marketing/MarketingApp.tsx');
const marketingSessionStore=read('apps/web/src/modules/marketing/marketingSessionStore.ts');
for(const token of ['getMarketingSessionCampaigns','saveMarketingSessionCampaigns','getMarketingSessionContents','saveMarketingSessionContents'])if(!marketing.includes(token))fail(`Marketing must use the shared session contract: missing ${token}.`);
if(marketing.includes('getMarketingMockFixture')||marketing.includes('RawContent')||marketing.includes('RawCampaign')||marketing.includes('MarketingFixture'))fail('Marketing UI must not bypass the validated session source with permissive raw fixture contracts.');
if(!marketingSessionStore.includes('readSessionRecords')||!marketingSessionStore.includes('writeSessionRecords')||!marketingSessionStore.includes('isMarketingContent')||!marketingSessionStore.includes('isMarketingCampaign'))fail('Marketing session storage must runtime-validate rich campaign/content records.');

const packageJson=read('package.json');
if(!packageJson.includes('npm run audit'))fail('Root quality gate must include dependency audit.');
const ci=read('.github/workflows/frontend-ci.yml');
const pages=read('.github/workflows/pages.yml');
if(!ci.includes('npm run audit'))fail('Website CI must keep dependency audit as a required gate.');
if(!pages.includes('npm run audit'))fail('Pages deployment must keep dependency audit as a required gate.');
if(/VITE_CRM_MOCKS:\s*['"]?true/i.test(pages))fail('GitHub Pages production workflow must not enable CRM mocks.');

for(const removed of [
  'apps/web/src/modules/finance/FinanceApp.tsx',
  'apps/web/src/styles/crm-dashboard-kpis.css',
  'apps/web/src/styles/crm-dashboard-relationship-bell-fix.css',
  'apps/web/src/styles/invoices-header-actions-fix.css',
  'apps/web/src/styles/settings-header-actions-fix.css',
])if(existsSync(resolve(root,removed)))fail(`Obsolete duplicate file must stay removed: ${removed}`);

const main=read('apps/web/src/main.tsx');
const crmSidebar=read('apps/web/src/components/CrmSidebar.tsx');
const rootApplication=read('apps/web/src/RootApplication.tsx');
const canonical='crm-header-actions-unified.css';
if(!crmSidebar.includes(canonical))fail('Canonical CRM header stylesheet must be owned by the lazy shared CRM shell.');
if(main.includes(canonical))fail('Canonical CRM header stylesheet must not return to the public entrypoint.');
if(main.includes('crm-dashboard-relationship-bell-fix')||main.includes('settings-header-actions-fix'))fail('Module-specific bell overrides must not return.');
if(rootApplication.includes('crm-dashboard-kpis.css'))fail('Dashboard KPI correction layer must not return; the base contract owns the six-card grid.');
if(rootApplication.includes('invoices-header-actions-fix.css')||!rootApplication.includes('invoices-header-layout.css'))fail('Invoices must use the explicit header layout contract instead of the obsolete fix layer.');
if(/modules\/crm\/crm\.css|styles\/(?:finance|marketing|settings|tasks|agenda|visachat|accounting|invoices|crm-dashboard|crm-relationship)/.test(main))fail('Public entrypoint must not eagerly load CRM/module-specific styles.');

if(failures.length){
  console.error('Source quality lint failed:');
  failures.forEach((failure)=>console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Source quality lint passed (${sourceFiles.length} TypeScript files checked).`);
