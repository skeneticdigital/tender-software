import React, { useState, useEffect } from 'react';
import { CreditCard, Search, IndianRupee } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { Payment } from '../types';

export const PaymentTracking: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPayments().then(res => setPayments(res)).finally(() => setLoading(false));
  }, []);

  const totalCollected = payments.reduce((acc, p) => acc + p.amountReceived, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Receipts Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Audit trail of bank credits, treasury cheques, NEFT transfers and remaining bill balances</p>
        </div>
        <div className="text-right bg-emerald-50 p-3 rounded-xl border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Collected</span>
          <div className="text-lg font-black text-emerald-950">{formatINR(totalCollected)}</div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading ledger...</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{p.billNumber}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{p.projectName}</td>
                    <td className="px-4 py-3.5">{p.paymentDate}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-700">{formatINR(p.amountReceived)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatINR(p.balance)}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold">{p.bankName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.transactionRef}</div>
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
