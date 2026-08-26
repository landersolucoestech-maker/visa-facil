const configuredMockFlag = typeof import.meta.env === 'object' ? import.meta.env.VITE_CRM_MOCKS : undefined;

// Mock fixtures remain enabled by default while this repository is operating as a frontend prototype.
// Set VITE_CRM_MOCKS=false to disable every centralized mock dataset in one place.
export const MOCK_DATA_ENABLED = configuredMockFlag !== 'false';

export function isMockDataEnabled() {
  return MOCK_DATA_ENABLED;
}
