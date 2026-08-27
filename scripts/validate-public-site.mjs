import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const containsAll = (source, values) => values.every((value) => source.includes(value));

const indexHtml = read('apps/web/index.html');
const main = read('apps/web/src/main.tsx');
const rootApp = read('apps/web/src/RootApplication.tsx');
const publicPage = read('apps/web/src/modules/public-site/pages/PublicSitePage.tsx');
const header = read('apps/web/src/modules/public-site/components/PublicHeader.tsx');
const hero = read('apps/web/src/modules/public-site/components/HeroSection.tsx');
const contact = read('apps/web/src/modules/public-site/components/ContactSection.tsx');
const footer = read('apps/web/src/modules/public-site/components/PublicFooter.tsx');
const interactions = read('apps/web/src/modules/public-site/usePublicSiteInteractions.ts');
const leadService = read('apps/web/src/modules/public-site/services/publicLeadService.ts');
const schema = read('apps/web/src/modules/site-cms/siteSchema.ts');
const schemaGlobal = read('apps/web/src/modules/site-cms/siteSchemaGlobal.ts');
const schemaConversion = read('apps/web/src/modules/site-cms/siteSchemaConversion.ts');
const schemaEditorial = read('apps/web/src/modules/site-cms/siteSchemaEditorial.ts');
const store = read('apps/web/src/modules/site-cms/siteStore.ts');
const cmsDocumentContract = read('apps/web/src/modules/site-cms/cmsDocumentContract.ts');
const crm = read('apps/web/src/modules/crm/CrmApp.tsx');
const crmTypes = read('apps/web/src/modules/crm/types.ts');
const crmSidebar = read('apps/web/src/components/CrmSidebar.tsx');
const crmMockProvider = read('apps/web/src/modules/crm/mocks/mockDataProvider.ts');
const crmMockData = read('apps/web/src/mocks/crm/crm-records.dev.json');
const contractsApp = read('apps/web/src/modules/contracts/ContractsApp.tsx');
const contractTypes = read('apps/web/src/modules/contracts/contractTypes.ts');
const contractEditor = read('apps/web/src/modules/contracts/ContractEditorModal.tsx');
const contractStore = read('apps/web/src/modules/contracts/contractSessionStore.ts');
const contractEngine = read('apps/web/src/modules/contracts/contractTemplateEngine.ts');
const contractMockProvider = read('apps/web/src/modules/contracts/mocks/contractsMockProvider.ts');
const contractMockRecords = read('apps/web/src/mocks/contracts/contracts-records.dev.json');
const financeConfigStore = read('apps/web/src/modules/finance/financeConfigStore.ts');
const financeTransactionsApp = read('apps/web/src/modules/finance/FinanceTransactionsApp.tsx');
const financeTransactionsCss = read('apps/web/src/modules/finance/finance.css');
const financeAccountingApp = read('apps/web/src/modules/finance/FinancePLApp.tsx');
const financeAccountingCss = read('apps/web/src/modules/finance/finance-accounting.css');
const financeCategoriesApp = read('apps/web/src/modules/finance/FinancialCategoriesApp.tsx');
const financeRulesApp = read('apps/web/src/modules/finance/FinancialRulesApp.tsx');
const reportsApp = read('apps/web/src/modules/reports/ReportsApp.tsx');
const reportsCss = read('apps/web/src/modules/reports/reports.css');
const tasksApp = read('apps/web/src/modules/tasks/TasksApp.tsx');
const tasksCss = read('apps/web/src/modules/tasks/tasks.css');
const agendaApp = read('apps/web/src/modules/agenda/AgendaApp.tsx');
const agendaCss = read('apps/web/src/modules/agenda/agenda.css');
const settingsApp = read('apps/web/src/modules/settings/SettingsApp.tsx');
const profileApp = read('apps/web/src/modules/settings/ProfileApp.tsx');
const settingsShared = read('apps/web/src/modules/settings/settingsShared.tsx');
const settingsResponsiveCss = read('apps/web/src/modules/settings/settings-responsive.css');
const settingsLayoutCss = read('apps/web/src/modules/settings/settings-layout.css');
const settingsMockProvider = read('apps/web/src/modules/settings/mocks/settingsMockProvider.ts');
const marketingApp = read('apps/web/src/modules/marketing/MarketingApp.tsx');
const marketingRefinementCss = read('apps/web/src/modules/marketing/marketing-refinement.css');
const marketingOverviewRefinementCss = read('apps/web/src/modules/marketing/marketing-overview-refinement.css');
const uiStandard = read('apps/web/src/styles/crm-ui-standard.css');
const allSource = [main, rootApp, publicPage, header, hero, contact, footer, interactions, schema, schemaGlobal, schemaConversion, schemaEditorial, store, cmsDocumentContract].join('\n');
const crmSource = [crm, crmTypes, crmMockProvider, crmMockData].join('\n');

