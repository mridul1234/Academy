import fs from 'fs/promises';
import path from 'path';
import { getSupabase } from './supabase';
import type { DashboardData, Lead, LeadNote, RevenueEntry, Student } from './types';
import { normalizeSource, planAmount, uid } from './utils';

const localPath = path.join(process.cwd(), 'lib', 'local-data.json');

async function readLocal(): Promise<DashboardData> {
  const text = await fs.readFile(localPath, 'utf8');
  return JSON.parse(text) as DashboardData;
}

async function writeLocal(data: DashboardData) {
  await fs.writeFile(localPath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabase();
  if (!supabase) return readLocal();

  const [leads, notes, revenue, students, metrics] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('lead_notes').select('*').order('created_at', { ascending: false }),
    supabase.from('revenue_entries').select('*').order('transaction_date', { ascending: false }),
    supabase.from('students').select('*').order('created_at', { ascending: false }),
    supabase.from('site_metrics').select('*'),
  ]);

  return {
    leads: leads.data || [],
    lead_notes: notes.data || [],
    revenue_entries: revenue.data || [],
    students: students.data || [],
    site_metrics: metrics.data || [],
  };
}

export async function createLead(input: Partial<Lead> & { parentName?: string; childName?: string; childAge?: string | number }) {
  const lead: Lead = {
    id: uid('lead'),
    created_at: new Date().toISOString(),
    parent_name: input.parent_name || input.parentName || '',
    child_name: input.child_name || input.childName || '',
    email: input.email || null,
    phone: input.phone || '',
    child_age: Number(input.child_age || input.childAge || 0) || null,
    source: normalizeSource(input.source),
    message: input.message || null,
    interested_plan: input.interested_plan || 'buddy_beginner',
    status: input.status || 'new',
    is_paid: Boolean(input.is_paid),
    payment_amount: input.payment_amount || null,
    payment_date: input.payment_date || null,
    enrolled_at: input.enrolled_at || null,
    lost_reason: input.lost_reason || null,
    last_contacted_at: null,
    archived: false,
  };

  const supabase = getSupabase();
  if (supabase) {
    const { id, ...insertLead } = lead;
    void id;
    const { data, error } = await supabase.from('leads').insert(insertLead).select('*').single();
    if (error) throw error;
    return data as Lead;
  }

  const data = await readLocal();
  data.leads.unshift(lead);
  await writeLocal(data);
  return lead;
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Lead;
  }

  const data = await readLocal();
  const idx = data.leads.findIndex((lead) => lead.id === id);
  if (idx === -1) throw new Error('Lead not found');
  data.leads[idx] = { ...data.leads[idx], ...updates };
  await writeLocal(data);
  return data.leads[idx];
}

export async function addLeadNote(leadId: string, content: string) {
  const note: LeadNote = { id: uid('note'), lead_id: leadId, content, created_at: new Date().toISOString() };
  const supabase = getSupabase();
  if (supabase) {
    const { id, ...insertNote } = note;
    void id;
    const { data, error } = await supabase.from('lead_notes').insert(insertNote).select('*').single();
    if (error) throw error;
    return data as LeadNote;
  }
  const data = await readLocal();
  data.lead_notes.unshift(note);
  await writeLocal(data);
  return note;
}

export async function createRevenueEntry(input: Partial<RevenueEntry>) {
  const entry: RevenueEntry = {
    id: uid('rev'),
    created_at: new Date().toISOString(),
    transaction_date: input.transaction_date || new Date().toISOString().slice(0, 10),
    amount: Number(input.amount || planAmount(input.plan_type)),
    student_name: input.student_name || null,
    plan_type: input.plan_type || null,
    payment_method: input.payment_method || 'manual',
    razorpay_payment_id: input.razorpay_payment_id || null,
    description: input.description || null,
    lead_id: input.lead_id || null,
  };

  const supabase = getSupabase();
  if (supabase) {
    const { id, ...insertEntry } = entry;
    void id;
    const { data, error } = await supabase.from('revenue_entries').insert(insertEntry).select('*').single();
    if (error) throw error;
    return data as RevenueEntry;
  }
  const data = await readLocal();
  data.revenue_entries.unshift(entry);
  await writeLocal(data);
  return entry;
}

