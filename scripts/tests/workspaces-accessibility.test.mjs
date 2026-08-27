import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const app=readFileSync(resolve(root,'apps/web/src/modules/workspaces/WorkspaceSelectorApp.tsx'),'utf8');
const css=readFileSync(resolve(root,'apps/web/src/modules/workspaces/workspaces.css'),'utf8');

test('workspace selector uses native navigation semantics',()=>{
 assert.ok(app.includes('<nav className="workspace-grid" aria-label="Workspaces disponíveis">'));
 assert.ok(app.includes('href={workspaceHref(workspace.href)}'));
 assert.equal(app.includes('function go('),false);
 assert.equal(app.includes('<button className={`workspace-card'),false);
});

test('workspace links expose keyboard focus and reduced-motion treatment',()=>{
 assert.ok(css.includes('.workspace-brand:focus-visible,.workspace-card:focus-visible{'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce){'));
 assert.ok(css.includes('.workspace-card{transition:none}'));
});
