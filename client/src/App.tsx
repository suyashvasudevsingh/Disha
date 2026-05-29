/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ConsentModal } from './components/ConsentModal';
import { SyncStatusBar } from './components/SyncStatusBar';
import { AuthBootstrap } from './components/AuthBootstrap';
import { GuestRoute, ProtectedRoute } from './components/RouteGuards';
import './lib/i18n';
import { Toaster } from '@/components/ui/sonner';
import { AppStateProvider } from '@/state/app-state';
import { ErrorBoundary } from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const OTPVerifyPage = lazy(() => import('./pages/OTPVerify'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RecordPage = lazy(() => import('./pages/RecordPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

export default function App() {
  const adminRouteEnabled = import.meta.env.VITE_ENABLE_ADMIN_ROUTE === 'true';

  return (
    <AppStateProvider>
      <AuthBootstrap />
      <BrowserRouter>
        <div id="firebase-recaptcha" className="sr-only" aria-hidden="true" />
        <SyncStatusBar />
        <Suspense fallback={<RouteFallback />}>
          <ErrorBoundary>
            <Routes>
              <Route element={<GuestRoute />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/verify" element={<OTPVerifyPage />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/record" element={<ErrorBoundary><RecordPage /></ErrorBoundary>} />
                  <Route path="/report/:id" element={<ReportPage />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  {adminRouteEnabled ? <Route path="/admin" element={<AdminPage />} /> : null}
                </Route>
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
