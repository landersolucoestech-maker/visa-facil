import raw from '../../../mocks/finance/config.dev.json';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';
import type { FinanceCategory, FinanceRule } from '../financeConfigStore';

function clone<T>(value:T):T{return structuredClone(value)}

export function getFinanceCategoryMocks():FinanceCategory[]{
 if(!isMockDataEnabled())return[];
 return clone(raw.categories) as FinanceCategory[];
}

export function getFinanceRuleMocks():FinanceRule[]{
 if(!isMockDataEnabled())return[];
 return clone(raw.rules) as FinanceRule[];
}
