import clsx from 'clsx';
import type { LeadStatus } from '@/lib/types';
import { statusLabels } from '@/lib/constants';

const tones: Record<LeadStatus, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-indigo-50 text-indigo-700',
  demo_scheduled: 'bg-amber-50 text-amber-700',
  demo_done: 'bg-orange-50 text-orange-700',
  enrolled: 'bg-emerald-50 text-emerald-700',
  lost: 'bg-red-50 text-red-700',
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={clsx('badge', tones[status])}>{statusLabels[status]}</span>;
}
