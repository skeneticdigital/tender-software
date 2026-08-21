import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, Search, Pencil, Trash2, TrendingUp, Save } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { RateAnalysisItem } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const RateAnalysisModule: React.FC = () => {
  const [items, setItems] = useState<RateAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RateAnalysisItem | null>(null);
  const [formData, setFormData] = useState<Partial<RateAnalysisItem>>({
    itemCode: '',
    itemName: '',
    unit: 'cu.m',
    tenderEstimatedRate: 1500,
    currentMarketRate: 1600,
    labourComponentRate: 250,
    materialComponentRate: 1050,
    machineryComponentRate: 300,
    overheadProfitPct: 10,
    status: 'Profitable'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getRateAnalysis();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      itemCode: `RAT-${Math.floor(Math.random() * 9000 + 1000)}`,
      itemName: '',
      unit: 'cu.m',
      tenderEstimatedRate: 1500,
      currentMarketRate: 1600,
      labourComponentRate: 250,
      materialComponentRate: 1050,
      machineryComponentRate: 300,
      overheadProfitPct: 10,
      status: 'Profitable'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: RateAnalysisItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const est = parseFloat(formData.tenderEstimatedRate as any) || 0;
    const mkt = parseFloat(formData.currentMarketRate as any) || 0;
    const lab = parseFloat(formData.labourComponentRate as any) || 0;
    const mat = parseFloat(formData.materialComponentRate as any) || 0;
    const mac = parseFloat(formData.machineryComponentRate as any) || 0;
    
    const analyzed = lab + mat + mac;
    const diff = mkt - est;
    const pct = est > 0 ? Math.round((diff / est) * 10000) / 100 : 0;

    let computedStatus: 'Profitable' | 'Tight Margin' | 'Loss Risk' = 'Profitable';
    if (diff > est * 0.1) computedStatus = 'Loss Risk';
    else if (diff > 0) computedStatus = 'Tight Margin';

    if (editingItem) {
      // Update
      const updatedList = items.map(i => i.id === editingItem.id ? {
        ...i,
        ...formData,
        tenderEstimatedRate: est,
        currentMarketRate: mkt,
        labourComponentRate: lab,
        materialComponentRate: mat,
        machineryComponentRate: mac,
        finalAnalyzedRate: analyzed,
        variancePerUnit: diff,
        variancePct: pct,
        status: computedStatus,
        lastUpdated: new Date().toISOString().split('T')[0]
      } as RateAnalysisItem : i);
      setItems(updatedList);
    } else {
      // Create
      const newItem: RateAnalysisItem = {
        id: `ra-${Date.now()}`,
        itemCode: formData.itemCode || `RAT-${Date.now()}`,
        itemName: formData.itemName || 'New Rate Analysis Item',
        unit: formData.unit || 'cu.m',
        tenderEstimatedRate: est,
        currentMarketRate: mkt,
        variancePerUnit: diff,
        variancePct: pct,
        labourComponentRate: lab,
        materialComponentRate: mat,
        machineryComponentRate: mac,
        overheadProfitPct: formData.overheadProfitPct || 10,
        finalAnalyzedRate: analyzed,
        status: computedStatus,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      setItems([newItem, ...items]);
    }

    setIsModalOpen(false);
  };

  const filtered = items.filter(i =>
    i.itemName.toLowerCase().includes(search.toLowerCase()) ||
    i.itemCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rate Calculations & Variance Analysis</h1>
          <p className="text-xs text-slate-500 mt-1">Detailed unit rate breakdown across Labour, Materials & Machinery components vs Tender Estimated Rates</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Rate Item
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
            placeholder="Search rate analysis by item name or code..."
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
                <th className="px-3 py-3.5 text-center w-12">S.NO</th>
                <th className="px-4 py-3.5">Item Code & Description</th>
                <th className="px-4 py-3.5 text-right">Unit</th>
                <th className="px-4 py-3.5 text-right">Tender Est. Rate</th>
                <th className="px-4 py-3.5 text-right">Current Market Rate</th>
                <th className="px-4 py-3.5 text-right">Labour / Mat / Mach</th>
                <th className="px-4 py-3.5 text-right">Analyzed Rate</th>
                <th className="px-4 py-3.5">Margin Status</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={9} className="p-8 text-center text-slate-400">Loading rate analysis...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-slate-400">No rate analysis records found.</td></tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3.5 text-center font-mono text-slate-400 font-bold">{index + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{item.itemName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.itemCode}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-700">{item.unit}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-800">{formatINR(item.tenderEstimatedRate)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatINR(item.currentMarketRate)}</td>
                    <td className="px-4 py-3.5 text-right text-[11px]">
                      <span className="text-blue-700">L:{item.labourComponentRate}</span> | <span className="text-emerald-700">M:{item.materialComponentRate}</span> | <span className="text-amber-700">MC:{item.machineryComponentRate}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-blue-900 text-sm">{formatINR(item.finalAnalyzedRate)}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={
                        item.status === 'Profitable' ? 'success' :
                        item.status === 'Tight Margin' ? 'warning' : 'danger'
                      }>
                        {item.status} ({item.variancePct > 0 ? '+' : ''}{item.variancePct}%)
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                          title="Edit Rate Analysis"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setItems(items.filter(x => x.id !== item.id));
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                          title="Delete Rate Item"
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

      {/* Custom React Modal Form for Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit Rate Analysis: ${editingItem.itemCode}` : 'Add Rate Analysis Item'}
        subtitle="Configure unit rates, market variations & component breakdowns"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Item Code *</label>
              <input
                type="text"
                required
                value={formData.itemCode || ''}
                onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Item Description / Work Name *</label>
              <input
                type="text"
                required
                value={formData.itemName || ''}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                placeholder="e.g. M30 Ready Mix Concrete (Pumping included)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit *</label>
              <select
                value={formData.unit || 'cu.m'}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
              >
                <option value="cu.m">cu.m (Cubic Meters)</option>
                <option value="sq.m">sq.m (Square Meters)</option>
                <option value="MT">MT (Metric Tonnes)</option>
                <option value="kg">kg (Kilograms)</option>
                <option value="Litres">Litres</option>
                <option value="Nos">Nos (Numbers)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tender Estimated Rate (₹) *</label>
              <input
                type="number"
                required
                value={formData.tenderEstimatedRate || 0}
                onChange={(e) => setFormData({ ...formData, tenderEstimatedRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Market Rate (₹) *</label>
              <input
                type="number"
                required
                value={formData.currentMarketRate || 0}
                onChange={(e) => setFormData({ ...formData, currentMarketRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-blue-700"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 block text-xs">Cost Component Rates Breakdown (₹ / {formData.unit || 'Unit'})</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-blue-800 mb-1">Labour Rate (₹)</label>
                <input
                  type="number"
                  value={formData.labourComponentRate || 0}
                  onChange={(e) => setFormData({ ...formData, labourComponentRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-blue-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-emerald-800 mb-1">Material Rate (₹)</label>
                <input
                  type="number"
                  value={formData.materialComponentRate || 0}
                  onChange={(e) => setFormData({ ...formData, materialComponentRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-emerald-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-amber-800 mb-1">Machinery Rate (₹)</label>
                <input
                  type="number"
                  value={formData.machineryComponentRate || 0}
                  onChange={(e) => setFormData({ ...formData, machineryComponentRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-amber-900"
                />
              </div>
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
              <Save className="w-4 h-4" /> Save Rate Analysis Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
