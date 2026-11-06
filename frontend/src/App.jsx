import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SecurityScanner from './pages/SecurityScanner';
import VisitorManagement from './pages/VisitorManagement';
import Reports from './pages/Reports';
import WhatsAppSettings from './pages/WhatsAppSettings';
import PublicGuestRegister from './pages/PublicGuestRegister';
import PublicPassView from './pages/PublicPassView';
import MasterDepartments from './pages/MasterDepartments';
import MasterEmployees from './pages/MasterEmployees';
import ActivityLogs from './pages/ActivityLogs';
import VisitorBlacklist from './pages/VisitorBlacklist';

function ProtectedLayout({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mr-3"></div>
        <span>Loading PT Cemindo Gemilang VMS...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Access Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/visitor/register" element={<PublicGuestRegister />} />
            <Route path="/register" element={<PublicGuestRegister />} />
            <Route path="/guest" element={<PublicGuestRegister />} />
            <Route path="/pass/:code" element={<PublicPassView />} />
            <Route path="/visitor/pass/:code" element={<PublicPassView />} />

            {/* Protected Operations Routes */}
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/scanner"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'SECURITY']}>
                  <SecurityScanner />
                </ProtectedLayout>
              }
            />
            <Route
              path="/visitors"
              element={
                <ProtectedLayout>
                  <VisitorManagement />
                </ProtectedLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedLayout>
                  <Reports />
                </ProtectedLayout>
              }
            />
            <Route
              path="/blacklist"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'SECURITY', 'MANAGEMENT']}>
                  <VisitorBlacklist />
                </ProtectedLayout>
              }
            />

            {/* Master Data Routes (Admin Only) */}
            <Route
              path="/master/departments"
              element={
                <ProtectedLayout allowedRoles={['ADMIN']}>
                  <MasterDepartments />
                </ProtectedLayout>
              }
            />
            <Route
              path="/master/employees"
              element={
                <ProtectedLayout allowedRoles={['ADMIN']}>
                  <MasterEmployees />
                </ProtectedLayout>
              }
            />
            <Route
              path="/whatsapp"
              element={
                <ProtectedLayout allowedRoles={['ADMIN']}>
                  <WhatsAppSettings />
                </ProtectedLayout>
              }
            />
            <Route
              path="/activity-logs"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'MANAGEMENT']}>
                  <ActivityLogs />
                </ProtectedLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