assert(containsAll(rootApp, ['const PublicSitePage = lazy', 'return { default: module.PublicSitePage }', 'return publicSite();']), 'Root application must retain the lazy public website');
assert(containsAll(rootApp, ["path==='/crm'", '<CrmDashboardApp/>', "path==='/crm/relacionamento'", '<CrmApp/>']), 'Dashboard and relationship routes must remain explicit and separate');
assert(containsAll(rootApp, ["path==='/crm/contratos'", "path==='/crm/contratos/templates'", "path==='/crm/contratos/variaveis'", '<ContractsApp/>']), 'Contracts route and canonical subworkspaces must remain explicit and lazy-loaded');
assert(containsAll(rootApp, ["path==='/crm/contratos/categorias'", "replacePath('/crm/contratos/templates')"]), 'Obsolete contract categories URL must redirect to Templates');
assert(containsAll(rootApp, ["path==='/login'", "path==='/workspaces'", "path==='/site-admin'", '<LoginApp/>', '<WorkspaceSelectorApp/>', '<SiteCmsApp/>']), 'Authentication/workspace/CMS routes are incomplete');
assert(rootApp.includes('lazy(') && rootApp.includes('Suspense'), 'Internal workspaces must remain lazy-loaded');
assert(!rootApp.includes('ManagementApp') && !rootApp.includes("'/app'"), 'Obsolete internal management application must not return');
assert(!allSource.includes('dangerouslySetInnerHTML'), 'dangerouslySetInnerHTML is forbidden');
assert(!allSource.includes('<iframe'), 'iframe embedding is forbidden');
assert(main.includes("import './styles/app-baseline.css';"), 'The application entrypoint must load the neutral viewport/reset baseline');
assert(!main.includes('01-base.css') && !main.includes('02-sections-responsive.css') && !main.includes('03-hero-v3.css') && containsAll(rootApp, ["await import('./modules/public-site/styles/01-base.css')", "await import('./modules/public-site/styles/02-sections-responsive.css')", "await import('./modules/public-site/styles/03-hero-v3.css')", "await import('./modules/public-site/content/cms-preview.css')"]), 'Official public style cascade must be loaded only with the public website route');
assert(!main.includes('/crm/') && !main.includes('styles/finance') && !main.includes('styles/marketing') && !main.includes('styles/settings'), 'Public entrypoint must not eagerly load internal workspace styles');
assert(!crmSidebar.includes('../modules/crm/crm.css') && containsAll(crmSidebar, ["../styles/sidebar-v2.css"]) && !crmSidebar.includes('../styles/sidebar-color-fix.css') && !crmSidebar.includes('../styles/ui-system.css') && !crmSidebar.includes('../styles/product-refinement.css') && !crmSidebar.includes('../styles/crm-header-actions-unified.css') && containsAll(rootApp, ["./styles/crm-content-layout.css", "./styles/crm-ui-standard.css", "./styles/crm-ui-enforcement.css", "./styles/tableview-surface.css", "await import('./modules/crm/crm.css')"]), 'Shared CRM chrome must be root-owned while legacy CRM CSS stays local to CRM pages and sidebar theme stays canonical');
assert(!existsSync(resolve(root,'apps/web/src/styles/sidebar-color-fix.css')), 'Duplicate sidebar color override must stay removed');
assert(containsAll(rootApp, ['visachat-refinement.css', 'marketing-refinement.css']) && !rootApp.includes('agenda-refinement.css') && !rootApp.includes('settings-refinement.css') && !rootApp.includes('reports-refinement.css') && !rootApp.includes('tasks-refinement.css') && !rootApp.includes('finance-transactions-refinement.css') && !rootApp.includes('accounting-refinement.css') && !rootApp.includes('invoices-refinement.css') && !rootApp.includes('marketing-campaigns-refinement.css'), 'Only modules that still require a dedicated refinement layer may load one from the CRM route shell');
assert(!existsSync(resolve(root,'apps/web/src/styles/agenda-refinement.css')) && rootApp.includes("const AgendaApp = lazy(() => import('./modules/agenda/AgendaApp'));") && agendaApp.includes("import './agenda.css'") && containsAll(agendaCss,['Agenda — dedicated visual system loaded after legacy/global styles.','.crm-global-page .agenda-toolbar-main','.crm-global-page .agenda-year-grid','.crm-global-page .agenda-form-modal']), 'Agenda must own one canonical module stylesheet instead of legacy base plus refinement layers');
assert(!existsSync(resolve(root,'apps/web/src/styles/reports-refinement.css')) && reportsApp.includes("import './reports.css'") && containsAll(reportsCss, ['--vf-control-height', '--vf-radius-card', '--vf-radius-modal']), 'Reports must own one canonical module stylesheet instead of base plus refinement layers');
assert(!existsSync(resolve(root,'apps/web/src/styles/tasks-refinement.css')) && tasksApp.includes("import './tasks.css'") && containsAll(tasksCss, ['--vf-row-action-size', '--vf-radius-card', '--vf-radius-modal', '--tasks-columns']), 'Tasks must own one canonical module stylesheet instead of base plus refinement layers');
assert(!existsSync(resolve(root,'apps/web/src/styles/finance-transactions-refinement.css')) && financeTransactionsApp.includes("import './finance.css'") && containsAll(financeTransactionsCss, ['--vf-field-height', '--vf-row-action-size', '--vf-radius-card', '--vf-radius-modal', 'finance-transaction-filters', 'finance-ofx-drop']), 'Finance Transactions and OFX must own one canonical module stylesheet instead of base plus refinement layers');
assert(!existsSync(resolve(root,'apps/web/src/styles/accounting-refinement.css')) && financeAccountingApp.includes("import './finance-accounting.css'") && containsAll(financeAccountingCss, ['--vf-radius-card', 'accounting-kpis', 'accounting-toolbar', 'accounting-report-card']), 'Accounting must own one canonical module stylesheet instead of legacy base plus refinement layers');
assert(rootApp.includes("./modules/finance/invoices-chrome.css") && !rootApp.includes('invoices-refinement.css') && !existsSync(resolve(root,'apps/web/src/styles/invoices-refinement.css')) && !rootApp.includes('invoices-kpi-cards.css') && !rootApp.includes('invoices-header-layout.css') && !existsSync(resolve(root,'apps/web/src/styles/invoices-kpi-cards.css')) && !existsSync(resolve(root,'apps/web/src/styles/invoices-header-layout.css')), 'Invoice page chrome must remain consolidated while fiscal/document styles stay domain-owned');
assert(financeCategoriesApp.includes("import './finance-config.css'") && financeRulesApp.includes("import './finance-config.css'") && !financeCategoriesApp.includes("import './finance.css'") && !financeRulesApp.includes("import './finance.css'"), 'Finance categories and rules must not load transaction/OFX presentation styles');
assert(rootApp.includes("./styles/crm-ui-standard.css"), 'Canonical CRM visual contract must remain loaded by the shared internal shell');
assert(!existsSync(resolve(root,'apps/web/src/styles/settings-refinement.css')) && containsAll(settingsApp,["import './settings.css'","import './settings-responsive.css'","import './settings-layout.css'"]) && containsAll(profileApp,["import './settings.css'","import './settings-responsive.css'","import './settings-layout.css'"]) && containsAll(settingsLayoutCss,['Canonical settings visual contract','.crm-global-page .settings-tabs','.crm-global-page .settings-integration-row','.crm-global-page .settings-notification-btn']), 'Settings and Profile must own their canonical visual contract inside the settings module');
assert(!existsSync(resolve(root,'apps/web/src/styles/marketing-campaigns-refinement.css')) && !rootApp.includes('marketing-campaigns-refinement.css') && containsAll(marketingRefinementCss,['Campaign KPI geometry','.marketing-content:has(> .marketing-table-card) > .marketing-kpis','height:96px!important']), 'Marketing campaign KPI geometry must stay consolidated in the shared Marketing refinement');
assert(marketingApp.includes('className="marketing-bell"') && /<BellIcon\s*\/>/.test(marketingApp) && marketingRefinementCss.includes('.marketing-bell>svg') && !marketingRefinementCss.includes('data:image/svg+xml'), 'Marketing notification control must style the rendered bell SVG instead of duplicating it as a CSS data image');
assert(containsAll(marketingOverviewRefinementCss,['Marketing overview refinement','.marketing-kpis:has(+ .marketing-grid)','.marketing-content>.marketing-grid']) && !marketingOverviewRefinementCss.includes('.marketing-bell') && !marketingOverviewRefinementCss.includes('.crm-topbar h1') && !marketingOverviewRefinementCss.includes('.crm-sidebar--shared'), 'Marketing overview refinement must remain overview-only');

