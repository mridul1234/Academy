import Link from 'next/link';
import { CalendarDays, CreditCard, GraduationCap, LayoutDashboard, UsersRound } from 'lucide-react';

const nav = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: UsersRound },
  { href: '/revenue', label: 'Revenue', icon: CreditCard },
  { href: '/students', label: 'Students', icon: GraduationCap },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="mb-8 flex items-center gap-3">
        <img src="/chessgum_logo.png" alt="" className="h-10 w-10 rounded-md bg-white p-1" />
        <div>
          <div className="text-lg font-extrabold">ChessGum</div>
          <div className="text-xs font-semibold text-slate-400">Internal Admin</div>
        </div>
      </div>

      <nav className="space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action="/api/auth/logout" method="post" className="absolute bottom-5 left-5 right-5">
        <button className="btn w-full border-white/10 bg-white/5 text-slate-200" type="submit">
          Sign out
        </button>
      </form>
    </aside>
  );
}
