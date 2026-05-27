import { DashboardShell } from '@/components/layout/DashboardShell';
import { getDashboardData } from '@/lib/data';
import { dateLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StudentsPage() {
  const data = await getDashboardData();
  const students = data.students;
  const soon = new Date();
  soon.setDate(soon.getDate() + 14);

  return (
    <DashboardShell title="Students" subtitle="Active roster, renewal tracking, and class progress">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric label="Active Students" value={String(students.filter((s) => s.is_active).length)} />
        <Metric label="Renewals In 14 Days" value={String(students.filter((s) => s.renewal_date && new Date(s.renewal_date) <= soon).length)} />
        <Metric label="At Risk" value={String(students.filter((s) => s.renewal_date && new Date(s.renewal_date) < new Date()).length)} />
      </div>
      <div className="card overflow-hidden">
        <table className="table">
          <thead><tr><th>Student</th><th>Parent</th><th>Plan</th><th>Enrolled</th><th>Renewal</th><th>Sessions</th><th>Status</th></tr></thead>
          <tbody>
            {students.map((student) => {
              const renewalSoon = student.renewal_date && new Date(student.renewal_date) <= soon;
              return (
                <tr key={student.id}>
                  <td><div className="font-black">{student.child_name}</div><div className="text-xs font-semibold text-slate-500">{student.email}</div></td>
                  <td>{student.parent_name}<div className="text-xs text-slate-500">{student.phone}</div></td>
                  <td><span className="badge bg-violet-50 text-brand">{student.plan_type} · {student.level}</span></td>
                  <td>{dateLabel(student.enrolled_date)}</td>
                  <td className={renewalSoon ? 'font-black text-amber-700' : ''}>{dateLabel(student.renewal_date)}</td>
                  <td>{student.sessions_done}/{student.sessions_total}</td>
                  <td><span className={student.is_active ? 'badge bg-emerald-50 text-emerald-700' : 'badge bg-slate-100 text-slate-600'}>{student.is_active ? 'Active' : 'Paused'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="card p-5"><div className="text-sm font-extrabold text-slate-500">{label}</div><div className="mt-2 text-3xl font-black">{value}</div></div>;
}
