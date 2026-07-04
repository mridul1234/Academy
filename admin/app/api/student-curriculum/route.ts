import { NextResponse } from 'next/server';
import { isAuthed, unauthorized } from '@/lib/auth';
import { saveStudentCurriculum } from '@/lib/data';

export async function PATCH(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  const body = await req.json();
  const studentId = String(body.student_id || '');
  const completedTopics = Array.isArray(body.completed_topics)
    ? body.completed_topics.map(String)
    : [];

  if (!studentId) {
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  const progress = await saveStudentCurriculum(studentId, completedTopics);
  return NextResponse.json({ progress });
}
