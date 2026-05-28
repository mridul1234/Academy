import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentsWorkspace } from '@/components/students/StudentsWorkspace';
import { getDashboardData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function StudentsPage() {
  const data = await getDashboardData();

  return (
    <DashboardShell
      title="Students"
      subtitle="Roster, sessions, renewals, and paid-student health"
      action={{ label: 'Add Student', targetId: '#add-student-panel' }}
    >
      <StudentsWorkspace initialStudents={data.students} revenue={data.revenue_entries} />
    </DashboardShell>
  );
}