assert(containsAll(indexHtml, ['<html lang="pt-BR">', '<title>VISA FÁCIL | Assessoria para Vistos Internacionais</title>', '<meta name="theme-color" content="#0D1B3D']), 'Official metadata changed unexpectedly');
assert(containsAll(schemaGlobal, ['EUA', 'Canadá', 'Vistos', 'Como Funciona', 'Dúvidas', 'Analisar meu perfil']), 'CMS default navigation changed unexpectedly');
assert(containsAll(hero, ['cmsList(values.slides)', 'slides.map', 'data-hero-slide', 'data-hero-dot']) && schemaConversion.includes("repeater('slides','Banners'"), 'Hero must render dynamically from CMS-editable slides');
assert(existsSync(resolve(root, 'apps/web/src/modules/public-site/assets/hero-visa-facil.webp')), 'Official hero artwork is missing');
assert(containsAll(schemaConversion, ['O caminho mais fácil', 'para o seu visto', 'começa aqui.', 'Analisar meu perfil', 'Conhecer os serviços']), 'Hero commercial defaults changed unexpectedly');
assert(interactions.includes('6000'), 'Hero autoplay interval must remain 6000 ms');
assert(interactions.includes('IntersectionObserver'), 'Reveal behavior must remain active');
assert(contact.includes('data-form') && containsAll(schemaEditorial, ['Nome completo', 'WhatsApp', 'E-mail', 'Enviar para análise']), 'CMS-driven lead capture form changed unexpectedly');
assert(containsAll(contact, ['submitPublicLead', 'isBackendConfigured', 'onSubmit={submit}']) && leadService.includes("'/v1/public/leads'"), 'Public lead form must use the real backend contract when configured');
assert(!interactions.includes('Formulário demonstrativo') && !contact.includes('Formulário demonstrativo'), 'Public lead form must not simulate submission success');
assert(containsAll(schemaGlobal, ['Instagram', 'Facebook', 'TikTok', '© 2026 VISA FÁCIL']), 'CMS footer/social defaults changed unexpectedly');
assert(!schemaGlobal.toLowerCase().includes('youtube'), 'YouTube must remain removed');
assert(containsAll(publicPage, ['SiteContentProvider', 'resolvePublicDocument', 'page.sections.filter', 'page.seo.title', "ensureMeta('description')", "ensureMeta('og:image',true)"]), 'Public page must consume the CMS document and page SEO');
assert(containsAll(store, ['DRAFT_KEY', 'PUBLISHED_KEY', 'loadDraft', 'loadPublished', 'publishDraft', 'parseCmsDocument', 'normalizeCmsPath']), 'Draft/published CMS storage contract is incomplete');
assert(containsAll(cmsDocumentContract, ['isCmsDocument', 'parseCmsDocument', 'normalizeCmsPath', 'VALID_PAGE_STATUSES', 'VALID_MEDIA_KINDS', 'hasUniqueIds']), 'Persisted CMS document validation contract is incomplete');
assert(containsAll(schema, ['PAGE_SECTION_TYPES', 'GLOBAL_SECTION_TYPES', 'createInitialCmsDocument', 'createSectionFromType']), 'Dynamic CMS schema contract is incomplete');

