import React, { useState, useEffect } from 'react';
import { Award, Plus, Search, Pencil, Trash2, CheckCircle2, Building2, Calendar, FileText } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { WorkExperienceCertificate } from '../types';
import { Badge } from '../components/ui/Badge';

export const CertificateModule: React.FC = () => {
  const [certs, setCerts] = useState<WorkExperienceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const handleAddCertificate = () => {
    const projName = prompt('Enter Completed Project Name:', 'Construction of High Level Bridge across Vaigai River');
    if (!projName) return;
    const certNum = prompt('Enter Certificate Number:', `TN-PWD-WEC-2026-${Math.floor(Math.random() * 89 + 10)}`);
    const valStr = prompt('Enter Actual Completed Contract Value (in INR):', '125000000');
    if (!valStr) return;

    const newCert: WorkExperienceCertificate = {
      id: `cert-${Date.now()}`,
      certificateNumber: certNum || `WEC-${Date.now()}`,
      projectName: projName,
      issuingDepartment: 'PWD Highways Division Madurai',
      clientAuthority: 'Superintending Engineer PWD',
      contractValue: parseFloat(valStr) || 125000000,
      actualCompletedValue: parseFloat(valStr) || 125000000,
      commencementDate: '2023-01-10',
      completionDate: '2025-11-20',
      financialYear: '2025-2026',
      qualityRating: 'Outstanding',
      isPast5Years: true
    };

    setCerts([newCert, ...certs]);
  };

  const totalPast5YearsValue = certs
    .filter(c => c.isPast5Years)
    .reduce((acc, c) => acc + c.actualCompletedValue, 0);

  const filtered = certs.filter(c =>
    c.projectName.toLowerCase().includes(search.toLowerCase()) ||
    c.certificateNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.issuingDepartment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Work Experience Certificate Management</h1>
          <p className="text-xs text-slate-500 mt-1">Official government contract completion certificates covering the past 5 financial years for tender qualification eligibility</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 uppercase">5-Yr Tender Eligibility Value</span>
            <div className="text-base font-black text-blue-950">{formatINR(totalPast5YearsValue)}</div>
          </div>
          <button
            onClick={handleAddCertificate}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Archive Experience Certificate
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Cert Number & Completed Project</th>
                <th className="px-4 py-3.5">Issuing Government Dept</th>
                <th className="px-4 py-3.5 text-right">Completed Value</th>
                <th className="px-4 py-3.5">Financial Year</th>
                <th className="px-4 py-3.5">Completion Date</th>
                <th className="px-4 py-3.5">Quality Rating</th>
                <th className="px-4 py-3.5">5-Yr Eligibility</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading experience certificates...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No work experience certificates recorded.</td></tr>
              ) : (
                filtered.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{cert.projectName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{cert.certificateNumber}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{cert.issuingDepartment}</div>
                      <div className="text-[10px] text-slate-500">{cert.clientAuthority}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-800 text-sm">{formatINR(cert.actualCompletedValue)}</td>
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
                          onClick={() => {
                            const newVal = prompt(`Update Completed Value for "${cert.projectName}":`, cert.actualCompletedValue.toString());
                            if (newVal) {
                              cert.actualCompletedValue = parseFloat(newVal) || cert.actualCompletedValue;
                              setCerts([...certs]);
                            }
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                          title="Edit Certificate Details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete certificate "${cert.certificateNumber}"?`)) {
                              setCerts(certs.filter(x => x.id !== cert.id));
                            }
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
    </div>
  );
};
