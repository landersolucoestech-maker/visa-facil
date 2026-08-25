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
function normalizeName(value: string) { return value.trim().toLocaleLowerCase('pt-BR'); }
function normalizeContains(value: string) { return value.trim().toLocaleUpperCase('pt-BR'); }
function isCategory(value: unknown): value is FinanceCategory {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && item.id.trim().length > 0 && typeof item.name === 'string' && item.name.trim().length > 0 && isType(item.type) && typeof item.active === 'boolean';
}
function isRule(value: unknown): value is FinanceRule {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && item.id.trim().length > 0 && typeof item.contains === 'string' && item.contains.trim().length > 0 && typeof item.category === 'string' && item.category.trim().length > 0 && isType(item.type) && typeof item.active === 'boolean';
}
function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}
function sanitizeCategories(categories: FinanceCategory[]) {
  return uniqueBy(
    uniqueBy(categories.filter(isCategory).map((category) => ({ ...category, id: category.id.trim(), name: category.name.trim() })), (category) => category.id),
    (category) => normalizeName(category.name),
  );
}
function sanitizeRules(rules: FinanceRule[], categories: FinanceCategory[]) {
  const validCategoryKeys = new Set(categories.map((category) => `${category.type}::${normalizeName(category.name)}`));
  const compatible = rules.filter(isRule).map((rule) => ({ ...rule, id: rule.id.trim(), contains: rule.contains.trim(), category: rule.category.trim() })).filter((rule) => validCategoryKeys.has(`${rule.type}::${normalizeName(rule.category)}`));
  return uniqueBy(uniqueBy(compatible, (rule) => rule.id), (rule) => `${rule.type}::${normalizeContains(rule.contains)}`);
}
function isCategoryList(value: unknown): value is FinanceCategory[] {
  if (!Array.isArray(value) || !value.every(isCategory)) return false;
  return sanitizeCategories(value).length === value.length;
}
function isRuleList(value: unknown): value is FinanceRule[] {
  if (!Array.isArray(value) || !value.every(isRule)) return false;
  const ids = new Set(value.map((rule) => rule.id.trim()));
  const signatures = new Set(value.map((rule) => `${rule.type}::${normalizeContains(rule.contains)}`));
  return ids.size === value.length && signatures.size === value.length;
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
function write<T>(key: string, value: T) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function getFinanceCategories(): FinanceCategory[] {
  return sanitizeCategories(read(CATEGORY_KEY, isCategoryList, DEFAULT_FINANCE_CATEGORIES));
}

export function getFinanceRules(): FinanceRule[] {
  return sanitizeRules(read(RULE_KEY, isRuleList, DEFAULT_FINANCE_RULES), getFinanceCategories());
}

export function saveFinanceCategories(categories: FinanceCategory[]) {
  const previous = getFinanceCategories();
  const next = sanitizeCategories(categories);
  const previousRules = read(RULE_KEY, isRuleList, DEFAULT_FINANCE_RULES);
  const previousCategoryByReference = new Map(previous.map((category) => [`${category.type}::${normalizeName(category.name)}`, category]));
  const nextCategoryById = new Map(next.map((category) => [category.id, category]));

  const migratedRules = previousRules.flatMap((rule) => {
    const previousCategory = previousCategoryByReference.get(`${rule.type}::${normalizeName(rule.category)}`);
    if (!previousCategory) return [rule];
    const nextCategory = nextCategoryById.get(previousCategory.id);
    if (!nextCategory) return [];
    return [{ ...rule, category: nextCategory.name, type: nextCategory.type }];
  });

  write(CATEGORY_KEY, next);
  write(RULE_KEY, sanitizeRules(migratedRules, next));
}

export function saveFinanceRules(rules: FinanceRule[]) {
  write(RULE_KEY, sanitizeRules(rules, getFinanceCategories()));
}

export function activeFinanceCategories(type?: FinanceType) {
  return getFinanceCategories().filter((category) => category.active && (!type || category.type === type));
}

export function applyFinanceRulesWithConfig(record: FinanceRecord, categories: FinanceCategory[], rules: FinanceRule[]): FinanceRecord {
  const compatibleCategories = sanitizeCategories(categories).filter((category) => category.active && category.type === record.type);
  const categoryNames = new Set(compatibleCategories.map((category) => category.name));
  const normalizedDescription = record.description.toLocaleUpperCase('pt-BR');
  const rule = sanitizeRules(rules, categories).find((candidate) => candidate.active && candidate.type === record.type && categoryNames.has(candidate.category) && normalizedDescription.includes(normalizeContains(candidate.contains)));
  if (rule) return { ...record, category: rule.category };
  if (categoryNames.has(record.category)) return record;
  const fallback = compatibleCategories.find((category) => category.name === 'Outros') ?? compatibleCategories[0];
  return fallback ? { ...record, category: fallback.name } : record;
}

export function applyFinanceRules(record: FinanceRecord): FinanceRecord {
  return applyFinanceRulesWithConfig(record, getFinanceCategories(), getFinanceRules());
}
