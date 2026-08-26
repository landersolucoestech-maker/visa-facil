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
  if(path!=='apps/web/src/components/AccountMenu.tsx'&&source.includes('crm-user'))fail(`${path}: module-local account chrome is forbidden; RootApplication/AccountMenu is the single owner.`);
  if(source.includes('workspace-account'))fail(`${path}: workspace-local account chrome is forbidden; RootApplication/AccountMenu is the single owner.`);
  if(source.includes('site-cms-user'))fail(`${path}: CMS-local account chrome is forbidden; RootApplication/AccountMenu is the single owner.`);
  if(/\bas\s+any\b/.test(source)||/:\s*any\b/.test(source))fail(`${path}: explicit any is forbidden; model the contract instead.`);
  if(source.includes('dangerouslySetInnerHTML'))fail(`${path}: dangerouslySetInnerHTML is forbidden.`);
  if(source.includes('<iframe'))fail(`${path}: iframe embedding is forbidden.`);
  if(/VITE_[A-Z0-9_]*(?:SECRET|TOKEN|API_KEY|PASSWORD)/.test(source))fail(`${path}: private credential names must not be exposed through VITE_* browser variables.`);
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
      if(/aria-label=["'](?:Alertas|Notifica(?:ç|c)ões)/i.test(tag)&&!tag.includes('onClick=')&&!/\bdisabled\b/.test(tag))fail(`${path}: notification control has no behavior and is not explicitly disabled.`);
    }
  }
}

const envExample=read('.env.example');
if(!envExample.includes('VITE_API_BASE_URL='))fail('.env.example must expose the public backend base URL contract.');
if(/VITE_[A-Z0-9_]*(?:SECRET|TOKEN|API_KEY|PASSWORD)\s*=/.test(envExample))fail('.env.example must never define browser-visible provider secrets.');

const sidebarOwners=sourceFiles.filter((path)=>read(path).includes('<aside className="crm-sidebar'));
if(sidebarOwners.length!==1||sidebarOwners[0]!=='apps/web/src/components/CrmSidebar.tsx')fail(`CRM sidebar must have one canonical owner; found: ${sidebarOwners.join(', ')||'none'}.`);

const auth=read('apps/web/src/modules/auth/auth.ts');
const authenticationDisabled=auth.includes('export const AUTHENTICATION_ENABLED = false');
if(!authenticationDisabled)fail('Authentication must remain explicitly disabled until a real provider is introduced and approved.');
if(auth.includes("AUTH_PROVIDER = 'local'"))fail('Frontend-local authentication provider must not return.');

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
const accounting=read('apps/web/src/modules/finance/FinancePLApp.tsx');
if(!accounting.includes('getFinanceSessionRecords'))fail('Contabilidade must derive from canonical finance session transactions.');
if(accounting.includes('getFinanceInitialRecords'))fail('Contabilidade must not bypass canonical finance session state through the development seed provider.');

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

const integrationContract=read('apps/web/src/modules/integrations/integrationContract.ts');
const integrationApi=read('apps/web/src/modules/integrations/integrationApi.ts');
const integrationsUi=read('apps/web/src/modules/settings/SecurityIntegrationTabs.tsx');
const settingsShared=read('apps/web/src/modules/settings/settingsShared.tsx');
const apiClient=read('apps/web/src/shared/apiClient.ts');
for(const provider of ['whatsapp','resend','autentique','nfse','instagram','facebook','youtube','tiktok','google-ads','google-calendar'])if(!integrationContract.includes(`'${provider}'`))fail(`Canonical integration registry is missing ${provider}.`);
for(const token of ['IntegrationRuntimeStatus','serverOnlySecrets','externalRequirements','isIntegrationRuntimeStatus'])if(!integrationContract.includes(token))fail(`Integration contract is incomplete: missing ${token}.`);
for(const token of ['/v1/integrations','connectIntegration','disconnectIntegration','syncIntegration','apiRequest'])if(!integrationApi.includes(token))fail(`Integration API facade is incomplete: missing ${token}.`);
for(const token of ['INTEGRATION_REGISTRY','getIntegrationStatuses','connectIntegration','disconnectIntegration','syncIntegration','isBackendConfigured'])if(!integrationsUi.includes(token))fail(`Settings integration UI must use the real backend contract: missing ${token}.`);
if(integrationsUi.includes('INITIAL_INTEGRATIONS')||settingsShared.includes('INITIAL_INTEGRATIONS'))fail('Parallel/static integration registries must not return.');
if(!apiClient.includes('VITE_API_BASE_URL')||!apiClient.includes("credentials:'include'")||!apiClient.includes('INVALID_API_RESPONSE'))fail('Frontend API boundary must remain configured, session-aware and runtime-validated.');

