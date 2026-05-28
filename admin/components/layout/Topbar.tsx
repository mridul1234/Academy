import { Plus, Zap } from 'lucide-react';
import Link from 'next/link';

export function Topbar({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: { label: string; href?: string; targetId?: string };
}) {
  const topbarAction = action || { label: 'Add Lead', href: '/leads?new=1' };

  return (
    <header className="topbar">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700 sm:flex">
          <Zap size={14} /> Live
        </div>
        {topbarAction.href ? (
          <Link href={topbarAction.href} className="btn btn-primary">
            <Plus size={16} /> {topbarAction.label}
          </Link>
        ) : (
          <a href={topbarAction.targetId || '#'} className="btn btn-primary">
            <Plus size={16} /> {topbarAction.label}
          </a>
        )}
      </div>
    </header>
  );
}
