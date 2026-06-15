'use client';

import { useMemo, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Lead, LeadStatus } from '@/lib/types';
import { sourceLabels, statusLabels } from '@/lib/constants';
import {
  acquisitionLabel,
  classifyLeadAcquisition,
  extractCampaignValue,
  leadDateKey,
  todayKey,
  type AcquisitionChannel,
} from '@/lib/acquisition';

type RangePreset = 'today' | 'yesterday' | '7' | '30' | '90' | 'custom';
type ChannelFilter = 'all' | AcquisitionChannel;

const rangeOptions: Array<{ value: RangePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom' },
];

const channelOptions: Array<{ value: ChannelFilter; label: string }> = [
  { value: 'all', label: 'All channels' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'organic', label: 'Organic' },
];

const trackedStatuses: LeadStatus[] = ['new', 'contacted', 'demo_scheduled', 'demo_done', 'enrolled', 'lost'];

function keyFromOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return todayKey(date);
}

function dateKeysBetween(startKey: string, endKey: string) {
  const keys: string[] = [];
  const current = new Date(`${startKey}T00:00:00+05:30`);
  const end = new Date(`${endKey}T00:00:00+05:30`);

  while (current <= end) {
    keys.push(todayKey(current));
    current.setDate(current.getDate() + 1);
  }

  return keys;
}

function labelDay(key: string) {
  const parts = key.split('-');
  if (parts.length !== 3) return key;
  return `${parts[2]}/${parts[1]}`;
}

function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function avg(part: number, days: number) {
  return Number((part / Math.max(days, 1)).toFixed(1));
}

function rangeForPreset(preset: RangePreset, customStart: string, customEnd: string) {
  if (preset === 'custom') {
    const fallback = todayKey();
    return {
      start: customStart || fallback,
      end: customEnd || customStart || fallback,
    };
  }

  if (preset === 'today') return { start: todayKey(), end: todayKey() };
  if (preset === 'yesterday') return { start: keyFromOffset(-1), end: keyFromOffset(-1) };

  const days = Number(preset);
  return { start: keyFromOffset(-(days - 1)), end: todayKey() };
}

function channelStats(leads: Lead[], channel: ChannelFilter) {
  const scoped = channel === 'all' ? leads : leads.filter((lead) => classifyLeadAcquisition(lead) === channel);
  const enrolled = scoped.filter((lead) => lead.status === 'enrolled').length;
  const lost = scoped.filter((lead) => lead.status === 'lost').length;
  const demos = scoped.filter((lead) => ['demo_scheduled', 'demo_done', 'enrolled'].includes(lead.status)).length;
  const demoDone = scoped.filter((lead) => ['demo_done', 'enrolled'].includes(lead.status)).length;

  return {
    channel,
    label: channel === 'all' ? 'Overall' : acquisitionLabel(channel),
    leads: scoped.length,
    demos,
    demoDone,
    enrolled,
    lost,
    demoRate: percent(demos, scoped.length),
    conversionRate: percent(enrolled, scoped.length),
    lostRate: percent(lost, scoped.length),
  };
}

function topLostReason(leads: Lead[]) {
  const reasons = leads
    .filter((lead) => lead.status === 'lost')
    .reduce<Record<string, number>>((acc, lead) => {
      const reason = lead.lost_reason || 'No reason selected';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});
  const [reason, count] = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0] || [];
  return reason ? `${reason} (${count})` : '-';
}

function campaignKey(lead: Lead) {
  const campaign = extractCampaignValue(lead, 'utm_campaign') || 'No campaign captured';
  const creative = extractCampaignValue(lead, 'utm_content');
  const audience = extractCampaignValue(lead, 'utm_term');
  return [campaign, creative, audience].filter(Boolean).join(' / ');
}

