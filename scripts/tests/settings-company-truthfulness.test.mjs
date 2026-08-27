import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source=readFileSync(resolve(process.cwd(),'apps/web/src/modules/settings/CompanyAutomationTabs.tsx'),'utf8');

test('company settings never advertise the unimplemented public registration route',()=>{
 assert.equal(source.includes('/cadastro/'),false);
 assert.equal(source.includes('Link de cadastro:'),false);
 assert.ok(source.includes('Identificador da organização'));
 assert.ok(source.includes('A rota pública de cadastro por organização ainda não existe neste protótipo.'));
});
