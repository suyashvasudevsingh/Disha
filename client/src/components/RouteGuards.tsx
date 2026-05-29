import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/state/auth';

export function ProtectedRoute() {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  if (status === 'checking') {
    return <FullPageState label="Checking session..." />;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  if (status === 'checking') {
    return <FullPageState label="Loading authentication..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function FullPageState({ label }: { label: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-surface text-ink/60">
      <div className="rounded-3xl border border-primary-light bg-white px-6 py-5 shadow-sm">{label}</div>
    </div>
  );
}
