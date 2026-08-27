import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const read=(path)=>readFileSync(resolve(root,path),'utf8');
const readme=read('README.md');
const architecture=read('docs/ARCHITECTURE.md');
const readiness=read('docs/PRODUCTION_READINESS.md');
const integrations=read('docs/INTEGRATIONS.md');

const documents=[readme,architecture,readiness,integrations];

test('documentation keeps Meta and Google as unified technical providers',()=>{
  assert.ok(readme.includes('Facebook, Instagram, Messenger e Meta Ads são produtos/canais internos do provider técnico Meta'));
  assert.ok(readme.includes('YouTube, Google Ads e Google Calendar são serviços internos do provider técnico Google'));
  assert.ok(architecture.includes('`meta` — provider único para Facebook, Instagram, Messenger e Meta Ads'));
  assert.ok(architecture.includes('`google` — provider único para YouTube, Google Ads e Google Calendar'));
  assert.ok(readiness.includes('**Meta** é o provider técnico único de Facebook, Instagram, Messenger e Meta Ads'));
  assert.ok(readiness.includes('**Google** é o provider técnico único de YouTube, Google Ads e Google Calendar'));
});

test('documentation never restores Resend as a browser-connectable integration',()=>{
  for(const source of documents){
    assert.equal(source.includes('Resend, Autentique, NFS-e, Instagram, Facebook, YouTube, TikTok, Google Ads e Google Calendar'),false);
  }
  assert.ok(readme.includes('Resend é infraestrutura interna/server-side'));
  assert.ok(architecture.includes('Resend é infraestrutura interna exclusivamente server-side'));
  assert.ok(readiness.includes('**Resend** permanece infraestrutura interna exclusivamente server-side'));
  assert.ok(integrations.includes('Resend é infraestrutura interna/server-side'));
});

test('reports documentation remains XLSX-only and does not regress to CSV templates',()=>{
  assert.ok(readme.includes('importação/exportação exclusivamente XLSX'));
  assert.ok(architecture.includes('Relatórios opera exclusivamente com arquivos `.xlsx`'));
  assert.ok(readiness.includes('Relatórios | XLSX operacional/configuração no navegador'));
  assert.equal(architecture.includes('Templates CSV'),false);
  assert.equal(architecture.includes('Templates CSV e validação estrutural'),false);
});

test('production readiness distinguishes existing browser smoke from future complete E2E coverage',()=>{
  assert.ok(readiness.includes('renderização/interações selecionadas das rotas críticas do frontend em navegador headless'));
  assert.ok(readiness.includes('testes E2E completos de fluxos críticos ponta a ponta, além do smoke de interação já existente'));
  assert.ok(readme.includes('smoke de interação/renderização das rotas críticas do CRM em navegador headless'));
});
