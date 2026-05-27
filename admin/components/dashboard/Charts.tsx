'use client';

import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Lead, RevenueEntry } from '@/lib/types';
import { statusLabels, statusOrder, sourceLabels } from '@/lib/constants';

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
