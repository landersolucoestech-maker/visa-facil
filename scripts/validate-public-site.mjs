import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const main = read('apps/web/src/main.tsx');
const rootApp = read('apps/web/src/RootApplication.tsx');
const publicPage = read('apps/web/src/modules/public-site/pages/PublicSitePage.tsx');
const header = read('apps/web/src/modules/public-site/components/PublicHeader.tsx');
const hero = read('apps/web/src/modules/public-site/components/HeroSection.tsx');
const contact = read('apps/web/src/modules/public-site/components/ContactSection.tsx');
const footer = read('apps/web/src/modules/public-site/components/PublicFooter.tsx');
const interactions = read('apps/web/src/modules/public-site/usePublicSiteInteractions.ts');
const allSource = [main, rootApp, publicPage, header, hero, contact, footer, interactions].join('\n');

assert(rootApp.includes("path === '/app'") && rootApp.includes("path.startsWith('/app/')"), 'Management scope must remain isolated under /app/*');
assert(rootApp.includes('<PublicSitePage />'), 'Public website must remain the default root experience');
assert(!allSource.includes('dangerouslySetInnerHTML'), 'dangerouslySetInnerHTML is forbidden in the migrated public website');
assert(!allSource.includes('<iframe'), 'iframe embedding is forbidden in the migrated public website');
assert(main.includes("01-base.css") && main.includes("02-sections-responsive.css") && main.includes("03-hero-v3.css"), 'Official style cascade must be loaded in order');

for (const id of ['#eua', '#canada', '#australia', '#europa-schengen', '#processo', '#duvidas', '#diagnostico']) {
  assert(header.includes(id) || publicPage.includes(id) || allSource.includes(`id=\"${id.slice(1)}\"`), `Missing public navigation contract: ${id}`);
}

assert((hero.match(/data-hero-slide=\"\"/g) || []).length === 3, 'Hero must contain exactly three slideshow slides');
assert((hero.match(/data-hero-dot=/g) || []).length === 3, 'Hero must contain exactly three slideshow dots');
assert(interactions.includes('6000'), 'Hero autoplay interval must remain 6000 ms');
assert(interactions.includes('IntersectionObserver'), 'Reveal behavior must remain IntersectionObserver-based');
assert(interactions.includes(".accordion__item button"), 'FAQ accordion behavior is missing');
assert(contact.includes('data-form'), 'Diagnostic form contract is missing');
assert(interactions.includes('Formulário demonstrativo. Integração com CRM e WhatsApp será configurada na implementação final.'), 'Official form feedback text changed unexpectedly');
assert(footer.includes('Instagram') && footer.includes('Facebook') && footer.includes('TikTok'), 'Required social links are missing');
assert(!footer.toLowerCase().includes('youtube'), 'YouTube must remain removed from the public footer');

for (const css of [
  'apps/web/src/modules/public-site/styles/01-base.css',
  'apps/web/src/modules/public-site/styles/02-sections-responsive.css',
  'apps/web/src/modules/public-site/styles/03-hero-v3.css',
]) {
  assert(existsSync(resolve(root, css)), `Missing migrated stylesheet: ${css}`);
}

if (failures.length) {
  console.error('Visa Fácil public-site contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Visa Fácil public-site contract validation passed.');
