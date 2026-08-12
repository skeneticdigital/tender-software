import React, { useEffect, useState } from 'react';
import {
  TrendingUp, AlertTriangle, FileText, HardHat, Landmark,
  Building2, ArrowUpRight, IndianRupee, Clock, ShieldCheck, CheckCircle2, ChevronRight
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { api, formatLakhsCr } from '../lib/api';
import { ActionItem } from '../types';

interface DashboardProps {
  onNavigateTab: (tab: string, id?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDash() {
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDash();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const actionItems: ActionItem[] = data?.actionItems || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive ERP Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time overview of Tenders, EMDs, Projects, Materials & Financial Performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('tenders')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            New Tender Quote
          </button>
          <button
            onClick={() => onNavigateTab('billing')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <IndianRupee className="w-4 h-4 text-emerald-400" />
            Create Client Bill
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Tenders Value"
          value={formatLakhsCr(kpis.totalTenderValue)}
          subtitle={`${kpis.activeTenders} active out of ${kpis.totalTenders} total`}
          icon={FileText}
          variant="default"
          onClick={() => onNavigateTab('tenders')}
        />
        <StatCard
          title="Active Projects Value"
          value={formatLakhsCr(kpis.totalProjectValue)}
          subtitle={`${kpis.activeProjects} projects under execution`}
          icon={HardHat}
          variant="navy"
          onClick={() => onNavigateTab('projects')}
        />
        <StatCard
          title="Pending EMD Refunds"
          value={formatLakhsCr(kpis.emdPendingRefund)}
          subtitle="Follow-up due with Government Depts"
          icon={Landmark}
          variant="warning"
          onClick={() => onNavigateTab('emd')}
        />
        <StatCard
          title="Outstanding Billing"
          value={formatLakhsCr(kpis.outstandingAmount)}
          subtitle={`Total Billed: ${formatLakhsCr(kpis.totalBilling)}`}
          icon={TrendingUp}
          variant={kpis.outstandingAmount > 10000000 ? 'alert' : 'default'}
          onClick={() => onNavigateTab('billing')}
        />
      </div>

      {/* Action Required Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Action Required & Critical Alerts</h2>
              <p className="text-xs text-slate-500">Automated alerts for tender deadlines, overdue EMDs, payment delays & stock levels</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
            {actionItems.length} Urgent Items
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {actionItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All actions up to date. No pending alerts!
            </div>
          ) : (
            actionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigateTab(item.linkModule, item.linkId)}
                className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className={`p-2 rounded-lg mt-0.5 ${
                    item.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{item.title}</span>
                      <Badge variant={item.priority === 'Critical' ? 'danger' : 'warning'}>
                        {item.priority}
                      </Badge>
                      <span className="text-xs text-slate-400">({item.type})</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold shrink-0">
                  <span>Take Action</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Analytics Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tender Performance Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Tender Portfolio Distribution</h2>
            <button
              onClick={() => onNavigateTab('tenders')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              View All Tenders <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {data?.charts?.tenderWinLoss?.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">{item.value} Tenders</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Collections Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Monthly Billing vs Collection</h2>
            <button
              onClick={() => onNavigateTab('billing')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              View Billing Ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {data?.charts?.monthlyBilling?.map((m: any) => (
              <div key={m.month} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{m.month}</span>
                  <span>Billed: {formatLakhsCr(m.billed)} | Collected: {formatLakhsCr(m.collected)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-600 h-full"
                    style={{ width: `${Math.min(100, (m.collected / (m.billed || 1)) * 100)}%` }}
                    title={`Collection Rate: ${((m.collected / m.billed) * 100).toFixed(1)}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
