import { NextRequest, NextResponse } from 'next/server';
import { getCrmSession } from '@/lib/auth';
import { savePlacement } from '@/lib/curriculum';

export async function POST(req: NextRequest) {
  const session = await getCrmSession();
  if (!session || session.role !== 'coach') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const studentId = String(form.get('student_id') || '');
  const levelId = String(form.get('level_id') || '');
  const completedTopicId = String(form.get('completed_topic_id') || '');

  if (!studentId || !levelId) {
    return NextResponse.json({ error: 'Missing placement fields' }, { status: 400 });
  }

  await savePlacement(studentId, levelId, completedTopicId || undefined);
  return NextResponse.redirect(new URL('/?view=curriculum', req.url), { status: 303 });
}
