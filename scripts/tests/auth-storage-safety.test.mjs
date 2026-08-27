import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const auth=readFileSync(resolve(root,'apps/web/src/modules/auth/auth.ts'),'utf8');
const login=readFileSync(resolve(root,'apps/web/src/modules/auth/LoginApp.tsx'),'utf8');
const menu=readFileSync(resolve(root,'apps/web/src/components/AccountMenu.tsx'),'utf8');
const rootApp=readFileSync(resolve(root,'apps/web/src/RootApplication.tsx'),'utf8');

test('authentication remains explicitly disabled and cannot fabricate a session',()=>{
  assert.ok(auth.includes('export const AUTHENTICATION_ENABLED = false'));
  assert.ok(auth.includes("export const AUTH_PROVIDER = 'disabled'"));
  assert.ok(auth.includes('A autenticação está desativada neste ambiente.'));
  assert.ok(auth.includes('Nenhum provedor de autenticação real está configurado.'));
  assert.equal(auth.includes('AUTHENTICATION_ENABLED = true'),false);
});

test('auth storage reads and cleanup tolerate restricted browser storage',()=>{
  assert.ok(auth.includes("function getStorage(kind:StorageKind):Storage|null"));
  assert.ok(auth.includes("return readSession(getStorage('session')) || readSession(getStorage('local'))"));
  assert.ok(auth.includes("for(const store of [getStorage('session'),getStorage('local')])"));
  assert.ok(auth.includes('try{store.removeItem(SESSION_KEY)}catch{}'));
  assert.equal(auth.includes('sessionStorage.removeItem(SESSION_KEY)'),false);
  assert.equal(auth.includes('localStorage.removeItem(SESSION_KEY)'),false);
});

test('disabled authentication keeps credential UI disabled and internal access routed directly',()=>{
  assert.ok(login.includes('const disabled=!AUTHENTICATION_ENABLED'));
  assert.ok(login.includes('Nenhum provedor de autenticação real está conectado neste ambiente.'));
  assert.ok(rootApp.includes("if(!AUTHENTICATION_ENABLED){replacePath('/workspaces');return internal(<WorkspaceSelectorApp/>,'workspace')}"));
});

test('account menu logout remains navigable with authentication disabled',()=>{
  assert.ok(menu.includes('signOut();'));
  assert.ok(menu.includes("go(AUTHENTICATION_ENABLED ? '/login' : '/workspaces')"));
  assert.ok(menu.includes("const detail = AUTHENTICATION_ENABLED ? (session?.email || 'Conta interna') : 'Autenticação desativada'"));
});
