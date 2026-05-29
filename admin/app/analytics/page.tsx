import { DashboardShell } from '@/components/layout/DashboardShell';
import { FunnelChart, SourceDonut } from '@/components/dashboard/Charts';
import { getDashboardData } from '@/lib/data';
import { sourceLabels } from '@/lib/constants';
import { currency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const data = await getDashboardData();
  const sourceRows = Object.entries(sourceLabels).map(([source, label]) => {
    const leads = data.leads.filter((lead) => lead.source === source);
    const enrolled = leads.filter((lead) => lead.status === 'enrolled').length;
    return { label, leads: leads.length, enrolled, conversion: leads.length ? Math.round((enrolled / leads.length) * 100) : 0 };
  });
  const revenueByPlan = Object.entries(data.revenue_entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.plan_type || 'Unknown'] = (acc[entry.plan_type || 'Unknown'] || 0) + Number(entry.amount);
    return acc;
  }, {}));
  const forecast = data.revenue_entries.reduce((sum, entry) => sum + Number(entry.amount), 0) * 1.15;

  return (
    <DashboardShell title="Analytics" subtitle="Source attribution, funnel health, and revenue signals">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-lg font-black">Conversion Funnel</h2>
          <FunnelChart leads={data.leads} />
        </section>
        <section className="card p-5">
          <h2 className="text-lg font-black">Source Attribution</h2>
          <SourceDonut leads={data.leads} />
        </section>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="card overflow-hidden">
          <table className="table">
            <thead><tr><th>Source</th><th>Leads</th><th>Enrolled</th><th>Conversion</th></tr></thead>
            <tbody>{sourceRows.map((row) => <tr key={row.label}><td data-label="Source" className="font-bold">{row.label}</td><td data-label="Leads">{row.leads}</td><td data-label="Enrolled">{row.enrolled}</td><td data-label="Conversion">{row.conversion}%</td></tr>)}</tbody>
          </table>
        </section>
        <section className="card p-5">
          <h2 className="text-lg font-black">Forecast</h2>
          <div className="mt-4 text-3xl font-black text-brand">{currency(forecast)}</div>
          <p className="mt-2 text-sm font-semibold text-slate-500">Simple 3-month projection from current revenue run rate.</p>
          <div className="mt-5 space-y-2">{revenueByPlan.map(([plan, amount]) => <div className="flex justify-between text-sm" key={plan}><span>{plan}</span><b>{currency(amount)}</b></div>)}</div>
        </section>
      </div>
    </DashboardShell>
  );
}
