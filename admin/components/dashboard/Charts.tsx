'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Lead, RevenueEntry } from '@/lib/types';
import { statusLabels, statusOrder, sourceLabels } from '@/lib/constants';
import { acquisitionLabel, classifyLeadAcquisition, leadDateKey, todayKey } from '@/lib/acquisition';

export function RevenueChart({ revenue }: { revenue: RevenueEntry[] }) {
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - index));
    const key = date.toISOString().slice(0, 7);
    return { key, month: date.toLocaleString('en-IN', { month: 'short' }), revenue: 0 };
  });
  revenue.forEach((entry) => {
    const bucket = months.find((item) => item.key === entry.transaction_date.slice(0, 7));
    if (bucket) bucket.revenue += Number(entry.amount);
  });

  return (
    <ResponsiveContainer width="100%" height={290}>
      <ComposedChart data={months}>
        <CartesianGrid stroke="#E5E7EB" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="revenue" fill="#7C3AED" radius={[6, 6, 0, 0]} />
        <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function SourceDonut({ leads }: { leads: Lead[] }) {
  const data = Object.entries(sourceLabels).map(([key, label]) => ({
    label,
    value: leads.filter((lead) => lead.source === key).length,
  })).filter((item) => item.value > 0);
  const colors = ['#1877F2', '#E1306C', '#F59E0B', '#10B981', '#7C3AED', '#64748B'];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data.length ? data : [{ label: 'No leads', value: 1 }]} dataKey="value" nameKey="label" innerRadius={62} outerRadius={96}>
          {(data.length ? data : [{ label: 'No leads', value: 1 }]).map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function FunnelChart({ leads }: { leads: Lead[] }) {
  const data = statusOrder.map((status) => ({
    status: statusLabels[status],
    count: leads.filter((lead) => lead.status === status).length,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid stroke="#E5E7EB" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="status" width={120} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#7C3AED" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

type LeadChartMode = 'overall' | 'meta_ads' | 'organic' | 'compare';

const periodOptions = [7, 14, 30, 90];
const modeOptions: Array<{ value: LeadChartMode; label: string }> = [
  { value: 'overall', label: 'Overall' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'organic', label: 'Organic' },
  { value: 'compare', label: 'Compare' },
];

function dayKeys(days: number) {
  const keys: string[] = [];
  const now = new Date();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    keys.push(todayKey(date));
  }

  return keys;
}

function dayLabel(key: string) {
  const [, month, day] = key.match(/^(\d{4})-(\d{2})-(\d{2})$/) || [];
  if (!month || !day) return key;
  return `${day}/${month}`;
}

function average(value: number, days: number) {
  return Number((value / days).toFixed(1));
}

export function DailyLeadsChart({ leads }: { leads: Lead[] }) {
  const [days, setDays] = useState(14);
  const [mode, setMode] = useState<LeadChartMode>('overall');
  const activeLeads = useMemo(() => leads.filter((lead) => !lead.archived), [leads]);

  const chart = useMemo(() => {
    const keys = dayKeys(days);
    const buckets = keys.map((key) => ({
      key,
      day: dayLabel(key),
      overall: 0,
      meta_ads: 0,
      organic: 0,
      avg_overall: 0,
      avg_meta_ads: 0,
      avg_organic: 0,
    }));

    activeLeads.forEach((lead) => {
      const bucket = buckets.find((item) => item.key === leadDateKey(lead));
      if (!bucket) return;
      const channel = classifyLeadAcquisition(lead);
      bucket.overall += 1;
      bucket[channel] += 1;
    });

    const totals = buckets.reduce(
      (acc, item) => ({
        overall: acc.overall + item.overall,
        meta_ads: acc.meta_ads + item.meta_ads,
        organic: acc.organic + item.organic,
      }),
      { overall: 0, meta_ads: 0, organic: 0 },
    );

    const averages = {
      overall: average(totals.overall, days),
      meta_ads: average(totals.meta_ads, days),
      organic: average(totals.organic, days),
    };

    return {
      rows: buckets.map((item) => ({
        ...item,
        avg_overall: averages.overall,
        avg_meta_ads: averages.meta_ads,
        avg_organic: averages.organic,
      })),
      totals,
      averages,
    };
  }, [activeLeads, days]);

  const selectedTotal = mode === 'compare' ? chart.totals.overall : chart.totals[mode];
  const selectedAverage = mode === 'compare' ? chart.averages.overall : chart.averages[mode];
  const selectedLabel = mode === 'compare' ? 'All channels' : acquisitionLabel(mode);

  return (
    <section className="card mt-6 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <h2 className="text-lg font-black">Daily Lead Trend</h2>
          <p className="text-sm font-medium text-slate-500">Track daily lead volume and average leads per day by acquisition channel.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((option) => (
            <button
              className={`btn px-3 py-2 text-xs ${days === option ? 'btn-primary' : ''}`}
              key={option}
              onClick={() => setDays(option)}
              type="button"
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_230px]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {modeOptions.map((option) => (
              <button
                className={`btn px-3 py-2 text-xs ${mode === option.value ? 'btn-primary' : ''}`}
                key={option.value}
                onClick={() => setMode(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={310}>
            <ComposedChart data={chart.rows} margin={{ left: -16, right: 8, top: 10 }}>
              <CartesianGrid stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              {mode === 'compare' ? (
                <>
                  <Legend />
                  <Bar dataKey="meta_ads" name="Meta Ads" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="organic" name="Organic" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="avg_meta_ads" name="Meta avg/day" stroke="#1D4ED8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="avg_organic" name="Organic avg/day" stroke="#059669" strokeWidth={2} dot={false} />
                </>
              ) : (
                <>
                  <Bar
                    dataKey={mode}
                    name={`${selectedLabel} leads`}
                    fill={mode === 'meta_ads' ? '#2563EB' : mode === 'organic' ? '#10B981' : '#7C3AED'}
                    radius={[6, 6, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey={`avg_${mode}`}
                    name="Avg/day"
                    stroke="#0F172A"
                    strokeWidth={3}
                    dot={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid content-start gap-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-wide text-slate-400">Selected view</div>
            <div className="mt-1 text-xl font-black">{selectedLabel}</div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="text-xs font-black uppercase tracking-wide text-slate-400">Total leads</div>
            <div className="mt-1 text-3xl font-black">{selectedTotal}</div>
            <div className="text-sm font-semibold text-slate-500">Last {days} days</div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-4">
            <div className="text-xs font-black uppercase tracking-wide text-slate-400">Avg leads/day</div>
            <div className="mt-1 text-3xl font-black">{selectedAverage}</div>
            <div className="text-sm font-semibold text-slate-500">Across selected period</div>
          </div>
        </div>
      </div>
    </section>
  );
}
