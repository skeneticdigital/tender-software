import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Filter, Calendar } from 'lucide-react';
import { api, formatINR, formatLakhsCr } from '../lib/api';

export const ReportsHub: React.FC = () => {
  const [reportType, setReportType] = useState('tenders');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportsList = [
    { id: 'tenders', name: '1. Tender Master Report' },
    { id: 'tender-win-loss', name: '2. Tender Win/Loss Analysis Report' },
    { id: 'emd', name: '3. EMD Refund Tracker Report' },
    { id: 'security-deposits', name: '4. Security Deposit Guarantee Report' },
    { id: 'projects', name: '5. Project Execution Progress Report' },
    { id: 'material-stock', name: '6. Central Inventory Stock Report' },
    { id: 'material-consumption', name: '7. Material Consumption Log Report' },
    { id: 'billing', name: '8. Client Billing & RA Invoices Report' },
    { id: 'payments', name: '9. Payment Collection Receipts Report' },
    { id: 'deductions', name: '10. Government Statutory Deduction Report' },
    { id: 'retention', name: '11. Retention Money Schedule Report' },
    { id: 'outstanding', name: '12. Outstanding Receivables Aging Report' },
    { id: 'project-financial', name: '13. Project Financial Summary Report' },
    { id: 'profitability', name: '14. Project Gross Profitability Report' }
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.getReport(reportType, { startDate, endDate });
      setReportData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate]);

  const handleExportCSV = () => {
    if (!reportData || !reportData.data) return;
    const items = reportData.data;
    if (items.length === 0) return;

    const headers = Object.keys(items[0]).join(',');
    const rows = items.map((item: any) =>
      Object.values(item).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centralized Executive Reports Hub</h1>
          <p className="text-xs text-slate-500 mt-1">Exportable decision-making reports for Tenders, EMDs, Projects, Stock, Invoicing & Financial Margins</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Report Selector & Date Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <span className="font-bold text-slate-700 whitespace-nowrap">Report Module:</span>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
          >
            {reportsList.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border rounded-lg text-xs"
          />
          <span className="font-semibold text-slate-500">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Summary KPI Panel */}
      {reportData?.summary && (
        <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {Object.entries(reportData.summary).map(([key, val]: any) => (
            <div key={key}>
              <span className="text-slate-500 font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {typeof val === 'number' && val > 10000 ? formatLakhsCr(val) : String(val)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Generating report dataset...</div>
          ) : !reportData || !reportData.data || reportData.data.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No records found for the selected criteria.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  {Object.keys(reportData.data[0]).slice(0, 8).map((col) => (
                    <th key={col} className="px-4 py-3.5">
                      {col.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {reportData.data.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    {Object.keys(row).slice(0, 8).map((col) => {
                      const val = row[col];
                      return (
                        <td key={col} className="px-4 py-3">
                          {typeof val === 'number' && val > 10000
                            ? formatINR(val)
                            : typeof val === 'boolean'
                            ? String(val)
                            : String(val || '-')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
