import { NextRequest, NextResponse } from 'next/server';
import { addLeadNote, updateLead } from '@/lib/data';
import { isAuthed, unauthorized } from '@/lib/auth';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return unauthorized();
  const body = await req.json();
  const params = await context.params;
  const lead = await updateLead(params.id, body);
  return NextResponse.json({ lead });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return unauthorized();
  const body = await req.json();
  const params = await context.params;
  const note = await addLeadNote(params.id, String(body.content || ''));
  return NextResponse.json({ note }, { status: 201 });
}
