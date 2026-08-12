import React, { useState, useEffect } from 'react';
import {
  HardHat, IndianRupee, Package, ShieldAlert, FolderKanban, History,
  TrendingUp, Calendar, MapPin, CheckCircle2, ArrowLeft, Plus
} from 'lucide-react';
import { api, formatINR, formatLakhsCr } from '../lib/api';
import { Project } from '../types';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';

interface ProjectDetailsProps {
  projectId: string;
  onBack: () => void;
  onNavigateTab: (tab: string, id?: string) => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId, onBack, onNavigateTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'billing' | 'materials' | 'payments' | 'retention' | 'documents' | 'activity'>('overview');
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await api.getProjectDetails(projectId);
      setProjectData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  if (loading || !projectData) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
        Loading project details...
      </div>
    );
  }

  const p: Project = projectData;
  const fin = projectData.financialSummary || {};
  const mat = projectData.materialSummary || {};

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors mt-0.5"
            title="Back to Projects"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{p.contractNumber}</span>
              <Badge variant={p.status === 'Active' ? 'success' : 'info'}>{p.status}</Badge>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{p.projectName}</h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {p.location}</span>
              <span>Client: <strong className="text-slate-800">{p.client}</strong></span>
              <span>Tender Ref: <strong className="text-slate-800">{p.tenderRef}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('billing')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <IndianRupee className="w-4 h-4" />
            Create Bill for Project
          </button>
        </div>
      </div>

      {/* Progress & Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Contract Value"
          value={formatLakhsCr(fin.contractValue)}
          subtitle={`Awarded: ${formatLakhsCr(fin.awardedAmount)}`}
          icon={HardHat}
          variant="navy"
        />
        <StatCard
          title="Total Billed"
          value={formatLakhsCr(fin.totalBilled)}
          subtitle={`Collected: ${formatLakhsCr(fin.totalCollected)}`}
          icon={IndianRupee}
          variant="default"
        />
        <StatCard
          title="Outstanding Amount"
          value={formatLakhsCr(fin.outstanding)}
          subtitle={`Retention Held: ${formatLakhsCr(fin.retentionHeld)}`}
          icon={TrendingUp}
          variant={fin.outstanding > 5000000 ? 'alert' : 'default'}
        />
        <StatCard
          title="Completion Progress"
          value={`${p.completionPercentage}%`}
          subtitle={`Target End: ${p.plannedCompletionDate}`}
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* 7 Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/60 p-2 flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: HardHat },
            { id: 'billing', label: `Billing (${projectData.bills?.length || 0})`, icon: IndianRupee },
            { id: 'materials', label: `Materials & Site Stock`, icon: Package },
            { id: 'payments', label: `Payments (${projectData.payments?.length || 0})`, icon: IndianRupee },
            { id: 'retention', label: `Retention Money`, icon: ShieldAlert },
            { id: 'documents', label: `Documents (${projectData.documents?.length || 0})`, icon: FolderKanban },
            { id: 'activity', label: `Activity History`, icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isActive ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900">Project Timeline & Duration</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Start Date:</span>
                      <span className="font-bold text-slate-800">{p.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Completion Date:</span>
                      <span className="font-bold text-slate-800">{p.plannedCompletionDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Project Manager:</span>
                      <span className="font-semibold text-slate-800">Er. Rajesh Sharma</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900">Material Dispatch & Site Stock Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Material Dispatched:</span>
                      <span className="font-bold text-slate-800">{mat.totalDispatchedQty} Units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Material Consumed:</span>
                      <span className="font-bold text-slate-800">{mat.totalConsumedQty} Units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Balance at Site:</span>
                      <span className="font-bold text-emerald-700">{mat.siteBalanceQty} Units</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BILLING */}
          {activeSubTab === 'billing' && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Bill Number</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Gross Amount</th>
                    <th className="px-4 py-3 text-right">Deductions</th>
                    <th className="px-4 py-3 text-right">Net Payable</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectData.bills?.map((b: any) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3 font-bold text-slate-900">{b.billNumber}</td>
                      <td className="px-4 py-3">{b.billDate}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatINR(b.grossAmount)}</td>
                      <td className="px-4 py-3 text-right text-rose-600 font-semibold">{formatINR(b.totalDeductions)}</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700">{formatINR(b.netPayable)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{formatINR(b.outstandingAmount)}</td>
                      <td className="px-4 py-3"><Badge variant={b.status === 'Paid' ? 'success' : 'warning'}>{b.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: MATERIALS */}
          {activeSubTab === 'materials' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-600">Material Dispatch Records for Project</h3>
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Dispatch Code</th>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Dispatch Date</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectData.dispatches?.map((d: any) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 font-bold text-slate-900">{d.dispatchCode}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{d.materialName}</td>
                      <td className="px-4 py-3 font-bold">{d.quantity} {d.unit}</td>
                      <td className="px-4 py-3">{d.dispatchDate}</td>
                      <td className="px-4 py-3 text-slate-600">{d.vehicleNumber}</td>
                      <td className="px-4 py-3"><Badge variant={d.status === 'Received' ? 'success' : 'info'}>{d.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: PAYMENTS */}
          {activeSubTab === 'payments' && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Bill Number</th>
                    <th className="px-4 py-3">Payment Date</th>
                    <th className="px-4 py-3 text-right">Amount Received</th>
                    <th className="px-4 py-3">Bank Name</th>
                    <th className="px-4 py-3">Transaction Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectData.payments?.map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-bold text-slate-900">{p.billNumber}</td>
                      <td className="px-4 py-3">{p.paymentDate}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatINR(p.amountReceived)}</td>
                      <td className="px-4 py-3 font-semibold">{p.bankName}</td>
                      <td className="px-4 py-3 font-mono">{p.transactionRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: RETENTION */}
          {activeSubTab === 'retention' && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Bill Number</th>
                    <th className="px-4 py-3 text-right">Retention Amount</th>
                    <th className="px-4 py-3">Expected Release Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectData.retentions?.map((r: any) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-bold text-slate-900">{r.billNumber}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-800">{formatINR(r.retentionAmount)}</td>
                      <td className="px-4 py-3 font-semibold">{r.expectedReleaseDate}</td>
                      <td className="px-4 py-3"><Badge variant={r.status === 'Released' ? 'success' : 'warning'}>{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: DOCUMENTS */}
          {activeSubTab === 'documents' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {projectData.documents?.map((doc: any) => (
                  <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{doc.fileName}</div>
                      <div className="text-[10px] text-slate-500">{doc.category} | {doc.fileSize}</div>
                    </div>
                    <a 
                      href="#" 
                      className="text-blue-600 font-bold hover:underline text-[11px] cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        const blob = new Blob([`Dummy content for ${doc.fileName}`], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = doc.fileName;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: ACTIVITY HISTORY */}
          {activeSubTab === 'activity' && (
            <div className="space-y-3">
              {projectData.activities?.map((act: any) => (
                <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{act.userName}</span> ({act.userRole}): {act.action}
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(act.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
