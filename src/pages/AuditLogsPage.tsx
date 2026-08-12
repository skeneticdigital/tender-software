import React, { useState, useEffect } from 'react';
import { History, Search } from 'lucide-react';
import { api } from '../lib/api';
import { AuditLog } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getAuditLogs({ search }).then(res => setLogs(res)).finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit Trail Logs</h1>
          <p className="text-xs text-slate-500 mt-1">Immutable security log of user operations, bid submissions, stock dispatches & invoice creation</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by User, Action, Module..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">User Account</th>
                <th className="px-4 py-3.5">Module</th>
                <th className="px-4 py-3.5">Action Executed</th>
                <th className="px-4 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading audit logs...</td></tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-mono text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{l.userName}</div>
                      <div className="text-[10px] text-slate-400">{l.userRole}</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-blue-700">{l.module}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{l.action}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{l.ipAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Demo Credentials Hint */}
      <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
        <p><strong>Admin Access Note:</strong> For system administration, use <span className="font-mono bg-white px-1.5 py-0.5 border rounded">username: admin</span> and <span className="font-mono bg-white px-1.5 py-0.5 border rounded">password: admin123</span></p>
      </div>
    </div>
  );
};
