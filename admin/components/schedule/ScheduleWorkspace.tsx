'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, Check, Clock3, Plus, Trash2, UsersRound } from 'lucide-react';
import type { ScheduleEntry, Student } from '@/lib/types';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayIndexes = [1, 2, 3, 4, 5, 6, 0];
const hours = Array.from({ length: 24 }, (_, index) => index);

export function ScheduleWorkspace({
  students,
  initialSchedule,
}: {
  students: Student[];
  initialSchedule: ScheduleEntry[];
}) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [selected, setSelected] = useState<{ day: number; hour: number } | null>(null);
  const [editing, setEditing] = useState<ScheduleEntry | null>(null);
  const today = new Date().getDay();

  const activeStudents = students.filter((student) => student.is_active);
  const studentMap = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const todaysClasses = schedule
    .filter((entry) => entry.day === today)
    .sort((a, b) => a.start_hour - b.start_hour);
  const weeklyHours = schedule.reduce((sum, entry) => sum + Number(entry.duration_hours || 1), 0);

  async function persist(next: ScheduleEntry[]) {
    setSchedule(next);
    await fetch('/api/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule: next }),
    });
  }

  async function saveSlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const day = Number(form.get('day'));
    const startHour = Number(form.get('start_hour'));
    const duration = Number(form.get('duration_hours') || 1);
    const studentId = String(form.get('student_id') || '');
    const entry: ScheduleEntry = {
      id: editing?.id || `slot_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
      student_id: studentId,
      day,
      start_hour: startHour,
      duration_hours: duration,
      title: String(form.get('title') || ''),
      note: String(form.get('note') || ''),
    };
    const next = editing
      ? schedule.map((item) => (item.id === editing.id ? entry : item))
      : [...schedule.filter((item) => !(item.day === day && item.start_hour === startHour)), entry];
    await persist(next);
    setSelected(null);
    setEditing(null);
  }

  async function deleteSlot(id: string) {
    await persist(schedule.filter((entry) => entry.id !== id));
    setEditing(null);
  }

  function entryFor(day: number, hour: number) {
    return schedule.find((entry) => entry.day === day && hour >= entry.start_hour && hour < entry.start_hour + entry.duration_hours);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="card overflow-hidden">
          <div className="bg-slate-950 p-4 text-white sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-violet-100">
                  <CalendarClock size={14} /> Class Calendar
                </div>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Know exactly who you teach today, tomorrow, and this week.</h2>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 text-left sm:w-auto sm:text-right">
                <Metric label="Today" value={String(todaysClasses.length)} />
                <Metric label="Weekly hrs" value={String(weeklyHours)} />
              </div>
            </div>
          </div>
          <div className="grid gap-px bg-slate-200 md:grid-cols-3">
            <SmallMetric icon={UsersRound} label="Active students" value={String(activeStudents.length)} />
            <SmallMetric icon={Clock3} label="Open slots" value={`${days.length * hours.length - schedule.length}`} />
            <SmallMetric icon={Check} label="Scheduled" value={String(schedule.length)} />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-black">Today&apos;s Classes</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Your teaching list for today.</p>
          <div className="mt-4 space-y-3">
            {todaysClasses.map((entry) => {
              const student = studentMap.get(entry.student_id);
              return (
                <button className="w-full rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50" key={entry.id} onClick={() => setEditing(entry)}>
                  <div className="flex items-center justify-between">
                    <div className="font-black">{student?.child_name || entry.title || 'Class'}</div>
                    <span className="badge bg-violet-50 text-brand">{formatHour(entry.start_hour)} - {entry.duration_hours}h</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">{student?.parent_name || 'Unlinked'} {entry.note ? `- ${entry.note}` : ''}</div>
                </button>
              );
            })}
            {todaysClasses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm font-bold text-slate-500">No classes scheduled today.</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card overflow-hidden" id="schedule-add-slot">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h3 className="text-lg font-black">Weekly Timetable</h3>
            <p className="text-sm font-semibold text-slate-500">Click any empty hour to assign a student. Click a class to edit it.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setSelected({ day: today, hour: new Date().getHours() })}>
            <Plus size={15} /> Add Slot
          </button>
        </div>

        <div className="overflow-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[84px_repeat(7,minmax(120px,1fr))] border-b border-slate-200 bg-slate-50">
              <div className="p-3 text-xs font-black uppercase text-slate-500">Time</div>
              {dayIndexes.map((day, index) => (
                <div className={`p-3 text-sm font-black ${day === today ? 'bg-violet-50 text-brand' : ''}`} key={day}>{days[index]}</div>
              ))}
            </div>
            {hours.map((hour) => (
              <div className="grid grid-cols-[84px_repeat(7,minmax(120px,1fr))] border-b border-slate-100" key={hour}>
                <div className="bg-slate-50 p-3 text-xs font-black text-slate-500">{formatHour(hour)}</div>
                {dayIndexes.map((day) => {
                  const entry = entryFor(day, hour);
                  const startsHere = entry?.start_hour === hour;
                  const student = entry ? studentMap.get(entry.student_id) : null;
                  return (
                    <button
                      className={`min-h-[74px] border-l border-slate-100 p-2 text-left transition hover:bg-violet-50 ${day === today ? 'bg-violet-50/40' : 'bg-white'}`}
                      key={`${day}-${hour}`}
                      onClick={() => entry ? setEditing(entry) : setSelected({ day, hour })}
                    >
                      {entry && startsHere ? (
                        <div className="rounded-lg bg-slate-950 p-3 text-white shadow-sm">
                          <div className="text-sm font-black">{student?.child_name || entry.title || 'Class'}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-300">{entry.duration_hours}h - {student?.parent_name || 'Unlinked'}</div>
                        </div>
                      ) : entry ? (
                        <div className="text-xs font-bold text-slate-400">continues</div>
                      ) : (
                        <div className="text-xs font-bold text-slate-300">Available</div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {selected || editing ? (
        <SlotModal
          students={activeStudents}
          entry={editing}
          selected={selected}
          onClose={() => { setSelected(null); setEditing(null); }}
          onSave={saveSlot}
          onDelete={deleteSlot}
        />
      ) : null}
    </div>
  );
}

function SlotModal({
  students,
  entry,
  selected,
  onClose,
  onSave,
  onDelete,
}: {
  students: Student[];
  entry: ScheduleEntry | null;
  selected: { day: number; hour: number } | null;
  onClose: () => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onClick={onClose}>
      <form className="card max-h-[92vh] w-full max-w-xl overflow-auto p-4 sm:p-5" onSubmit={onSave} onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black">{entry ? 'Edit Class Slot' : 'Add Class Slot'}</h3>
            <p className="text-sm font-semibold text-slate-500">Assign a student to a weekly recurring class time.</p>
          </div>
          <button className="btn" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <select className="select md:col-span-2" name="student_id" defaultValue={entry?.student_id || ''} required>
            <option value="">Select student</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.child_name} - {student.parent_name}</option>)}
          </select>
          <select className="select" name="day" defaultValue={entry?.day ?? selected?.day ?? 1}>
            {dayIndexes.map((day, index) => <option key={day} value={day}>{days[index]}</option>)}
          </select>
          <select className="select" name="start_hour" defaultValue={entry?.start_hour ?? selected?.hour ?? 17}>
            {hours.map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
          </select>
          <select className="select" name="duration_hours" defaultValue={entry?.duration_hours || 1}>
            <option value="1">1 hour</option>
            <option value="1.5">1.5 hours</option>
            <option value="2">2 hours</option>
          </select>
          <input className="input" name="title" defaultValue={entry?.title || ''} placeholder="Optional title" />
          <textarea className="textarea md:col-span-2" name="note" defaultValue={entry?.note || ''} placeholder="Class note: tactics, trial, tournament prep..." />
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-2">
          {entry ? <button className="btn btn-danger" type="button" onClick={() => onDelete(entry.id)}><Trash2 size={15} /> Delete</button> : <span />}
          <div className="flex flex-wrap gap-2">
            <button className="btn" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary">Save Slot</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/10 p-4"><div className="text-xs font-bold uppercase text-slate-300">{label}</div><div className="mt-1 text-2xl font-black">{value}</div></div>;
}

function SmallMetric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) {
  return <div className="bg-white p-4"><div className="mb-3 inline-flex rounded-lg bg-violet-50 p-2 text-brand"><Icon size={18} /></div><div className="text-2xl font-black">{value}</div><div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</div></div>;
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:00 ${suffix}`;
}
