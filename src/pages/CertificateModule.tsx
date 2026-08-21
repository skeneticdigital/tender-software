import React, { useState, useEffect } from 'react';
import { Award, Plus, Search, Pencil, Trash2, Save } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { WorkExperienceCertificate } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const CertificateModule: React.FC = () => {
  const [certs, setCerts] = useState<WorkExperienceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State (Add & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<WorkExperienceCertificate | null>(null);
  const [formData, setFormData] = useState<Partial<WorkExperienceCertificate>>({
    certificateNumber: 'TN-PWD-WEC-2026-88',
    projectName: '',
    issuingDepartment: 'PWD Highways Division Madurai',
    clientAuthority: 'Superintending Engineer PWD',
    actualCompletedValue: 125000000,
    commencementDate: '2023-01-10',
    completionDate: '2025-11-20',
    financialYear: '2025-2026',
    qualityRating: 'Outstanding',
    isPast5Years: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getCertificates();
      setCerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCert(null);
    setFormData({
      certificateNumber: `TN-PWD-WEC-2026-${Math.floor(Math.random() * 89 + 10)}`,
      projectName: '',
      issuingDepartment: 'PWD Highways Division Madurai',
      clientAuthority: 'Superintending Engineer PWD',
      actualCompletedValue: 125000000,
      commencementDate: '2023-01-10',
      completionDate: '2025-11-20',
      financialYear: '2025-2026',
      qualityRating: 'Outstanding',
      isPast5Years: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cert: WorkExperienceCertificate) => {
    setEditingCert(cert);
    setFormData({ ...cert });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formData.actualCompletedValue as any) || 0;

    if (editingCert) {
      // Edit
      const updated = certs.map(c => c.id === editingCert.id ? {
        ...c,
        ...formData,
        contractValue: val,
        actualCompletedValue: val
      } as WorkExperienceCertificate : c);
      setCerts(updated);
    } else {
      // Create
      const newCert: WorkExperienceCertificate = {
        id: `cert-${Date.now()}`,
        certificateNumber: formData.certificateNumber || `WEC-${Date.now()}`,
        projectName: formData.projectName || 'Completed Civil Infrastructure Contract',
        issuingDepartment: formData.issuingDepartment || 'Government Highways Division',
        clientAuthority: formData.clientAuthority || 'Superintending Engineer PWD',
        contractValue: val,
        actualCompletedValue: val,
        commencementDate: formData.commencementDate || '2023-01-10',
        completionDate: formData.completionDate || '2025-11-20',
        financialYear: formData.financialYear || '2025-2026',
        qualityRating: formData.qualityRating || 'Outstanding',
        isPast5Years: true
      };
      setCerts([newCert, ...certs]);
    }

    setIsModalOpen(false);
  };

  const totalPast5YearsValue = certs
    .filter(c => c.isPast5Years)
    .reduce((acc, c) => acc + c.actualCompletedValue, 0);

  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const filtered = certs.filter(c => {
    const matchesSearch = c.projectName.toLowerCase().includes(search.toLowerCase()) ||
      c.certificateNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.issuingDepartment.toLowerCase().includes(search.toLowerCase());

    const matchesDate = !filterDate || c.completionDate === filterDate;
    const matchesMonth = !filterMonth || c.completionDate?.substring(5, 7) === filterMonth;
    const matchesYear = !filterYear || c.completionDate?.substring(0, 4) === filterYear;

    return matchesSearch && matchesDate && matchesMonth && matchesYear;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Work Experience Certificate Vault</h1>
          <p className="text-xs text-slate-500 mt-1">Archive past completed contract completion certificates, client evaluation ratings & 5-year technical turnover eligibility</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 uppercase">5-Yr Tender Eligibility Value</span>
            <div className="text-base font-black text-blue-950">{formatINR(totalPast5YearsValue)}</div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Archive Experience Certificate
          </button>
        </div>
      </div>

      {/* Filter Bar with Date, Month, Year filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search completed projects or certificate numbers..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date, Month, Year Quick Filters */}
        <div className="flex items-center gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Exact Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
            >
              <option value="">All Months</option>
              <option value="01">Jan</option>
              <option value="02">Feb</option>
              <option value="03">Mar</option>
              <option value="04">Apr</option>
              <option value="05">May</option>
              <option value="06">Jun</option>
              <option value="07">Jul</option>
              <option value="08">Aug</option>
              <option value="09">Sep</option>
              <option value="10">Oct</option>
              <option value="11">Nov</option>
              <option value="12">Dec</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
            >
              <option value="">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>
          {(filterDate || filterMonth || filterYear) && (
            <button
              onClick={() => { setFilterDate(''); setFilterMonth(''); setFilterYear(''); }}
              className="mt-4 px-2 py-1 text-xs font-bold text-rose-600 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3.5 text-center w-12">S.NO</th>
                <th className="px-4 py-3.5">Cert Number & Completed Project</th>
                <th className="px-4 py-3.5">Issuing Government Dept</th>
                <th className="px-4 py-3.5 text-right">Completed Value</th>
                <th className="px-4 py-3.5 text-center">Certificate Doc</th>
                <th className="px-4 py-3.5">Financial Year</th>
                <th className="px-4 py-3.5">Completion Date</th>
                <th className="px-4 py-3.5">Quality Rating</th>
                <th className="px-4 py-3.5">5-Yr Eligibility</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={10} className="p-8 text-center text-slate-400">Loading experience certificates...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-slate-400">No work experience certificates recorded.</td></tr>
              ) : (
                filtered.map((cert, index) => (
                  <tr key={cert.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3.5 text-center font-mono text-slate-400 font-bold">{index + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{cert.projectName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{cert.certificateNumber}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{cert.issuingDepartment}</div>
                      <div className="text-[10px] text-slate-500">{cert.clientAuthority}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-800 text-sm">{formatINR(cert.actualCompletedValue)}</td>
                    <td className="px-4 py-3.5 text-center">
                      {(cert as any).certificateDocUrl ? (
                        <div className="inline-flex items-center gap-1">
                          <a
                            href={(cert as any).certificateDocUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold"
                          >
                            📄 View Cert (PDF)
                          </a>
                          <button
                            type="button"
                            onClick={() => setCerts(prev => prev.map(x => x.id === cert.id ? { ...x, certificateDocUrl: undefined } : x))}
                            className="p-1 hover:bg-rose-100 text-rose-600 rounded text-xs font-bold transition-colors"
                            title="Delete Certificate Document"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold hover:bg-slate-200">
                          + Upload Cert
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const dummyUrl = URL.createObjectURL(file);
                                setCerts(prev => prev.map(x => x.id === cert.id ? { ...x, certificateDocUrl: dummyUrl } : x));
                              }
                            }}
                          />
                        </label>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-700">{cert.financialYear}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{cert.completionDate}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={cert.qualityRating === 'Outstanding' ? 'purple' : 'success'}>
                        ★ {cert.qualityRating}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={cert.isPast5Years ? 'info' : 'default'}>
                        {cert.isPast5Years ? 'Eligible (< 5 Yrs)' : 'Older'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(cert)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                          title="Edit Certificate Details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCerts(certs.filter(x => x.id !== cert.id));
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                          title="Delete Certificate"
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

      {/* Custom React Modal Form for Add/Edit Experience Certificate */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCert ? `Edit Certificate: ${editingCert.certificateNumber}` : 'Archive Experience Certificate'}
        subtitle="Record completed government contracts & 5-year tender eligibility value"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Certificate Ref Number *</label>
              <input
                type="text"
                required
                value={formData.certificateNumber || ''}
                onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Completed Project Name *</label>
              <input
                type="text"
                required
                value={formData.projectName || ''}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                placeholder="e.g. Construction of High Level Bridge across Vaigai River"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Issuing Government Dept *</label>
              <input
                type="text"
                required
                value={formData.issuingDepartment || ''}
                onChange={(e) => setFormData({ ...formData, issuingDepartment: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Client Authority Signatory *</label>
              <input
                type="text"
                required
                value={formData.clientAuthority || ''}
                onChange={(e) => setFormData({ ...formData, clientAuthority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Completed Value (₹) *</label>
              <input
                type="number"
                required
                value={formData.actualCompletedValue || 0}
                onChange={(e) => setFormData({ ...formData, actualCompletedValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Financial Year *</label>
              <input
                type="text"
                required
                value={formData.financialYear || ''}
                onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Completion Date *</label>
              <input
                type="date"
                required
                value={formData.completionDate || ''}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quality Rating *</label>
              <select
                value={formData.qualityRating || 'Outstanding'}
                onChange={(e) => setFormData({ ...formData, qualityRating: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                <option value="Outstanding">★ Outstanding</option>
                <option value="Very Good">★ Very Good</option>
                <option value="Satisfactory">★ Satisfactory</option>
              </select>
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
              <Save className="w-4 h-4" /> Save Certificate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
