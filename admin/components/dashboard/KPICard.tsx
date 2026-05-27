import type { LucideIcon } from 'lucide-react';

export function KPICard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="text-sm font-extrabold text-slate-500">{label}</div>
        <div className="rounded-lg bg-violet-50 p-2 text-brand">
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      <div className="mt-2 text-xs font-bold text-slate-500">{detail}</div>
    </div>
  );
}
