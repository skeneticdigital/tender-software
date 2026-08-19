import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Pencil, Trash2, Building2, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { WorkOrder } from '../types';
import { Badge } from '../components/ui/Badge';

export const WorkOrderModule: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkOrders();
      setWorkOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkOrder = () => {
    const title = prompt('Enter Work Order Title:', 'Construction of Flyover Ramp & Retaining Wall');
    if (!title) return;
    const woNum = prompt('Enter Work Order / Contract Ref Number:', 'WO/NHAI/MAD/2026/088');
    const valStr = prompt('Enter Contract Value (in INR):', '45000000');
    if (!valStr) return;

    const newWo: WorkOrder = {
      id: `wo-${Date.now()}`,
      workOrderNumber: woNum || `WO-${Date.now()}`,
      title: title,
      clientName: 'NHAI Tamil Nadu',
      contractorName: 'Elvina Infra Pvt Ltd (Prime Contractor)',
      orderType: 'Government Work Order',
      value: parseFloat(valStr) || 45000000,
      startDate: new Date().toISOString().split('T')[0],
      completionDate: '2027-12-31',
      status: 'Active',
      scopeOfWork: 'Civil infrastructure construction with RA billing',
      paymentTerms: 'Monthly Running Account Bills',
      retentionPct: 5.0,
      emdDeposited: 450000
    };

    setWorkOrders([newWo, ...workOrders]);
  };

  const filtered = workOrders.filter(w => {
    const matchesSearch = w.title.toLowerCase().includes(search.toLowerCase()) ||
                          w.workOrderNumber.toLowerCase().includes(search.toLowerCase()) ||
                          w.contractorName.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || w.orderType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Work Orders & Subcontracts Module</h1>
          <p className="text-xs text-slate-500 mt-1">Management of active government work orders, inward prime contracts & outward subcontracts</p>
        </div>
        <button
          onClick={handleAddWorkOrder}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Issue Work Order / Subcontract
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
            placeholder="Search work orders by title, WO number or contractor..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
        >
          <option value="">All Contract Types</option>
          <option value="Government Work Order">Government Work Orders</option>
          <option value="Outward Subcontract">Outward Subcontracts (Given Out)</option>
          <option value="Inward Subcontract">Inward Subcontracts (Received)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Work Order Ref & Title</th>
                <th className="px-4 py-3.5">Contract Type</th>
                <th className="px-4 py-3.5">Client / Subcontractor</th>
                <th className="px-4 py-3.5 text-right">Contract Value</th>
                <th className="px-4 py-3.5">Start Date</th>
                <th className="px-4 py-3.5">Completion Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading work orders...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No work order contracts found.</td></tr>
              ) : (
                filtered.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{wo.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{wo.workOrderNumber}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={
                        wo.orderType === 'Government Work Order' ? 'purple' :
                        wo.orderType === 'Outward Subcontract' ? 'info' : 'success'
                      }>
                        {wo.orderType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{wo.clientName}</div>
                      <div className="text-[10px] text-slate-500">{wo.contractorName}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-blue-900 text-sm">{formatINR(wo.value)}</td>
                    <td className="px-4 py-3.5">{wo.startDate}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{wo.completionDate}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={wo.status === 'Active' ? 'success' : 'default'}>{wo.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            const newVal = prompt(`Update Value for Work Order "${wo.workOrderNumber}":`, wo.value.toString());
                            if (newVal) {
                              wo.value = parseFloat(newVal) || wo.value;
                              setWorkOrders([...workOrders]);
                            }
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                          title="Edit Work Order"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete work order "${wo.workOrderNumber}"?`)) {
                              setWorkOrders(workOrders.filter(x => x.id !== wo.id));
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                          title="Delete Work Order"
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