assert(containsAll(crmSidebar, ['Dashboard', 'CRM', 'Agenda', 'Tarefas', 'VisaChat', 'Contratos', 'Financeiro', 'Marketing', 'Relatórios', 'Configurações']), 'Shared CRM sidebar is incomplete');
assert(!crm.includes('<aside className="crm-sidebar"'), 'Relationship CRM must not render a second sidebar');
assert(containsAll(crm, ['Total de contatos', 'Clientes', 'Leads', 'Qualificados', 'Convertidos']), 'Relationship summary is incomplete');
assert(containsAll(crm, ['value={query}', 'value={filter}', 'normalizedQuery']), 'Relationship search/filter controls must remain connected to data');
assert(containsAll(crmTypes, ['cpf: string', 'rg: string', 'passportNumber: string']), 'Canonical CRM person model must include CPF, RG and passport number');
assert(containsAll(crm, ['label="CPF"', 'label="RG"', 'label="Número do passaporte"', 'value={record.cpf}', 'value={record.rg}', 'value={record.passportNumber}']), 'CRM create/edit/view flows must include CPF, RG and passport number');
assert(containsAll(crmMockProvider, ['isCrmRecord', 'isMockDataEnabled', 'isText(value.cpf)', 'isText(value.rg)', 'isText(value.passportNumber)', 'clone.filter(isCrmRecord)']), 'CRM mock provider must runtime-validate document fields under the centralized mock policy');
assert(!crmMockProvider.includes('crypto.randomUUID()') && !crmMockProvider.includes('new Date().toISOString()'), 'CRM mock provider must reject malformed fixture identity/timestamps instead of fabricating replacements');

