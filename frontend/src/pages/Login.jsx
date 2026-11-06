import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { Factory, Lock, Mail, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { label: 'Danru Security (Agus)', email: 'security.agus@cemindo.com', pass: 'security123', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { label: 'Security Gate 1 (Bambang)', email: 'security.bambang@cemindo.com', pass: 'security123', color: 'bg-amber-50 text-amber-900 border-amber-200' },
    { label: 'PIC Host (Production)', email: 'pic.production@cemindo.com', pass: 'pic123', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { label: 'PIC Host (SHE Safety)', email: 'pic.safety@cemindo.com', pass: 'safety123', color: 'bg-teal-100 text-teal-800 border-teal-300' },
    { label: 'Plant Management', email: 'management@cemindo.com', pass: 'mgmt123', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { label: 'System Administrator', email: 'admin@cemindo.com', pass: 'admin123', color: 'bg-purple-100 text-purple-800 border-purple-300' }
  ];

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-cemindo-red items-center justify-center text-white shadow-xl shadow-red-500/20 mb-4 ring-4 ring-white/10">
            <Factory className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            PT CEMINDO GEMILANG TBK
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
              Plant Batam
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Visitor Management System
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-3 max-w-sm mx-auto">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/20">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@cemindo.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-cemindo-red hover:bg-cemindo-darkred text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <span>{loading ? t('loading') : t('login')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 text-center">
              {t('quickDemoUsers')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleFillDemo(acc.email, acc.pass)}
                  className={`px-2 py-2 text-[10px] font-bold rounded-lg border text-left transition flex items-center gap-1.5 hover:shadow-sm ${acc.color}`}
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Public Guest Registration Link */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Visitor or Contractor arriving at plant?{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-bold text-red-400 hover:text-red-300 underline underline-offset-2 ml-1"
            >
              Open Guest Self-Registration Portal
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
