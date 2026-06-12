import fs from 'fs/promises';
import path from 'path';
import { getSupabase } from './supabase';
import type { ClassSession, CoachProfile, CrmData, CrmSession, ScheduleEntry, SiteMetric, Student } from './types';

const localPath = path.join(process.cwd(), 'lib', 'local-data.json');
const scheduleMetricKey = 'class_schedule';
const classDurationMinutes = 45;
const crmStudentsTable = 'crm_students';
const crmMetricsTable = 'crm_site_metrics';

export const mridulCoach: CoachProfile = {
  id: 'coach_mridul',
  name: 'Mridul Bansal',
  email: process.env.CRM_COACH_EMAIL || 'mridul@chessgum.com',
  specialization: 'ChessGum coaching operations',
  active_students: 0,
};

type InternalData = {
  students: Student[];
  site_metrics: SiteMetric[];
};

async function readLocal(): Promise<InternalData> {
  try {
    const text = await fs.readFile(localPath, 'utf8');
    const data = JSON.parse(text) as InternalData;
    return {
      students: data.students || [],
      site_metrics: data.site_metrics || [],
    };
  } catch {
    return { students: [], site_metrics: [] };
  }
}

export async function getInternalData(): Promise<InternalData> {
  const supabase = getSupabase();
  if (!supabase) return readLocal();

  const [students, metrics] = await Promise.all([
    supabase.from(crmStudentsTable).select('*').order('created_at', { ascending: false }),
    supabase.from(crmMetricsTable).select('*'),
  ]);

  if (students.error || metrics.error) return readLocal();

  return {
    students: students.data || [],
    site_metrics: metrics.data || [],
  };
}

function parseSchedule(metrics: SiteMetric[]) {
  const raw = metrics.find((metric) => metric.key === scheduleMetricKey)?.value;
  if (!raw) return [] as ScheduleEntry[];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScheduleEntry[]) : [];
  } catch {
    return [];
  }
}

function occurrenceInWeek(day: number, startHour: number, weekOffset: number) {
  const now = new Date();
  const date = new Date(now);
  const delta = (day - now.getDay() + 7) % 7;
  date.setDate(now.getDate() + delta + weekOffset * 7);
  date.setHours(startHour, 0, 0, 0);

  if (weekOffset === 0 && date.getTime() <= now.getTime()) {
    date.setDate(date.getDate() + 7);
  }

  return date;
}

function remainingSessions(student: Student) {
  return Math.max(Number(student.sessions_total || 0) - Number(student.sessions_done || 0), 0);
}

function formatPlanLabel(student: Student, durationMinutes: number) {
  const plan = String(student.plan_type || 'class').replace(/_/g, ' ');
  return `${student.child_name} (${plan} - ${durationMinutes} min)`;
}

function upcomingForStudent(entries: ScheduleEntry[], student: Student) {
  const remaining = remainingSessions(student);
  if (!remaining || !entries.length) return [] as ClassSession[];

  const weeksToGenerate = Math.ceil(remaining / entries.length) + 2;
  const candidates = entries.flatMap((entry) => (
    Array.from({ length: weeksToGenerate }, (_, weekOffset) => ({
      entry,
      startsAt: occurrenceInWeek(entry.day, entry.start_hour, weekOffset),
      durationMinutes: classDurationMinutes,
    }))
  ));

  return candidates
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, remaining)
    .map((item, index) => ({
      id: `${item.entry.id}_upcoming_${index + 1}`,
      student_id: student.id,
      coach_id: mridulCoach.id,
      title: item.entry.title || formatPlanLabel(student, item.durationMinutes),
      starts_at: item.startsAt.toISOString(),
      duration_minutes: item.durationMinutes,
      status: 'upcoming',
      meeting_link: null,
      notes: item.entry.note ? `By ${mridulCoach.name} - ${item.entry.note}` : `By ${mridulCoach.name}`,
      remaining_sessions: remaining,
      session_number: Number(student.sessions_done || 0) + index + 1,
      total_sessions: Number(student.sessions_total || 0),
    }) satisfies ClassSession);
}

function scheduleToSessions(schedule: ScheduleEntry[], students: Student[]) {
  const entriesByStudent = new Map<string, ScheduleEntry[]>();
  for (const entry of schedule) {
    const list = entriesByStudent.get(entry.student_id) || [];
    list.push(entry);
    entriesByStudent.set(entry.student_id, list);
  }

  return students.flatMap((student) => {
    const entries = (entriesByStudent.get(student.id) || []).sort((a, b) => a.day - b.day || a.start_hour - b.start_hour);
    return upcomingForStudent(entries, student);
  });
}

export async function findStudentByEmail(email: string) {
  const data = await getInternalData();
  return data.students.find((student) => student.email?.toLowerCase() === email.toLowerCase()) || null;
}

export async function getCrmData(session: CrmSession): Promise<CrmData> {
  const internal = await getInternalData();
  const schedule = parseSchedule(internal.site_metrics);
  const allSessions = scheduleToSessions(schedule, internal.students);
  const activeStudents = internal.students.filter((student) => student.is_active);
  const coach = {
    ...mridulCoach,
    active_students: activeStudents.length,
  };

  if (session.role === 'student') {
    const currentStudent = internal.students.find((student) => student.id === session.subjectId);
    const classSessions = allSessions.filter((item) => item.student_id === session.subjectId);
    return { session, coach, students: currentStudent ? [currentStudent] : [], classSessions };
  }

  return { session, coach, students: internal.students, classSessions: allSessions };
}
