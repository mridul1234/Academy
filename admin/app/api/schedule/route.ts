import { NextResponse } from 'next/server';
import { getDashboardData, parseSchedule, saveSchedule } from '@/lib/data';
import { isAuthed, unauthorized } from '@/lib/auth';

export async function GET() {
  if (!(await isAuthed())) return unauthorized();
  const data = await getDashboardData();
  return NextResponse.json({ schedule: parseSchedule(data.site_metrics) });
}

export async function PUT(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  const body = await req.json();
  const schedule = await saveSchedule(Array.isArray(body.schedule) ? body.schedule : []);
  return NextResponse.json({ schedule });
}
