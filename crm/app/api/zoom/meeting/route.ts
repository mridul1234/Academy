import { NextRequest, NextResponse } from 'next/server';
import { getCrmSession } from '@/lib/auth';
import { getCrmData } from '@/lib/data';
import { createZoomMeeting, isZoomConfigured } from '@/lib/zoom';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getCrmSession();
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!isZoomConfigured()) {
    return NextResponse.json(
      { error: 'Zoom API is not configured. Add ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.' },
      { status: 500 },
    );
  }

  const sessionId = req.nextUrl.searchParams.get('session');
  const data = await getCrmData(session);
  const classSession = data.classSessions.find((item) => item.id === sessionId);

  if (!classSession) {
    return NextResponse.json({ error: 'Class session not found.' }, { status: 404 });
  }

  if (session.role === 'student' && classSession.student_id !== session.subjectId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const student = data.students.find((item) => item.id === classSession.student_id);
  let meeting;
  try {
    meeting = await createZoomMeeting({
      topic: `ChessGum Class - ${student?.child_name || 'Student'}`,
      startsAt: classSession.starts_at,
      durationMinutes: classSession.duration_minutes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create Zoom meeting.' },
      { status: 502 },
    );
  }

  const redirectUrl = session.role === 'coach' ? meeting.start_url : meeting.join_url;
  return NextResponse.redirect(redirectUrl);
}
