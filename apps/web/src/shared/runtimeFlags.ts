export const MOCK_DATA_ENABLED = import.meta.env.DEV && import.meta.env.VITE_CRM_MOCKS === 'true';

export function isMockDataEnabled() {
  return MOCK_DATA_ENABLED;
}
