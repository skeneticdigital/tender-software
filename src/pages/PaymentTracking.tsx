import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, Pencil, Trash2, IndianRupee, Save } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { Payment } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const PaymentTracking: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State (Add & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState<Partial<Payment>>({
    billNumber: 'RA-01/2026/MAD',
    projectName: 'Madurai Ring Road Expansion Project',
    clientName: 'NHAI Tamil Nadu',
    amountReceived: 12000000,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'NEFT / RTGS',
    transactionRef: 'UTIBR88910023',
    bankAccount: 'HDFC Bank - A/c 50200012345678',
    status: 'Received'
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await api.getPayments();
      setPayments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPayment(null);
    setFormData({
      billNumber: 'RA-01/2026/MAD',
      projectName: 'Madurai Ring Road Expansion Project',
      clientName: 'NHAI Tamil Nadu',
      amountReceived: 12000000,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'NEFT / RTGS',
      transactionRef: `UTIBR${Math.floor(Math.random() * 8999999 + 1000000)}`,
      bankAccount: 'HDFC Bank - A/c 50200012345678',
      status: 'Received'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Payment) => {
    setEditingPayment(p);
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formData.amountReceived as any) || 0;

    if (editingPayment) {
      // Edit
      const updated = payments.map(p => p.id === editingPayment.id ? {
        ...p,
        ...formData,
        amountReceived: amt
      } as Payment : p);
      setPayments(updated);
    } else {
      // Create
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        billId: 'b-001',
        billNumber: formData.billNumber || 'RA-01/2026/MAD',
        billNo: formData.billNumber || 'RA-01/2026/MAD',
        projectId: 'p-001',
        projectName: formData.projectName || 'Madurai Ring Road Expansion Project',
        clientName: formData.clientName || 'NHAI Tamil Nadu',
        amountReceived: amt,
        balance: 4650000,
        paymentDate: formData.paymentDate || new Date().toISOString().split('T')[0],
        paymentMode: formData.paymentMode || 'NEFT / RTGS',
        transactionRef: formData.transactionRef || `UTIBR${Date.now().toString().slice(-8)}`,
        bankName: formData.bankAccount || 'HDFC Bank - A/c 50200012345678',
        bankAccount: formData.bankAccount || 'HDFC Bank - A/c 50200012345678',
        status: 'Received',
        createdAt: new Date().toISOString()
      };
      setPayments([newPayment, ...payments]);
    }

    setIsModalOpen(false);
  };

  const filtered = payments.filter(p =>
    p.billNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.projectName.toLowerCase().includes(search.toLowerCase()) ||
    p.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Receipts Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time payment collections, bank UTR reference tracking & outstanding bill balances</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Record Client Payment
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payments by bill number, project or client..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Bill Number & Project</th>
                <th className="px-4 py-3.5">Client Department</th>
                <th className="px-4 py-3.5 text-right">Amount Received</th>
                <th className="px-4 py-3.5">Payment Date</th>
                <th className="px-4 py-3.5">Mode & UTR Ref</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading payment receipts...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No payment receipts logged.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 font-mono">{p.billNumber}</div>
                      <div className="text-[10px] text-slate-500">{p.projectName}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{p.clientName}</td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-800 text-sm">{formatINR(p.amountReceived)}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{p.paymentDate}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{p.paymentMode}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.transactionRef}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="success">Received</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                          title="Edit Payment Receipt"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setPayments(payments.filter(x => x.id !== p.id));
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                          title="Delete Payment"
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

      {/* Custom React Modal Form for Add/Edit Payment Receipt */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPayment ? `Edit Payment Receipt: ${editingPayment.billNumber}` : 'Record Client Payment Receipt'}
        subtitle="Log running account bill collections, bank UTR reference numbers & deposit accounts"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bill Ref Number *</label>
              <input
                type="text"
                required
                value={formData.billNumber || ''}
                onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={formData.projectName || ''}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Client Authority *</label>
              <input
                type="text"
                required
                value={formData.clientName || ''}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount Received (₹) *</label>
              <input
                type="number"
                required
                value={formData.amountReceived || 0}
                onChange={(e) => setFormData({ ...formData, amountReceived: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={formData.paymentDate || ''}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Mode *</label>
              <select
                value={formData.paymentMode || 'NEFT / RTGS'}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                <option value="NEFT / RTGS">NEFT / RTGS Direct Credit</option>
                <option value="Treasury Cheque">Government Treasury Cheque</option>
                <option value="Bank Guarantee">Bank Guarantee / FDR</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bank UTR / Transaction Ref *</label>
              <input
                type="text"
                required
                value={formData.transactionRef || ''}
                onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Payment Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
