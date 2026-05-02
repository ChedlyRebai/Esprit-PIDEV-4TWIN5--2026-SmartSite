import { lazy, Suspense, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { AssignedIncidentFlash } from '../../components/AssignedIncidentFlash';
import { Button } from '../../components/ui/button';
import { Sparkles } from 'lucide-react';

const DirectorDashboard = lazy(() => import('./DirectorDashboard'));
const ProjectManagerDashboard = lazy(() => import('./ProjectManagerDashboard'));
const SiteManagerDashboard = lazy(() => import('./SiteManagerDashboard'));
const WorksManagerDashboard = lazy(() => import('./WorksManagerDashboard'));
const AccountantDashboard = lazy(() => import('./AccountantDashboard'));
const ProcurementDashboard = lazy(() => import('./ProcurementDashboard'));
const QHSEDashboard = lazy(() => import('./QHSEDashboard'));
const ClientDashboard = lazy(() => import('./ClientDashboard'));
const SubcontractorDashboard = lazy(() => import('./SubcontractorDashboard'));
const UserDashboard = lazy(() => import('./UserDashboard'));
const ProfessionalPowerBiDashboard = lazy(() => import('../../components/ProfessionalPowerBiDashboard'));
const PowerBiAdvancedDashboard = lazy(() => import('../../components/PowerBiAdvancedDashboard'));

function DashboardLoadingState() {
  return (
    <div className="min-h-[60vh] px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/40" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [dashboardView, setDashboardView] = useState<'professional' | 'advanced'>('professional');

  if (!user) return null;

  // Get role name - handle both string and object formats
  const roleName = typeof user.role === 'string' ? user.role : user.role?.name || 'user';
  const isSuperAdmin = roleName === 'super_admin';

  // For super_admin: Show integrated Power BI dashboard as default (replaces old dashboard)
  if (isSuperAdmin) {
    // Show professional dashboard (preferred template) as default
    if (dashboardView === 'professional') {
      return (
        <>
          {user?.cin && <AssignedIncidentFlash userCin={user.cin} />}
          <div className="fixed top-4 right-4 z-50 flex gap-2 flex-wrap">
            <Button
              onClick={() => setDashboardView('advanced')}
              size="sm"
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="h-4 w-4" />
              Analytics
            </Button>
          </div>
          <ProfessionalPowerBiDashboard />
        </>
      );
    }

    // Show advanced dashboard if selected
    if (dashboardView === 'advanced') {
      return (
        <>
          {user?.cin && <AssignedIncidentFlash userCin={user.cin} />}
          <div className="fixed top-4 right-4 z-50 flex gap-2 flex-wrap">
            <Button
              onClick={() => setDashboardView('professional')}
              variant="outline"
              size="sm"
            >
              ← Back to Main
            </Button>
          </div>
          <PowerBiAdvancedDashboard />
        </>
      );
    }

    // Default: Integrated dashboard (main view)
    return (
      <>
        {user?.cin && <AssignedIncidentFlash userCin={user.cin} />}
        <div className="fixed top-4 right-4 z-50 flex gap-2 flex-wrap">
          <Button
            onClick={() => setDashboardView('advanced')}
            size="sm"
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="h-4 w-4" />
            Analytics
          </Button>
        </div>
        <ProfessionalPowerBiDashboard />
      </>
    );
  }

  // Route to appropriate dashboard based on role
  const renderDashboard = () => {
    switch (roleName) {
      case 'director':
        return <DirectorDashboard />;
      case 'project_manager':
        return <ProjectManagerDashboard />;
      case 'site_manager':
        return <SiteManagerDashboard />;
      case 'works_manager':
        return <WorksManagerDashboard />;
      case 'accountant':
        return <AccountantDashboard />;
      case 'procurement_manager':
        return <ProcurementDashboard />;
      case 'qhse_manager':
        return <QHSEDashboard />;
      case 'client':
        return <ClientDashboard />;
      case 'subcontractor':
        return <SubcontractorDashboard />;
      case 'user':
        return <UserDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <>
      {/* Flash Notification for Assigned Incidents - All Users */}
      {user?.cin && <AssignedIncidentFlash userCin={user.cin} />}
      <Suspense fallback={<DashboardLoadingState />}>
        {renderDashboard()}
      </Suspense>
    </>
  );
}
