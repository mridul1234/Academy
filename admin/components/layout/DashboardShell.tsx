import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: { label: string; href?: string; targetId?: string };
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Topbar title={title} subtitle={subtitle} action={action} />
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
