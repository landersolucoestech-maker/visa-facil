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
const heroSlides = read('apps/web/src/modules/public-site/content/heroSlides.ts');
const contact = read('apps/web/src/modules/public-site/components/ContactSection.tsx');
const footer = read('apps/web/src/modules/public-site/components/PublicFooter.tsx');
const interactions = read('apps/web/src/modules/public-site/usePublicSiteInteractions.ts');
const allSource = [main, rootApp, publicPage, header, hero, heroSlides, contact, footer, interactions].join('\n');

assert(rootApp.includes('<PublicSitePage />'), 'Root application must render the public website');
assert(!rootApp.includes('ManagementApp') && !rootApp.includes("'/app'"), 'Internal management application must not return');
assert(!main.includes('/management/') && !main.includes('/clients/') && !main.includes('/processes/'), 'Internal system styles must not be loaded');
assert(!allSource.includes('dangerouslySetInnerHTML'), 'dangerouslySetInnerHTML is forbidden');
assert(!allSource.includes('<iframe'), 'iframe embedding is forbidden');
assert(main.includes("01-base.css") && main.includes("02-sections-responsive.css") && main.includes("03-hero-v3.css"), 'Official public style cascade must remain loaded');

assert(containsAll(indexHtml, ['<html lang="pt-BR">', '<title>VISA FÁCIL | Assessoria para Vistos Internacionais</title>', '<meta name="theme-color" content="#0D1B3D"']), 'Official metadata changed unexpectedly');
assert(containsAll(header, ['EUA', 'Canadá', 'Vistos', 'Como Funciona', 'Dúvidas', 'Analisar meu perfil']), 'Public navigation changed unexpectedly');
assert(hero.includes('HERO_SLIDES.map') && hero.includes('data-hero-slide') && hero.includes('data-hero-dot'), 'Hero must render dynamically from editable slides');
assert(heroSlides.includes('export const HERO_SLIDES') && heroSlides.includes('heroVisaFacil'), 'Editable hero slide configuration is missing');
assert(existsSync(resolve(root, 'apps/web/src/modules/public-site/content/heroSlides.ts')), 'Hero slide configuration file is missing');
assert(existsSync(resolve(root, 'apps/web/src/modules/public-site/assets/hero-visa-facil.webp')), 'Official hero artwork is missing');
assert(containsAll(hero, ['O caminho mais fácil', 'para o seu visto', 'começa aqui.', 'Analisar meu perfil', 'Conhecer os serviços']), 'Hero commercial content changed unexpectedly');
assert(interactions.includes('6000'), 'Hero autoplay interval must remain 6000 ms');
assert(interactions.includes('IntersectionObserver'), 'Reveal behavior must remain active');
assert(containsAll(contact, ['Nome completo', 'WhatsApp', 'E-mail', 'Enviar para análise', 'data-form']), 'Lead capture form changed unexpectedly');
assert(containsAll(footer, ['Instagram', 'Facebook', 'TikTok', '© 2026 VISA FÁCIL']), 'Footer/social contract changed unexpectedly');
assert(!footer.toLowerCase().includes('youtube'), 'YouTube must remain removed');

for (const css of ['apps/web/src/modules/public-site/styles/01-base.css','apps/web/src/modules/public-site/styles/02-sections-responsive.css','apps/web/src/modules/public-site/styles/03-hero-v3.css']) assert(existsSync(resolve(root, css)), `Missing public stylesheet: ${css}`);

if (failures.length) {
  console.error('Visa Fácil public-site contract validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Visa Fácil public-site contract validation passed.');
