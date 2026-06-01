import { format, formatDistanceToNowStrict } from 'date-fns';

export function currency(amount: number | null | undefined) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export function dateLabel(date: string | null | undefined) {
  if (!date) return '-';
  return format(new Date(date), 'dd MMM yyyy');
}

export function relativeTime(date: string) {
  return `${formatDistanceToNowStrict(new Date(date))} ago`;
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function normalizeSource(source?: string | null) {
  const value = (source || '').toLowerCase();
  if (!value || value.includes('unknown') || value.includes("don't know") || value.includes('dont know')) return 'unknown';
  if (value.includes('facebook')) return 'facebook';
  if (value.includes('instagram')) return 'instagram';
  if (value.includes('google')) return 'google';
  if (value.includes('word') || value.includes('referral')) return 'word_of_mouth';
  if (value.includes('website')) return 'website';
  return 'other';
}

export function planAmount(plan?: string | null) {
  const rates: Record<string, number> = {
    buddy_beginner: 3500,
    individual_beginner: 5500,
    buddy_intermediate: 3675,
    individual_intermediate: 5775,
    buddy_advanced: 3850,
    individual_advanced: 6050,
  };
  return rates[plan || ''] || 3500;
}

export function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}
