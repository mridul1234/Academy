import { redirect } from 'next/navigation';
import { CalendarDays, CheckCircle2, Filter, LogOut, PlayCircle, Search, Users, Video } from 'lucide-react';
import { getCrmSession } from '@/lib/auth';
import { curriculumStandard, nextTopicForPlacement, readPlacements } from '@/lib/curriculum';
import { getCrmData } from '@/lib/data';
import type { ClassSession, Student } from '@/lib/types';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const tabs = ['upcoming', 'completed'] as const;
const views = ['sessions', 'curriculum', 'students'] as const;

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

function formatInputDate(value: Date) {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function sessionDate(value: string) {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date),
    day: new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(date),
    time: new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date),
    inputDate: formatInputDate(date),
  };
}

function studentName(students: Student[], studentId: string) {
  return students.find((student) => student.id === studentId)?.child_name || 'Unknown student';
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function buildQuery(params: Record<string, string>, updates: Record<string, string>) {
  const query = new URLSearchParams(params);
  Object.entries(updates).forEach(([key, value]) => {
    if (value) query.set(key, value);
    else query.delete(key);
  });
  const text = query.toString();
  return text ? `/?${text}` : '/';
}

function cleanTitle(title: string, fallback: string) {
  const detail = title.match(/\(([^)]+)\)/)?.[1];
  return detail ? detail.trim() : fallback;
}

function SessionCard({
  session,
  students,
  role,
  nextTopicTitle,
}: {
  session: ClassSession;
  students: Student[];
  role: 'coach' | 'student';
  nextTopicTitle?: string;
}) {
  const when = sessionDate(session.starts_at);
  const name = studentName(students, session.student_id);
  const isCompleted = session.status === 'completed';
  const planLabel = cleanTitle(session.title, 'Chess class');

  return (
    <article className="session-card">
      <div className="session-time-block">
        <strong>{when.date.split(' ')[0]}</strong>
        <span>{when.date.split(' ')[1]}</span>
        <small>{when.day}</small>
        <em>{when.time}</em>
      </div>

      <div className="session-main-copy">
        <div className="session-kicker">
          <span className="student-avatar">{initials(name)}</span>
          <span>{name}</span>
          <span className="soft-divider" />
          <span>{planLabel}</span>
        </div>
        <h3>{session.title}</h3>
        <p>{session.notes || 'Session notes will appear here after the coach updates this class.'}</p>
        {session.total_sessions ? (
          <p className="session-progress-text">
            Class {session.session_number} of {session.total_sessions}
            {session.remaining_sessions !== undefined ? ` - ${session.remaining_sessions} remaining` : ''}
          </p>
        ) : null}
        {nextTopicTitle ? <p className="next-topic-line">Next: {nextTopicTitle}</p> : null}
      </div>

      <div className="session-meta">
        <span className={`state-chip ${isCompleted ? 'state-chip-completed' : ''}`}>
          {isCompleted ? 'Completed' : 'Upcoming'}
        </span>
        <span className="duration-chip">{session.duration_minutes} min</span>
      </div>

      <div className="session-card-actions">
        {!isCompleted ? (
          <a className="primary-action" href={`/lesson?session=${encodeURIComponent(session.id)}`}>
            <Video className="h-4 w-4" />
            Join
          </a>
        ) : (
          <button className="secondary-action">
            <PlayCircle className="h-4 w-4" />
            View notes
          </button>
        )}
        {role === 'coach' ? <button className="secondary-action">Edit</button> : null}
      </div>
    </article>
  );
}