export function AcquisitionDashboard({ leads }: { leads: Lead[] }) {
  const [range, setRange] = useState<RangePreset>('30');
  const [customStart, setCustomStart] = useState(todayKey());
  const [customEnd, setCustomEnd] = useState(todayKey());
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');

  const rangeKeys = rangeForPreset(range, customStart, customEnd);

  const analysis = useMemo(() => {
    const start = rangeKeys.start <= rangeKeys.end ? rangeKeys.start : rangeKeys.end;
    const end = rangeKeys.start <= rangeKeys.end ? rangeKeys.end : rangeKeys.start;
    const days = dateKeysBetween(start, end);
    const active = leads.filter((lead) => !lead.archived);
    const ranged = active.filter((lead) => {
      const key = leadDateKey(lead);
      return key >= start && key <= end;
    });
    const filtered = channelFilter === 'all'
      ? ranged
      : ranged.filter((lead) => classifyLeadAcquisition(lead) === channelFilter);

    const stats = [
      channelStats(ranged, 'all'),
      channelStats(ranged, 'meta_ads'),
      channelStats(ranged, 'organic'),
    ];

    const dailyRows = days.map((key) => {
      const daily = ranged.filter((lead) => leadDateKey(lead) === key);
      const selected = filtered.filter((lead) => leadDateKey(lead) === key);

      return {
        key,
        day: labelDay(key),
        overall: daily.length,
        meta_ads: daily.filter((lead) => classifyLeadAcquisition(lead) === 'meta_ads').length,
        organic: daily.filter((lead) => classifyLeadAcquisition(lead) === 'organic').length,
        selected: selected.length,
        enrolled: selected.filter((lead) => lead.status === 'enrolled').length,
        lost: selected.filter((lead) => lead.status === 'lost').length,
        average: avg(filtered.length, days.length),
      };
    });

    const campaignMap = ranged
      .filter((lead) => classifyLeadAcquisition(lead) === 'meta_ads')
      .reduce<Record<string, Lead[]>>((acc, lead) => {
        const key = campaignKey(lead);
        acc[key] = acc[key] || [];
        acc[key].push(lead);
        return acc;
      }, {});

    const campaigns = Object.entries(campaignMap)
      .map(([name, items]) => {
        const enrolled = items.filter((lead) => lead.status === 'enrolled').length;
        const lost = items.filter((lead) => lead.status === 'lost').length;
        return {
          name,
          leads: items.length,
          enrolled,
          lost,
          conversionRate: percent(enrolled, items.length),
          lostRate: percent(lost, items.length),
          topLostReason: topLostReason(items),
        };
      })
      .sort((a, b) => b.leads - a.leads || b.conversionRate - a.conversionRate);

    const sourceRows = Object.entries(sourceLabels)
      .map(([source, label]) => {
        const items = ranged.filter((lead) => lead.source === source);
        const enrolled = items.filter((lead) => lead.status === 'enrolled').length;
        return {
          source,
          label,
          leads: items.length,
          enrolled,
          conversionRate: percent(enrolled, items.length),
          topLostReason: topLostReason(items),
        };
      })
      .filter((item) => item.leads > 0)
      .sort((a, b) => b.leads - a.leads);

    const selectedStats = channelStats(filtered, 'all');
    const bestVolume = stats.filter((item) => item.channel !== 'all').sort((a, b) => b.leads - a.leads)[0];
    const bestConversion = stats
      .filter((item) => item.channel !== 'all' && item.leads > 0)
      .sort((a, b) => b.conversionRate - a.conversionRate)[0];
    const biggestLoss = stats.filter((item) => item.channel !== 'all').sort((a, b) => b.lostRate - a.lostRate)[0];
    const campaignToWatch = campaigns.find((item) => item.leads > 0 && item.conversionRate === 0) || campaigns[0];

    return {
      start,
      end,
      days,
      ranged,
      filtered,
      stats,
      dailyRows,
      campaigns,
      sourceRows,
      selectedStats,
      decisions: {
        bestVolume: bestVolume ? `${bestVolume.label} (${bestVolume.leads} leads)` : '-',
        bestConversion: bestConversion ? `${bestConversion.label} (${bestConversion.conversionRate}%)` : '-',
        biggestLoss: biggestLoss ? `${biggestLoss.label} lost rate ${biggestLoss.lostRate}%` : '-',
        campaignToWatch: campaignToWatch ? `${campaignToWatch.name} (${campaignToWatch.conversionRate}% conversion)` : '-',
        topLostReason: topLostReason(filtered),
      },
    };
  }, [channelFilter, leads, rangeKeys.end, rangeKeys.start]);

  return (
    <div className="space-y-6">
      <section className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label>
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">Date range</span>
            <select className="select min-w-[170px]" value={range} onChange={(event) => setRange(event.target.value as RangePreset)}>
              {rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {range === 'custom' ? (
            <>
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">From</span>
                <input className="input" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">To</span>
                <input className="input" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
              </label>
            </>
          ) : null}
          <label>
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">Chart source</span>
            <select className="select min-w-[170px]" value={channelFilter} onChange={(event) => setChannelFilter(event.target.value as ChannelFilter)}>
              {channelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div className="text-sm font-semibold text-slate-500">
            Showing {analysis.start} to {analysis.end}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Selected Leads" value={analysis.selectedStats.leads} detail={`${avg(analysis.selectedStats.leads, analysis.days.length)} avg/day`} />
        <MetricCard label="Demo Scheduled" value={analysis.selectedStats.demos} detail={`${analysis.selectedStats.demoRate}% of leads`} />
        <MetricCard label="Enrolled" value={analysis.selectedStats.enrolled} detail={`${analysis.selectedStats.conversionRate}% conversion`} />
        <MetricCard label="Lost" value={analysis.selectedStats.lost} detail={`${analysis.selectedStats.lostRate}% lost rate`} />
        <MetricCard label="Top Lost Reason" value={analysis.decisions.topLostReason} detail="Selected source" compact />
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-black">Daily Acquisition Trend</h2>
          <p className="text-sm font-medium text-slate-500">Daily lead volume, enrolled leads, lost leads, and average lead pace.</p>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={analysis.dailyRows} margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              {channelFilter === 'all' ? (
                <>
                  <Bar dataKey="meta_ads" name="Meta Ads" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="organic" name="Organic" fill="#10B981" radius={[6, 6, 0, 0]} />
                </>
              ) : (
                <Bar dataKey="selected" name={acquisitionLabel(channelFilter)} fill={channelFilter === 'meta_ads' ? '#2563EB' : '#10B981'} radius={[6, 6, 0, 0]} />
              )}
              <Line type="monotone" dataKey="average" name="Avg leads/day" stroke="#0F172A" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="enrolled" name="Enrolled" stroke="#7C3AED" strokeWidth={2} />
              <Line type="monotone" dataKey="lost" name="Lost" stroke="#DC2626" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-black">Channel Breakdown</h2>
          <p className="text-sm font-medium text-slate-500">Which acquisition source brings volume and which one converts.</p>
        </div>
        <MetricsTable rows={analysis.stats} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black">Meta Campaign Breakdown</h2>
            <p className="text-sm font-medium text-slate-500">Campaign / creative / audience performance from captured UTM values.</p>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Leads</th>
                <th>Enrolled</th>
                <th>Lost</th>
                <th>Conversion</th>
                <th>Top lost reason</th>
              </tr>
            </thead>
            <tbody>
              {analysis.campaigns.length ? analysis.campaigns.map((item) => (
                <tr key={item.name}>
                  <td data-label="Campaign" className="max-w-[320px] font-extrabold">{item.name}</td>
                  <td data-label="Leads">{item.leads}</td>
                  <td data-label="Enrolled">{item.enrolled}</td>
                  <td data-label="Lost">{item.lost}</td>
                  <td data-label="Conversion"><span className="badge bg-emerald-50 text-emerald-700">{item.conversionRate}%</span></td>
                  <td data-label="Top lost reason" className="text-sm font-semibold text-slate-500">{item.topLostReason}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center text-sm font-semibold text-slate-500">No Meta campaign leads in this range.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-black">Decision Summary</h2>
          <p className="mb-4 text-sm font-medium text-slate-500">Fast read on what to double down on, fix, or stop.</p>
          <div className="space-y-3">
            <Decision label="Best volume source" value={analysis.decisions.bestVolume} />
            <Decision label="Best conversion source" value={analysis.decisions.bestConversion} />
            <Decision label="Biggest leak" value={analysis.decisions.biggestLoss} />
            <Decision label="Campaign to watch" value={analysis.decisions.campaignToWatch} />
            <Decision label="Main lost reason" value={analysis.decisions.topLostReason} />
          </div>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-black">Confirmed Source Breakdown</h2>
          <p className="text-sm font-medium text-slate-500">This uses the lead source field, separate from Meta vs Organic attribution.</p>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Leads</th>
              <th>Enrolled</th>
              <th>Conversion</th>
              <th>Top lost reason</th>
            </tr>
          </thead>
          <tbody>
            {analysis.sourceRows.length ? analysis.sourceRows.map((item) => (
              <tr key={item.source}>
                <td data-label="Source" className="font-extrabold">{item.label}</td>
                <td data-label="Leads">{item.leads}</td>
                <td data-label="Enrolled">{item.enrolled}</td>
                <td data-label="Conversion"><span className="badge bg-emerald-50 text-emerald-700">{item.conversionRate}%</span></td>
                <td data-label="Top lost reason" className="text-sm font-semibold text-slate-500">{item.topLostReason}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center text-sm font-semibold text-slate-500">No leads in this range.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-black">Stage Mix</h2>
          <p className="text-sm font-medium text-slate-500">Where the selected leads currently sit in the pipeline.</p>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {trackedStatuses.map((status) => {
              const count = analysis.filtered.filter((lead) => lead.status === status).length;
              return (
                <tr key={status}>
                  <td data-label="Status" className="font-extrabold">{statusLabels[status]}</td>
                  <td data-label="Count">{count}</td>
                  <td data-label="Share"><span className="badge bg-slate-100 text-slate-700">{percent(count, analysis.filtered.length)}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail, compact = false }: { label: string; value: string | number; detail: string; compact?: boolean }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-2 font-black ${compact ? 'text-lg leading-tight' : 'text-3xl'}`}>{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-500">{detail}</div>
    </div>
  );
}

function MetricsTable({ rows }: { rows: ReturnType<typeof channelStats>[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Channel</th>
          <th>Leads</th>
          <th>Demos Scheduled</th>
          <th>Demo Done</th>
          <th>Enrolled</th>
          <th>Lost</th>
          <th>Conversion</th>
          <th>Lost Rate</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item) => (
          <tr key={item.channel}>
            <td data-label="Channel" className="font-extrabold">{item.label}</td>
            <td data-label="Leads">{item.leads}</td>
            <td data-label="Demos Scheduled">{item.demos}</td>
            <td data-label="Demo Done">{item.demoDone}</td>
            <td data-label="Enrolled">{item.enrolled}</td>
            <td data-label="Lost">{item.lost}</td>
            <td data-label="Conversion"><span className="badge bg-emerald-50 text-emerald-700">{item.conversionRate}%</span></td>
            <td data-label="Lost Rate"><span className="badge bg-rose-50 text-rose-700">{item.lostRate}%</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Decision({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 font-extrabold">{value}</div>
    </div>
  );
}
