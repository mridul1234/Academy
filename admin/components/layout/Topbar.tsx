import { Plus, Zap } from 'lucide-react';
import Link from 'next/link';

export function Topbar({ title, subtitle }: { title: string; subtitle: string }) {
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
        <Link href="/leads?new=1" className="btn btn-primary">
          <Plus size={16} /> Add Lead
        </Link>
      </div>
    </header>
  );
}
