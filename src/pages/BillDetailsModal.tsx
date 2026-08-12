import React, { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { api, formatINR } from '../lib/api';
import { IndianRupee, Printer, Download, CheckCircle2 } from 'lucide-react';

interface BillDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  billId: string | null;
  onRefresh: () => void;
}

export const BillDetailsModal: React.FC<BillDetailsModalProps> = ({
  isOpen,
  onClose,
  billId,
  onRefresh
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Record Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    amountReceived: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'NEFT/RTGS',
    bankName: 'State Bank of India - Govt Reg Account',
    transactionRef: `UTR/2026/${Math.floor(100000 + Math.random() * 900000)}`,
    remarks: ''
  });
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    if (billId && isOpen) {
      setLoading(true);
      api.getBillDetails(billId)
        .then(res => {
          setData(res);
          setPayForm(prev => ({ ...prev, amountReceived: res.outstandingAmount || res.netPayable }));
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [billId, isOpen]);

  if (!isOpen || !billId) return null;

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayLoading(true);
    setPayError('');

    try {
      await api.recordPayment({ ...payForm, billId });
      setIsPayModalOpen(false);
      const updated = await api.getBillDetails(billId);
      setData(updated);
      onRefresh();
    } catch (err: any) {
      setPayError(err.message || 'Payment recording failed');
    } finally {
      setPayLoading(false);
    }
  };

  const b = data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={b ? `Tax Invoice / Client Bill: ${b.billNumber}` : 'Loading...'}
      subtitle={b?.projectName}
      maxWidth="4xl"
    >
      {loading || !b ? (
        <div className="p-8 text-center text-slate-400">Loading invoice details...</div>
      ) : (
        <div className="space-y-6 text-xs">
          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={b.status === 'Paid' ? 'success' : 'warning'} size="md">{b.status}</Badge>
                <span className="text-slate-300">Due: <strong>{b.paymentDueDate}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Invoice
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              {b.outstandingAmount > 0 && (
                <button
                  onClick={() => setIsPayModalOpen(true)}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg font-black flex items-center gap-1.5"
                >
                  <IndianRupee className="w-4 h-4" /> Record Payment
                </button>
              )}
            </div>
          </div>

          {/* Client & Billing Header */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Client / Department</span>
              <div className="font-bold text-sm text-slate-900 mt-1">{b.clientName}</div>
              <div className="text-slate-600 mt-0.5">{b.workDescription}</div>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Billing Period</span>
              <div className="font-bold text-sm text-slate-900 mt-1">{b.billingPeriod}</div>
              <div className="text-slate-500 mt-0.5">Bill Date: {b.billDate}</div>
            </div>
          </div>

          {/* BOQ Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 p-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-600 border-b">
              Bill of Quantities (BOQ) Items
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-[11px] font-bold text-slate-500">
                <tr>
                  <th className="p-2.5">Item Code</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Quantity</th>
                  <th className="p-2.5 text-right">Rate (₹)</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {b.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-mono text-slate-500">{item.boqItem}</td>
                    <td className="p-2.5 font-medium text-slate-900">{item.description}</td>
                    <td className="p-2.5 text-right font-bold">{item.quantity} {item.unit}</td>
                    <td className="p-2.5 text-right font-semibold">{formatINR(item.rate)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatINR(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Government Deductions Breakdown */}
            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-2">
              <div className="font-bold text-rose-900 uppercase tracking-wider text-[10px]">Government / Institutional Statutory Deductions</div>
              <div className="divide-y divide-rose-200/60">
                {b.deductions?.map((d: any, idx: number) => (
                  <div key={idx} className="py-1.5 flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{d.deductionName} ({d.percentage > 0 ? `${d.percentage}%` : 'Fixed'}):</span>
                    <span className="text-rose-700 font-bold">{formatINR(d.calculatedAmount)}</span>
                  </div>
                ))}
                <div className="pt-2 flex justify-between font-black text-sm text-rose-900">
                  <span>Total Deductions:</span>
                  <span>{formatINR(b.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Financial Summary */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
              <div className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">Net Payable Breakdown</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Gross BOQ Work Amount:</span>
                  <span className="font-bold">{formatINR(b.grossAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>GST (18%):</span>
                  <span className="font-bold">{formatINR(b.gstAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Gross with GST Tax:</span>
                  <span className="font-bold">{formatINR(b.grossWithTax)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Less Total Deductions:</span>
                  <span className="font-bold"> - {formatINR(b.totalDeductions)}</span>
                </div>
                <div className="pt-2 border-t border-blue-300 flex justify-between text-base font-black text-blue-950">
                  <span>Net Amount Payable:</span>
                  <span>{formatINR(b.netPayable)}</span>
                </div>
                <div className="pt-1 flex justify-between text-xs font-bold text-emerald-800">
                  <span>Received to Date:</span>
                  <span>{formatINR(b.paymentReceivedAmount)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-rose-800">
                  <span>Current Outstanding Balance:</span>
                  <span>{formatINR(b.outstandingAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History List */}
          {b.payments && b.payments.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-600 border-b">
                Payment Collection History
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-[11px] font-bold text-slate-500">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5 text-right">Amount Received</th>
                    <th className="p-2.5">Bank Name</th>
                    <th className="p-2.5">Transaction Ref / UTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {b.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="p-2.5 font-medium">{p.paymentDate}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">{formatINR(p.amountReceived)}</td>
                      <td className="p-2.5 font-semibold">{p.bankName}</td>
                      <td className="p-2.5 font-mono">{p.transactionRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Sub-Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Record Payment for Bill: ${b?.billNumber}`}
        subtitle={`Current Outstanding: ${formatINR(b?.outstandingAmount)}`}
        maxWidth="md"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
          {payError && <div className="p-2.5 bg-rose-50 text-rose-700 rounded font-medium">{payError}</div>}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Amount Received (₹) *</label>
            <input
              type="number"
              required
              value={payForm.amountReceived}
              onChange={(e) => setPayForm({ ...payForm, amountReceived: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={payForm.paymentDate}
                onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="NEFT/RTGS">NEFT / RTGS</option>
                <option value="Cheque">Government Treasury Cheque</option>
                <option value="PFMS">PFMS Direct Credit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Bank Name *</label>
            <input
              type="text"
              required
              value={payForm.bankName}
              onChange={(e) => setPayForm({ ...payForm, bankName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Transaction Ref / UTR *</label>
            <input
              type="text"
              required
              value={payForm.transactionRef}
              onChange={(e) => setPayForm({ ...payForm, transactionRef: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
            <button type="submit" disabled={payLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold">Save Payment</button>
          </div>
        </form>
      </Modal>
    </Modal>
  );
};
