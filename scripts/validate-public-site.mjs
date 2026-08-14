import { readFileSync, existsSync } from 'node:fs';
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
const services = read('apps/web/src/modules/public-site/components/ServicesSection.tsx');
const experience = read('apps/web/src/modules/public-site/components/ExperienceSection.tsx');
const painPoints = read('apps/web/src/modules/public-site/components/PainPointsSection.tsx');
const processSection = read('apps/web/src/modules/public-site/components/ProcessSection.tsx');
const difference = read('apps/web/src/modules/public-site/components/DifferenceSection.tsx');
const faq = read('apps/web/src/modules/public-site/components/FaqSection.tsx');
const contact = read('apps/web/src/modules/public-site/components/ContactSection.tsx');
const footer = read('apps/web/src/modules/public-site/components/PublicFooter.tsx');
const interactions = read('apps/web/src/modules/public-site/usePublicSiteInteractions.ts');
const allSource = [main, rootApp, publicPage, header, hero, services, experience, painPoints, processSection, difference, faq, contact, footer, interactions].join('\n');

assert(rootApp.includes("path === '/app'") && rootApp.includes("path.startsWith('/app/')"), 'Management scope must remain isolated under /app/*');
assert(rootApp.includes('<PublicSitePage />'), 'Public website must remain the default root experience');
assert(!allSource.includes('dangerouslySetInnerHTML'), 'dangerouslySetInnerHTML is forbidden in the migrated public website');
assert(!allSource.includes('<iframe'), 'iframe embedding is forbidden in the migrated public website');
assert(main.includes("01-base.css") && main.includes("02-sections-responsive.css") && main.includes("03-hero-v3.css"), 'Official style cascade must be loaded in order');

assert(containsAll(indexHtml, [
  '<html lang="pt-BR">',
  '<title>VISA FÁCIL | Assessoria para Vistos Internacionais</title>',
  'Assessoria personalizada para vistos dos Estados Unidos, Canadá, Austrália, Europa e Schengen, com suporte em português e acompanhamento em todas as etapas.',
  '<meta name="theme-color" content="#0D1B3D"',
  'family=Montserrat:wght@400;500;600;700;800;900',
]), 'Official document metadata or typography changed unexpectedly');

assert(containsAll(header, [
  'Atendimento online para todo o Brasil',
  'Faça uma análise inicial gratuita',
  'href="#eua">EUA',
  'href="#canada">Canadá',
  'Vistos',
  'Austrália',
  'Europa e Schengen',
  'Como Funciona',
  'Dúvidas',
  'Analisar meu perfil',
]), 'Official header/navigation contract changed unexpectedly');

for (const id of ['#eua', '#canada', '#australia', '#europa-schengen', '#processo', '#duvidas', '#diagnostico']) {
  assert(header.includes(id) || publicPage.includes(id) || allSource.includes(`id=\"${id.slice(1)}\"`), `Missing public navigation contract: ${id}`);
}

assert((hero.match(/data-hero-slide=\"\"/g) || []).length === 3, 'Hero must contain exactly three slideshow slides');
assert((hero.match(/data-hero-dot=/g) || []).length === 3, 'Hero must contain exactly three slideshow dots');
assert(containsAll(hero, ['O caminho mais fácil', 'para o seu visto', 'começa aqui.']), 'Official hero headline changed unexpectedly');
assert(hero.includes('hero__content reveal'), 'Official hero reveal behavior marker is missing');
assert(containsAll(hero, ['★', '◎', '↗', '◯']), 'Official hero benefit symbols changed unexpectedly');
assert(containsAll(hero, ['Onde você estiver', 'Sem pacote genérico', 'Do visto à próxima etapa', 'Orientação em português']), 'Official confidence strip copy is incomplete');
assert(hero.includes("import heroVisaFacil from '../assets/hero-visa-facil.webp'"), 'Official first hero artwork must be a local asset');
assert(existsSync(resolve(root, 'apps/web/src/modules/public-site/assets/hero-visa-facil.webp')), 'Official first hero artwork asset is missing');

assert(containsAll(services, [
  'Uma assessoria completa para transformar planos em possibilidades reais.',
  'Análise de perfil, preenchimento do DS-160, organização documental, agendamento e preparação individual para entrevista.',
  'Visto americano', 'Visto canadense', 'Visto australiano', 'Vistos e autorizações',
  'Renovação de visto', 'Preparação para entrevista', 'Revisão de formulários',
]), 'Official services section content changed unexpectedly');

assert(containsAll(experience, [
  'Mais do que solicitar um visto: preparar cada etapa com segurança.',
  'Diagnóstico do perfil', 'Organização documental', 'Agendamentos e etapas', 'Preparação final',
  'A decisão final sobre qualquer visto pertence exclusivamente às autoridades competentes e depende da análise individual de cada solicitação.',
]), 'Official international-experience section content changed unexpectedly');

assert(containsAll(painPoints, [
  'Erros pequenos podem criar problemas grandes.',
  'Informações inconsistentes', 'Documentação insuficiente', 'Entrevista sem preparação', 'Decisões sem cronograma',
]), 'Official planning-risk section content changed unexpectedly');

assert(containsAll(processSection, [
  'Um processo claro, do primeiro contato ao próximo passo.',
  'Análise de perfil', 'Plano e documentos', 'Solicitação e agenda', 'Preparação e acompanhamento',
]), 'Official process section content changed unexpectedly');

assert(containsAll(difference, [
  'Confiança nasce de preparo, clareza e acompanhamento.',
  'Atendimento próximo', 'Escopo transparente', 'Informação responsável', 'Visão da jornada inteira',
  'Grande taxa de aceitação, com índice de aprovação de até 99%.',
]), 'Official working-style section content changed unexpectedly');

assert(containsAll(faq, [
  'Informação clara antes de qualquer contratação.',
  'A assessoria garante a aprovação do visto?',
  'Posso contratar o serviço após uma negativa?',
  'Todo o atendimento pode ser feito online?',
  'Em quanto tempo o processo fica pronto?',
]), 'Official FAQ content changed unexpectedly');

assert(interactions.includes('6000'), 'Hero autoplay interval must remain 6000 ms');
assert(interactions.includes('IntersectionObserver'), 'Reveal behavior must remain IntersectionObserver-based');
assert(interactions.includes(".accordion__item button"), 'FAQ accordion behavior is missing');

assert(containsAll(contact, [
  'Conte seu objetivo. Nós organizamos o primeiro passo.',
  'Nome completo', 'WhatsApp', 'E-mail', 'Objetivo principal', 'Conte brevemente seu caso',
  'Visto americano', 'Visto canadense', 'Visto australiano', 'Europa e Schengen', 'Renovação de visto', 'Outro objetivo',
  'Autorizo o contato e declaro que li a política de privacidade.',
  'Enviar para análise', 'data-form', 'data-form-feedback',
]), 'Official diagnostic form content changed unexpectedly');
assert(interactions.includes('Formulário demonstrativo. Integração com CRM e WhatsApp será configurada na implementação final.'), 'Official form feedback text changed unexpectedly');

assert(containsAll(footer, [
  'Assessoria especializada para vistos internacionais, com atendimento em português, processo personalizado e orientação clara em cada etapa.',
  'Instagram', 'Facebook', 'TikTok',
  'WhatsApp: preencher', 'E-mail: preencher', 'Segunda a sexta', 'Horário: preencher',
  '© 2026 VISA FÁCIL. Todos os direitos reservados.',
  'Não somos órgão consular e não garantimos decisões de autoridades públicas.',
  'Falar com a equipe',
]), 'Official footer content changed unexpectedly');
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
