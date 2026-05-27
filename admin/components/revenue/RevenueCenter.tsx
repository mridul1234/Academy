'use client';

import { useState } from 'react';
import { Download, Plus, Upload } from 'lucide-react';
import type { RevenueEntry } from '@/lib/types';
import { planLabels } from '@/lib/constants';
import { currency, dateLabel } from '@/lib/utils';
import { RevenueChart } from '@/components/dashboard/Charts';

export function RevenueCenter({ initialRevenue }: { initialRevenue: RevenueEntry[] }) {
  const [revenue, setRevenue] = useState(initialRevenue);
  const [summary, setSummary] = useState('');

  async function addManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch('/api/revenue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const data = await res.json();
    setRevenue((items) => [data.entry, ...items]);
    event.currentTarget.reset();
  }

  async function upload(file: File) {
    const csv = await file.text();
    const res = await fetch('/api/import/razorpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    setSummary(`${data.imported} imported, ${data.duplicates} duplicates skipped`);
    const refreshed = await fetch('/api/revenue').then((r) => r.json());
    setRevenue(refreshed.revenue);
  }

  const total = revenue.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const mrr = revenue.filter((entry) => entry.transaction_date.slice(0, 7) === new Date().toISOString().slice(0, 7)).reduce((sum, entry) => sum + Number(entry.amount), 0);
  const bestPlan = Object.entries(revenue.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.plan_type || 'Unknown'] = (acc[entry.plan_type || 'Unknown'] || 0) + Number(entry.amount);
    return acc;
  }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="MRR" value={currency(mrr)} />
        <Metric label="ARR" value={currency(mrr * 12)} />
        <Metric label="Average Revenue" value={currency(revenue.length ? total / revenue.length : 0)} />
        <Metric label="Best Plan" value={planLabels[bestPlan] || bestPlan} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="card p-5">
          <h2 className="text-lg font-black">Monthly Revenue</h2>
          <RevenueChart revenue={revenue} />
        </section>
        <section className="card p-5">
          <h2 className="text-lg font-black">Manual Entry</h2>
          <form className="mt-4 grid gap-3" onSubmit={addManual}>
            <input className="input" name="student_name" placeholder="Student name" required />
            <select className="select" name="plan_type">{Object.entries(planLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
            <input className="input" name="amount" type="number" placeholder="Amount" required />
            <input className="input" name="transaction_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            <textarea className="textarea" name="description" placeholder="Notes" />
            <button className="btn btn-primary"><Plus size={15} /> Add Revenue</button>
          </form>
        </section>
      </div>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Razorpay CSV Import</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Razorpay Dashboard → Transactions → Payments → Export. Upload the CSV here; Payment ID duplicates are skipped.</p>
          </div>
          <label className="btn btn-primary cursor-pointer">
            <Upload size={15} /> Upload CSV
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>
        {summary ? <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{summary}</div> : null}
      </section>

      <section className="card overflow-hidden">
        <table className="table">
          <thead><tr><th>Date</th><th>Student</th><th>Plan</th><th>Amount</th><th>Payment ID</th><th>Method</th></tr></thead>
          <tbody>
            {revenue.map((entry) => (
              <tr key={entry.id}><td>{dateLabel(entry.transaction_date)}</td><td className="font-bold">{entry.student_name}</td><td>{planLabels[entry.plan_type || ''] || entry.plan_type}</td><td className="font-black text-brand">{currency(entry.amount)}</td><td>{entry.razorpay_payment_id || '-'}</td><td>{entry.payment_method}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="card p-5"><div className="text-sm font-extrabold text-slate-500">{label}</div><div className="mt-2 text-2xl font-black">{value}</div></div>;
}
