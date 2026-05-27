import { NextResponse } from 'next/server';
import { createRevenueEntry, deleteRevenueEntry, getDashboardData } from '@/lib/data';
import { isAuthed, unauthorized } from '@/lib/auth';

export async function GET() {
  if (!(await isAuthed())) return unauthorized();
  const data = await getDashboardData();
  return NextResponse.json({ revenue: data.revenue_entries });
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  const entry = await createRevenueEntry(await req.json());
  return NextResponse.json({ entry }, { status: 201 });
}

export async function DELETE(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  const { searchParams } = new URL(req.url);
  await deleteRevenueEntry(String(searchParams.get('id') || ''));
  return NextResponse.json({ ok: true });
}
