import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { errMsg } from '../lib/api.js';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) navigate('/', { replace: true });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errMsg(err, 'Gagal login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-brand-500 p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-md p-1.5 shrink-0">
              <img src="/logo.png" alt="Logo" className="h-14 w-auto" />
            </div>
            <div>
              <div className="text-white font-semibold tracking-wide text-sm">PT CEMINDO GEMILANG Tbk</div>
              <div className="text-slate-300 text-xs mt-1">Plant Batam</div>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-semibold text-white leading-snug">
            Visitor Management
            <br />
            System
          </h1>
          <p className="mt-4 text-white/75 text-sm max-w-sm leading-relaxed">
            Pendataan tamu, validasi gerbang, dan pencatatan keluar-masuk kawasan pabrik dalam satu alur
            terintegrasi.
          </p>
          <div className="mt-8 flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck size={14} />
            Akses terbatas untuk personel berwenang
          </div>
        </div>

        <div className="text-[11px] text-white/60">
          © {new Date().getFullYear()} PT Cemindo Gemilang Tbk
        </div>
      </div>

      <div className="flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-900">PT CEMINDO GEMILANG Tbk</div>
            <div className="text-xs text-slate-500 mt-0.5">Visitor Management · Plant Batam</div>
          </div>

          <h2 className="text-xl font-semibold text-slate-900">Masuk ke sistem</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Gunakan akun internal yang telah terdaftar.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@cemindo.com"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              <LogIn size={16} />
              {loading ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <a href="/register" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Tamu? Daftarkan kunjungan Anda di sini →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
