import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Topbar title={title} subtitle={subtitle} />
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
