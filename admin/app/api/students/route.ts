import { NextResponse } from 'next/server';
import { createStudent, getDashboardData, updateStudent } from '@/lib/data';
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

export async function PATCH(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  const body = await req.json();
  const { id, ...updates } = body;
  const student = await updateStudent(String(id), updates);
  return NextResponse.json({ student });
}
