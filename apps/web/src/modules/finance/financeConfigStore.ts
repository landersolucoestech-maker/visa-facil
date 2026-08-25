import type { FinanceRecord, FinanceType } from './types';

export type FinanceCategory = { id: string; name: string; type: FinanceType; active: boolean };
export type FinanceRule = { id: string; contains: string; category: string; type: FinanceType; active: boolean };

const CATEGORY_KEY = 'visa-facil.finance.categories.v1';
const RULE_KEY = 'visa-facil.finance.rules.v1';

export const DEFAULT_FINANCE_CATEGORIES: FinanceCategory[] = [
  { id: 'cat-1', name: 'Assessoria', type: 'Receita', active: true },
  { id: 'cat-2', name: 'Renovação', type: 'Receita', active: true },
  { id: 'cat-3', name: 'Taxas consulares', type: 'Despesa', active: true },
  { id: 'cat-4', name: 'Serviços terceiros', type: 'Despesa', active: true },
  { id: 'cat-5', name: 'Marketing', type: 'Despesa', active: true },
  { id: 'cat-6', name: 'Outros', type: 'Despesa', active: true },
];

export const DEFAULT_FINANCE_RULES: FinanceRule[] = [
  { id: 'rule-1', contains: 'META ADS', category: 'Marketing', type: 'Despesa', active: true },
  { id: 'rule-2', contains: 'CONSULADO', category: 'Taxas consulares', type: 'Despesa', active: true },
  { id: 'rule-3', contains: 'VISA FACIL', category: 'Assessoria', type: 'Receita', active: true },
];

function isType(value: unknown): value is FinanceType { return value === 'Receita' || value === 'Despesa'; }
function isCategory(value: unknown): value is FinanceCategory {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.name === 'string' && item.name.trim().length > 0 && isType(item.type) && typeof item.active === 'boolean';
}
function isRule(value: unknown): value is FinanceRule {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.contains === 'string' && item.contains.trim().length > 0 && typeof item.category === 'string' && item.category.trim().length > 0 && isType(item.type) && typeof item.active === 'boolean';
}
function read<T>(key: string, validate: (value: unknown) => value is T, fallback: T): T {
  if (typeof sessionStorage === 'undefined') return structuredClone(fallback);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}
function isCategoryList(value: unknown): value is FinanceCategory[] { return Array.isArray(value) && value.every(isCategory); }
function isRuleList(value: unknown): value is FinanceRule[] { return Array.isArray(value) && value.every(isRule); }
function write<T>(key: string, value: T) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function getFinanceCategories(): FinanceCategory[] { return read(CATEGORY_KEY, isCategoryList, DEFAULT_FINANCE_CATEGORIES); }
export function saveFinanceCategories(categories: FinanceCategory[]) { write(CATEGORY_KEY, categories.filter(isCategory)); }
export function getFinanceRules(): FinanceRule[] { return read(RULE_KEY, isRuleList, DEFAULT_FINANCE_RULES); }
export function saveFinanceRules(rules: FinanceRule[]) { write(RULE_KEY, rules.filter(isRule)); }

export function activeFinanceCategories(type?: FinanceType) {
  return getFinanceCategories().filter((category) => category.active && (!type || category.type === type));
}

export function applyFinanceRulesWithConfig(record: FinanceRecord, categories: FinanceCategory[], rules: FinanceRule[]): FinanceRecord {
  const compatibleCategories = categories.filter((category) => category.active && category.type === record.type);
  const categoryNames = new Set(compatibleCategories.map((category) => category.name));
  const normalizedDescription = record.description.toLocaleUpperCase('pt-BR');
  const rule = rules.find((candidate) => candidate.active && candidate.type === record.type && categoryNames.has(candidate.category) && normalizedDescription.includes(candidate.contains.trim().toLocaleUpperCase('pt-BR')));
  if (rule) return { ...record, category: rule.category };
  if (categoryNames.has(record.category)) return record;
  const fallback = compatibleCategories.find((category) => category.name === 'Outros') ?? compatibleCategories[0];
  return fallback ? { ...record, category: fallback.name } : record;
}

export function applyFinanceRules(record: FinanceRecord): FinanceRecord {
  return applyFinanceRulesWithConfig(record, getFinanceCategories(), getFinanceRules());
}
