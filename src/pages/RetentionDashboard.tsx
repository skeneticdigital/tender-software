import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Pencil, Trash2, Save } from 'lucide-react';
import { api, formatINR, formatLakhsCr } from '../lib/api';
import { Retention } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const RetentionDashboard: React.FC = () => {
  const [retentions, setRetentions] = useState<Retention[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedRetention, setSelectedRetention] = useState<Retention | null>(null);
  const [formData, setFormData] = useState<Partial<Retention>>({});

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
      console.error(err);
    }
  };

  const handleOpenEdit = (r: Retention) => {
    setSelectedRetention(r);
    setFormData({ ...r });
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRetention) return;

    const amt = parseFloat(formData.retentionAmount as any) || 0;
    const updated = retentions.map(r => r.id === selectedRetention.id ? {
      ...r,
      ...formData,
      retentionAmount: amt
    } as Retention : r);

    setRetentions(updated);
    setSelectedRetention(null);
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
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{r.billNumber || r.billNo || 'RA-01/2026/MAD'}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-amber-900">{formatINR(r.retentionAmount)}</td>
                    <td className="px-4 py-3.5">{r.retentionDate || r.heldDate || r.withheldDate || '2026-05-05'}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{r.expectedReleaseDate}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={r.status === 'Released' ? 'success' : 'warning'}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.status !== 'Released' && (
                          <button
                            onClick={() => handleStatusUpdate(r.id, 'Released')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                          >
                            Mark Released
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                          title="Edit Retention Record"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setRetentions(prev => prev.filter(x => x.id !== r.id));
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                          title="Delete Retention Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom React Modal Form for Edit Retention Money */}
      {selectedRetention && (
        <Modal
          isOpen={!!selectedRetention}
          onClose={() => setSelectedRetention(null)}
          title={`Edit Retention Record: ${selectedRetention.billNumber || selectedRetention.billNo}`}
          subtitle={`Project: ${selectedRetention.projectName}`}
          maxWidth="md"
        >
          <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Retention Amount (₹) *</label>
              <input
                type="number"
                required
                value={formData.retentionAmount || 0}
                onChange={(e) => setFormData({ ...formData, retentionAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold text-amber-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Expected Release Date *</label>
              <input
                type="date"
                required
                value={formData.expectedReleaseDate || ''}
                onChange={(e) => setFormData({ ...formData, expectedReleaseDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status *</label>
              <select
                value={formData.status || 'Withheld'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                <option value="Withheld">Withheld in DLP Period</option>
                <option value="Released">Released & Credited</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRetention(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Retention Record
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
