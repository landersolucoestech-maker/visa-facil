import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_FINANCE_CATEGORIES,
  DEFAULT_FINANCE_RULES,
  applyFinanceRulesWithConfig,
  getFinanceCategories,
} from '../../apps/web/src/modules/finance/financeConfigStore.ts';

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
  assert.equal(classified.category, 'Taxas consulares');
  assert.equal(DEFAULT_FINANCE_CATEGORIES.find((category) => category.name === classified.category)?.type, 'Despesa');
});

test('inactive finance rules are ignored', () => {
  const rules = DEFAULT_FINANCE_RULES.map((rule) => ({ ...rule, active: false }));
  const classified = applyFinanceRulesWithConfig(baseRecord, DEFAULT_FINANCE_CATEGORIES, rules);
  assert.equal(classified.category, 'Taxas consulares');
});
