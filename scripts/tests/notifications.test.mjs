import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('CRM renders a clickable notification fallback when a page has no functional notification button', () => {
  const rootApplication = read('apps/web/src/RootApplication.tsx');
  const fallback = read('apps/web/src/components/GlobalNotificationFallback.tsx');

  assert.ok(rootApplication.includes("accountSurface==='crm'&&<GlobalNotificationFallback/>"));
  for (const token of ['aria-expanded={open}', 'onClick={() => setOpen((current) => !current)}', "event.key === 'Escape'", 'MutationObserver', 'button.disabled', 'button.hidden = true']) {
    assert.ok(fallback.includes(token), `missing ${token}`);
  }
  assert.ok(fallback.includes("label.includes('notifica') || label.includes('alerta')"));
  assert.ok(fallback.includes("actions.className = 'crm-topbar-actions global-notification-host'"));
});

test('existing domain notification buttons remain interactive', () => {
  const files = [
    'apps/web/src/modules/tasks/TasksApp.tsx',
    'apps/web/src/modules/agenda/AgendaApp.tsx',
    'apps/web/src/modules/attendance/AttendanceApp.tsx',
    'apps/web/src/modules/finance/FinanceTransactionsApp.tsx',
    'apps/web/src/modules/finance/FinanceInvoicesWorkspace.tsx',
    'apps/web/src/modules/finance/FinancePLApp.tsx',
    'apps/web/src/modules/marketing/MarketingApp.tsx',
    'apps/web/src/modules/reports/ReportsApp.tsx',
    'apps/web/src/modules/settings/SettingsApp.tsx',
  ];

  for (const file of files) {
    const source = read(file);
    assert.ok(source.includes('aria-expanded='), `${file} must expose notification expanded state`);
    assert.ok(source.includes('onClick='), `${file} must keep notification click behavior`);
  }
});

test('legacy disabled notification placeholders are covered by the global fallback', () => {
  const files = [
    'apps/web/src/modules/crm/CrmDashboardApp.tsx',
    'apps/web/src/modules/crm/CrmApp.tsx',
    'apps/web/src/modules/contracts/ContractsApp.tsx',
  ];
  const fallback = read('apps/web/src/components/GlobalNotificationFallback.tsx');
  assert.ok(fallback.includes('const disabledButtons = existingButtons.filter((button) => button.disabled)'));
  for (const file of files) {
    const source = read(file);
    assert.ok(source.includes('BellIcon') || source.includes('NotificationBell'), `${file} must still expose its notification placeholder for fallback replacement`);
  }
});
