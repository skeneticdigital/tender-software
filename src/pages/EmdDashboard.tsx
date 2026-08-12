import React, { useState, useEffect } from 'react';
import { Landmark, Search, ShieldCheck, Clock, CheckCircle2, AlertTriangle, RefreshCw, IndianRupee, Pencil, Trash2 } from 'lucide-react';
import { api, formatINR, formatLakhsCr } from '../lib/api';
import { EmdTransaction, SecurityDeposit } from '../types';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Modal } from '../components/ui/Modal';

export const EmdDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'emd' | 'sd'>('emd');
  const [emds, setEmds] = useState<EmdTransaction[]>([]);
  const [sds, setSds] = useState<SecurityDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected EMD update modal state
  const [selectedEmd, setSelectedEmd] = useState<EmdTransaction | null>(null);
  const [emdUpdateForm, setEmdUpdateForm] = useState({
    refundStatus: '',
    actualRefundDate: new Date().toISOString().split('T')[0],
    refundAmount: 0,
    remarks: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emdRes, sdRes] = await Promise.all([
        api.getEmds({ search }),
        api.getSecurityDeposits({ search })
      ]);
      setEmds(emdRes);
      setSds(sdRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleUpdateEmdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmd) return;

    try {
      await api.updateEmd(selectedEmd.id, emdUpdateForm);
      setSelectedEmd(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating EMD');
    }
  };

  // Aggregations
  const totalEmdHeld = emds.reduce((acc, e) => acc + (e.emdAmount - (e.refundAmount || 0)), 0);
  const pendingRefunds = emds.filter(e => e.refundStatus === 'Refund Pending');
  const pendingRefundValue = pendingRefunds.reduce((acc, e) => acc + e.emdAmount, 0);

  const activeSdValue = sds.filter(s => s.status === 'Active' || s.status === 'Due Soon').reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">EMD & Security Deposit Management</h1>
          <p className="text-xs text-slate-500 mt-1">Track Earnest Money Deposits, government refund schedules, overdue claims & Security Deposit guarantees</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total EMD Amount Withheld"
          value={formatLakhsCr(totalEmdHeld)}
          subtitle={`${emds.length} total EMD transactions`}
          icon={Landmark}
          variant="default"
        />
        <StatCard
          title="Pending EMD Refund Claims"
          value={formatLakhsCr(pendingRefundValue)}
          subtitle={`${pendingRefunds.length} overdue / pending claims`}
          icon={AlertTriangle}
          variant="alert"
        />
        <StatCard
          title="Active Security Deposits"
          value={formatLakhsCr(activeSdValue)}
          subtitle={`${sds.length} active performance guarantees`}
          icon={ShieldCheck}
          variant="success"
        />
      </div>

      {/* Search & Tabs Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('emd')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'emd' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EMD Transactions Ledger
          </button>
          <button
            onClick={() => setActiveTab('sd')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'sd' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Security Deposit / Performance Guarantees
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search EMD / Tender / Bank..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Table */}
      {activeTab === 'emd' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Tender & Client</th>
                  <th className="px-4 py-3.5">EMD Method / Ref</th>
                  <th className="px-4 py-3.5 text-right">EMD Amount</th>
                  <th className="px-4 py-3.5">Payment Date</th>
                  <th className="px-4 py-3.5">Expected Refund</th>
                  <th className="px-4 py-3.5">Refund Status</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading EMD records...</td></tr>
                ) : emds.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No EMD transactions found.</td></tr>
                ) : (
                  emds.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{e.refNumber}</div>
                        <div className="text-[11px] text-slate-500">{e.clientName}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{e.paymentMethod}</div>
                        <div className="text-[10px] text-slate-400">{e.transactionRef}</div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        {formatINR(e.emdAmount)}
                      </td>

                      <td className="px-4 py-3.5">{e.paymentDate}</td>

                      <td className="px-4 py-3.5">
                        <span className={`font-semibold ${
                          e.refundStatus === 'Refund Pending' ? 'text-rose-600 font-bold' : 'text-slate-800'
                        }`}>
                          {e.expectedRefundDate}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant={
                          e.refundStatus === 'Refunded' ? 'success' :
                          e.refundStatus === 'Refund Pending' ? 'danger' :
                          e.refundStatus === 'Converted to Security Deposit' ? 'purple' : 'warning'
                        }>
                          {e.refundStatus}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedEmd(e);
                              setEmdUpdateForm({
                                refundStatus: e.refundStatus,
                                actualRefundDate: e.actualRefundDate || new Date().toISOString().split('T')[0],
                                refundAmount: e.refundAmount || e.emdAmount,
                                remarks: e.remarks || ''
                              });
                            }}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded font-bold text-[11px] transition-colors flex items-center gap-1 border border-blue-200"
                            title="Edit / Update EMD"
                          >
                            <Pencil className="w-3 h-3" />
                            Update
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete EMD transaction "${e.refNumber}"?`)) {
                                setEmds(prev => prev.filter(x => x.id !== e.id));
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                            title="Delete EMD"
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
      ) : (
        /* Security Deposits Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Project Name</th>
                  <th className="px-4 py-3.5">Guarantee Type</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5">Bank & Ref</th>
                  <th className="px-4 py-3.5">Deposit Date</th>
                  <th className="px-4 py-3.5">Release Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sds.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{s.projectName}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{s.depositType}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatINR(s.amount)}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{s.bank}</div>
                      <div className="text-[10px] text-slate-400">{s.refNumber}</div>
                    </td>
                    <td className="px-4 py-3.5">{s.depositDate}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{s.expectedReleaseDate}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={s.status === 'Released' ? 'success' : 'info'}>{s.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            const newStatus = prompt(`Update status for Security Deposit "${s.refNumber}" (Active / Released / Claimed):`, s.status);
                            if (newStatus) {
                              setSds(prev => prev.map(x => x.id === s.id ? { ...x, status: newStatus as any } : x));
                            }
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                          title="Edit Security Deposit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete Security Deposit "${s.refNumber}"?`)) {
                              setSds(prev => prev.filter(x => x.id !== s.id));
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                          title="Delete Security Deposit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for EMD Update */}
      {selectedEmd && (
        <Modal
          isOpen={!!selectedEmd}
          onClose={() => setSelectedEmd(null)}
          title={`Update EMD Refund: ${selectedEmd.refNumber}`}
          subtitle={`Tender: ${selectedEmd.tenderName}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateEmdSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Refund Status *</label>
              <select
                required
                value={emdUpdateForm.refundStatus}
                onChange={(e) => setEmdUpdateForm({ ...emdUpdateForm, refundStatus: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
              >
                <option value="Paid">Paid / Under Claim</option>
                <option value="Refund Pending">Refund Pending (Department Delay)</option>
                <option value="Refunded">Refunded to Bank Account</option>
                <option value="Converted to Security Deposit">Converted to Security Deposit</option>
                <option value="Retained">Retained / Forfeited</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Actual Refund / Release Date</label>
              <input
                type="date"
                value={emdUpdateForm.actualRefundDate}
                onChange={(e) => setEmdUpdateForm({ ...emdUpdateForm, actualRefundDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Refunded Amount Received (₹)</label>
              <input
                type="number"
                value={emdUpdateForm.refundAmount}
                onChange={(e) => setEmdUpdateForm({ ...emdUpdateForm, refundAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Bank Voucher Ref</label>
              <textarea
                value={emdUpdateForm.remarks}
                onChange={(e) => setEmdUpdateForm({ ...emdUpdateForm, remarks: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedEmd(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Save EMD Status
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
