import React, { useState, useEffect } from 'react';
import { vmsApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { History, Search, RefreshCw, UserCheck, Shield } from 'lucide-react';

export default function ActivityLogs() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter !== 'ALL') params.action = actionFilter;
      const data = await vmsApi.getActivityLogs(params);
      setLogs(data || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.user?.name && l.user.name.toLowerCase().includes(q)) ||
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.description && l.description.toLowerCase().includes(q)) ||
      (l.ipAddress && l.ipAddress.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <Shield className="w-4 h-4 text-cemindo-red" />
            <span>Audit & Compliance Trail</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t('menuActivityLogs')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full accountability log recording user authentication, check-ins, check-outs, approvals, and master data changes
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          title={t('action_refresh')}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity description, officer, IP..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cemindo-red"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
          >
            <option value="ALL">All Actions</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="VISIT_REGISTERED">Visit Registrations</option>
            <option value="VISIT_APPROVED">Visit Approvals</option>
            <option value="VISIT_CHECK_IN">Gate Check-Ins</option>
            <option value="VISIT_CHECK_OUT">Gate Check-Outs</option>
            <option value="VISIT_CANCELLED">Visit Cancellations</option>
            <option value="USER_CREATED">Employee Created</option>
            <option value="USER_UPDATED">Employee Updated</option>
          </select>
          <span className="text-xs font-semibold text-slate-500">
            Total Logs: <span className="font-extrabold text-slate-900">{filteredLogs.length}</span>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Officer / User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {l.user ? (
                        <div>
                          <p className="font-bold text-slate-900">{l.user.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{l.user.employeeId || '-'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">System / Guest</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {l.user?.role ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {t(`role_${l.user.role}`)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono text-[10px] font-bold uppercase">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">
                      {l.description}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {l.ipAddress || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

