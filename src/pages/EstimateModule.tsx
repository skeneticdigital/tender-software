import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Search, Eye, Pencil, Trash2, ArrowUpDown, FileSpreadsheet, Download, Layers } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { EstimateComparison, EstimateItem } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const EstimateModule: React.FC = () => {
  const [estimates, setEstimates] = useState<EstimateComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateComparison | null>(null);

  // Unit Calculator State
  const [calcForm, setCalcForm] = useState({
    workType: 'Concrete',
    length: 10,
    width: 5,
    height: 3,
    unit: 'cu.m'
  });

  const [calcResult, setCalcResult] = useState<{ volumeCuM: number; cementBags: number; sandCuM: number; jellyCuM: number; steelKg: number } | null>(null);

  useEffect(() => {
    fetchEstimates();
  }, []);

  const fetchEstimates = async () => {
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

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const volume = calcForm.length * calcForm.width * calcForm.height;
    if (calcForm.workType === 'Concrete') {
      setCalcResult({
        volumeCuM: volume,
        cementBags: Math.round(volume * 7.8),
        sandCuM: Math.round(volume * 0.45 * 100) / 100,
        jellyCuM: Math.round(volume * 0.85 * 100) / 100,
        steelKg: Math.round(volume * 110)
      });
    } else {
      // Brickwork / Masonry
      setCalcResult({
        volumeCuM: volume,
        cementBags: Math.round(volume * 2.5),
        sandCuM: Math.round(volume * 0.35 * 100) / 100,
        jellyCuM: 0,
        steelKg: 0
      });
    }
  };

  const filtered = estimates.filter(e =>
    e.projectName.toLowerCase().includes(search.toLowerCase()) ||
    e.estimateName.toLowerCase().includes(search.toLowerCase())
  );

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
            onClick={() => {
              const name = prompt('Enter new Estimate Name:', 'Bridge Foundation BOQ Estimate v3');
              if (name) {
                const newEst: EstimateComparison = {
                  id: `est-${Date.now()}`,
                  projectId: 'p-001',
                  projectName: 'Madurai Ring Road Expansion Project',
                  estimateName: name,
                  date: new Date().toISOString().split('T')[0],
                  totalEstimate1Value: 45000000,
                  totalEstimate2Value: 48500000,
                  varianceValue: 3500000,
                  items: []
                };
                setEstimates([newEst, ...estimates]);
                setSelectedEstimate(newEst);
              }
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Estimate Comparison
          </button>
        </div>
      </div>

      {/* Unit Dimension Quantity Calculator */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-sm text-slate-100">Live Unit-Level Material Requirement Calculator</h2>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-900/50 text-blue-300 px-2.5 py-1 rounded-full border border-blue-700/50">Auto Material Coefficient Engine</span>
        </div>

        <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Work Type</label>
            <select
              value={calcForm.workType}
              onChange={(e) => setCalcForm({ ...calcForm, workType: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="Concrete">RCC Concrete Work (M30/M25)</option>
              <option value="Masonry">Brick Masonry & Mortar</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Length (meters)</label>
            <input
              type="number"
              step="0.1"
              value={calcForm.length}
              onChange={(e) => setCalcForm({ ...calcForm, length: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Width (meters)</label>
            <input
              type="number"
              step="0.1"
              value={calcForm.width}
              onChange={(e) => setCalcForm({ ...calcForm, width: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Height / Depth (m)</label>
            <input
              type="number"
              step="0.1"
              value={calcForm.height}
              onChange={(e) => setCalcForm({ ...calcForm, height: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md transition-colors text-xs"
            >
              Calculate Quantities
            </button>
          </div>
        </form>

        {/* Calculator Output Display */}
        {calcResult && (
          <div className="mt-4 p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="p-2 bg-slate-900/60 rounded-lg">
              <span className="text-[10px] text-slate-400 font-medium">Total Volume</span>
              <div className="text-base font-black text-blue-400">{calcResult.volumeCuM} cu.m</div>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-lg">
              <span className="text-[10px] text-slate-400 font-medium">Cement Required</span>
              <div className="text-base font-black text-emerald-400">{calcResult.cementBags} Bags</div>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-lg">
              <span className="text-[10px] text-slate-400 font-medium">Sand Required</span>
              <div className="text-base font-black text-amber-400">{calcResult.sandCuM} cu.m</div>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-lg">
              <span className="text-[10px] text-slate-400 font-medium">Aggregate / Jelly</span>
              <div className="text-base font-black text-purple-400">{calcResult.jellyCuM} cu.m</div>
            </div>
            <div className="p-2 bg-slate-900/60 rounded-lg">
              <span className="text-[10px] text-slate-400 font-medium">TMT Steel Required</span>
              <div className="text-base font-black text-rose-400">{calcResult.steelKg} kg ({Math.round((calcResult.steelKg / 1000) * 100) / 100} MT)</div>
            </div>
          </div>
        )}
      </div>

      {/* Estimate 1 vs Estimate 2 Comparison Header */}
      {selectedEstimate && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Active Comparison Document</span>
              <h2 className="text-xl font-black text-slate-900">{selectedEstimate.estimateName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Project: {selectedEstimate.projectName}  |  Date: {selectedEstimate.date}</p>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Estimate 1 (Original)</span>
                <div className="text-base font-black text-blue-950">{formatINR(selectedEstimate.totalEstimate1Value)}</div>
              </div>
              <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Estimate 2 (Current Market)</span>
                <div className="text-base font-black text-emerald-950">{formatINR(selectedEstimate.totalEstimate2Value)}</div>
              </div>
              <div className="bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                <span className="text-[10px] font-bold text-rose-700 uppercase">Escalation Variance</span>
                <div className="text-base font-black text-rose-950">+ {formatINR(selectedEstimate.varianceValue)}</div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
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
                  <th className="px-4 py-3.5 text-right">Variance %</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {selectedEstimate.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{item.code}</td>
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
                          onClick={() => {
                            const newEst2Rate = prompt(`Update Estimate 2 Rate for "${item.code}":`, item.estimate2Rate.toString());
                            if (newEst2Rate) {
                              const rate = parseFloat(newEst2Rate) || item.estimate2Rate;
                              item.estimate2Rate = rate;
                              item.estimate2Total = rate * item.quantity;
                              setSelectedEstimate({ ...selectedEstimate });
                            }
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                          title="Edit Item Rates"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete BOQ Item "${item.code}"?`)) {
                              selectedEstimate.items = selectedEstimate.items.filter(x => x.id !== item.id);
                              setSelectedEstimate({ ...selectedEstimate });
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                          title="Delete BOQ Item"
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
  );
};