export async function deleteRevenueEntry(id: string) {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('revenue_entries').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const data = await readLocal();
  data.revenue_entries = data.revenue_entries.filter((entry) => entry.id !== id);
  await writeLocal(data);
}

export async function cleanupRosterRevenueDuplicates() {
  const data = await getDashboardData();
  const rosterEntries = data.revenue_entries
    .filter((entry) => (entry.description || '').includes('student roster'))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const activeStudentIds = new Set(data.students.map((student) => student.id));
  const seen = new Set<string>();
  const deleteIds: string[] = [];

  for (const entry of rosterEntries) {
    const marker = getStudentMarker(entry.description);
    const key = marker && activeStudentIds.has(marker)
      ? `student:${marker}`
      : `orphan:${(entry.student_name || '').toLowerCase()}|${entry.amount}|${entry.transaction_date}`;
    if (seen.has(key) || !marker || !activeStudentIds.has(marker)) {
      deleteIds.push(entry.id);
    } else {
      seen.add(key);
    }
  }

  if (!deleteIds.length) return { deleted: 0 };

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('revenue_entries').delete().in('id', deleteIds);
    if (error) throw error;
    return { deleted: deleteIds.length };
  }

  const local = await readLocal();
  local.revenue_entries = local.revenue_entries.filter((entry) => !deleteIds.includes(entry.id));
  await writeLocal(local);
  return { deleted: deleteIds.length };
}

export async function createStudent(input: Partial<Student>) {
  const student: Student = {
    id: uid('student'),
    lead_id: input.lead_id || null,
    child_name: input.child_name || '',
    parent_name: input.parent_name || '',
    email: input.email || null,
    phone: input.phone || null,
    plan_type: input.plan_type || 'buddy',
    level: input.level || 'beginner',
    enrolled_date: input.enrolled_date || new Date().toISOString().slice(0, 10),
    renewal_date: input.renewal_date || null,
    is_active: input.is_active ?? true,
    sessions_total: Number(input.sessions_total || 24),
    sessions_done: Number(input.sessions_done || 0),
    notes: input.notes || null,
    created_at: new Date().toISOString(),
  };
  const supabase = getSupabase();
  if (supabase) {
    const { id, ...insertStudent } = student;
    void id;
    const { data, error } = await supabase.from('students').insert(insertStudent).select('*').single();
    if (error) throw error;
    return data as Student;
  }
  const data = await readLocal();
  data.students.unshift(student);
  await writeLocal(data);
  return student;
}

export async function updateStudent(id: string, updates: Partial<Student>) {
  const normalized: Partial<Student> = {
    ...updates,
  };
  if (updates.sessions_total !== undefined) normalized.sessions_total = Number(updates.sessions_total);
  if (updates.sessions_done !== undefined) normalized.sessions_done = Number(updates.sessions_done);

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('students').update(normalized).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Student;
  }

  const data = await readLocal();
  const idx = data.students.findIndex((student) => student.id === id);
  if (idx === -1) throw new Error('Student not found');
  data.students[idx] = { ...data.students[idx], ...normalized };
  await writeLocal(data);
  return data.students[idx];
}

export async function deleteStudent(id: string) {
  const supabase = getSupabase();
  if (supabase) {
    const { error: revenueError } = await supabase
      .from('revenue_entries')
      .delete()
      .ilike('description', `%[student:${id}]%`);
    if (revenueError) throw revenueError;

    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
    return;
  }

  const data = await readLocal();
  data.revenue_entries = data.revenue_entries.filter(
    (entry) => !(entry.description || '').includes(`[student:${id}]`),
  );
  data.students = data.students.filter((student) => student.id !== id);
  await writeLocal(data);
}

function getStudentMarker(description?: string | null) {
  const match = String(description || '').match(/\[student:([^\]]+)\]/);
  return match?.[1] || null;
}

export async function updateSettings(metrics: Record<string, string>) {
  const data = await readLocal();
  data.site_metrics = Object.entries(metrics).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  await writeLocal(data);
  return data.site_metrics;
}
