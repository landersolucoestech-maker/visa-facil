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
const crmMockData = read('apps/web/src/modules/crm/mocks/crm-records.dev.json');
const allSource = [main, rootApp, publicPage, header, hero, contact, footer, interactions, schema, schemaGlobal, schemaConversion, schemaEditorial, store, cmsDocumentContract].join('\n');
const crmSource = [crm, crmTypes, crmMockProvider, crmMockData].join('\n');

assert(rootApp.includes('<PublicSitePage/>') || rootApp.includes('<PublicSitePage />'), 'Root application must retain the public website');
assert(containsAll(rootApp, ["path==='/crm'", '<CrmDashboardApp/>', "path==='/crm/relacionamento'", '<CrmApp/>']), 'Dashboard and relationship routes must remain explicit and separate');
assert(containsAll(rootApp, ["path==='/crm/contratos'", '<ContractsApp/>']), 'Contracts route must remain explicit and lazy-loaded');
assert(containsAll(rootApp, ["path==='/login'", "path==='/workspaces'", "path==='/site-admin'", '<LoginApp/>', '<WorkspaceSelectorApp/>', '<SiteCmsApp/>']), 'Authentication/workspace/CMS routes are incomplete');
assert(rootApp.includes('lazy(') && rootApp.includes('Suspense'), 'Internal workspaces must remain lazy-loaded');
assert(!rootApp.includes('ManagementApp') && !rootApp.includes("'/app'"), 'Obsolete internal management application must not return');
assert(!allSource.includes('dangerouslySetInnerHTML'), 'dangerouslySetInnerHTML is forbidden');
assert(!allSource.includes('<iframe'), 'iframe embedding is forbidden');
assert(main.includes("01-base.css") && main.includes("02-sections-responsive.css") && main.includes("03-hero-v3.css"), 'Official public style cascade must remain loaded');
assert(!main.includes('/crm/') && !main.includes('styles/finance') && !main.includes('styles/marketing') && !main.includes('styles/settings'), 'Public entrypoint must not eagerly load internal workspace styles');
assert(containsAll(crmSidebar, ["../modules/crm/crm.css", "../styles/ui-system.css", "../styles/product-refinement.css", "../styles/sidebar-v2.css", "../styles/crm-header-actions-unified.css"]), 'Shared CRM styles must remain owned by the lazy CRM shell');
assert(containsAll(rootApp, ['agenda-refinement.css', 'visachat-refinement.css', 'tasks-refinement.css', 'finance-transactions-refinement.css', 'invoices-refinement.css', 'accounting-refinement.css', 'marketing-refinement.css', 'reports-refinement.css', 'settings-refinement.css']), 'Module refinement styles must remain route-lazy instead of returning to the public entrypoint');

assert(containsAll(indexHtml, ['<html lang="pt-BR">', '<title>VISA FÁCIL | Assessoria para Vistos Internacionais</title>', '<meta name="theme-color" content="#0D1B3D"']), 'Official metadata changed unexpectedly');
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

for (const forbidden of ['Pessoa Jurídica', 'personType', 'CNPJ', 'cnpj', 'legalName', 'tradeName', 'contactPerson', 'isCompany']) {
  assert(!crmSource.includes(forbidden), `CRM must remain person-only; forbidden company field/logic found: ${forbidden}`);
}

for (const css of ['apps/web/src/modules/public-site/styles/01-base.css','apps/web/src/modules/public-site/styles/02-sections-responsive.css','apps/web/src/modules/public-site/styles/03-hero-v3.css','apps/web/src/modules/crm/crm.css','apps/web/src/modules/site-cms/site-cms-base.css','apps/web/src/modules/contracts/contracts.css']) assert(existsSync(resolve(root, css)), `Missing stylesheet: ${css}`);

if (failures.length) {
  console.error('Visa Fácil website/CRM/CMS contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Visa Fácil website/CRM/CMS contract validation passed.');
