import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Search, Pencil, Trash2, ArrowRightLeft, FileSpreadsheet, Save } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { EstimateItem, EstimateComparison } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const EstimateModule: React.FC = () => {
  const [estimates, setEstimates] = useState<EstimateComparison[]>([]);
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison'>('comparison');

  // Calculator State
  const [length, setLength] = useState<number>(100);
  const [width, setWidth] = useState<number>(7.5);
  const [depth, setDepth] = useState<number>(0.25);
  const [steelRatio, setSteelRatio] = useState<number>(110);

  // New Estimate Modal State
  const [isEstModalOpen, setIsEstModalOpen] = useState(false);
  const [estFormName, setEstFormName] = useState('');

  // BOQ Item Modal State (Add & Edit)
  const [isBoqModalOpen, setIsBoqModalOpen] = useState(false);
  const [editingBoqItem, setEditingBoqItem] = useState<EstimateItem | null>(null);
  const [boqForm, setBoqForm] = useState<Partial<EstimateItem>>({
    code: 'BOQ-CONC-01',
    description: '',
    quantity: 100,
    unit: 'cu.m',
    estimate1Rate: 8500,
    estimate2Rate: 9200
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getEstimates();
      setEstimates(data);
      if (data.length > 0) setSelectedEstimate(data[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Dimensional calculation
  const totalVolumeCumu = length * width * depth;
  const cementBags = Math.round(totalVolumeCumu * 8.2);
  const sandCumu = Math.round(totalVolumeCumu * 0.45 * 100) / 100;
  const jellyCumu = Math.round(totalVolumeCumu * 0.85 * 100) / 100;
  const steelKg = Math.round(totalVolumeCumu * steelRatio);

  const handleOpenAddEstimate = () => {
    setEstFormName(`Detailed BOQ Estimate v${estimates.length + 1}`);
    setIsEstModalOpen(true);
  };

  const handleSaveNewEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estFormName) return;

    const newEst: EstimateComparison = {
      id: `est-${Date.now()}`,
      projectId: 'p-001',
      projectName: 'Madurai Ring Road Expansion Project',
      estimateName: estFormName,
      date: new Date().toISOString().split('T')[0],
      totalEstimate1Value: 185000000,
      totalEstimate2Value: 198200000,
      varianceValue: 13200000,
      items: [
        {
          id: 'boq-001',
          code: 'BOQ-CONC-01',
          description: 'M30 Grade Reinforced Cement Concrete for Bridge Piers & Abutments',
          quantity: 4500,
          unit: 'cu.m',
          estimate1Rate: 8500,
          estimate1Total: 38250000,
          estimate2Rate: 9200,
          estimate2Total: 41400000,
          varianceAmount: 3150000,
          variancePct: 8.24
        }
      ]
    };
    setEstimates([newEst, ...estimates]);
    setSelectedEstimate(newEst);
    setIsEstModalOpen(false);
  };

  const handleOpenAddBoqItem = () => {
    setEditingBoqItem(null);
    setBoqForm({
      code: `BOQ-ITEM-${Math.floor(Math.random() * 90 + 10)}`,
      description: '',
      quantity: 100,
      unit: 'cu.m',
      estimate1Rate: 1500,
      estimate2Rate: 1650
    });
    setIsBoqModalOpen(true);
  };

  const handleOpenEditBoqItem = (item: EstimateItem) => {
    setEditingBoqItem(item);
    setBoqForm({ ...item });
    setIsBoqModalOpen(true);
  };

  const handleSaveBoqItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstimate) return;

    const qty = parseFloat(boqForm.quantity as any) || 0;
    const r1 = parseFloat(boqForm.estimate1Rate as any) || 0;
    const r2 = parseFloat(boqForm.estimate2Rate as any) || 0;
    const tot1 = qty * r1;
    const tot2 = qty * r2;
    const diff = tot2 - tot1;
    const pct = tot1 > 0 ? Math.round((diff / tot1) * 10000) / 100 : 0;

    if (editingBoqItem) {
      // Edit
      selectedEstimate.items = selectedEstimate.items.map(item =>
        item.id === editingBoqItem.id ? {
          ...item,
          ...boqForm,
          quantity: qty,
          estimate1Rate: r1,
          estimate1Total: tot1,
          estimate2Rate: r2,
          estimate2Total: tot2,
          varianceAmount: diff,
          variancePct: pct
        } as EstimateItem : item
      );
    } else {
      // Add
      const newItem: EstimateItem = {
        id: `boq-${Date.now()}`,
        code: boqForm.code || `BOQ-${Date.now()}`,
        description: boqForm.description || 'BOQ Work Description Item',
        quantity: qty,
        unit: boqForm.unit || 'cu.m',
        estimate1Rate: r1,
        estimate1Total: tot1,
        estimate2Rate: r2,
        estimate2Total: tot2,
        varianceAmount: diff,
        variancePct: pct
      };
      selectedEstimate.items.push(newItem);
    }

    // Recalculate Totals
    selectedEstimate.totalEstimate1Value = selectedEstimate.items.reduce((acc, i) => acc + i.estimate1Total, 0);
    selectedEstimate.totalEstimate2Value = selectedEstimate.items.reduce((acc, i) => acc + i.estimate2Total, 0);
    selectedEstimate.varianceValue = selectedEstimate.totalEstimate2Value - selectedEstimate.totalEstimate1Value;

    setSelectedEstimate({ ...selectedEstimate });
    setIsBoqModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Estimate & Quantity Take-Off Module</h1>
          <p className="text-xs text-slate-500 mt-1">Unit-level dimensional calculations, material coefficients & Estimate 1 vs Estimate 2 comparative analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'calculator' ? 'comparison' : 'calculator')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            {activeTab === 'calculator' ? 'View Estimate 1 vs 2 Comparison' : 'Material Quantity Calculator'}
          </button>
          <button
            onClick={handleOpenAddEstimate}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Estimate
          </button>
        </div>
      </div>

      {activeTab === 'calculator' ? (
        /* Tab 1: Live Material Coefficient Calculator */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              Dimensions & Parameters
            </h2>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Length (L) in Meters</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Width / Breadth (B) in Meters</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Depth / Thickness (D) in Meters</label>
              <input
                type="number"
                step="0.01"
                value={depth}
                onChange={(e) => setDepth(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Steel Reinforcement Ratio (kg / cu.m)</label>
              <input
                type="number"
                value={steelRatio}
                onChange={(e) => setSteelRatio(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Calculated Total Volume</span>
                <div className="text-3xl font-black text-blue-900">{totalVolumeCumu.toFixed(2)} cu.m</div>
              </div>
              <Badge variant="purple" size="md">IS 456 Concrete Coefficients</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-800 uppercase">Cement Required</span>
                <div className="text-xl font-black text-blue-950">{cementBags} Bags</div>
                <span className="text-[10px] text-blue-600">({(cementBags * 50 / 1000).toFixed(2)} MT)</span>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase">M-Sand Required</span>
                <div className="text-xl font-black text-amber-950">{sandCumu} cu.m</div>
                <span className="text-[10px] text-amber-600">({(sandCumu * 35.315).toFixed(0)} cu.ft)</span>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Blue Metal Jelly</span>
                <div className="text-xl font-black text-emerald-950">{jellyCumu} cu.m</div>
                <span className="text-[10px] text-emerald-600">({(jellyCumu * 35.315).toFixed(0)} cu.ft)</span>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <span className="text-[10px] font-bold text-purple-800 uppercase">TMT Steel Required</span>
                <div className="text-xl font-black text-purple-950">{(steelKg / 1000).toFixed(2)} MT</div>
                <span className="text-[10px] text-purple-600">({steelKg} kg)</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Estimate 1 vs Estimate 2 Comparison */
        <div className="space-y-6">
          {/* Estimate Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Select Active Comparison Document:</span>
              <select
                value={selectedEstimate?.id || ''}
                onChange={(e) => {
                  const est = estimates.find(x => x.id === e.target.value);
                  if (est) setSelectedEstimate(est);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              >
                {estimates.map(e => (
                  <option key={e.id} value={e.id}>{e.estimateName} ({e.date})</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAddBoqItem}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add BOQ Item
            </button>
          </div>

          {selectedEstimate && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Comparison Document</span>
                  <h2 className="text-xl font-black text-slate-900">{selectedEstimate.estimateName}</h2>
                  <p className="text-xs text-slate-500">Project: {selectedEstimate.projectName} | Date: {selectedEstimate.date}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Estimate 1 (Original)</span>
                    <div className="text-base font-black text-slate-900">{formatINR(selectedEstimate.totalEstimate1Value)}</div>
                  </div>
                  <div className="text-right p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Estimate 2 (Current Market)</span>
                    <div className="text-base font-black text-emerald-950">{formatINR(selectedEstimate.totalEstimate2Value)}</div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">BOQ Item Code</th>
                      <th className="px-4 py-3.5">Work Description</th>
                      <th className="px-4 py-3.5 text-right">Qty & Unit</th>
                      <th className="px-4 py-3.5 text-right">Est 1 Rate</th>
                      <th className="px-4 py-3.5 text-right">Est 1 Total</th>
                      <th className="px-4 py-3.5 text-right">Est 2 Rate</th>
                      <th className="px-4 py-3.5 text-right">Est 2 Total</th>
                      <th className="px-4 py-3.5 text-right">Variance</th>
                      <th className="px-4 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedEstimate.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3.5 font-bold text-slate-900 font-mono">{item.code}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">{item.description}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-600">{formatINR(item.estimate1Rate)}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-blue-700">{formatINR(item.estimate1Total)}</td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-600">{formatINR(item.estimate2Rate)}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-700">{formatINR(item.estimate2Total)}</td>
                        <td className="px-4 py-3.5 text-right">
                          <Badge variant={item.variancePct > 5 ? 'danger' : 'success'}>
                            +{item.variancePct}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditBoqItem(item)}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                              title="Edit BOQ Item Rates"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                selectedEstimate.items = selectedEstimate.items.filter(x => x.id !== item.id);
                                setSelectedEstimate({ ...selectedEstimate });
                              }}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                              title="Delete Item"
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
        </div>
      )}

      {/* Modal 1: Create New Estimate */}
      <Modal
        isOpen={isEstModalOpen}
        onClose={() => setIsEstModalOpen(false)}
        title="Create New Estimate Comparison Document"
        subtitle="Initialize Estimate 1 vs Estimate 2 comparative dataset"
        maxWidth="md"
      >
        <form onSubmit={handleSaveNewEstimate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Estimate Document Title *</label>
            <input
              type="text"
              required
              value={estFormName}
              onChange={(e) => setEstFormName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
              placeholder="e.g. Detailed BOQ Estimate v3"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEstModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Create Estimate Document
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add / Edit BOQ Item */}
      <Modal
        isOpen={isBoqModalOpen}
        onClose={() => setIsBoqModalOpen(false)}
        title={editingBoqItem ? `Edit BOQ Item: ${editingBoqItem.code}` : 'Add New BOQ Item'}
        subtitle="Specify work item quantities, Estimate 1 original rate & Estimate 2 market rate"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveBoqItem} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">BOQ Code *</label>
              <input
                type="text"
                required
                value={boqForm.code || ''}
                onChange={(e) => setBoqForm({ ...boqForm, code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Work Description *</label>
              <input
                type="text"
                required
                value={boqForm.description || ''}
                onChange={(e) => setBoqForm({ ...boqForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                placeholder="e.g. M30 Grade RCC Concrete for Bridge Abutments"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                required
                value={boqForm.quantity || 0}
                onChange={(e) => setBoqForm({ ...boqForm, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit *</label>
              <select
                value={boqForm.unit || 'cu.m'}
                onChange={(e) => setBoqForm({ ...boqForm, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              >
                <option value="cu.m">cu.m</option>
                <option value="sq.m">sq.m</option>
                <option value="MT">MT</option>
                <option value="kg">kg</option>
                <option value="Litres">Litres</option>
                <option value="Nos">Nos</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Estimate 1 Rate (₹) *</label>
              <input
                type="number"
                required
                value={boqForm.estimate1Rate || 0}
                onChange={(e) => setBoqForm({ ...boqForm, estimate1Rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Estimate 2 Rate (₹) *</label>
              <input
                type="number"
                required
                value={boqForm.estimate2Rate || 0}
                onChange={(e) => setBoqForm({ ...boqForm, estimate2Rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBoqModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save BOQ Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
