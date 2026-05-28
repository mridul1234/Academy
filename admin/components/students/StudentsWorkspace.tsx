'use client';

import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  Check,
  Clock3,
  Filter,
  GraduationCap,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Trophy,
  UserPlus,
  WalletCards,
} from 'lucide-react';
import type { RevenueEntry, Student } from '@/lib/types';
import { currency } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'paused' | 'churned';

type EnrichedStudent = Student & {
  paid: number;
  daysToRenewal: number | null;
  progress: number;
  remaining: number;
  computedStatus: 'active' | 'paused' | 'churned';
};

const planOptions = [
  { value: 'buddy', label: 'Buddy' },
  { value: 'individual', label: 'Individual' },
];

const levelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function StudentsWorkspace({
  initialStudents,
  revenue,
}: {
  initialStudents: Student[];
  revenue: RevenueEntry[];
}) {
  const [students, setStudents] = useState(initialStudents);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [saving, setSaving] = useState(false);

  const enriched = useMemo<EnrichedStudent[]>(() => {
    return students.map((student) => {
      const paid = revenue
        .filter((entry) => {
          const haystack = `${entry.student_name || ''} ${entry.description || ''}`.toLowerCase();
          return haystack.includes(student.child_name.toLowerCase()) || haystack.includes(student.parent_name.toLowerCase());
        })
        .reduce((sum, entry) => sum + Number(entry.amount), 0);
      const renewal = student.renewal_date ? new Date(student.renewal_date) : null;
      const today = new Date();
      const daysToRenewal = renewal ? Math.ceil((renewal.getTime() - today.getTime()) / 86400000) : null;
      const progress = student.sessions_total ? Math.min(100, Math.round((student.sessions_done / student.sessions_total) * 100)) : 0;
      const remaining = Math.max(0, Number(student.sessions_total || 0) - Number(student.sessions_done || 0));
      const computedStatus = !student.is_active ? 'paused' : daysToRenewal !== null && daysToRenewal < -14 ? 'churned' : 'active';
      return { ...student, paid, daysToRenewal, progress, remaining, computedStatus };
    });
  }, [students, revenue]);

  const filtered = enriched.filter((student) => {
    const q = query.toLowerCase();
    const matchesQuery = `${student.child_name} ${student.parent_name} ${student.phone || ''} ${student.email || ''}`
      .toLowerCase()
      .includes(q);
    const matchesStatus = status === 'all' || student.computedStatus === status;
    return matchesQuery && matchesStatus;
  });

  const active = enriched.filter((student) => student.computedStatus === 'active');
  const renewSoon = enriched.filter((student) => student.daysToRenewal !== null && student.daysToRenewal >= 0 && student.daysToRenewal <= 14);
  const overdue = enriched.filter((student) => student.daysToRenewal !== null && student.daysToRenewal < 0);
  const lowSessions = enriched.filter((student) => student.is_active && student.remaining <= 3);
  const attention = uniqueStudents([...overdue, ...renewSoon, ...lowSessions]);
  const totalPaid = enriched.reduce((sum, student) => sum + student.paid, 0);
  const completion = active.length
    ? Math.round(active.reduce((sum, student) => sum + student.progress, 0) / active.length)
    : 0;

  async function addStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);
    const studentRes = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        is_active: payload.status !== 'paused',
      }),
    });
    const studentData = await studentRes.json();

    const amount = Number(payload.opening_payment || 0);
    if (amount > 0) {
      await fetch('/api/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: `${payload.child_name} ${payload.parent_name}`,
          plan_type: `${payload.plan_type}_${payload.level}`,
          amount,
          transaction_date: payload.enrolled_date || new Date().toISOString().slice(0, 10),
          payment_method: 'manual',
          description: 'Opening payment from student roster',
        }),
      });
    }

    setStudents((items) => [studentData.student, ...items]);
    event.currentTarget.reset();
    setSaving(false);
  }

  async function patchStudent(id: string, updates: Partial<Student>) {
    const res = await fetch('/api/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    const data = await res.json();
    setStudents((items) => items.map((student) => (student.id === id ? data.student : student)));
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card overflow-hidden">
          <div className="bg-slate-950 p-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-violet-100">
                  <GraduationCap size={14} /> Academy Roster
                </div>
                <h2 className="text-3xl font-black tracking-tight">Students, renewals, sessions, and payments in one place.</h2>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-4 text-right">
                <div className="text-xs font-bold uppercase text-slate-300">Roster Revenue</div>
                <div className="mt-1 text-2xl font-black">{currency(totalPaid)}</div>
              </div>
            </div>
          </div>
          <div className="grid gap-px bg-slate-200 md:grid-cols-4">
            <Metric icon={GraduationCap} label="Active" value={String(active.length)} tone="emerald" />
            <Metric icon={CalendarClock} label="Renew soon" value={String(renewSoon.length)} tone="amber" />
            <Metric icon={AlertTriangle} label="Overdue" value={String(overdue.length)} tone="red" />
            <Metric icon={BookOpen} label="Avg sessions" value={`${completion}%`} tone="violet" />
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black">Needs Attention</h3>
              <p className="text-sm font-semibold text-slate-500">Renewals and low-session students</p>
            </div>
            <Clock3 className="text-amber-500" size={22} />
          </div>
          <div className="space-y-3">
            {attention.slice(0, 5).map((student) => (
              <AttentionItem key={student.id} student={student} />
            ))}
            {attention.length === 0 ? (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                <Check size={15} className="mr-2 inline" /> No urgent roster actions today.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section id="add-student-panel" className="card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-violet-50 p-2 text-brand">
            <UserPlus size={19} />
          </div>
          <div>
            <h3 className="text-lg font-black">Add Student</h3>
            <p className="text-sm font-semibold text-slate-500">Backfill existing students or add a newly enrolled child</p>
          </div>
        </div>
        <form className="grid gap-3 lg:grid-cols-6" onSubmit={addStudent}>
          <input className="input lg:col-span-2" name="child_name" placeholder="Child name" required />
          <input className="input lg:col-span-2" name="parent_name" placeholder="Parent name" required />
          <input className="input lg:col-span-2" name="phone" placeholder="Phone" />
          <input className="input lg:col-span-2" name="email" placeholder="Email" />
          <select className="select" name="plan_type">{planOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <select className="select" name="level">{levelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <input className="input" name="enrolled_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          <input className="input" name="renewal_date" type="date" />
          <input className="input" name="sessions_done" type="number" min="0" placeholder="Done" defaultValue="0" />
          <input className="input" name="sessions_total" type="number" min="1" placeholder="Total" defaultValue="24" />
          <input className="input" name="opening_payment" type="number" min="0" placeholder="Payment received" />
          <select className="select" name="status"><option value="active">Active</option><option value="paused">Paused</option></select>
          <textarea className="textarea lg:col-span-5" name="notes" placeholder="Batch time, coach notes, parent preferences, renewal context..." />
          <button className="btn btn-primary lg:col-span-1" disabled={saving}>
            <Plus size={16} /> {saving ? 'Saving' : 'Save'}
          </button>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input className="input pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student, parent, phone..." />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400" size={16} />
            <select className="select w-auto" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
              <option value="all">All students</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-2">
          {filtered.map((student) => (
            <StudentCard key={student.id} student={student} onPatch={patchStudent} />
          ))}
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <div className="font-black text-slate-700">No students match this view.</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">Clear search or add a new student above.</div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function uniqueStudents(students: EnrichedStudent[]) {
  const seen = new Set<string>();
  return students.filter((student) => {
    if (seen.has(student.id)) return false;
    seen.add(student.id);
    return true;
  });
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'emerald' | 'amber' | 'red' | 'violet';
}) {
  const tones = {
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    red: 'text-red-700 bg-red-50',
    violet: 'text-violet-700 bg-violet-50',
  };
  return (
    <div className="bg-white p-4">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function AttentionItem({ student }: { student: EnrichedStudent }) {
  const isOverdue = student.daysToRenewal !== null && student.daysToRenewal < 0;
  const renewSoon = student.daysToRenewal !== null && student.daysToRenewal >= 0 && student.daysToRenewal <= 14;
  const text = isOverdue
    ? `${Math.abs(student.daysToRenewal || 0)} days overdue`
    : renewSoon
      ? `Renews in ${student.daysToRenewal} days`
      : `${student.remaining} sessions left`;

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
      <div>
        <div className="font-black">{student.child_name}</div>
        <div className="text-xs font-semibold text-slate-500">{student.parent_name}</div>
      </div>
      <span className={`badge ${isOverdue ? 'bg-red-50 text-red-700' : student.remaining <= 3 ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'}`}>
        {text}
      </span>
    </div>
  );
}

function StudentCard({
  student,
  onPatch,
}: {
  student: EnrichedStudent;
  onPatch: (id: string, updates: Partial<Student>) => void;
}) {
  const initials = `${student.child_name?.[0] || 'S'}${student.parent_name?.[0] || 'P'}`.toUpperCase();
  const waText = encodeURIComponent(`Hi ${student.parent_name}, this is from ChessGum. Quick update about ${student.child_name}'s classes.`);
  const renewalTone =
    student.daysToRenewal === null
      ? 'bg-slate-100 text-slate-600'
      : student.daysToRenewal < 0
        ? 'bg-red-50 text-red-700'
        : student.daysToRenewal <= 14
          ? 'bg-amber-50 text-amber-700'
          : 'bg-emerald-50 text-emerald-700';
  const renewalText =
    student.daysToRenewal === null
      ? 'No renewal date'
      : student.daysToRenewal < 0
        ? `${Math.abs(student.daysToRenewal)}d overdue`
        : `${student.daysToRenewal}d to renewal`;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">{initials}</div>
          <div>
            <div className="text-lg font-black">{student.child_name}</div>
            <div className="text-sm font-semibold text-slate-500">{student.parent_name}</div>
          </div>
        </div>
        <span className={student.computedStatus === 'active' ? 'badge bg-emerald-50 text-emerald-700' : student.computedStatus === 'churned' ? 'badge bg-red-50 text-red-700' : 'badge bg-slate-100 text-slate-600'}>
          {student.computedStatus}
        </span>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <InfoTile icon={Trophy} label="Plan" value={`${student.plan_type || '-'} · ${student.level || '-'}`} />
        <InfoTile icon={WalletCards} label="Matched paid" value={currency(student.paid)} />
        <InfoTile icon={CalendarClock} label="Renewal" value={renewalText} tone={renewalTone} />
      </div>

      <div className="mb-4 rounded-lg bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-extrabold text-slate-700">Session progress</span>
          <span className="font-black">{student.sessions_done}/{student.sessions_total}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-brand" style={{ width: `${student.progress}%` }} />
        </div>
        <div className="mt-2 text-xs font-bold text-slate-500">{student.remaining} sessions remaining</div>
      </div>

      {student.notes ? <div className="mb-4 rounded-lg border border-violet-100 bg-violet-50 p-3 text-sm font-semibold text-violet-800">{student.notes}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {student.phone ? <a className="btn" href={`tel:${student.phone}`}><Phone size={15} /></a> : null}
          {student.phone ? <a className="btn" href={`https://wa.me/91${student.phone}?text=${waText}`} target="_blank"><MessageCircle size={15} /></a> : null}
          {student.email ? <a className="btn" href={`mailto:${student.email}`}><Mail size={15} /></a> : null}
        </div>
        <div className="flex gap-2">
          <button
            className="btn"
            onClick={() => onPatch(student.id, { sessions_done: Math.max(0, Number(student.sessions_done || 0) - 1) })}
          >
            -1
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onPatch(student.id, { sessions_done: Math.min(Number(student.sessions_total || 0), Number(student.sessions_done || 0) + 1) })}
          >
            +1 Session
          </button>
          <button className="btn" onClick={() => onPatch(student.id, { is_active: !student.is_active })}>
            {student.is_active ? 'Pause' : 'Activate'}
          </button>
        </div>
      </div>
    </article>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
        <Icon size={14} /> {label}
      </div>
      <div className={`inline-flex rounded-full px-2 py-1 text-sm font-black ${tone || 'bg-slate-100 text-slate-700'}`}>{value}</div>
    </div>
  );
}
