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
import Register from './pages/Register.jsx';
import Pass from './pages/Pass.jsx';
import PublicScan from './pages/PublicScan.jsx';

function Guard({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Memuat…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
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
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/scan"
              element={
                <Guard roles={['ADMIN', 'SECURITY']}>
                  <Scan />
                </Guard>
              }
            />
            <Route path="/visits" element={<Visits />} />
            <Route
              path="/reports"
              element={
                <Guard roles={['ADMIN', 'SECURITY', 'MANAGEMENT']}>
                  <Reports />
                </Guard>
              }
            />
            <Route
              path="/master"
              element={
                <Guard roles={['ADMIN']}>
                  <Master />
                </Guard>
              }
            />
            <Route
              path="/whatsapp"
              element={
                <Guard roles={['ADMIN', 'MANAGEMENT']}>
                  <WhatsApp />
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
