import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Menangkap error render agar aplikasi tidak menjadi layar putih kosong.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[UI Error]', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
        <div className="card p-6 max-w-md w-full text-center">
          <AlertTriangle className="mx-auto text-amber-500" size={30} />
          <h1 className="mt-3 text-base font-semibold text-slate-900">Halaman gagal dimuat</h1>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Terjadi kesalahan saat menampilkan halaman ini. Muat ulang halaman untuk melanjutkan.
          </p>
          <pre className="mt-3 text-[11px] text-left bg-slate-50 border border-slate-200 rounded p-2.5 overflow-auto max-h-24 text-slate-500">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button className="btn-primary w-full mt-4" onClick={() => window.location.reload()}>
            <RotateCcw size={15} /> Muat ulang halaman
          </button>
        </div>
      </div>
    );
  }
}
