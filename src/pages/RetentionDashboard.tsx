import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api, formatINR, formatLakhsCr } from '../lib/api';
import { Retention } from '../types';
import { Badge } from '../components/ui/Badge';

export const RetentionDashboard: React.FC = () => {
  const [retentions, setRetentions] = useState<Retention[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRetentions = async () => {
    setLoading(true);
    try {
      const res = await api.getRetentions();
      setRetentions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetentions();
  }, []);

  const totalHeld = retentions.reduce((acc, r) => acc + r.retentionAmount, 0);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.updateRetention(id, {
        status: newStatus,
        actualReleaseDate: newStatus === 'Released' ? new Date().toISOString().split('T')[0] : undefined
      });
      fetchRetentions();
    } catch (err: any) {
      alert(err.message || 'Error updating retention');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Retention Money Management</h1>
          <p className="text-xs text-slate-500 mt-1">Track retention funds withheld from client bills during Defects Liability Period (DLP)</p>
        </div>
        <div className="text-right bg-amber-50 p-3 rounded-xl border border-amber-200">
          <span className="text-[10px] font-bold text-amber-800 uppercase">Total Retention Held</span>
          <div className="text-lg font-black text-amber-950">{formatLakhsCr(totalHeld)}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Project Name</th>
                <th className="px-4 py-3.5">Bill Number</th>
                <th className="px-4 py-3.5 text-right">Retention Amount</th>
                <th className="px-4 py-3.5">Withheld Date</th>
                <th className="px-4 py-3.5">Expected Release Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading retention records...</td></tr>
              ) : (
                retentions.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{r.projectName}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{r.billNumber}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-amber-900">{formatINR(r.retentionAmount)}</td>
                    <td className="px-4 py-3.5">{r.retentionDate}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{r.expectedReleaseDate}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={r.status === 'Released' ? 'success' : 'warning'}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {r.status !== 'Released' && (
                        <button
                          onClick={() => handleStatusUpdate(r.id, 'Released')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                        >
                          Mark Released
                        </button>
                      )}
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
};