assert(containsAll(contractsApp, ['TemplatesWorkspace', 'VariablesWorkspace', 'getCrmSessionRecords', 'getIntegrationStatuses', 'Todos os templates', '<th>Template</th>']), 'Contracts workspace is incomplete');
assert(!contractsApp.includes('contracts-module-tabs')&&!contractsApp.includes('CategoriesWorkspace')&&!contractsApp.includes('/crm/contratos/categorias'), 'Contracts page must not restore module tabs or a Categories workspace');
assert(!contractTypes.includes('ContractCategory')&&!contractTypes.includes('categoryId'), 'Contracts canonical types must classify through Template only');
assert(containsAll(contractEditor, ['Template','Partes','Variáveis','Documento','Signatários','Revisão','Salvar rascunho','Salvar para revisão']), 'Contracts six-step wizard changed unexpectedly');
assert(!contractEditor.includes('categoryId')&&!contractEditor.includes('>Categoria<'), 'Contract wizard must not expose a second category classification');
assert(containsAll(contractStore, ['readSessionRecords','writeSessionRecords','isContractRecord','isContractTemplate','isContractVariable','visa-facil.session.contracts.v4','getContractMockRecords']), 'Contracts session persistence/mock contract is incomplete');
assert(containsAll(contractMockProvider, ['contracts-records.dev.json','getContractMockRecords','isMockDataEnabled']), 'Contracts must consume centralized operational mock records');
assert(contractMockRecords.includes('mock-contract-001')&&contractMockRecords.includes('"signatureProvider": null')&&contractMockRecords.includes('"signatureState": "not_sent"'), 'Contract mock records must be present without pretending external signature completion');
assert(!contractStore.includes('ContractCategory')&&!contractStore.includes('contract-categories')&&!contractStore.includes('categoryId'), 'Contracts session store must not retain category persistence');
assert(containsAll(contractEngine, ['extractTemplatePlaceholders','resolveTemplateContent','{{CLIENTE.NOME}}','{{PROCESSO.TIPO_VISTO}}','{{CONTRATO.VALOR}}']), 'Contracts template engine is incomplete');
assert(!contractStore.toLowerCase().includes('clicksign')&&!contractStore.toLowerCase().includes('docusign'), 'Contracts signing provider must remain Autentique-only');

