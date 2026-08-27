import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const main=readFileSync(resolve(root,'apps/web/src/main.tsx'),'utf8');
const boundary=readFileSync(resolve(root,'apps/web/src/components/GlobalErrorBoundary.tsx'),'utf8');

 test('application root is protected by a global error boundary',()=>{
  assert.ok(main.includes("import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'"));
  assert.ok(main.includes('<GlobalErrorBoundary>'));
  assert.ok(main.includes('<RootApplication />'));
  assert.ok(main.includes('</GlobalErrorBoundary>'));
 });

test('recovery boundary does not expose stack traces in production UI',()=>{
  assert.ok(boundary.includes('static getDerivedStateFromError'));
  assert.ok(boundary.includes("if(import.meta.env.DEV)console.error"));
  assert.ok(boundary.includes('Não foi possível carregar esta área.'));
  assert.ok(boundary.includes('Seus dados locais não serão apagados por esta tela.'));
  assert.ok(boundary.includes('Tentar novamente'));
  assert.ok(boundary.includes('Voltar aos workspaces'));
  assert.equal(boundary.includes('{error.message}'),false);
  assert.equal(boundary.includes('{error.stack}'),false);
});
