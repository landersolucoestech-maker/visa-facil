import mockData from './marketing.dev.json';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';

export function getMarketingMockFixture(): unknown {
  return isMockDataEnabled() ? structuredClone(mockData) : {};
}
