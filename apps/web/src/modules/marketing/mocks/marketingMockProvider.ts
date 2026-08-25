import mockData from './marketing.dev.json';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';

export type MarketingMockContent = {
  id: string;
  date: string;
  time: string;
  title: string;
  channel: 'Instagram' | 'Facebook' | 'TikTok' | 'YouTube' | 'X' | 'Threads';
  type: string;
  status: string;
  owner: string;
  copy: string;
};

export type MarketingMockCampaign = {
  id: string;
  name: string;
  channel: 'Meta Ads' | 'Google Ads' | 'YouTube' | 'TikTok';
  objective: string;
  status: string;
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  startDate: string;
  endDate: string;
};

export type MarketingMockFixture = {
  contents: MarketingMockContent[];
  campaigns: MarketingMockCampaign[];
};

const CONTENT_CHANNELS = new Set<MarketingMockContent['channel']>(['Instagram', 'Facebook', 'TikTok', 'YouTube', 'X', 'Threads']);
const CAMPAIGN_CHANNELS = new Set<MarketingMockCampaign['channel']>(['Meta Ads', 'Google Ads', 'YouTube', 'TikTok']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isText(value: unknown): value is string { return typeof value === 'string'; }
function isNonNegative(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0; }
function isContent(value: unknown): value is MarketingMockContent {
  if (!isObject(value)) return false;
  return typeof value.id === 'string' && value.id.trim().length > 0
    && typeof value.date === 'string' && DATE_RE.test(value.date)
    && typeof value.time === 'string' && TIME_RE.test(value.time)
    && typeof value.title === 'string' && value.title.trim().length > 0
    && typeof value.channel === 'string' && CONTENT_CHANNELS.has(value.channel as MarketingMockContent['channel'])
    && isText(value.type)
    && isText(value.status)
    && isText(value.owner)
    && isText(value.copy);
}
function isCampaign(value: unknown): value is MarketingMockCampaign {
  if (!isObject(value)) return false;
  if (!isNonNegative(value.budget) || value.budget <= 0 || !isNonNegative(value.spent) || value.spent > value.budget || !isNonNegative(value.leads) || !Number.isInteger(value.leads) || !isNonNegative(value.conversions) || !Number.isInteger(value.conversions) || value.conversions > value.leads) return false;
  if (typeof value.startDate !== 'string' || typeof value.endDate !== 'string' || !DATE_RE.test(value.startDate) || !DATE_RE.test(value.endDate) || value.endDate < value.startDate) return false;
  return typeof value.id === 'string' && value.id.trim().length > 0
    && typeof value.name === 'string' && value.name.trim().length > 0
    && typeof value.channel === 'string' && CAMPAIGN_CHANNELS.has(value.channel as MarketingMockCampaign['channel'])
    && isText(value.objective)
    && isText(value.status);
}
function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function getMarketingMockFixture(): MarketingMockFixture {
  if (!isMockDataEnabled()) return { contents: [], campaigns: [] };
  const clone: unknown = structuredClone(mockData);
  if (!isObject(clone)) return { contents: [], campaigns: [] };
  const contents = Array.isArray(clone.contents) ? uniqueById(clone.contents.filter(isContent)) : [];
  const campaigns = Array.isArray(clone.campaigns) ? uniqueById(clone.campaigns.filter(isCampaign)) : [];
  return { contents, campaigns };
}
