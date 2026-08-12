import React, { useState, useEffect } from 'react';
import { CreditCard, Search, IndianRupee, Plus, Pencil, Trash2 } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { Payment } from '../types';

export const PaymentTracking: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPayments().then(res => setPayments(res)).finally(() => setLoading(false));
  }, []);

  const totalCollected = payments.reduce((acc, p) => acc + (p.amountReceived || 0), 0);

  const handleRecordPayment = () => {
    const billNum = prompt('Enter Bill Number (e.g. RA-01/2026/MAD):', 'RA-01/2026/MAD');
    if (!billNum) return;
    const projName = prompt('Enter Project Name:', 'Madurai Ring Road Expansion Project');
    const amountStr = prompt('Enter Amount Received (in INR):', '12000000');
    if (!amountStr) return;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      billId: 'b-001',
      billNumber: billNum,
      billNo: billNum,
      projectId: 'p-001',
      projectName: projName || 'Madurai Ring Road Expansion Project',
      clientName: 'NHAI Tamil Nadu',
      amountReceived: parseFloat(amountStr) || 12000000,
      balance: 4650000,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'NEFT / RTGS',
      transactionRef: `UTIBR${Date.now().toString().slice(-8)}`,
      bankName: 'HDFC Bank - A/c 50200012345678',
      bankAccount: 'HDFC Bank - A/c 50200012345678',
      status: 'Received',
      createdAt: new Date().toISOString()
    };

    setPayments(prev => [newPayment, ...prev]);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Receipts Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Audit trail of bank credits, treasury cheques, NEFT transfers and remaining bill balances</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Collected</span>
            <div className="text-base font-black text-emerald-950">{formatINR(totalCollected)}</div>
          </div>
          <button
            onClick={handleRecordPayment}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Bill Number</th>
                <th className="px-4 py-3.5">Project Name</th>
                <th className="px-4 py-3.5">Payment Date</th>
                <th className="px-4 py-3.5 text-right">Amount Received</th>
                <th className="px-4 py-3.5 text-right">Remaining Balance</th>
                <th className="px-4 py-3.5">Bank & UTR Ref</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading ledger...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No payment transactions recorded.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{p.billNumber || p.billNo || 'RA-01/2026/MAD'}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{p.projectName}</td>
                    <td className="px-4 py-3.5">{p.paymentDate}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-700">{formatINR(p.amountReceived)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatINR(p.balance || 4650000)}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold">{p.bankName || p.bankAccount || 'HDFC Bank'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.transactionRef}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            const newAmt = prompt(`Update received amount for Bill "${p.billNumber || p.billNo}":`, p.amountReceived.toString());
                            if (newAmt) {
                              setPayments(prev => prev.map(x => x.id === p.id ? { ...x, amountReceived: parseFloat(newAmt) || x.amountReceived } : x));
                            }
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                          title="Edit Payment Record"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete payment receipt for "${p.billNumber || p.billNo}"?`)) {
                              setPayments(prev => prev.filter(x => x.id !== p.id));
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                          title="Delete Payment Record"
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
    </div>
  );
};
