import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { api, formatINR } from '../lib/api';
import { Tender } from '../types';

interface CreateTenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Tender | null;
}

export const CreateTenderModal: React.FC<CreateTenderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData
}) => {
  const [formData, setFormData] = useState({
    refNumber: initialData?.refNumber || `NIT/2026/${Math.floor(100 + Math.random() * 900)}`,
    name: initialData?.name || '',
    clientName: initialData?.clientName || '',
    department: initialData?.department || 'Public Works Department',
    departmentType: initialData?.departmentType || 'State Gov',
    tenderType: initialData?.tenderType || 'Item Rate',
    projectCategory: initialData?.projectCategory || 'Building',
    location: initialData?.location || 'State Capital',
    submissionDate: initialData?.submissionDate?.split('T')[0] || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    openingDate: initialData?.openingDate?.split('T')[0] || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
    estimatedValue: initialData?.estimatedValue || 25000000,
    quotedAmount: initialData?.quotedAmount || 23500000,
    tenderFee: initialData?.tenderFee || 10000,
    emdRequired: initialData?.emdRequired ?? true,
    emdAmount: initialData?.emdAmount || 500000,
    emdPaymentDate: initialData?.emdPaymentDate || new Date().toISOString().split('T')[0],
    emdBankAccount: initialData?.emdBankAccount || 'SBI Corporate Account 10293847561',
    tenderStatus: initialData?.tenderStatus || 'Preparing',
    competitorInfo: initialData?.competitorInfo || '',
    remarks: initialData?.remarks || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dynamic calculations
  const estVal = Number(formData.estimatedValue) || 0;
  const quoteVal = Number(formData.quotedAmount) || 0;
  const quoteDiff = quoteVal - estVal;
  const quoteVariancePct = estVal > 0 ? (quoteDiff / estVal) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (initialData) {
        await api.updateTender(initialData.id, formData);
      } else {
        await api.createTender(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save tender');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit Tender: ${initialData.refNumber}` : 'Create New Tender Submission'}
      subtitle="Register tender metadata, estimated vs quoted valuation, and EMD requirements"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tender Ref / NIT Number *</label>
            <input
              type="text"
              required
              value={formData.refNumber}
              onChange={(e) => setFormData({ ...formData, refNumber: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Tender / Work Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Construction of 4-Lane Flyover at Sector 62"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Client Authority *</label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="e.g., NHAI, PWD State Highway"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department Type</label>
            <select
              value={formData.departmentType}
              onChange={(e) => setFormData({ ...formData, departmentType: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
            >
              <option value="Central Gov">Central Government</option>
              <option value="State Gov">State Government</option>
              <option value="PSU">PSU / Institutional</option>
              <option value="Private">Private Developer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Category</label>
            <select
              value={formData.projectCategory}
              onChange={(e) => setFormData({ ...formData, projectCategory: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
            >
              <option value="Highways">Highways & Roads</option>
              <option value="Building">Building Construction</option>
              <option value="Water Supply">Water Supply & Sewerage</option>
              <option value="Bridges">Bridges & Flyovers</option>
              <option value="Electrical">Electrical / Substation</option>
              <option value="Urban Infra">Urban Infrastructure</option>
            </select>
          </div>
        </div>

        {/* Valuation & Calculations Section */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Financial Valuation & Variance Analysis</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Tender Value (₹) *</label>
              <input
                type="number"
                required
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">{formatINR(formData.estimatedValue)}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quoted Bid Amount (₹) *</label>
              <input
                type="number"
                required
                value={formData.quotedAmount}
                onChange={(e) => setFormData({ ...formData, quotedAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-700"
              />
              <span className="text-[10px] text-blue-600 mt-1 block">{formatINR(formData.quotedAmount)}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Variance (% Quoted vs Estimated)</label>
              <div className={`px-3 py-2 rounded-lg border text-xs font-bold ${
                quoteVariancePct < 0 ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
              }`}>
                {quoteVariancePct.toFixed(2)}% ({quoteDiff < 0 ? 'Below Estimated' : 'Above Estimated'})
              </div>
            </div>
          </div>
        </div>

        {/* Dates & EMD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Submission Deadline *</label>
            <input
              type="date"
              required
              value={formData.submissionDate}
              onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">EMD Amount (₹)</label>
            <input
              type="number"
              value={formData.emdAmount}
              onChange={(e) => setFormData({ ...formData, emdAmount: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">EMD Payment Bank / Ref</label>
            <input
              type="text"
              value={formData.emdBankAccount}
              onChange={(e) => setFormData({ ...formData, emdBankAccount: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
          >
            {loading ? 'Saving...' : initialData ? 'Update Tender' : 'Submit Tender'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
