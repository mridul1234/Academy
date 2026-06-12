import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCrmSession } from '@/lib/auth';
import { nextTopicForPlacement, readPlacements } from '@/lib/curriculum';
import { getCrmData } from '@/lib/data';

type LessonPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export default async function LessonPage({ searchParams }: LessonPageProps) {
  const crmSession = await getCrmSession();
  if (!crmSession) redirect('/login');

  const params = searchParams ? await searchParams : {};
  const sessionId = paramValue(params.session);
  const data = await getCrmData(crmSession);
  const lesson = data.classSessions.find((item) => item.id === sessionId);
  if (!lesson) redirect('/');

  const student = data.students.find((item) => item.id === lesson.student_id);
  if (!student) redirect('/');

  const placements = await readPlacements();
  const placement = placements.find((item) => item.student_id === student.id);
  const next = nextTopicForPlacement(placement, student);

  return (
    <main className="lesson-page">
      <a className="back-link" href="/">
        <ArrowLeft className="h-4 w-4" />
        Back to schedule
      </a>

      <section className="lesson-hero">
        <div>
          <p>Today&apos;s class</p>
          <h1>{next.isComplete ? 'Review and advance' : next.topic.title}</h1>
          <span>
            {student.child_name} - {formatDate(lesson.starts_at)} - {lesson.duration_minutes} min
          </span>
        </div>
        <div className="lesson-level">
          <small>Level</small>
          <strong>{next.level.name}</strong>
        </div>
      </section>

      <section className="lesson-brief">
        <article>
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <span>Teaching objective</span>
            <p>{next.isComplete ? 'The student has completed this level. Use this class to review weak spots or move them to the next level in Curriculum.' : next.topic.objective}</p>
          </div>
        </article>
        <article>
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <span>Practice task</span>
            <p>{next.isComplete ? 'Pick two previous topics, run a short quiz, then update the student placement.' : next.topic.practice}</p>
          </div>
        </article>
        <article>
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <span>After class</span>
            <p>Go to Curriculum, mark this topic as completed for {student.child_name}, and the next Join click will show the following topic.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
