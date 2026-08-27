import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const read=(path)=>readFileSync(resolve(root,path),'utf8');

test('Invoices keeps its complete canonical layout contract',()=>{
 const css=read('apps/web/src/modules/finance/invoices-chrome.css');
 for(const token of [
  '.crm-global-page .invoice-content',
  'grid-template-columns:repeat(4,minmax(0,1fr))',
  '.crm-global-page .invoice-list-card',
  '.crm-global-page .invoice-search svg',
  'width:14px!important',
  '.crm-global-page .invoice-table-head,.crm-global-page .invoice-table-row',
  '.invoice-detail-modal',
  '.invoice-refined-form,.invoice-payment-modal,.invoice-payment-picker',
 ]) assert.ok(css.includes(token),`missing invoice layout token: ${token}`);
});

test('Profile exposes the shared notification trigger and account-menu host',()=>{
 const profile=read('apps/web/src/modules/settings/ProfileApp.tsx');
 const rootApplication=read('apps/web/src/RootApplication.tsx');
 assert.ok(profile.includes('className="crm-topbar-actions"'));
 assert.ok(profile.includes('className="settings-notification-btn"'));
 assert.ok(profile.includes('aria-label="Notificações"'));
 assert.ok(profile.includes('disabled title='));
 assert.ok(rootApplication.includes("if(path==='/crm/perfil')return withSharedSidebar(<ProfileApp/>);"));
 assert.ok(rootApplication.includes("accountSurface&&<AccountMenu surface={accountSurface}/>"));
 assert.ok(rootApplication.includes("accountSurface==='crm'&&<GlobalNotificationFallback/>"));
});
