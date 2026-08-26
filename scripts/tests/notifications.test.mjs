import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('global notification helper reuses the existing disabled bell and anchors its panel to that button', () => {
  const rootApplication = read('apps/web/src/RootApplication.tsx');
  const helper = read('apps/web/src/components/GlobalNotificationFallback.tsx');
  const styles = read('apps/web/src/components/global-notification-fallback.css');

  assert.ok(rootApplication.includes("accountSurface==='crm'&&<GlobalNotificationFallback/>"));
  for (const token of [
    'target.disabled = false',
    "target.addEventListener('click', toggle)",
    'target.getBoundingClientRect()',
    'rect.right - width',
    'rect.bottom + PANEL_GAP',
    'style={{ top: panelPosition.top, left: panelPosition.left, width: panelPosition.width }}',
    'document.body',
    "window.addEventListener('resize', updatePosition)",
    "window.addEventListener('scroll', updatePosition, true)",
    "event.key === 'Escape'",
    'MutationObserver',
  ]) {
    assert.ok(helper.includes(token), `missing ${token}`);
  }
  assert.ok(styles.includes('position:fixed'));
  assert.ok(!styles.includes('right:0'));
  assert.ok(!helper.includes('function BellIcon'));
  assert.ok(!helper.includes('global-notification-menu__trigger'));
  assert.ok(!helper.includes("document.createElement('div')"));
  assert.ok(!helper.includes('button.hidden = true'));
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

test('legacy disabled placeholders are enhanced in place without adding notification controls to pages that have none', () => {
  const files = [
    'apps/web/src/modules/crm/CrmDashboardApp.tsx',
    'apps/web/src/modules/crm/CrmApp.tsx',
    'apps/web/src/modules/contracts/ContractsApp.tsx',
  ];
  const helper = read('apps/web/src/components/GlobalNotificationFallback.tsx');
  assert.ok(helper.includes('const disabledButton = buttons.find((button) => button.disabled && !button.hidden)'));
  assert.ok(helper.includes('setTarget(disabledButton)'));
  assert.ok(helper.includes('if (!target || !open || !panelPosition) return null'));
  for (const file of files) {
    const source = read(file);
    assert.ok(source.includes('BellIcon') || source.includes('NotificationBell'), `${file} must retain its original notification button`);
  }
});
