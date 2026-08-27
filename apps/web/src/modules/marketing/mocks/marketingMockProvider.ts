import mockData from '../../../mocks/marketing/marketing.dev.json';
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

export type MarketingMockBriefing = {
  id: string;
  title: string;
  objective: string;
  audience: string;
  channels: MarketingMockContent['channel'][];
  owner: string;
  ownerUserId?: string;
  dueDate: string;
  status: 'Rascunho' | 'Em elaboração' | 'Em revisão' | 'Aprovado' | 'Arquivado';
  keyMessage: string;
  deliverables: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type MarketingMockFixture = {
  contents: MarketingMockContent[];
  campaigns: MarketingMockCampaign[];
  briefings: MarketingMockBriefing[];
};

const CONTENT_CHANNELS = new Set<MarketingMockContent['channel']>(['Instagram', 'Facebook', 'TikTok', 'YouTube', 'X', 'Threads']);
const CAMPAIGN_CHANNELS = new Set<MarketingMockCampaign['channel']>(['Meta Ads', 'Google Ads', 'YouTube', 'TikTok']);
const BRIEFING_STATUSES = new Set<MarketingMockBriefing['status']>(['Rascunho', 'Em elaboração', 'Em revisão', 'Aprovado', 'Arquivado']);
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
function isBriefing(value: unknown): value is MarketingMockBriefing {
  if (!isObject(value) || typeof value.id !== 'string' || !value.id.trim() || typeof value.title !== 'string' || !value.title.trim()) return false;
  if (typeof value.objective !== 'string' || typeof value.audience !== 'string' || typeof value.owner !== 'string' || (value.ownerUserId !== undefined && typeof value.ownerUserId !== 'string')) return false;
  if (!Array.isArray(value.channels) || !value.channels.every((channel) => typeof channel === 'string' && CONTENT_CHANNELS.has(channel as MarketingMockContent['channel'])) || new Set(value.channels).size !== value.channels.length) return false;
  if (typeof value.dueDate !== 'string' || (value.dueDate !== '' && !DATE_RE.test(value.dueDate))) return false;
  if (typeof value.status !== 'string' || !BRIEFING_STATUSES.has(value.status as MarketingMockBriefing['status'])) return false;
  if (typeof value.keyMessage !== 'string' || typeof value.deliverables !== 'string' || typeof value.notes !== 'string') return false;
  if (typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt)) || typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))) return false;
  if (value.status !== 'Rascunho' && (!value.objective.trim() || !value.ownerUserId)) return false;
  return true;
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
  if (!isMockDataEnabled()) return { contents: [], campaigns: [], briefings: [] };
  const clone: unknown = structuredClone(mockData);
  if (!isObject(clone)) return { contents: [], campaigns: [], briefings: [] };
  const contents = Array.isArray(clone.contents) ? uniqueById(clone.contents.filter(isContent)) : [];
  const campaigns = Array.isArray(clone.campaigns) ? uniqueById(clone.campaigns.filter(isCampaign)) : [];
  const briefings = Array.isArray(clone.briefings) ? uniqueById(clone.briefings.filter(isBriefing)) : [];
  return { contents, campaigns, briefings };
}

export function getMarketingMockBriefings(): MarketingMockBriefing[] {
  return getMarketingMockFixture().briefings.map((briefing) => structuredClone(briefing));
}