assert(financeConfigStore.includes('./mocks/financeConfigMockProvider')&&!financeConfigStore.includes("{ id: 'cat-1'"), 'Finance configuration reference data must remain centralized in mocks');
assert(settingsShared.includes('./mocks/settingsMockProvider')&&settingsMockProvider.includes('settings.dev.json')&&!settingsShared.includes("{id:'u-1'"), 'Settings demonstration users/roles must remain centralized behind a validated mock provider');
assert(!settingsShared.includes("import './settings.css'") && !settingsResponsiveCss.includes('settings-public-') && !settingsResponsiveCss.includes('settings-billing-') && !settingsResponsiveCss.includes('settings-plans-grid') && !settingsResponsiveCss.includes('settings-invoice-table') && !settingsResponsiveCss.includes('settings-payment-row') && !settingsResponsiveCss.includes('settings-invite-row') && !settingsLayoutCss.includes('settings-billing-') && !settingsLayoutCss.includes('settings-plans-grid') && !settingsLayoutCss.includes('settings-invoice-table') && !settingsLayoutCss.includes('settings-payment-row') && !settingsLayoutCss.includes('settings-invite-row'), 'Settings must not restore obsolete public/billing/invoice/invite presentation or duplicate shared stylesheet ownership');
assert(containsAll(uiStandard, ['--vf-control-height:36px','--vf-field-height:40px','--vf-radius-control:5px','--vf-radius-card:7px','--vf-radius-modal:8px','line-height:0!important']), 'Canonical visual tokens/buttons are incomplete');

for (const forbidden of ['Pessoa Jurídica', 'personType', 'CNPJ', 'cnpj', 'legalName', 'tradeName', 'contactPerson', 'isCompany']) {
  assert(!crmSource.includes(forbidden), `CRM must remain person-only; forbidden company field/logic found: ${forbidden}`);
}

for (const css of ['apps/web/src/styles/app-baseline.css','apps/web/src/modules/public-site/styles/01-base.css','apps/web/src/modules/public-site/styles/02-sections-responsive.css','apps/web/src/modules/public-site/styles/03-hero-v3.css','apps/web/src/modules/crm/crm.css','apps/web/src/modules/site-cms/site-cms-base.css','apps/web/src/modules/contracts/contracts.css','apps/web/src/modules/finance/finance.css','apps/web/src/modules/finance/finance-accounting.css','apps/web/src/modules/finance/finance-config.css','apps/web/src/modules/reports/reports.css','apps/web/src/modules/tasks/tasks.css','apps/web/src/modules/agenda/agenda.css','apps/web/src/modules/settings/settings.css','apps/web/src/modules/settings/settings-responsive.css','apps/web/src/modules/settings/settings-layout.css','apps/web/src/modules/marketing/marketing-refinement.css','apps/web/src/modules/marketing/marketing-overview-refinement.css','apps/web/src/modules/finance/invoices-chrome.css','apps/web/src/styles/crm-ui-standard.css']) assert(existsSync(resolve(root, css)), `Missing stylesheet: ${css}`);
for (const file of ['apps/web/src/modules/contracts/contractTypes.ts','apps/web/src/modules/contracts/contractSessionStore.ts','apps/web/src/modules/contracts/contractTemplateEngine.ts','apps/web/src/modules/contracts/ContractEditorModal.tsx','apps/web/src/modules/contracts/ContractTemplateModal.tsx','apps/web/src/modules/contracts/ContractViewModal.tsx','apps/web/src/modules/contracts/ContractDocumentPreview.tsx','apps/web/src/mocks/contracts/contracts-records.dev.json','apps/web/src/mocks/finance/config.dev.json','apps/web/src/mocks/settings/settings.dev.json','apps/web/src/modules/settings/mocks/settingsMockProvider.ts']) assert(existsSync(resolve(root,file)),`Missing canonical implementation/mock file: ${file}`);

if (failures.length) {
  console.error('Visa Fácil website/CRM/CMS contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Visa Fácil website/CRM/CMS contract validation passed.');
