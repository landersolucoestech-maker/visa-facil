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
const schema = read('apps/web/src/modules/site-cms/siteSchema.ts');
const schemaGlobal = read('apps/web/src/modules/site-cms/siteSchemaGlobal.ts');
const schemaConversion = read('apps/web/src/modules/site-cms/siteSchemaConversion.ts');
const schemaEditorial = read('apps/web/src/modules/site-cms/siteSchemaEditorial.ts');
const store = read('apps/web/src/modules/site-cms/siteStore.ts');
const crm = read('apps/web/src/modules/crm/CrmApp.tsx');
const crmMockProvider = read('apps/web/src/modules/crm/mocks/mockDataProvider.ts');
const crmMockData = read('apps/web/src/modules/crm/mocks/crm-records.dev.json');
const allSource = [main, rootApp, publicPage, header, hero, contact, footer, interactions, schema, schemaGlobal, schemaConversion, schemaEditorial, store].join('\n');
const crmSource = [crm, crmMockProvider, crmMockData].join('\n');

assert(rootApp.includes('<PublicSitePage />'), 'Root application must retain the public website');
assert(rootApp.includes("path === '/crm'") && rootApp.includes('<CrmApp />'), 'CRM prototype must remain isolated under /crm/*');
assert(containsAll(rootApp, ["path==='/login'", "path==='/workspaces'", "path==='/site-admin'", '<LoginApp/>', '<WorkspaceSelectorApp/>', '<SiteCmsApp/>']), 'Authentication/workspace/CMS routes are incomplete');
assert(!rootApp.includes('ManagementApp') && !rootApp.includes("'/app'"), 'Obsolete internal management application must not return');
assert(!allSource.includes('dangerouslySetInnerHTML'), 'dangerouslySetInnerHTML is forbidden');
assert(!allSource.includes('<iframe'), 'iframe embedding is forbidden');
assert(main.includes("01-base.css") && main.includes("02-sections-responsive.css") && main.includes("03-hero-v3.css"), 'Official public style cascade must remain loaded');
assert(main.includes("./modules/crm/crm.css"), 'CRM stylesheet must remain loaded');

assert(containsAll(indexHtml, ['<html lang="pt-BR">', '<title>VISA FÁCIL | Assessoria para Vistos Internacionais</title>', '<meta name="theme-color" content="#0D1B3D"']), 'Official metadata changed unexpectedly');
assert(containsAll(schemaGlobal, ['EUA', 'Canadá', 'Vistos', 'Como Funciona', 'Dúvidas', 'Analisar meu perfil']), 'CMS default navigation changed unexpectedly');
assert(containsAll(hero, ['cmsList(values.slides)', 'slides.map', 'data-hero-slide', 'data-hero-dot']) && schemaConversion.includes("repeater('slides','Banners'"), 'Hero must render dynamically from CMS-editable slides');
assert(existsSync(resolve(root, 'apps/web/src/modules/public-site/assets/hero-visa-facil.webp')), 'Official hero artwork is missing');
assert(containsAll(schemaConversion, ['O caminho mais fácil', 'para o seu visto', 'começa aqui.', 'Analisar meu perfil', 'Conhecer os serviços']), 'Hero commercial defaults changed unexpectedly');
assert(interactions.includes('6000'), 'Hero autoplay interval must remain 6000 ms');
assert(interactions.includes('IntersectionObserver'), 'Reveal behavior must remain active');
assert(contact.includes('data-form') && containsAll(schemaEditorial, ['Nome completo', 'WhatsApp', 'E-mail', 'Enviar para análise']), 'CMS-driven lead capture form changed unexpectedly');
assert(containsAll(schemaGlobal, ['Instagram', 'Facebook', 'TikTok', '© 2026 VISA FÁCIL']), 'CMS footer/social defaults changed unexpectedly');
assert(!schemaGlobal.toLowerCase().includes('youtube'), 'YouTube must remain removed');
assert(containsAll(publicPage, ['SiteContentProvider', 'resolvePublicDocument', 'page.sections.filter', 'page.seo.title', "ensureMeta('description')", "ensureMeta('og:image',true)"]), 'Public page must consume the CMS document and page SEO');
assert(containsAll(store, ['DRAFT_KEY', 'PUBLISHED_KEY', 'loadDraft', 'loadPublished', 'publishDraft']), 'Draft/published CMS storage contract is incomplete');
assert(containsAll(schema, ['PAGE_SECTION_TYPES', 'GLOBAL_SECTION_TYPES', 'createInitialCmsDocument', 'createSectionFromType']), 'Dynamic CMS schema contract is incomplete');

assert(containsAll(crm, ['Dashboard', 'Contatos', 'Leads', 'Oportunidades', 'Atendimentos', 'Tarefas', 'Agenda', 'Financeiro', 'Relatórios', 'Configurações']), 'CRM shell navigation is incomplete');
assert(containsAll(crm, ['Leads por status', 'Origem dos leads', 'Financeiro (Resumo)', 'Atendimentos recentes', 'Tarefas pendentes']), 'CRM dashboard blocks are incomplete');
assert(crm.includes('import.meta.env.BASE_URL'), 'CRM must support subdirectory hosting');
assert(containsAll(crm, ['cpf: string', 'rg: string', 'passportNumber: string', 'label="CPF"', 'label="RG"', 'label="Número do passaporte"', 'value={record.cpf}', 'value={record.rg}', 'value={record.passportNumber}']), 'CRM create/edit/view flows must include CPF, RG and passport number');
assert(containsAll(crmMockProvider, ['cpf: raw.cpf', 'rg: raw.rg', 'passportNumber: raw.passportNumber']), 'CRM mock provider must support personal document fields');

for (const forbidden of ['Pessoa Jurídica', 'personType', 'CNPJ', 'cnpj', 'legalName', 'tradeName', 'contactPerson', 'isCompany']) {
  assert(!crmSource.includes(forbidden), `CRM must remain person-only; forbidden company field/logic found: ${forbidden}`);
}

for (const css of ['apps/web/src/modules/public-site/styles/01-base.css','apps/web/src/modules/public-site/styles/02-sections-responsive.css','apps/web/src/modules/public-site/styles/03-hero-v3.css','apps/web/src/modules/crm/crm.css','apps/web/src/modules/site-cms/site-cms-base.css']) assert(existsSync(resolve(root, css)), `Missing stylesheet: ${css}`);

if (failures.length) {
  console.error('Visa Fácil website/CRM/CMS contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Visa Fácil website/CRM/CMS contract validation passed.');
