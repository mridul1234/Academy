import type { Lead } from './types';

export type AcquisitionChannel = 'meta_ads' | 'organic';

export type ChannelMetrics = {
  channel: AcquisitionChannel | 'overall';
  label: string;
  leads: number;
  today: number;
  enrolled: number;
  lost: number;
  conversionRate: number;
  lostRate: number;
};

const channelLabels: Record<AcquisitionChannel | 'overall', string> = {
  overall: 'Overall',
  meta_ads: 'Meta Ads',
  organic: 'Organic',
};

function istDateKey(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

export function todayKey() {
  return istDateKey(new Date());
}

export function leadDateKey(lead: Lead) {
  return istDateKey(new Date(lead.created_at));
}

export function classifyLeadAcquisition(lead: Lead): AcquisitionChannel {
  const source = String(lead.source || '').toLowerCase();
  const message = String(lead.message || '').toLowerCase();

  if (
    source.includes('facebook') ||
    source.includes('instagram') ||
    message.includes('utm_source=meta') ||
    message.includes('utm_source=facebook') ||
    message.includes('utm_source=instagram') ||
    message.includes('utm_medium=paid_social') ||
    message.includes('fbclid=')
  ) {
    return 'meta_ads';
  }

  return 'organic';
}

export function acquisitionLabel(channel: AcquisitionChannel | 'overall') {
  return channelLabels[channel];
}

export function channelMetric(leads: Lead[], channel: AcquisitionChannel | 'overall', dayKey = todayKey()): ChannelMetrics {
  const scoped = channel === 'overall'
    ? leads
    : leads.filter((lead) => classifyLeadAcquisition(lead) === channel);
  const enrolled = scoped.filter((lead) => lead.status === 'enrolled').length;
  const lost = scoped.filter((lead) => lead.status === 'lost').length;

  return {
    channel,
    label: channelLabels[channel],
    leads: scoped.length,
    today: scoped.filter((lead) => leadDateKey(lead) === dayKey).length,
    enrolled,
    lost,
    conversionRate: scoped.length ? Math.round((enrolled / scoped.length) * 100) : 0,
    lostRate: scoped.length ? Math.round((lost / scoped.length) * 100) : 0,
  };
}

export function acquisitionMetrics(leads: Lead[]) {
  const activeLeads = leads.filter((lead) => !lead.archived);
  const dayKey = todayKey();

  return [
    channelMetric(activeLeads, 'overall', dayKey),
    channelMetric(activeLeads, 'meta_ads', dayKey),
    channelMetric(activeLeads, 'organic', dayKey),
  ];
}

export function extractCampaignValue(lead: Lead, key: string) {
  const match = String(lead.message || '').match(new RegExp(`${key}=([^|\\n]+)`, 'i'));
  return match?.[1]?.trim() || '';
}
