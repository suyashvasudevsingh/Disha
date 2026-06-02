/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ConsentModal } from './components/ConsentModal';
import { SyncStatusBar } from './components/SyncStatusBar';
import './lib/i18n';
import { Toaster } from '@/components/ui/sonner';
import { AppStateProvider } from '@/state/app-state';
import { ErrorBoundary } from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RecordPage = lazy(() => import('./pages/RecordPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function SyncStatusBarWrapper() {
  const location = useLocation();
  // Hide status bar on landing page
  if (location.pathname === '/') return null;
  return <SyncStatusBar />;
}

export default function App() {
  const adminRouteEnabled = import.meta.env.VITE_ENABLE_ADMIN_ROUTE === 'true';

  return (
    <AppStateProvider>
      <BrowserRouter>
        <SyncStatusBarWrapper />
        <Suspense fallback={<RouteFallback />}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/record" element={<ErrorBoundary><RecordPage /></ErrorBoundary>} />
                <Route path="/report/:id" element={<ReportPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                {adminRouteEnabled ? <Route path="/admin" element={<AdminPage />} /> : null}
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <ConsentModal />
        <Toaster />
      </BrowserRouter>
    </AppStateProvider>
  );
}

function RouteFallback() {
  return (
    <div className="min-h-screen bg-surface grid place-items-center px-4">
      <div className="rounded-3xl border border-primary-light bg-white px-5 py-4 text-sm text-ink/60 shadow-sm">
        Loading route...
      </div>
    </div>
  );
}