const contractsApp=read('apps/web/src/modules/contracts/ContractsApp.tsx');
const contractTypes=read('apps/web/src/modules/contracts/contractTypes.ts');
const contractStore=read('apps/web/src/modules/contracts/contractSessionStore.ts');
const contractEngine=read('apps/web/src/modules/contracts/contractTemplateEngine.ts');
const contractEditor=read('apps/web/src/modules/contracts/ContractEditorModal.tsx');
const contractView=read('apps/web/src/modules/contracts/ContractViewModal.tsx');
const contractsSources=sourceFiles.filter(path=>path.includes('/modules/contracts/')).map(read).join('\n').toLowerCase();
for(const token of ['ContractRecord','ContractTemplate','ContractVariableDefinition','ContractCategory','ContractSigner','ContractVersion','ContractAuditEvent'])if(!contractTypes.includes(token))fail(`Canonical contracts domain is incomplete: missing ${token}.`);
for(const token of ['readSessionRecords','writeSessionRecords','isContractRecord','isContractTemplate','isContractVariable','isContractCategory','visa-facil.session.contracts.v2'])if(!contractStore.includes(token))fail(`Contracts session store is incomplete: missing ${token}.`);
if(!contractStore.includes("readSessionRecords<ContractRecord>(KEYS.contracts,()=>[]"))fail('Contracts must not seed fake operational records.');
for(const token of ['makePlaceholder','extractTemplatePlaceholders','resolveTemplateContent','mergedVariableValues','{{CLIENTE.NOME}}','{{PROCESSO.TIPO_VISTO}}','{{CONTRATO.VALOR}}'])if(!contractEngine.includes(token)&&!contractStore.includes(token))fail(`Contracts template engine is incomplete: missing ${token}.`);
for(const token of ['Template','Partes','Variáveis','Documento','Signatários','Revisão','Salvar rascunho','Salvar para revisão'])if(!contractEditor.includes(token))fail(`Contract wizard is incomplete: missing ${token}.`);
for(const token of ['getCrmSessionRecords','getIntegrationStatuses','isBackendConfigured','TemplatesWorkspace','VariablesWorkspace','CategoriesWorkspace'])if(!contractsApp.includes(token))fail(`Contracts workspace is incomplete: missing ${token}.`);
if(!contractView.includes('Autentique')||!contractView.includes('Enviar para assinatura')||!contractView.includes('disabled'))fail('Contracts signing UI must expose Autentique truthfully without simulating delivery.');
for(const forbidden of ['clicksign','docusign','obra musical','lançamento musical','gravadora','produtor musical'])if(contractsSources.includes(forbidden))fail(`Contracts module must not retain reference-only/music-specific concept: ${forbidden}.`);
if(contractsSources.includes('localstorage'))fail('Contracts must use the validated session store instead of a competing localStorage persistence layer.');

const contactSection=read('apps/web/src/modules/public-site/components/ContactSection.tsx');
const publicInteractions=read('apps/web/src/modules/public-site/usePublicSiteInteractions.ts');
const publicLeadService=read('apps/web/src/modules/public-site/services/publicLeadService.ts');
for(const token of ['submitPublicLead','createPublicLeadPayload','isBackendConfigured'])if(!contactSection.includes(token))fail(`Public lead form must use the backend-ready contract: missing ${token}.`);
if(publicInteractions.includes('Formulário demonstrativo')||contactSection.includes('Formulário demonstrativo'))fail('Public lead capture must not simulate a successful submission.');
if(!publicLeadService.includes("'/v1/public/leads'")||!publicLeadService.includes('apiRequest'))fail('Public lead service must target the canonical backend endpoint.');

