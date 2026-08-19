import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { api, formatINR, formatLakhsCr } from '../lib/api';
import { Tender, EmdTransaction } from '../types';
import { Landmark, HardHat, FileText, CheckCircle2, XCircle, Pencil, Save, X } from 'lucide-react';

interface TenderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderId: string | null;
  onRefresh: () => void;
  onNavigateTab: (tab: string, id?: string) => void;
}

export const TenderDetailsModal: React.FC<TenderDetailsModalProps> = ({
  isOpen,
  onClose,
  tenderId,
  onRefresh,
  onNavigateTab
}) => {
  const [tenderData, setTenderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Edit Form state
  const [editForm, setEditForm] = useState<Partial<Tender>>({});

  // Convert to Project form state
  const [convertForm, setConvertForm] = useState({
    contractNumber: `CONT/2026/${Math.floor(1000 + Math.random() * 9000)}`,
    startDate: new Date().toISOString().split('T')[0],
    plannedCompletionDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    remarks: ''
  });
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState('');

  React.useEffect(() => {
    if (tenderId && isOpen) {
      setLoading(true);
      setIsEditing(false);
      api.getTenderDetails(tenderId)
        .then(res => {
          setTenderData(res);
          setEditForm(res);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [tenderId, isOpen]);

  if (!isOpen || !tenderId) return null;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.updateTender(tenderId, {
        tenderStatus: newStatus as any,
        resultDate: newStatus === 'Won' || newStatus === 'Lost' ? new Date().toISOString().split('T')[0] : undefined
      });
      const updated = await api.getTenderDetails(tenderId);
      setTenderData(updated);
      setEditForm(updated);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const est = parseFloat(editForm.estimatedValue as any) || tenderData.estimatedValue;
      const q = parseFloat(editForm.quotedAmount as any) || tenderData.quotedAmount;
      const diff = q - est;
      const pct = est > 0 ? (diff / est) * 100 : 0;

      const payload = {
        ...editForm,
        estimatedValue: est,
        quotedAmount: q,
        quoteDiff: diff,
        quoteVariancePct: pct
      };

      await api.updateTender(tenderId, payload);
      const updated = await api.getTenderDetails(tenderId);
      setTenderData(updated);
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update tender details');
    }
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConvertLoading(true);
    setConvertError('');

    try {
      const proj = await api.convertToProject(tenderId, convertForm);
      setShowConvertModal(false);
      onClose();
      onNavigateTab('projects', proj.id);
    } catch (err: any) {
      setConvertError(err.message || 'Failed to convert tender to project');
    } finally {
      setConvertLoading(false);
    }
  };

  const t: Tender = tenderData;
  const emd: EmdTransaction = tenderData?.emd;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t ? `Tender Details: ${t.refNumber}` : 'Loading...'}
      subtitle={t?.name}
      maxWidth="4xl"
    >
      {loading || !t ? (
        <div className="p-8 text-center text-slate-400">Loading tender data...</div>
      ) : (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Current Status:</span>
              <Badge variant={
                t.tenderStatus === 'Won' ? 'success' :
                t.tenderStatus === 'Lost' ? 'danger' :
                t.tenderStatus === 'Submitted' ? 'info' : 'warning'
              } size="md">
                {t.tenderStatus}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {isEditing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                {isEditing ? 'Cancel Edit' : 'Edit Tender Info'}
              </button>

              {/* Quick Status Actions */}
              {t.tenderStatus !== 'Won' && (
                <button
                  onClick={() => handleStatusChange('Won')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Won
                </button>
              )}
              {t.tenderStatus !== 'Lost' && (
                <button
                  onClick={() => handleStatusChange('Lost')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Mark Lost
                </button>
              )}
              {t.tenderStatus === 'Won' && (
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 animate-bounce"
                >
                  <HardHat className="w-4 h-4" /> Convert to Active Project
                </button>
              )}
            </div>
          </div>

          {/* EDIT FORM MODE */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="p-5 bg-slate-50 rounded-xl border border-slate-300 space-y-4 text-xs">
              <div className="font-bold text-slate-900 text-sm border-b pb-2 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                Edit Tender Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tender Title / Work Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Name Authority</label>
                  <input
                    type="text"
                    required
                    value={editForm.clientName || ''}
                    onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Value (INR)</label>
                  <input
                    type="number"
                    required
                    value={editForm.estimatedValue || 0}
                    onChange={(e) => setEditForm({ ...editForm, estimatedValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quoted Bid Amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={editForm.quotedAmount || 0}
                    onChange={(e) => setEditForm({ ...editForm, quotedAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tender Status</label>
                  <select
                    value={editForm.tenderStatus || 'Submitted'}
                    onChange={(e) => setEditForm({ ...editForm, tenderStatus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Evaluation">Under Evaluation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Category</label>
                  <input
                    type="text"
                    value={editForm.projectCategory || ''}
                    onChange={(e) => setEditForm({ ...editForm, projectCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location / Site</label>
                  <input
                    type="text"
                    value={editForm.location || ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Submission Date</label>
                  <input
                    type="date"
                    value={editForm.submissionDate?.split('T')[0] || ''}
                    onChange={(e) => setEditForm({ ...editForm, submissionDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Tender Changes
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
            <>
              {/* Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Client Authority</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{t.clientName}</div>
                  <span className="text-[10px] text-slate-400">{t.departmentType} ({t.department})</span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Category & Type</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{t.projectCategory}</div>
                  <span className="text-[10px] text-slate-400">{t.tenderType} | Location: {t.location}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Submission Deadline</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{t.submissionDate?.split('T')[0]}</div>
                  <span className="text-[10px] text-slate-400">Opening: {t.openingDate?.split('T')[0]}</span>
                </div>
              </div>

              {/* Financial Valuation Card */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-600">Estimated Value</span>
                  <div className="text-lg font-bold text-slate-900">{formatLakhsCr(t.estimatedValue)}</div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-blue-700">Quoted Bid Amount</span>
                  <div className="text-lg font-bold text-blue-900">{formatLakhsCr(t.quotedAmount)}</div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-600">Variance Analysis</span>
                  <div className={`text-sm font-bold ${
                    (t.quoteVariancePct || 0) < 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {(t.quoteVariancePct || 0).toFixed(2)}% ({formatINR(t.quoteDiff)})
                  </div>
                </div>
              </div>

              {/* EMD Information Card */}
              {emd && (
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-amber-900">Earnest Money Deposit (EMD) Ledger</span>
                    </div>
                    <Badge variant={
                      emd.refundStatus === 'Refunded' ? 'success' :
                      emd.refundStatus === 'Refund Pending' ? 'danger' : 'info'
                    }>
                      {emd.refundStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-500">EMD Amount:</span>
                      <div className="font-bold text-slate-900">{formatINR(emd.emdAmount)}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Bank Ref:</span>
                      <div className="font-medium text-slate-800">{emd.transactionRef}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Payment Date:</span>
                      <div className="font-medium text-slate-800">{emd.paymentDate}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Expected Refund:</span>
                      <div className="font-bold text-amber-800">{emd.expectedRefundDate || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Convert Modal Inline */}
          {showConvertModal && (
            <div className="p-5 bg-blue-950 text-white rounded-xl border border-blue-800 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm">Convert Tender Quote to Active Construction Project</span>
                </div>
                <button onClick={() => setShowConvertModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {convertError && (
                <div className="p-3 bg-rose-900/50 border border-rose-700 rounded-lg text-xs text-rose-200">
                  {convertError}
                </div>
              )}

              <form onSubmit={handleConvertSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Contract / WO Ref Number</label>
                    <input
                      type="text"
                      required
                      value={convertForm.contractNumber}
                      onChange={(e) => setConvertForm({ ...convertForm, contractNumber: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Commencement Date</label>
                    <input
                      type="date"
                      required
                      value={convertForm.startDate}
                      onChange={(e) => setConvertForm({ ...convertForm, startDate: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Completion Target Date</label>
                    <input
                      type="date"
                      required
                      value={convertForm.plannedCompletionDate}
                      onChange={(e) => setConvertForm({ ...convertForm, plannedCompletionDate: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConvertModal(false)}
                    className="px-4 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={convertLoading}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md"
                  >
                    {convertLoading ? 'Converting...' : 'Confirm & Initialize Active Project'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
