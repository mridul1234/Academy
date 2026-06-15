import { CalendarCheck, Percent, TrendingUp, UsersRound } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { KPICard } from '@/components/dashboard/KPICard';
import { getDashboardData } from '@/lib/data';
import { statusLabels } from '@/lib/constants';
import {
  acquisitionLabel,
  acquisitionMetrics,
  classifyLeadAcquisition,
  extractCampaignValue,
} from '@/lib/acquisition';
import { relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const data = await getDashboardData();
  const activeLeads = data.leads.filter((lead) => !lead.archived);
  const metrics = acquisitionMetrics(activeLeads);
  const overall = metrics.find((item) => item.channel === 'overall')!;
  const meta = metrics.find((item) => item.channel === 'meta_ads')!;
  const organic = metrics.find((item) => item.channel === 'organic')!;
  const recent = activeLeads.slice(0, 8);
  const lostLeads = activeLeads.filter((lead) => lead.status === 'lost');
  const lostReasons = lostLeads.reduce<Record<string, number>>((acc, lead) => {
    const reason = lead.lost_reason || 'No reason selected';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardShell title="Overview" subtitle="Meta vs Organic lead tracking">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KPICard
          label="Leads Today"
          value={String(overall.today)}
          detail={`Meta ${meta.today} / Organic ${organic.today}`}
          icon={UsersRound}
        />
        <KPICard label="Meta Leads" value={String(meta.leads)} detail={`${meta.today} today`} icon={UsersRound} />
        <KPICard label="Organic Leads" value={String(organic.leads)} detail={`${organic.today} today`} icon={UsersRound} />
        <KPICard
          label="Overall Conversion"
          value={`${overall.conversionRate}%`}
          detail={`${overall.enrolled}/${overall.leads} enrolled`}
          icon={Percent}
        />
        <KPICard
          label="Meta Conversion"
          value={`${meta.conversionRate}%`}
          detail={`${meta.enrolled}/${meta.leads} enrolled`}
          icon={CalendarCheck}
        />
        <KPICard
          label="Organic Conversion"
          value={`${organic.conversionRate}%`}
          detail={`${organic.enrolled}/${organic.leads} enrolled`}
          icon={Percent}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black">Acquisition Scoreboard</h2>
            <p className="text-sm font-medium text-slate-500">Use enrolled status as the conversion point for each channel.</p>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Today</th>
                <th>Total Leads</th>
                <th>Enrolled</th>
                <th>Lost</th>
                <th>Conversion</th>
                <th>Lost Rate</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((item) => (
                <tr key={item.channel}>
                  <td data-label="Channel" className="font-extrabold">{item.label}</td>
                  <td data-label="Today">{item.today}</td>
                  <td data-label="Total Leads">{item.leads}</td>
                  <td data-label="Enrolled">{item.enrolled}</td>
                  <td data-label="Lost">{item.lost}</td>
                  <td data-label="Conversion"><span className="badge bg-emerald-50 text-emerald-700">{item.conversionRate}%</span></td>
                  <td data-label="Lost Rate"><span className="badge bg-rose-50 text-rose-700">{item.lostRate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="text-rose-600" size={18} />
            <div>
              <h2 className="text-lg font-black">Lost Lead Reasons</h2>
              <p className="text-sm font-medium text-slate-500">Why leads are dropping by reason.</p>
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(lostReasons).length ? Object.entries(lostReasons).map(([reason, count]) => (
              <div className="rounded-lg border border-slate-100 p-3" key={reason}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{reason}</span>
                  <span className="badge bg-slate-100 text-slate-700">{count}</span>
                </div>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500">
                No lost leads yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-black">Recent Leads</h2>
          <p className="text-sm font-medium text-slate-500">Newest leads with their acquisition channel and campaign details.</p>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Parent / Child</th>
              <th>Channel</th>
              <th>Campaign</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((lead) => {
              const channel = classifyLeadAcquisition(lead);
              const campaign = extractCampaignValue(lead, 'utm_campaign');
              const creative = extractCampaignValue(lead, 'utm_content');

              return (
                <tr key={lead.id}>
                  <td data-label="Parent / Child">
                    <div className="font-extrabold">{lead.parent_name}</div>
                    <div className="text-xs font-semibold text-slate-500">{lead.child_name}</div>
                  </td>
                  <td data-label="Channel">
                    <span className={`badge ${channel === 'meta_ads' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {acquisitionLabel(channel)}
                    </span>
                  </td>
                  <td data-label="Campaign" className="text-sm font-semibold text-slate-500">
                    {campaign || '-'}
                    {creative ? <div className="text-xs text-slate-400">{creative}</div> : null}
                  </td>
                  <td data-label="Status"><span className="badge bg-slate-100 text-slate-700">{statusLabels[lead.status]}</span></td>
                  <td data-label="Created" className="text-sm font-semibold text-slate-500">{relativeTime(lead.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}