const packageJson=read('package.json');
if(!packageJson.includes('npm run audit'))fail('Root quality gate must include dependency audit.');
const ci=read('.github/workflows/frontend-ci.yml');
const pages=read('.github/workflows/pages.yml');
if(!ci.includes('npm run audit'))fail('Website CI must keep dependency audit as a required gate.');
if(!pages.includes('npm run audit'))fail('Pages deployment must keep dependency audit as a required gate.');
if(/VITE_CRM_MOCKS:\s*['"]?true/i.test(pages))fail('GitHub Pages production workflow must not enable CRM mocks.');

for(const removed of[
  'apps/web/src/modules/finance/FinanceApp.tsx',
  'apps/web/src/styles/crm-dashboard-kpis.css',
  'apps/web/src/styles/crm-dashboard-relationship-bell-fix.css',
  'apps/web/src/styles/invoices-header-actions-fix.css',
  'apps/web/src/styles/settings-header-actions-fix.css',
])if(existsSync(resolve(root,removed)))fail(`Obsolete duplicate file must stay removed: ${removed}`);

const main=read('apps/web/src/main.tsx');
const crmSidebar=read('apps/web/src/components/CrmSidebar.tsx');
const rootApplication=read('apps/web/src/RootApplication.tsx');
const accountMenu=read('apps/web/src/components/AccountMenu.tsx');
const accountMenuCss=read('apps/web/src/components/account-menu.css');
const profileApp=read('apps/web/src/modules/settings/ProfileApp.tsx');
const routeLoader=read('apps/web/src/components/GlobalRouteLoader.tsx');
const routeLoaderCss=read('apps/web/src/components/global-route-loader.css');
const canonical='crm-header-actions-unified.css';
if(!crmSidebar.includes(canonical))fail('Canonical CRM header stylesheet must be owned by the lazy shared CRM shell.');
if(main.includes(canonical))fail('Canonical CRM header stylesheet must not return to the public entrypoint.');
if(main.includes('crm-dashboard-relationship-bell-fix')||main.includes('settings-header-actions-fix'))fail('Module-specific bell overrides must not return.');
if(rootApplication.includes('crm-dashboard-kpis.css'))fail('Dashboard KPI correction layer must not return; the base contract owns the six-card grid.');
if(rootApplication.includes('invoices-header-actions-fix')||!rootApplication.includes('invoices-header-layout.css'))fail('Invoices must use the explicit header layout contract instead of the obsolete fix layer.');
if(/modules\/crm\/crm\.css|styles\/(?:finance|marketing|settings|tasks|agenda|visachat|accounting|invoices|crm-dashboard|crm-relationship)/.test(main))fail('Public entrypoint must not eagerly load CRM/module-specific styles.');

const mainNavBlock=crmSidebar.match(/const MAIN_ITEMS:[\s\S]*?\];/)?.[0]??'';
const expectedMainNav=['Dashboard','CRM','Agenda','Tarefas','VisaChat','Contratos'];
let previousMainIndex=-1;
for(const label of expectedMainNav){const index=mainNavBlock.indexOf(`label: '${label}'`);if(index<0||index<=previousMainIndex)fail(`CRM sidebar primary order must be Dashboard → CRM → Agenda → Tarefas → VisaChat → Contratos; invalid position for ${label}.`);previousMainIndex=index;}
const mainRenderIndex=crmSidebar.indexOf('{MAIN_ITEMS.map');
const financeRenderIndex=crmSidebar.indexOf('<span>Financeiro</span>');
const marketingRenderIndex=crmSidebar.indexOf('<span>Marketing</span>');
const afterRenderIndex=crmSidebar.indexOf('{AFTER_ITEMS.map');
if(!(mainRenderIndex>=0&&mainRenderIndex<financeRenderIndex&&financeRenderIndex<marketingRenderIndex&&marketingRenderIndex<afterRenderIndex))fail('CRM sidebar group order must be primary navigation → Financeiro → Marketing → Relatórios/Configurações.');
const afterNavBlock=crmSidebar.match(/const AFTER_ITEMS:[\s\S]*?\];/)?.[0]??'';
if(!(afterNavBlock.indexOf("label: 'Relatórios'")>=0&&afterNavBlock.indexOf("label: 'Relatórios'")<afterNavBlock.indexOf("label: 'Configurações'")))fail('CRM sidebar must end with Relatórios → Configurações.');
if(!rootApplication.includes("path==='/crm/contratos'||path.startsWith('/crm/contratos/')")||!rootApplication.includes('withSharedSidebar(<ContractsApp/>)'))fail('Contracts module and its workspaces must remain a lazy shared-shell route.');

