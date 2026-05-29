'use client';

import { useMemo, useState } from 'react';
import { CreditCard, IndianRupee, Plus, Trash2, TrendingUp, UsersRound, WalletCards } from 'lucide-react';
import type { RevenueEntry, Student } from '@/lib/types';
import { planLabels } from '@/lib/constants';
import { currency, dateLabel } from '@/lib/utils';
import { RevenueChart } from '@/components/dashboard/Charts';

const paymentMethods = [
  { value: 'upi', label: 'UPI' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'manual', label: 'Other' },
];

export function RevenueCenter({
  initialRevenue,
  students,
}: {
  initialRevenue: RevenueEntry[];
  students: Student[];
}) {
  const [revenue, setRevenue] = useState(initialRevenue);
  const [studentId, setStudentId] = useState(students[0]?.id || '');

  const selectedStudent = students.find((student) => student.id === studentId);

  async function addPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);
    const student = students.find((item) => item.id === payload.student_id);
    const baseDescription = String(payload.description || '').trim();
    const marker = student ? `[student:${student.id}]` : '';
    const res = await fetch('/api/revenue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_name: student ? `${student.child_name} ${student.parent_name}` : payload.student_name,
        plan_type: student ? `${student.plan_type}_${student.level}` : payload.plan_type,
        amount: payload.amount,
        transaction_date: payload.transaction_date,
        payment_method: payload.payment_method,
        description: [baseDescription || 'Manual academy payment', marker].filter(Boolean).join(' '),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Could not save payment');
      return;
    }
    setRevenue((items) => [data.entry, ...items]);
    event.currentTarget.reset();
    setStudentId(students[0]?.id || '');
  }

  async function deletePayment(id: string) {
    if (!confirm('Delete this payment entry?')) return;
    await fetch(`/api/revenue?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setRevenue((items) => items.filter((entry) => entry.id !== id));
  }

  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);

  const total = revenue.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const monthRevenue = revenue
    .filter((entry) => entry.transaction_date.slice(0, 7) === thisMonth)
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const previousMonthRevenue = revenue
    .filter((entry) => entry.transaction_date.slice(0, 7) === lastMonth)
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const growth = previousMonthRevenue ? Math.round(((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100) : 0;
  const payingStudents = new Set(revenue.map((entry) => getStudentMarker(entry.description)).filter(Boolean)).size;
  const averagePayment = revenue.length ? total / revenue.length : 0;

  const byStudent = useMemo(() => {
    return students.map((student) => {
      const entries = revenue.filter((entry) => getStudentMarker(entry.description) === student.id);
      const paid = entries.reduce((sum, entry) => sum + Number(entry.amount), 0);
      const lastPaid = entries.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0];
      return { student, paid, lastPaid };
    }).sort((a, b) => b.paid - a.paid);
  }, [revenue, students]);

  const bestPlan = Object.entries(revenue.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.plan_type || 'Unknown'] = (acc[entry.plan_type || 'Unknown'] || 0) + Number(entry.amount);
    return acc;
  }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={IndianRupee} label="This Month" value={currency(monthRevenue)} sub={`${growth >= 0 ? '+' : ''}${growth}% vs last month`} />
        <Metric icon={WalletCards} label="Total Collected" value={currency(total)} sub={`${revenue.length} payment entries`} />
        <Metric icon={UsersRound} label="Paying Students" value={String(payingStudents)} sub="Linked from roster payments" />
        <Metric icon={CreditCard} label="Avg Payment" value={currency(averagePayment)} sub={`Best: ${planLabels[bestPlan] || bestPlan}`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_430px]">
        <div className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Revenue Momentum</h2>
              <p className="text-sm font-semibold text-slate-500">Every manual/student payment you add appears here.</p>
            </div>
            <TrendingUp className="text-brand" size={22} />
          </div>
          <RevenueChart revenue={revenue} />
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-black">Add Payment</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Use this whenever a parent pays by Razorpay, UPI, bank, or cash.</p>
          <form className="mt-4 grid gap-3" onSubmit={addPayment}>
            <select className="select" name="student_id" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
              <option value="">Unlinked / one-off payment</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.child_name} - {student.parent_name}</option>
              ))}
            </select>
            {!studentId ? <input className="input" name="student_name" placeholder="Student / payer name" /> : null}
            <input
              className="input"
              name="plan_type"
              placeholder="Plan"
              defaultValue={selectedStudent ? `${selectedStudent.plan_type}_${selectedStudent.level}` : ''}
            />
            <input className="input" name="amount" type="number" min="1" placeholder="Amount received" required />
            <input className="input" name="transaction_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            <select className="select" name="payment_method">
              {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
            </select>
            <textarea className="textarea" name="description" placeholder="Notes: renewal, first payment, monthly fee, sibling discount..." />
            <button className="btn btn-primary"><Plus size={15} /> Add Payment</button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="card p-5">
          <h2 className="text-lg font-black">Student Totals</h2>
          <div className="mt-4 space-y-3">
            {byStudent.map(({ student, paid, lastPaid }) => (
              <div className="rounded-lg border border-slate-200 p-3" key={student.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-black">{student.child_name}</div>
                    <div className="text-xs font-semibold text-slate-500">{student.parent_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-brand">{currency(paid)}</div>
                    <div className="text-xs font-semibold text-slate-500">{lastPaid ? dateLabel(lastPaid.transaction_date) : 'No payment'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-lg font-black">Payment Ledger</h2>
            <p className="text-sm font-semibold text-slate-500">Manual source of truth for who paid what.</p>
          </div>
          <table className="table">
            <thead><tr><th>Date</th><th>Student / Payer</th><th>Plan</th><th>Amount</th><th>Method</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {revenue.map((entry) => (
                <tr key={entry.id}>
                  <td data-label="Date">{dateLabel(entry.transaction_date)}</td>
                  <td data-label="Student / Payer" className="font-bold">{entry.student_name || '-'}</td>
                  <td data-label="Plan">{planLabels[entry.plan_type || ''] || entry.plan_type || '-'}</td>
                  <td data-label="Amount" className="font-black text-brand">{currency(entry.amount)}</td>
                  <td data-label="Method"><span className="badge bg-slate-100 text-slate-700">{entry.payment_method}</span></td>
                  <td data-label="Notes" className="max-w-[260px] text-sm text-slate-500">{stripStudentMarker(entry.description) || '-'}</td>
                  <td data-label="Actions"><button className="btn btn-danger" onClick={() => deletePayment(entry.id)}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub }: { icon: typeof IndianRupee; label: string; value: string; sub: string }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-extrabold text-slate-500">{label}</div>
        <div className="rounded-lg bg-violet-50 p-2 text-brand"><Icon size={18} /></div>
      </div>
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-2 text-xs font-bold text-slate-500">{sub}</div>
    </div>
  );
}

function getStudentMarker(description?: string | null) {
  const match = String(description || '').match(/\[student:([^\]]+)\]/);
  return match?.[1] || null;
}

function stripStudentMarker(description?: string | null) {
  return String(description || '').replace(/\s*\[student:[^\]]+\]/g, '').trim();
}
