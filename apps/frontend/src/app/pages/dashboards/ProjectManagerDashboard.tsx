import { useAuthStore } from '../../store/authStore';

export default function ProjectManagerDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Project Management Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome, {user?.firstName} — track and manage your projects
        </p>
      </div>
    </div>
  );
}