if(!rootApplication.includes("from './components/AccountMenu'")||!rootApplication.includes("from './components/GlobalRouteLoader'"))fail('RootApplication must own the shared account menu and global lazy-route loader.');
if(!rootApplication.includes("internal(<WorkspaceSelectorApp/>,'workspace')")||!rootApplication.includes("internal(<SiteCmsApp/>,'cms')")||!rootApplication.includes("</div>,'crm')"))fail('Every internal surface must receive the canonical AccountMenu from RootApplication.');
if(!rootApplication.includes("path==='/crm/perfil'")||!rootApplication.includes('withSharedSidebar(<ProfileApp/>)'))fail('Canonical Perfil route must be owned by RootApplication and use the shared CRM shell.');
if(!rootApplication.includes('fallback={<GlobalRouteLoader/>}')||rootApplication.includes('crm-route-loading')||rootApplication.includes('InternalFallback'))fail('Internal lazy routes must use the canonical full-viewport GlobalRouteLoader only.');
for(const token of ['<span>Perfil</span>','<span>Configurações</span>','<span>Logout</span>',"href('/crm/perfil')",'AUTHENTICATION_ENABLED','signOut','aria-haspopup="menu"'])if(!accountMenu.includes(token))fail(`Canonical AccountMenu contract is incomplete: missing ${token}.`);
if(accountMenu.includes('<span>Workspaces</span>'))fail('Canonical AccountMenu must contain only Perfil, Configurações and Logout actions.');
if(!accountMenu.includes("go(AUTHENTICATION_ENABLED ? '/login' : '/workspaces')"))fail('Logout must clear the auth session and route consistently whether authentication is enabled or disabled.');
for(const token of ['Perfil da conta','AUTHENTICATION_ENABLED','getAuthSession','readOnly'])if(!profileApp.includes(token))fail(`Canonical profile destination is incomplete: missing ${token}.`);
for(const token of ['.crm-global-shell .crm-global-page .crm-topbar','.site-cms-topbar','.workspace-header'])if(!accountMenuCss.includes(token))fail(`Canonical account-menu CSS must reserve the global account slot consistently: missing ${token}.`);
for(const legacyToken of ['.crm-global-shell .crm-global-page .crm-user','.workspace-account','.site-cms-user'])if(accountMenuCss.includes(legacyToken))fail(`Canonical account-menu CSS must not retain legacy neutralization selector: ${legacyToken}.`);
if(!routeLoader.includes('global-route-loader__progress')||!routeLoader.includes('role="progressbar"')||!routeLoader.includes('M7 8h17l8 39L20 56 7 8Z'))fail('GlobalRouteLoader must render the canonical Visa Fácil mark and an accessible progress indicator.');
if(!routeLoaderCss.includes('position:fixed')||!routeLoaderCss.includes('place-items:center')||!routeLoaderCss.includes('100dvh')||!routeLoaderCss.includes('prefers-reduced-motion'))fail('GlobalRouteLoader must remain viewport-centered, responsive and reduced-motion aware.');

if(failures.length){
  console.error('Source quality lint failed:');
  failures.forEach((failure)=>console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Source quality lint passed (${sourceFiles.length} TypeScript files checked).`);
