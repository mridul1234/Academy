import { NextResponse } from 'next/server';
import { createStudent, getDashboardData } from '@/lib/data';
import { isAuthed, unauthorized } from '@/lib/auth';

export async function GET() {
  if (!(await isAuthed())) return unauthorized();
  const data = await getDashboardData();
  return NextResponse.json({ students: data.students });
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  const student = await createStudent(await req.json());
  return NextResponse.json({ student }, { status: 201 });
}
