import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const webRoot = resolve(process.cwd(), 'apps/web');
const vite = await createServer({
  root: webRoot,
  logLevel: 'silent',
  server: { middlewareMode: true },
  appType: 'custom',
});

after(async () => {
  await vite.close();
});

const {
  DEFAULT_FINANCE_CATEGORIES,
  DEFAULT_FINANCE_RULES,
  applyFinanceRulesWithConfig,
  getFinanceCategories,
  getFinanceRules,
  saveFinanceCategories,
  saveFinanceRules,
} = await vite.ssrLoadModule('/src/modules/finance/financeConfigStore.ts');

const baseRecord = {
  id: 'ofx-rule-test',
  description: 'PAGAMENTO META ADS BRASIL',
  type: 'Despesa',
  category: 'Outros',
  amount: 350,
  date: '2026-08-25',
  dueDate: '2026-08-25',
  status: 'Pago',
  paymentMethod: 'OFX',
  relatedName: '',
  notes: '',
};

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

function withSessionStorage(callback) {
  const previous = globalThis.sessionStorage;
  globalThis.sessionStorage = memoryStorage();
  try { callback(); }
  finally {
    if (previous === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = previous;
  }
}

test('finance config can be read safely outside the browser', () => {
  const categories = getFinanceCategories();
  assert.deepEqual(categories, DEFAULT_FINANCE_CATEGORIES);
});

test('active finance rule classifies an OFX record into a compatible canonical category', () => {
  const classified = applyFinanceRulesWithConfig(baseRecord, DEFAULT_FINANCE_CATEGORIES, DEFAULT_FINANCE_RULES);
  assert.equal(classified.category, 'Marketing');
});

test('finance rules never assign a category from the wrong transaction type', () => {
  const incompatibleRules = [{ id: 'bad-rule', contains: 'META ADS', category: 'Assessoria', type: 'Despesa', active: true }];
  const classified = applyFinanceRulesWithConfig(baseRecord, DEFAULT_FINANCE_CATEGORIES, incompatibleRules);
  assert.equal(classified.category, 'Outros');
  assert.equal(DEFAULT_FINANCE_CATEGORIES.find((category) => category.name === classified.category)?.type, 'Despesa');
});

test('inactive finance rules are ignored', () => {
  const rules = DEFAULT_FINANCE_RULES.map((rule) => ({ ...rule, active: false }));
  const classified = applyFinanceRulesWithConfig(baseRecord, DEFAULT_FINANCE_CATEGORIES, rules);
  assert.equal(classified.category, 'Outros');
});

test('renaming a finance category migrates rules by category identity', () => withSessionStorage(() => {
  saveFinanceCategories(DEFAULT_FINANCE_CATEGORIES);
  saveFinanceRules(DEFAULT_FINANCE_RULES);
  saveFinanceCategories(DEFAULT_FINANCE_CATEGORIES.map((category) => category.id === 'cat-5' ? { ...category, name: 'Performance' } : category));
  assert.equal(getFinanceRules().find((rule) => rule.id === 'rule-1')?.category, 'Performance');
}));

test('deleting a finance category removes rules that would become orphaned', () => withSessionStorage(() => {
  saveFinanceCategories(DEFAULT_FINANCE_CATEGORIES);
  saveFinanceRules(DEFAULT_FINANCE_RULES);
  saveFinanceCategories(DEFAULT_FINANCE_CATEGORIES.filter((category) => category.id !== 'cat-5'));
  assert.equal(getFinanceRules().some((rule) => rule.id === 'rule-1'), false);
}));

test('duplicate finance categories are not persisted into the canonical configuration', () => withSessionStorage(() => {
  saveFinanceCategories([...DEFAULT_FINANCE_CATEGORIES, { ...DEFAULT_FINANCE_CATEGORIES[0], id: 'duplicate-category' }]);
  assert.equal(getFinanceCategories().length, DEFAULT_FINANCE_CATEGORIES.length);
}));

test('the same category label may exist once for Receita and once for Despesa', () => withSessionStorage(() => {
  saveFinanceCategories([
    { id: 'income-other', name: 'Outros', type: 'Receita', active: true },
    { id: 'expense-other', name: 'Outros', type: 'Despesa', active: true },
  ]);
  assert.deepEqual(getFinanceCategories().map((category) => `${category.type}:${category.name}`).sort(), ['Despesa:Outros','Receita:Outros']);
}));
