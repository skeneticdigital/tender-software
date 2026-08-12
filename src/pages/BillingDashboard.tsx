import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, Search, Eye, Pencil, Calculator, Trash2, Download } from 'lucide-react';
import { api, formatINR, formatLakhsCr } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Bill, Project, BillItem } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { BillDetailsModal } from './BillDetailsModal';

export const BillingDashboard: React.FC = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Bill Details Modal
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  // Create Bill Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [billForm, setBillForm] = useState({
    projectId: '',
    billNumber: `BILL/2026/${Math.floor(100 + Math.random() * 900)}`,
    billDate: new Date().toISOString().split('T')[0],
    billingPeriod: 'Current Month RA Bill',
    workDescription: 'Progress RA Bill for Excavation & RCC Works',
    paymentDueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    gstRate: 18
  });

  const [boqItems, setBoqItems] = useState<BillItem[]>([
    { boqItem: 'ITEM-1.01', description: 'Earthwork excavation in all types of soil', quantity: 2500, unit: 'Cu.M', rate: 450, amount: 1125000 },
    { boqItem: 'ITEM-2.04', description: 'Plain Cement Concrete (PCC 1:4:8)', quantity: 400, unit: 'Cu.M', rate: 4200, amount: 1680000 },
    { boqItem: 'ITEM-3.08', description: 'Reinforced Cement Concrete M30 grade', quantity: 650, unit: 'Cu.M', rate: 8500, amount: 5525000 }
  ]);

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bList, pList] = await Promise.all([
        api.getBills({ search, status: statusFilter }),
        api.getProjects()
      ]);
      setBills(bList);
      setProjects(pList);
      if (pList.length > 0 && !billForm.projectId) {
        setBillForm(prev => ({ ...prev, projectId: pList[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  // BOQ Math
  const grossAmount = boqItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  const gstAmount = (grossAmount * billForm.gstRate) / 100;
  const grossWithTax = grossAmount + gstAmount;

  // Deduction Estimates (Standard Statutory Rules)
  const estWelfare = grossAmount * 0.01; // 1%
  const estCess = grossAmount * 0.01; // 1%
  const estTds = grossAmount * 0.02; // 2%
  const estGstTds = grossAmount * 0.02; // 2%
  const estRetention = grossAmount * 0.05; // 5%
  const totalDeductions = estWelfare + estCess + estTds + estGstTds + estRetention;
  const netPayable = grossWithTax - totalDeductions;

  const handleAddItem = () => {
    setBoqItems([
      ...boqItems,
      { boqItem: `ITEM-${boqItems.length + 1}.01`, description: 'New BOQ Work Item', quantity: 100, unit: 'Cu.M', rate: 1000, amount: 100000 }
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof BillItem, value: any) => {
    const updated = [...boqItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      item.amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    }
    updated[index] = item;
    setBoqItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setBoqItems(boqItems.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      await api.createBill({
        ...billForm,
        items: boqItems
      });
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      setCreateError(err.message || 'Error creating bill');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDownloadBill = (bill: Bill) => {
    const billNum = bill.billNumber || bill.billNo || 'RA-01/2026/MAD';
    const gross = (bill.grossAmount || 18500000).toLocaleString('en-IN');
    const deductions = (bill.totalDeductions || 1850000).toLocaleString('en-IN');
    const net = (bill.netPayable || bill.netAmount || 16650000).toLocaleString('en-IN');
    const outstanding = (bill.outstandingAmount || 4650000).toLocaleString('en-IN');
    const tds = ((bill.grossAmount || 18500000) * 0.02).toLocaleString('en-IN');
    const gstTds = ((bill.grossAmount || 18500000) * 0.02).toLocaleString('en-IN');
    const cess = ((bill.grossAmount || 18500000) * 0.01).toLocaleString('en-IN');
    const retention = ((bill.grossAmount || 18500000) * 0.05).toLocaleString('en-IN');

    const pdfText = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /Resources <<
    /Font <<
      /F1 4 0 R
      /F2 5 0 R
    >>
  >>
  /MediaBox [0 0 595.28 841.89]
  /Contents 6 0 R
>>
endobj
4 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
>>
endobj
5 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj
6 0 obj
<< /Length 1200 >>
stream
BT
/F1 18 Tf
40 800 Td
(ELVINA INFRA PVT LTD) Tj
0 -20 Td
/F2 11 Tf
(TenderFlow ERP - Tax Invoice & Client Bill Statement) Tj
0 -30 Td
/F1 14 Tf
(RUNNING ACCOUNT \(RA\) CLIENT BILL INVOICE) Tj
0 -30 Td
/F1 11 Tf
(Bill Number: ${billNum}) Tj
0 -18 Td
/F2 11 Tf
(Project Name: ${bill.projectName || 'Madurai Ring Road Expansion'}) Tj
0 -18 Td
(Client Name: ${bill.clientName || 'NHAI Tamil Nadu'}) Tj
0 -18 Td
(Bill Date: ${bill.billDate || '2026-05-05'}   |   Due Date: ${bill.dueDate || '2026-06-05'}) Tj
0 -18 Td
(Status: ${bill.status || 'Submitted'}) Tj
0 -35 Td
/F1 13 Tf
(FINANCIAL STATEMENT SUMMARY) Tj
0 -22 Td
/F2 11 Tf
(Gross Claimed Bill Amount : Rs. ${gross}) Tj
0 -18 Td
(Total Statutory Deductions: Rs. ${deductions} (-)) Tj
0 -18 Td
/F1 11 Tf
(NET PAYABLE AMOUNT        : Rs. ${net}) Tj
0 -18 Td
(OUTSTANDING BALANCE       : Rs. ${outstanding}) Tj
0 -35 Td
/F1 13 Tf
(STATUTORY & CONTRACT DEDUCTIONS BREAKDOWN) Tj
0 -22 Td
/F2 11 Tf
(1. TDS Income Tax Sec 194C @ 2.0% : Rs. ${tds}) Tj
0 -18 Td
(2. GST TDS @ 2.0%                 : Rs. ${gstTds}) Tj
0 -18 Td
(3. Labour Welfare Cess @ 1.0%      : Rs. ${cess}) Tj
0 -18 Td
(4. Retention Guarantee @ 5.0%      : Rs. ${retention}) Tj
0 -50 Td
/F2 9 Tf
(Official Computer-Generated Tax Invoice PDF Document from TenderFlow ERP System) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
0000000340 00000 n 
0000000413 00000 n 
trailer
<<
  /Size 7
  /Root 1 0 R
>>
startxref
1670
%%EOF`;

    const blob = new Blob([pdfText], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${billNum.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Billing & Client Invoicing</h1>
          <p className="text-xs text-slate-500 mt-1">Generate RA bills, statutory Government deductions (TDS, GST TDS, Cess, Retention) & payment schedules</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create RA Client Bill
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bills by Number, Client, Project..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Bill Number</th>
                <th className="px-4 py-3.5">Project / Client</th>
                <th className="px-4 py-3.5 text-right">Gross Amount</th>
                <th className="px-4 py-3.5 text-right">Deductions</th>
                <th className="px-4 py-3.5 text-right">Net Payable</th>
                <th className="px-4 py-3.5 text-right">Outstanding Balance</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading bills...</td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No client bills found.</td></tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{b.billNumber || b.billNo || 'RA-01/2026/MAD'}</td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{b.projectName}</div>
                      <div className="text-[10px] text-slate-400">{b.clientName}</div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-semibold">{formatINR(b.grossAmount)}</td>

                    <td className="px-4 py-3.5 text-right font-semibold text-rose-600">
                      - {formatINR(b.totalDeductions)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-blue-700">{formatINR(b.netPayable || b.netAmount)}</td>

                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatINR(b.outstandingAmount || ((b.grossAmount || 0) - (b.totalDeductions || 0)))}</td>

                    <td className="px-4 py-3.5">
                      <Badge variant={b.status === 'Paid' ? 'success' : 'warning'}>{b.status}</Badge>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => setSelectedBillId(b.id)}
                          className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                          title="View Bill"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadBill(b)}
                          className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                          title="Download Bill File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedBillId(b.id)}
                          className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                          title="Edit Bill"
                        >
                          <Pencil className="w-4 h-4" />
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

      {/* Create Bill Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Client Running Account (RA) Bill"
        subtitle="Build BOQ items; statutory deductions (TDS, Cess, Retention) automatically calculated"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {createError && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">{createError}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Project *</label>
              <select
                required
                value={billForm.projectId}
                onChange={(e) => setBillForm({ ...billForm, projectId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="" disabled>Select Project Reference</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.projectName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bill / Invoice Number *</label>
              <input
                type="text"
                required
                value={billForm.billNumber}
                onChange={(e) => setBillForm({ ...billForm, billNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bill Date *</label>
              <input
                type="date"
                required
                value={billForm.billDate}
                onChange={(e) => setBillForm({ ...billForm, billDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Dynamic BOQ Builder */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Bill BOQ Items Builder</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add BOQ Item
              </button>
            </div>

            <div className="space-y-2">
              {boqItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border">
                  <input
                    type="text"
                    placeholder="BOQ Item"
                    value={item.boqItem}
                    onChange={(e) => handleUpdateItem(idx, 'boqItem', e.target.value)}
                    className="col-span-2 px-2 py-1 bg-slate-50 border rounded text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                    className="col-span-4 px-2 py-1 bg-slate-50 border rounded text-[11px]"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                    className="col-span-2 px-2 py-1 bg-slate-50 border rounded text-[11px] font-bold"
                  />
                  <input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => handleUpdateItem(idx, 'rate', Number(e.target.value))}
                    className="col-span-2 px-2 py-1 bg-slate-50 border rounded text-[11px]"
                  />
                  <div className="col-span-1 font-bold text-right pr-1">{formatINR(item.amount)}</div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="col-span-1 text-rose-500 hover:text-rose-700 flex justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Auto Deduction Calculator Panel */}
          <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-semibold">Gross BOQ Amount:</span>
              <div className="font-bold text-slate-900 text-sm">{formatINR(grossAmount)}</div>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">GST (18%):</span>
              <div className="font-bold text-slate-900 text-sm">{formatINR(gstAmount)}</div>
            </div>
            <div>
              <span className="text-rose-700 font-semibold">Auto Deductions (TDS, Retention, Cess):</span>
              <div className="font-bold text-rose-800 text-sm">{formatINR(totalDeductions)}</div>
            </div>
            <div>
              <span className="text-blue-700 font-bold">Net Bill Receivable:</span>
              <div className="font-black text-blue-950 text-base">{formatINR(netPayable)}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
            <button type="submit" disabled={createLoading} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">Submit RA Bill</button>
          </div>
        </form>
      </Modal>

      <BillDetailsModal
        isOpen={!!selectedBillId}
        onClose={() => setSelectedBillId(null)}
        billId={selectedBillId}
        onRefresh={fetchData}
      />
    </div>
  );
};
