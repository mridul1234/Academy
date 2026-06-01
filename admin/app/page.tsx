import { CalendarCheck, GraduationCap, IndianRupee, Percent, TrendingUp, UsersRound } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { KPICard } from '@/components/dashboard/KPICard';
import { FunnelChart, RevenueChart, SourceDonut } from '@/components/dashboard/Charts';
import { getDashboardData } from '@/lib/data';
import { statusLabels } from '@/lib/constants';
import { currency, relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const data = await getDashboardData();
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const newLeads = data.leads.filter((lead) => lead.created_at.slice(0, 7) === month).length;
  const revenueThisMonth = data.revenue_entries
    .filter((entry) => entry.transaction_date.slice(0, 7) === month)
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const lastMonthDate = new Date(now);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  const revenueLastMonth = data.revenue_entries
    .filter((entry) => entry.transaction_date.slice(0, 7) === lastMonth)
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const momGrowth = revenueLastMonth
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : revenueThisMonth > 0
      ? 100
      : 0;
  const enrolled = data.leads.filter((lead) => lead.status === 'enrolled').length;
  const conversion = data.leads.length ? Math.round((enrolled / data.leads.length) * 100) : 0;
  const demos = data.leads.filter((lead) => ['demo_scheduled', 'demo_done'].includes(lead.status)).length;
  const recent = data.leads.slice(0, 5);

  return (
    <DashboardShell title="Overview" subtitle="Your morning command center for ChessGum">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KPICard label="New Leads" value={String(newLeads)} detail="This month" icon={UsersRound} />
        <KPICard label="Revenue" value={currency(revenueThisMonth)} detail="This month" icon={IndianRupee} />
        <KPICard label="Active Students" value={String(data.students.filter((s) => s.is_active).length)} detail="Currently enrolled" icon={GraduationCap} />
        <KPICard label="Conversion" value={`${conversion}%`} detail="Lead to enrolled" icon={Percent} />
        <KPICard label="Demos Booked" value={String(demos)} detail="Scheduled or done" icon={CalendarCheck} />
        <KPICard label="MoM Growth" value={`${momGrowth >= 0 ? '+' : ''}${momGrowth}%`} detail={`${currency(revenueLastMonth)} last month`} icon={TrendingUp} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="card p-5">
          <h2 className="text-lg font-black">Revenue Growth</h2>
          <p className="mb-4 text-sm font-medium text-slate-500">12-month revenue trend</p>
          <RevenueChart revenue={data.revenue_entries} />
        </section>
        <section className="card p-5">
          <h2 className="text-lg font-black">Source Breakdown</h2>
          <p className="mb-4 text-sm font-medium text-slate-500">Where leads come from</p>
          <SourceDonut leads={data.leads} />
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="card p-5">
          <h2 className="text-lg font-black">Lead Funnel</h2>
          <p className="mb-4 text-sm font-medium text-slate-500">New to enrolled flow</p>
          <FunnelChart leads={data.leads} />
        </section>
        <section className="card p-5">
          <h2 className="text-lg font-black">Recent Leads</h2>
          <div className="mt-4 space-y-3">
            {recent.map((lead) => (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-3" key={lead.id}>
                <div>
                  <div className="font-extrabold">{lead.parent_name}</div>
                  <div className="text-xs font-semibold text-slate-500">{lead.child_name} · {relativeTime(lead.created_at)}</div>
                </div>
                <span className="badge bg-violet-50 text-brand">{statusLabels[lead.status]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
