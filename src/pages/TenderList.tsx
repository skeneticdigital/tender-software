import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Eye, Pencil, ArrowUpDown, Landmark, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { api, formatLakhsCr, formatINR } from '../lib/api';
import { Tender } from '../types';
import { Badge } from '../components/ui/Badge';
import { CreateTenderModal } from './CreateTenderModal';
import { TenderDetailsModal } from './TenderDetailsModal';

interface TenderListProps {
  onNavigateTab: (tab: string, id?: string) => void;
  selectedTenderId?: string;
}

export const TenderList: React.FC<TenderListProps> = ({ onNavigateTab, selectedTenderId }) => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(selectedTenderId || null);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.getTenders(params);
      setTenders(res);
    } catch (err) {
      console.error('Error loading tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    if (selectedTenderId) {
      setSelectedDetailsId(selectedTenderId);
    }
  }, [selectedTenderId]);

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tender Management</h1>
          <p className="text-xs text-slate-500 mt-1">Track NIT notices, estimate vs quoted valuation, quote variance, and result conversion</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Tender Quote
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenders by Name, Ref Number, Client, Location..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="Preparing">Preparing</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Evaluation">Under Evaluation</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="Highways">Highways</option>
            <option value="Building">Building</option>
            <option value="Water Supply">Water Supply</option>
            <option value="Bridges">Bridges</option>
            <option value="Electrical">Electrical</option>
          </select>
        </div>
      </div>

      {/* Tenders Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Ref No & Tender Name</th>
                <th className="px-4 py-3.5">Client & Dept</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Submission Date</th>
                <th className="px-4 py-3.5 text-right">Estimated Value</th>
                <th className="px-4 py-3.5 text-right">Quoted Bid</th>
                <th className="px-4 py-3.5 text-center">Paid Challan Doc</th>
                <th className="px-4 py-3.5 text-center">Tender Notice Doc</th>
                <th className="px-4 py-3.5 text-right">Quote Variance</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">Loading tenders...</td>
                </tr>
              ) : tenders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">No tenders found matching criteria.</td>
                </tr>
              ) : (
                tenders.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{t.refNumber}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{t.name}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{t.clientName}</div>
                      <div className="text-[10px] text-slate-400">{t.departmentType}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                        {t.projectCategory}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{t.submissionDate?.split('T')[0]}</div>
                      <div className="text-[10px] text-slate-400">Opening: {t.openingDate?.split('T')[0]}</div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                      {formatLakhsCr(t.estimatedValue)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-blue-700">
                      {formatLakhsCr(t.quotedAmount)}
                    </td>

                    {/* Column 1: Paid Challan */}
                    <td className="px-4 py-3.5 text-center">
                      {t.paidChallanDoc ? (
                        <a
                          href={t.paidChallanDoc}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold hover:bg-emerald-100"
                        >
                          📄 Paid Fee (PDF)
                        </a>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold hover:bg-slate-200">
                          + Add Challan
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const dummyUrl = URL.createObjectURL(file);
                                setTenders(prev => prev.map(x => x.id === t.id ? { ...x, paidChallanDoc: dummyUrl } : x));
                              }
                            }}
                          />
                        </label>
                      )}
                    </td>

                    {/* Column 2: Tender Notice */}
                    <td className="px-4 py-3.5 text-center">
                      {t.tenderNoticeDoc ? (
                        <a
                          href={t.tenderNoticeDoc}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold hover:bg-blue-100"
                        >
                          📋 NIT Notice (PDF)
                        </a>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold hover:bg-slate-200">
                          + Add Notice
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const dummyUrl = URL.createObjectURL(file);
                                setTenders(prev => prev.map(x => x.id === t.id ? { ...x, tenderNoticeDoc: dummyUrl } : x));
                              }
                            }}
                          />
                        </label>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-bold ${
                        (t.quoteVariancePct || 0) < 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {(t.quoteVariancePct || 0).toFixed(2)}%
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge variant={
                        t.tenderStatus === 'Won' ? 'success' :
                        t.tenderStatus === 'Lost' ? 'danger' :
                        t.tenderStatus === 'Submitted' ? 'info' : 'warning'
                      }>
                        {t.tenderStatus}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => setSelectedDetailsId(t.id)}
                          className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedDetailsId(t.id)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit Tender"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setTenders(prev => prev.filter(x => x.id !== t.id));
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                          title="Delete Tender"
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

      {/* Modals */}
      <CreateTenderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchTenders}
      />

      <TenderDetailsModal
        isOpen={!!selectedDetailsId}
        onClose={() => setSelectedDetailsId(null)}
        tenderId={selectedDetailsId}
        onRefresh={fetchTenders}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
