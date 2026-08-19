import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Pencil, Trash2, Calendar, AlertTriangle, ShieldCheck, FileCheck, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { CompanyFilingDoc } from '../types';
import { Badge } from '../components/ui/Badge';

export const CompanyFilingModule: React.FC = () => {
  const [docs, setDocs] = useState<CompanyFilingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getCompanyFilings();
      setDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = () => {
    const title = prompt('Enter Document Title (e.g. GST Registration Certificate):', 'Commercial Vehicle RC Book - Tipper Truck');
    if (!title) return;
    const cat = prompt('Enter Category (Government License / Tax Certificate / PWD Registration / Vehicle RC Book):', 'Vehicle RC Book');
    const refNum = prompt('Enter License / Ref Number:', `RC-TN59-${Math.floor(Math.random() * 8999 + 1000)}`);
    const expDate = prompt('Enter Expiry Date (YYYY-MM-DD):', '2026-11-30');

    const newDoc: CompanyFilingDoc = {
      id: `cfg-${Date.now()}`,
      documentTitle: title,
      documentCategory: (cat as any) || 'Vehicle RC Book',
      referenceNumber: refNum || 'REF-10029',
      issuingAuthority: 'Government Authority',
      issueDate: '2021-06-01',
      expiryDate: expDate || '2026-11-30',
      renewalCycleYears: 5,
      daysUntilExpiry: 180,
      status: 'Renewal Due Soon'
    };

    setDocs([newDoc, ...docs]);
  };

  const filtered = docs.filter(d => {
    const matchesSearch = d.documentTitle.toLowerCase().includes(search.toLowerCase()) ||
                          d.referenceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !categoryFilter || d.documentCategory === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Filing & License Vault</h1>
          <p className="text-xs text-slate-500 mt-1">Centralized digital archive for company registrations, PWD/NHAI licenses, vehicle RC books & 3/5-year renewal alert tracking</p>
        </div>
        <button
          onClick={handleAddDocument}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Archive Company Document
        </button>
      </div>

      {/* Expiry Alerts Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-xl font-black text-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Valid Active Licenses</span>
            <div className="text-xl font-black text-emerald-950">{docs.filter(d => d.status === 'Valid Active').length} Documents</div>
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-center gap-3">
          <div className="p-3 bg-amber-600 text-white rounded-xl font-black text-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Renewal Due Soon</span>
            <div className="text-xl font-black text-amber-950">{docs.filter(d => d.status === 'Renewal Due Soon').length} Documents</div>
          </div>
        </div>

        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 flex items-center gap-3">
          <div className="p-3 bg-rose-600 text-white rounded-xl font-black text-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Standard Renewal Cycle</span>
            <div className="text-xl font-black text-rose-950">3 & 5 Year Cycles</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document title or reference number..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
        >
          <option value="">All Document Categories</option>
          <option value="PWD / NHAI Registration">PWD / NHAI Contractor Registrations</option>
          <option value="Tax Certificate (GST/PAN)">Tax Certificates (GST / PAN)</option>
          <option value="Vehicle RC Book">Vehicle RC Books</option>
          <option value="Government License">Government Licenses</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Document Title & Ref</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Issuing Authority</th>
                <th className="px-4 py-3.5">Issue Date</th>
                <th className="px-4 py-3.5">Expiry Date</th>
                <th className="px-4 py-3.5">Cycle</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading document vault...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No company filing documents archived.</td></tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{d.documentTitle}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.referenceNumber}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">{d.documentCategory}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{d.issuingAuthority}</td>
                    <td className="px-4 py-3.5">{d.issueDate}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{d.expiryDate}</td>
                    <td className="px-4 py-3.5 font-bold text-blue-700">{d.renewalCycleYears} Years</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={
                        d.status === 'Valid Active' ? 'success' :
                        d.status === 'Renewal Due Soon' ? 'warning' : 'danger'
                      }>
                        {d.status} ({d.daysUntilExpiry} days left)
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            const newExp = prompt(`Update Expiry Date for "${d.documentTitle}":`, d.expiryDate);
                            if (newExp) {
                              d.expiryDate = newExp;
                              setDocs([...docs]);
                            }
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                          title="Edit Document Dates"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete archive document "${d.documentTitle}"?`)) {
                              setDocs(docs.filter(x => x.id !== d.id));
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                          title="Delete Document"
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
