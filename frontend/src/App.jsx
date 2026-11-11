import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import { ThemeProvider } from './lib/theme.jsx';
import { I18nProvider, useI18n } from './lib/i18n.jsx';
import { DialogProvider } from './lib/dialog.jsx';
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
import Profile from './pages/Profile.jsx';

function NoAccess() {
  const { logout, user } = useAuth();
  const { t } = useI18n();
  return (
    <div className="card p-8 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <h2 className="text-base font-bold text-slate-800 dark:text-white">Akses Ditolak</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
        Akun <b>{user?.name}</b> tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator bila menurut Anda ini keliru.
      </p>
      <button className="btn-ghost mt-5 mx-auto text-xs" onClick={logout}>
        Keluar Sistem
      </button>
    </div>
  );
}

function Guard({ feature, children }) {
  const { user, loading, can } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-semibold text-slate-400 dark:bg-slate-950">
        Memuat aplikasi...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (feature && !can(feature)) return <NoAccess />;
  return children;
}

export default function App() {
  const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  return (
    <ThemeProvider>
      <I18nProvider>
        <DialogProvider>
          <AuthProvider>
            <BrowserRouter basename={basename}>
              <ErrorBoundary>
                <Routes>
                {/* Rute Publik */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/pass/:token" element={<Pass />} />
                <Route path="/scan-public" element={<PublicScan />} />

                {/* Rute Internal Terproteksi */}
                <Route
                  element={
                    <Guard>
                      <Shell />
                    </Guard>
                  }
                >
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
                  {/* Halaman Profil Pengguna Terautentikasi */}
                  <Route path="/profile" element={<Profile />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </DialogProvider>
    </I18nProvider>
  </ThemeProvider>
);
}
