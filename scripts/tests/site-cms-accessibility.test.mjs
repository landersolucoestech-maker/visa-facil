import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const read=(path)=>readFileSync(resolve(root,path),'utf8');

test('Site CMS new-page dialog preserves accessible trigger and dismissal semantics',()=>{
 const source=read('apps/web/src/modules/site-cms/CmsPagesView.tsx');
 for(const token of ['aria-haspopup="dialog"','aria-controls="site-cms-new-page-dialog"','id="site-cms-new-page-dialog"','role="dialog"','aria-modal="true"','aria-labelledby={newPageTitleId}','event.key!==\'Escape\'','requestAnimationFrame(()=>newPageTriggerRef.current?.focus())','role="alert"']) assert.ok(source.includes(token),`CMS dialog contract missing ${token}`);
 assert.ok(source.includes('aria-label={`Mover ${section.label} para cima`}'));
 assert.ok(source.includes('aria-label={`Mover ${section.label} para baixo`}'));
});
