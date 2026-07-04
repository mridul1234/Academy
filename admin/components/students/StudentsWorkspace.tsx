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
  Trash2,
  Trophy,
  UserPlus,
  WalletCards,
} from 'lucide-react';
import type { RevenueEntry, Student } from '@/lib/types';
import { currency } from '@/lib/utils';
import {
  curriculumByLevel,
  normalizeCurriculumLevel,
  type CurriculumLevel,
  type StudentCurriculumProgress,
} from '@/lib/student-curriculum';

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

function completedTopicsFor(student: Student, progress: StudentCurriculumProgress) {
  const saved = progress[student.id];
  if (saved) return saved.completed_topics;
  const curriculum = curriculumByLevel[normalizeCurriculumLevel(student.level)];
  return curriculum.slice(0, Math.max(0, Number(student.sessions_done || 0)));
}

export function StudentsWorkspace({
  initialStudents,
  revenue,
  initialCurriculumProgress,
}: {
  initialStudents: Student[];
  revenue: RevenueEntry[];
  initialCurriculumProgress: StudentCurriculumProgress;
}) {
  const [students, setStudents] = useState(initialStudents);
  const [revenueEntries, setRevenueEntries] = useState(revenue);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [curriculumStudent, setCurriculumStudent] = useState<Student | null>(null);
  const [curriculumProgress, setCurriculumProgress] = useState(initialCurriculumProgress);

  const enriched = useMemo<EnrichedStudent[]>(() => {
    return students.map((student) => {
      const paid = revenueEntries
        .filter((entry) => (entry.description || '').includes(`[student:${student.id}]`))
        .reduce((sum, entry) => sum + Number(entry.amount), 0);
      const renewal = student.renewal_date ? new Date(student.renewal_date) : null;
      const today = new Date();
      const daysToRenewal = renewal ? Math.ceil((renewal.getTime() - today.getTime()) / 86400000) : null;
      const progress = student.sessions_total ? Math.min(100, Math.round((student.sessions_done / student.sessions_total) * 100)) : 0;
      const remaining = Math.max(0, Number(student.sessions_total || 0) - Number(student.sessions_done || 0));
      const computedStatus = !student.is_active ? 'paused' : daysToRenewal !== null && daysToRenewal < -14 ? 'churned' : 'active';
      return { ...student, paid, daysToRenewal, progress, remaining, computedStatus };
    });
  }, [students, revenueEntries]);

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
    const structuredNotes = [
      payload.batch_time ? `Batch: ${payload.batch_time}` : '',
      payload.student_goal ? `Goal: ${payload.student_goal}` : '',
      payload.current_focus ? `Current focus: ${payload.current_focus}` : '',
      payload.homework ? `Homework: ${payload.homework}` : '',
      payload.notes ? `Notes: ${payload.notes}` : '',
    ].filter(Boolean).join('\n');
    const studentRes = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        notes: structuredNotes,
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
          description: `Opening payment from student roster [student:${studentData.student.id}]`,
        }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payment save failed');
        return data;
      }).then((data) => {
        if (data.entry) setRevenueEntries((items) => [data.entry, ...items]);
      }).catch((error) => {
        alert(`Student was saved, but payment was not added: ${error.message}`);
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
    if (editing?.id === id) setEditing(data.student);
  }

  async function removeStudent(id: string) {
    if (!confirm('Delete this student from the roster? Opening payment created from this student card will also be removed. Razorpay/manual revenue stays untouched.')) return;
    await fetch(`/api/students?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setStudents((items) => items.filter((student) => student.id !== id));
    setRevenueEntries((items) => items.filter((entry) => !(entry.description || '').includes(`[student:${id}]`)));
    if (editing?.id === id) setEditing(null);
  }

  async function cleanupDuplicates() {
    const res = await fetch('/api/revenue', { method: 'PATCH' });
    const result = await res.json();
    const refreshed = await fetch('/api/revenue').then((r) => r.json());
    setRevenueEntries(refreshed.revenue || []);
    alert(`Cleaned ${result.deleted || 0} duplicate/orphan roster payment entries.`);
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);
    await patchStudent(editing.id, {
      child_name: String(payload.child_name || ''),
      parent_name: String(payload.parent_name || ''),
      phone: String(payload.phone || ''),
      email: String(payload.email || ''),
      plan_type: String(payload.plan_type || ''),
      level: String(payload.level || ''),
      enrolled_date: String(payload.enrolled_date || ''),
      renewal_date: String(payload.renewal_date || ''),
      sessions_done: Number(payload.sessions_done || 0),
      sessions_total: Number(payload.sessions_total || 24),
      is_active: payload.status !== 'paused',
      notes: String(payload.notes || ''),
    });
    setEditing(null);
  }

  async function saveCurriculum(student: Student, level: CurriculumLevel, completedTopics: string[]) {
    const studentRes = await fetch('/api/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: student.id,
        level,
        sessions_done: completedTopics.length,
        sessions_total: curriculumByLevel[level].length,
      }),
    });
    const studentData = await studentRes.json();
    if (!studentRes.ok) throw new Error(studentData.error || 'Student update failed');

    const progressRes = await fetch('/api/student-curriculum', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id, completed_topics: completedTopics }),
    });
    const progressData = await progressRes.json();
    if (!progressRes.ok) throw new Error(progressData.error || 'Curriculum update failed');

    setStudents((items) => items.map((item) => (item.id === student.id ? studentData.student : item)));
    setCurriculumProgress((current) => ({ ...current, [student.id]: progressData.progress }));
    setCurriculumStudent(null);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card overflow-hidden">
          <div className="bg-slate-950 p-4 text-white sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-violet-100">
                  <GraduationCap size={14} /> Academy Roster
                </div>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Students, renewals, sessions, and payments in one place.</h2>
              </div>
              <div className="w-full rounded-lg border border-white/10 bg-white/10 p-4 text-left sm:w-auto sm:text-right">
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
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="rounded-lg bg-violet-50 p-2 text-brand">
            <UserPlus size={19} />
          </div>
          <div>
            <h3 className="text-lg font-black">Add Student</h3>
            <p className="text-sm font-semibold text-slate-500">Backfill existing students or add a newly enrolled child</p>
          </div>
          <button className="btn sm:ml-auto" type="button" onClick={cleanupDuplicates}>
            Clean duplicate payments
          </button>
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
          <input className="input lg:col-span-2" name="batch_time" placeholder="Batch/time e.g. Tue Thu 6 PM" />
          <input className="input lg:col-span-2" name="student_goal" placeholder="Goal e.g. basics, tournament prep" />
          <input className="input lg:col-span-2" name="current_focus" placeholder="Current focus e.g. tactics, openings" />
          <input className="input lg:col-span-3" name="homework" placeholder="Homework / next practice" />
          <textarea className="textarea lg:col-span-2" name="notes" placeholder="Parent preferences, coach notes, renewal context..." />
          <button className="btn btn-primary lg:col-span-1" disabled={saving}>
            <Plus size={16} /> {saving ? 'Saving' : 'Save'}
          </button>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-0 flex-1 basis-full sm:min-w-[260px] sm:basis-auto">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input className="input pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student, parent, phone..." />
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Filter className="text-slate-400" size={16} />
            <select className="select w-full sm:w-auto" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
              <option value="all">All students</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-2">
          {filtered.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              completedTopics={completedTopicsFor(student, curriculumProgress)}
              onPatch={patchStudent}
              onEdit={setEditing}
              onCurriculum={setCurriculumStudent}
              onDelete={removeStudent}
            />
          ))}
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <div className="font-black text-slate-700">No students match this view.</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">Clear search or add a new student above.</div>
            </div>
          ) : null}
        </div>
      </section>

      {editing ? (
        <EditStudentModal
          student={editing}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
        />
      ) : null}

      {curriculumStudent ? (
        <CurriculumModal
          student={curriculumStudent}
          completedTopics={completedTopicsFor(curriculumStudent, curriculumProgress)}
          onClose={() => setCurriculumStudent(null)}
          onSave={saveCurriculum}
        />
      ) : null}
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
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3">
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
  completedTopics,
  onPatch,
  onEdit,
  onCurriculum,
  onDelete,
}: {
  student: EnrichedStudent;
  completedTopics: string[];
  onPatch: (id: string, updates: Partial<Student>) => void;
  onEdit: (student: Student) => void;
  onCurriculum: (student: Student) => void;
  onDelete: (id: string) => void;
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
  const todayLine = `Session logged ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  const curriculum = curriculumByLevel[normalizeCurriculumLevel(student.level)];
  const nextTopic = curriculum.find((topic) => !completedTopics.includes(topic));

  function addMonths(months: number) {
    const base = student.renewal_date ? new Date(student.renewal_date) : new Date();
    base.setMonth(base.getMonth() + months);
    return base.toISOString().slice(0, 10);
  }

  function appendNote(line: string) {
    return [student.notes || '', line].filter(Boolean).join('\n');
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">{initials}</div>
          <div>
            <div className="text-lg font-black">{student.child_name}</div>
            <div className="text-sm font-semibold text-slate-500">{student.parent_name}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={student.computedStatus === 'active' ? 'badge bg-emerald-50 text-emerald-700' : student.computedStatus === 'churned' ? 'badge bg-red-50 text-red-700' : 'badge bg-slate-100 text-slate-600'}>
            {student.computedStatus}
          </span>
          <button className="btn" onClick={() => onEdit(student)}>Edit</button>
          <button className="btn btn-danger" onClick={() => onDelete(student.id)} aria-label={`Delete ${student.child_name}`}>
            <Trash2 size={15} />
          </button>
        </div>
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
        <div className="mt-2 border-t border-slate-200 pt-2 text-xs font-bold text-slate-600">
          Next topic: {nextTopic || 'Curriculum completed'}
        </div>
      </div>

      {student.notes ? <div className="mb-4 rounded-lg border border-violet-100 bg-violet-50 p-3 text-sm font-semibold text-violet-800">{student.notes}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {student.phone ? <a className="btn" href={`tel:${student.phone}`}><Phone size={15} /></a> : null}
          {student.phone ? <a className="btn" href={`https://wa.me/91${student.phone}?text=${waText}`} target="_blank"><MessageCircle size={15} /></a> : null}
          {student.email ? <a className="btn" href={`mailto:${student.email}`}><Mail size={15} /></a> : null}
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => onCurriculum(student)}>
            <BookOpen size={15} /> Curriculum
          </button>
          <button
            className="btn"
            onClick={() => onPatch(student.id, { sessions_done: Math.max(0, Number(student.sessions_done || 0) - 1) })}
          >
            -1
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onPatch(student.id, {
              sessions_done: Math.min(Number(student.sessions_total || 0), Number(student.sessions_done || 0) + 1),
              notes: appendNote(todayLine),
            })}
          >
            +1 Session
          </button>
          <button className="btn" onClick={() => onPatch(student.id, { renewal_date: addMonths(1), is_active: true })}>
            Renew 1m
          </button>
          <button className="btn" onClick={() => onPatch(student.id, { renewal_date: addMonths(3), is_active: true })}>
            Renew 3m
          </button>
          <button className="btn" onClick={() => onPatch(student.id, { is_active: !student.is_active })}>
            {student.is_active ? 'Pause' : 'Activate'}
          </button>
        </div>
      </div>
    </article>
  );
}

function EditStudentModal({
  student,
  onClose,
  onSave,
}: {
  student: Student;
  onClose: () => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onClick={onClose}>
      <form className="card max-h-[92vh] w-full max-w-4xl overflow-auto p-4 sm:p-5" onSubmit={onSave} onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black">Edit Student</h3>
            <p className="text-sm font-semibold text-slate-500">Update roster, renewal, sessions, contact, and coach notes.</p>
          </div>
          <button className="btn" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="grid gap-3 lg:grid-cols-6">
          <input className="input lg:col-span-2" name="child_name" defaultValue={student.child_name} placeholder="Child name" required />
          <input className="input lg:col-span-2" name="parent_name" defaultValue={student.parent_name} placeholder="Parent name" required />
          <input className="input lg:col-span-2" name="phone" defaultValue={student.phone || ''} placeholder="Phone" />
          <input className="input lg:col-span-2" name="email" defaultValue={student.email || ''} placeholder="Email" />
          <select className="select" name="plan_type" defaultValue={student.plan_type || 'buddy'}>{planOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <select className="select" name="level" defaultValue={student.level || 'beginner'}>{levelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <input className="input" name="enrolled_date" type="date" defaultValue={student.enrolled_date || ''} />
          <input className="input" name="renewal_date" type="date" defaultValue={student.renewal_date || ''} />
          <input className="input" name="sessions_done" type="number" min="0" defaultValue={student.sessions_done} />
          <input className="input" name="sessions_total" type="number" min="1" defaultValue={student.sessions_total} />
          <select className="select" name="status" defaultValue={student.is_active ? 'active' : 'paused'}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
          <textarea className="textarea lg:col-span-6" name="notes" rows={8} defaultValue={student.notes || ''} placeholder="Batch, goal, current focus, homework, parent preferences, session log..." />
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button className="btn" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  );
}

function CurriculumModal({
  student,
  completedTopics,
  onClose,
  onSave,
}: {
  student: Student;
  completedTopics: string[];
  onClose: () => void;
  onSave: (student: Student, level: CurriculumLevel, completedTopics: string[]) => Promise<void>;
}) {
  const [level, setLevel] = useState<CurriculumLevel>(normalizeCurriculumLevel(student.level));
  const [completed, setCompleted] = useState<string[]>(completedTopics);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const curriculum = curriculumByLevel[level];
  const validCompleted = completed.filter((topic) => curriculum.includes(topic));
  const nextTopic = curriculum.find((topic) => !validCompleted.includes(topic));
  const progress = Math.round((validCompleted.length / curriculum.length) * 100);

  function toggleTopic(topic: string) {
    setCompleted((items) => items.includes(topic)
      ? items.filter((item) => item !== topic)
      : [...items, topic]);
  }

  function completeThrough(index: number) {
    const through = curriculum.slice(0, index + 1);
    setCompleted((items) => Array.from(new Set([...items, ...through])));
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      await onSave(student, level, validCompleted);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save curriculum');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onClick={onClose}>
      <section className="card flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-brand">Curriculum Tracker</div>
              <h3 className="mt-1 text-xl font-black">{student.child_name}</h3>
              <p className="text-sm font-semibold text-slate-500">Mark what was completed after each class and see what comes next.</p>
            </div>
            <button className="btn" type="button" onClick={onClose}>Close</button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[200px_1fr]">
            <label>
              <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">Student level</span>
              <select
                className="select"
                value={level}
                onChange={(event) => setLevel(event.target.value as CurriculumLevel)}
              >
                {levelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-extrabold">{validCompleted.length} of {curriculum.length} completed</span>
                <span className="badge bg-violet-50 text-violet-700">{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 text-xs font-bold text-slate-600">Next: {nextTopic || 'Curriculum completed'}</div>
            </div>
          </div>
        </div>

        <div className="overflow-auto p-4 sm:p-5">
          <div className="grid gap-2 md:grid-cols-2">
            {curriculum.map((topic, index) => {
              const isCompleted = validCompleted.includes(topic);
              const isNext = topic === nextTopic;
              return (
                <div
                  className={`rounded-lg border p-3 ${isCompleted ? 'border-emerald-200 bg-emerald-50' : isNext ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white'}`}
                  key={topic}
                >
                  <div className="flex items-start gap-3">
                    <input
                      aria-label={`Mark ${topic} completed`}
                      checked={isCompleted}
                      className="mt-1 h-4 w-4 accent-emerald-600"
                      onChange={() => toggleTopic(topic)}
                      type="checkbox"
                    />
                    <button className="min-w-0 flex-1 text-left" type="button" onClick={() => toggleTopic(topic)}>
                      <div className="text-xs font-black uppercase tracking-wide text-slate-400">Class {index + 1}</div>
                      <div className="font-extrabold text-slate-800">{topic}</div>
                      {isNext ? <span className="badge mt-2 bg-violet-100 text-violet-700">Next class</span> : null}
                    </button>
                    {!isCompleted ? (
                      <button className="btn px-2 py-1 text-xs" type="button" onClick={() => completeThrough(index)} title="Mark this and all earlier classes complete">
                        Through
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
          {error ? <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button className="btn" type="button" onClick={() => setCompleted([])}>Clear progress</button>
            <button className="btn" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving} type="button" onClick={save}>
              <Check size={16} /> {saving ? 'Saving' : 'Save Progress'}
            </button>
          </div>
        </div>
      </section>
    </div>
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
