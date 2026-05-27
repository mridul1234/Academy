import { NextRequest, NextResponse } from 'next/server';
import { createLead, getDashboardData } from '@/lib/data';
import { isAuthed, requireApiKey, unauthorized } from '@/lib/auth';

export async function GET() {
  if (!(await isAuthed())) return unauthorized();
  const data = await getDashboardData();
  return NextResponse.json({ leads: data.leads, notes: data.lead_notes });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed()) && !requireApiKey(req)) return unauthorized();
  const body = await req.json();
  const lead = await createLead(body);
  return NextResponse.json({ lead }, { status: 201 });
}
