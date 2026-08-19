import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, Search, Pencil, Trash2, TrendingUp, TrendingDown, Layers, FileText } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { RateAnalysisItem } from '../types';
import { Badge } from '../components/ui/Badge';

export const RateAnalysisModule: React.FC = () => {
  const [items, setItems] = useState<RateAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
          onClick={() => {
            const name = prompt('Enter Item Name for Rate Analysis:', 'Granular Sub-Base (GSB) 250mm Paving');
            if (name) {
              const newItem: RateAnalysisItem = {
                id: `ra-${Date.now()}`,
                itemCode: `RAT-GSB-${Math.floor(Math.random() * 90 + 10)}`,
                itemName: name,
                unit: 'cu.m',
                tenderEstimatedRate: 1450,
                currentMarketRate: 1520,
                variancePerUnit: 70,
                variancePct: 4.83,
                labourComponentRate: 220,
                materialComponentRate: 1050,
                machineryComponentRate: 250,
                overheadProfitPct: 10,
                finalAnalyzedRate: 1672,
                status: 'Profitable',
                lastUpdated: new Date().toISOString().split('T')[0]
              };
              setItems([newItem, ...items]);
            }
          }}
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
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading rate analysis...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No rate analysis records found.</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
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
                          onClick={() => {
                            const newMktRate = prompt(`Update Current Market Rate for "${item.itemName}":`, item.currentMarketRate.toString());
                            if (newMktRate) {
                              const rate = parseFloat(newMktRate) || item.currentMarketRate;
                              item.currentMarketRate = rate;
                              item.variancePerUnit = rate - item.tenderEstimatedRate;
                              item.variancePct = Math.round(((rate - item.tenderEstimatedRate) / item.tenderEstimatedRate) * 10000) / 100;
                              setItems([...items]);
                            }
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                          title="Edit Rate Analysis"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete rate item "${item.itemCode}"?`)) {
                              setItems(items.filter(x => x.id !== item.id));
                            }
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
    </div>
  );
};