export default async function CrmHomePage({ searchParams }: PageProps) {
  const crmSession = await getCrmSession();
  if (!crmSession) redirect('/login');

  const params = searchParams ? await searchParams : {};
  const selectedTab = tabs.includes(paramValue(params.tab) as (typeof tabs)[number])
    ? (paramValue(params.tab) as (typeof tabs)[number])
    : 'upcoming';
  const selectedStudent = paramValue(params.student);
  const selectedFrom = paramValue(params.from);
  const selectedTo = paramValue(params.to);
  const selectedSort = paramValue(params.sort) || 'asc';
  const selectedView = views.includes(paramValue(params.view) as (typeof views)[number])
    ? (paramValue(params.view) as (typeof views)[number])
    : 'sessions';
  const data = await getCrmData(crmSession);
  const placements = await readPlacements();
  const placementByStudent = new Map(placements.map((placement) => [placement.student_id, placement]));
  const queryParams = {
    tab: selectedTab,
    student: selectedStudent,
    from: selectedFrom,
    to: selectedTo,
    sort: selectedSort,
    view: selectedView,
  };

  const roleSessions = data.classSessions.filter((item) => {
    if (data.session.role === 'student' && item.student_id !== data.session.subjectId) return false;
    if (selectedStudent && item.student_id !== selectedStudent) return false;
    const when = sessionDate(item.starts_at);
    if (selectedFrom && when.inputDate < selectedFrom) return false;
    if (selectedTo && when.inputDate > selectedTo) return false;
    return true;
  });

  const visibleSessions = roleSessions
    .filter((item) => item.status === selectedTab)
    .sort((a, b) => {
      const diff = new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      return selectedSort === 'desc' ? -diff : diff;
    });

  const upcomingCount = roleSessions.filter((item) => item.status === 'upcoming').length;
  const completedCount = roleSessions.filter((item) => item.status === 'completed').length;
  const tabCounts = {
    upcoming: upcomingCount,
    completed: completedCount,
  };
  const individualCount = visibleSessions.filter((item) => {
    const student = data.students.find((entry) => entry.id === item.student_id);
    return String(student?.plan_type || item.title).toLowerCase().includes('individual');
  }).length;
  const groupCount = visibleSessions.length - individualCount;

  return (
    <div className="crm-workspace">
      <header className="crm-topbar">
        <div className="brand-lockup">
          <span>CG</span>
          <div>
            <strong>ChessGum</strong>
            <small>Coach workspace</small>
          </div>
        </div>

        <nav className="primary-nav">
          <a className={selectedView === 'sessions' ? 'nav-item-active' : ''} href={buildQuery(queryParams, { view: 'sessions' })}>
            <CalendarDays className="h-5 w-5" />
            Sessions
          </a>
          <a className={selectedView === 'students' ? 'nav-item-active' : ''} href={buildQuery(queryParams, { view: 'students' })}>
            <Users className="h-5 w-5" />
            Students
          </a>
          <a className={selectedView === 'curriculum' ? 'nav-item-active' : ''} href={buildQuery(queryParams, { view: 'curriculum' })}>
            <CheckCircle2 className="h-5 w-5" />
            Curriculum
          </a>
        </nav>

        <div className="topbar-actions">
          <div className="nav-profile">
            <span>{initials(data.session.name)}</span>
            <div>
              <strong>{data.session.name}</strong>
              <small>{data.session.role}</small>
            </div>
          </div>

          <form action="/api/auth/logout" method="post">
            <button className="logout-button">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="crm-page">
        {selectedView === 'curriculum' ? (
          <section className="curriculum-page">
            <div className="curriculum-hero">
              <div>
                <p>Installed standard</p>
                <h1>{curriculumStandard.name}</h1>
                <span>{curriculumStandard.description}</span>
              </div>
              <strong>{curriculumStandard.levels.reduce((count, level) => count + level.topics.length, 0)} sessions</strong>
            </div>

            <section className="curriculum-outline" aria-label="Curriculum outline">
              {curriculumStandard.levels.map((level) => (
                <article key={level.id}>
                  <div className="curriculum-outline-heading">
                    <div>
                      <p>{level.name}</p>
                      <h2>{level.description}</h2>
                    </div>
                    <span>{level.topics.length} sessions</span>
                  </div>
                  <ol>
                    {level.topics.map((topic, index) => (
                      <li key={topic.id}>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <strong>{topic.title}</strong>
                          <p>{topic.objective}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </section>

            <div className="curriculum-grid">
              {data.students.filter((student) => student.is_active).map((student) => {
                const placement = placementByStudent.get(student.id);
                const next = nextTopicForPlacement(placement, student);

                return (
                  <article className="curriculum-card" key={student.id}>
                    <div className="curriculum-student">
                      <span>{initials(student.child_name)}</span>
                      <div>
                        <h2>{student.child_name}</h2>
                        <p>Next topic: {next.isComplete ? 'Level completed' : next.topic.title}</p>
                      </div>
                    </div>

                    <form action="/api/curriculum/placement" method="post" className="curriculum-form">
                      <input type="hidden" name="student_id" value={student.id} />
                      <label>
                        <span>Student level</span>
                        <select name="level_id" defaultValue={placement?.level_id || next.level.id}>
                          {curriculumStandard.levels.map((level) => (
                            <option key={level.id} value={level.id}>
                              {level.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Last completed topic</span>
                        <select name="completed_topic_id" defaultValue={placement?.completed_topic_id || ''}>
                          <option value="">Nothing completed yet</option>
                          {curriculumStandard.levels.map((level) => (
                            <optgroup key={level.id} label={level.name}>
                              {level.topics.map((topic) => (
                                <option key={topic.id} value={topic.id}>
                                  {topic.title}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </label>
                      <button className="filter-button">Save placement</button>
                    </form>
                  </article>
                );
              })}
            </div>
          </section>
        ) : selectedView === 'students' ? (
          <section className="students-panel">
            <div className="section-heading">
              <div>
                <p>Active students</p>
                <h2>Students assigned to Mridul</h2>
              </div>
              <span>{data.students.filter((student) => student.is_active).length} active</span>
            </div>
            <div className="student-name-list">
              {data.students.filter((student) => student.is_active).map((student) => (
                <div key={student.id}>{student.child_name}</div>
              ))}
            </div>
          </section>
        ) : (
          <>
        <section className="schedule-shell">
          <div className="schedule-intro">
            <div>
              <p>{data.session.role === 'coach' ? 'Coach schedule' : 'Student classes'}</p>
              <h1>Upcoming classes</h1>
              <span>Live schedule generated from remaining classes and the internal timetable.</span>
            </div>
            <div className="hero-stat">
              <small>Total classes</small>
              <strong>{visibleSessions.length}</strong>
              <span>45 min each - Individual {individualCount} / Group {groupCount}</span>
            </div>
          </div>

          <div className="session-control-panel">
            <nav className="session-tabs" aria-label="Session status">
              {tabs.map((tab) => (
                <a key={tab} className={selectedTab === tab ? 'session-tab-active' : ''} href={buildQuery(queryParams, { tab })}>
                  {tab} <span>{tabCounts[tab]}</span>
                </a>
              ))}
            </nav>

            <form className="filter-grid" action="/">
              <input type="hidden" name="tab" value={selectedTab} />
              <input type="hidden" name="view" value={selectedView} />
              {data.session.role === 'coach' ? (
                <label>
                  <span>Student</span>
                  <select name="student" defaultValue={selectedStudent}>
                    <option value="">All students</option>
                    {data.students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.child_name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label>
                <span>From</span>
                <input name="from" type="date" defaultValue={selectedFrom} />
              </label>
              <label>
                <span>To</span>
                <input name="to" type="date" defaultValue={selectedTo} />
              </label>
              <label>
                <span>Sort</span>
                <select name="sort" defaultValue={selectedSort}>
                  <option value="asc">Earliest first</option>
                  <option value="desc">Latest first</option>
                </select>
              </label>
              <button className="filter-button">
                <Filter className="h-4 w-4" />
                Apply
              </button>
              <a className="clear-button" href={buildQuery(queryParams, { student: '', from: '', to: '', sort: 'asc' })}>
                Clear
              </a>
            </form>
          </div>
        </section>

        <section className="sessions-section">
          <div className="section-heading">
            <div>
              <p>{selectedTab} sessions</p>
              <h2>{selectedTab === 'upcoming' ? 'Class lineup' : 'Nothing here yet'}</h2>
            </div>
            <span>
              <Search className="h-4 w-4" />
              {visibleSessions.length} result{visibleSessions.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="session-cards">
            {visibleSessions.length ? (
              visibleSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  students={data.students}
                  role={data.session.role}
                  nextTopicTitle={nextTopicForPlacement(placementByStudent.get(session.student_id), data.students.find((student) => student.id === session.student_id)).topic.title}
                />
              ))
            ) : (
              <div className="empty-panel">
                {selectedTab === 'upcoming' ? 'No upcoming sessions match this filter.' : `${selectedTab} sessions are not being shown yet.`}
              </div>
            )}
          </div>
        </section>

          </>
        )}
      </main>
    </div>
  );
}
