import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Shell from './components/Shell.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Scan from './pages/Scan.jsx';
import Visits from './pages/Visits.jsx';
import Reports from './pages/Reports.jsx';
import Master from './pages/Master.jsx';
import WhatsApp from './pages/WhatsApp.jsx';
import Features from './pages/Features.jsx';
import Register from './pages/Register.jsx';
import Pass from './pages/Pass.jsx';
import PublicScan from './pages/PublicScan.jsx';

function NoAccess() {
  const { logout, user } = useAuth();
  return (
    <div className="card p-8 text-center max-w-md mx-auto">
      <h2 className="text-sm font-semibold text-slate-800">Akses ditolak</h2>
      <p className="text-sm text-slate-500 mt-1">
        Akun {user?.name} tidak memiliki hak untuk membuka halaman ini. Hubungi administrator bila
        menurut Anda ini keliru.
      </p>
      <button className="btn-ghost mt-4 mx-auto" onClick={logout}>
        Keluar
      </button>
    </div>
  );
}

function Guard({ feature, children }) {
  const { user, loading, can } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Memuat…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (feature && !can(feature)) return <NoAccess />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
          {/* Publik */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pass/:token" element={<Pass />} />
          <Route path="/scan-public" element={<PublicScan />} />

          {/* Internal */}
          <Route
            element={
              <Guard>
                <Shell />
              </Guard>
            }
          >
            {/* Hak halaman memakai fitur page.* — bisa diatur per user
                di halaman Manajemen Fitur. */}
            <Route
              path="/"
              element={
                <Guard feature="page.dashboard">
                  <Dashboard />
                </Guard>
              }
            />
            <Route
              path="/scan"
              element={
                <Guard feature="page.scan">
                  <Scan />
                </Guard>
              }
            />
            <Route
              path="/visits"
              element={
                <Guard feature="page.visits">
                  <Visits />
                </Guard>
              }
            />
            <Route
              path="/reports"
              element={
                <Guard feature="page.reports">
                  <Reports />
                </Guard>
              }
            />
            <Route
              path="/master"
              element={
                <Guard feature="page.master">
                  <Master />
                </Guard>
              }
            />
            <Route
              path="/whatsapp"
              element={
                <Guard feature="page.whatsapp">
                  <WhatsApp />
                </Guard>
              }
            />
            <Route
              path="/features"
              element={
                <Guard feature="page.features">
                  <Features />
                </Guard>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}
