import { NextResponse } from 'next/server';
import { updateSettings } from '@/lib/data';
import { isAuthed, unauthorized } from '@/lib/auth';

export async function POST(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  const metrics = await updateSettings(await req.json());
  return NextResponse.json({ metrics });
}
