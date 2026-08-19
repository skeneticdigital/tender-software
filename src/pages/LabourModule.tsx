import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Pencil, Trash2, IndianRupee, HardHat, CalendarCheck, ShieldCheck } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { LabourWorker, LabourDisbursement } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const LabourModule: React.FC = () => {
  const [workers, setWorkers] = useState<LabourWorker[]>([]);
  const [disbursements, setDisbursements] = useState<LabourDisbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'disbursements'>('roster');
  const [search, setSearch] = useState('');

  // Disbursement Modal
  const [isDisbOpen, setIsDisbOpen] = useState(false);
  const [disbForm, setDisbForm] = useState({
    masonsCount: 12,
    cooliesCount: 30,
    operatorsCount: 4,
    masonsWageTotal: 13200,
    cooliesWageTotal: 19500,
    paymentMode: 'Cash' as 'Cash' | 'Bank Transfer / UPI',
    supervisorInCharge: 'V. Gunaseelan',
    remarks: 'Daily muster roll payment for road paving gang'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wList, dList] = await Promise.all([
        api.getLabourWorkers(),
        api.getLabourDisbursements()
      ]);
      setWorkers(wList);
      setDisbursements(dList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = () => {
    const name = prompt('Enter Worker Name (e.g. K. Arumugam Master):', 'K. Arumugam (Mason Master)');
    if (!name) return;
    const cat = prompt('Enter Category (Mason (Kottan) / Coolie (Mazdoor) / Machine Operator / Supervisor):', 'Mason (Kottan)');
    const wage = prompt('Enter Daily Wage Rate (INR):', '1100');

    const newWorker: LabourWorker = {
      id: `lw-${Date.now()}`,
      workerName: name,
      category: (cat as any) || 'Mason (Kottan)',
      dailyWageRate: parseFloat(wage || '1100') || 1100,
      phone: '+91 98450 99881',
      assignedProject: 'Madurai Ring Road Expansion',
      status: 'Active'
    };

    setWorkers([newWorker, ...workers]);
  };

  const handleAddDisbursementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalCount = disbForm.masonsCount + disbForm.cooliesCount + disbForm.operatorsCount;
    const totalAmount = disbForm.masonsWageTotal + disbForm.cooliesWageTotal + (disbForm.operatorsCount * 1200);

    const newDisb: LabourDisbursement = {
      id: `ldisb-${Date.now()}`,
      projectId: 'p-001',
      projectName: 'Madurai Ring Road Expansion Project',
      date: new Date().toISOString().split('T')[0],
      masonsCount: disbForm.masonsCount,
      cooliesCount: disbForm.cooliesCount,
      operatorsCount: disbForm.operatorsCount,
      totalManpowerCount: totalCount,
      masonsWageTotal: disbForm.masonsWageTotal,
      cooliesWageTotal: disbForm.cooliesWageTotal,
      totalDisbursementAmount: totalAmount,
      paymentMode: disbForm.paymentMode,
      supervisorInCharge: disbForm.supervisorInCharge,
      remarks: disbForm.remarks
    };

    setDisbursements([newDisb, ...disbursements]);
    setIsDisbOpen(false);
  };

  const filteredWorkers = workers.filter(w =>
    w.workerName.toLowerCase().includes(search.toLowerCase()) ||
    w.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Labour Management & Wage Payroll Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Manpower details (Masons, Coolies, Operators), attendance tracking & daily/weekly wage disbursements</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDisbOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <IndianRupee className="w-4 h-4" />
            Record Wage Payout
          </button>
          <button
            onClick={handleAddWorker}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Worker Profile
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'roster' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manpower Roster ({workers.length})
          </button>
          <button
            onClick={() => setActiveTab('disbursements')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'disbursements' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Wage Disbursements ({disbursements.length})
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workers by name or category..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tab 1: Manpower Roster */}
      {activeTab === 'roster' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Worker Name</th>
                  <th className="px-4 py-3.5">Skill Category</th>
                  <th className="px-4 py-3.5 text-right">Daily Wage Rate</th>
                  <th className="px-4 py-3.5">Phone Contact</th>
                  <th className="px-4 py-3.5">Assigned Site / Project</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading worker roster...</td></tr>
                ) : filteredWorkers.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">No worker profiles found.</td></tr>
                ) : (
                  filteredWorkers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{w.workerName}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">{w.category}</td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-800 text-sm">{formatINR(w.dailyWageRate)}/day</td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">{w.phone}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{w.assignedProject}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={w.status === 'Active' ? 'success' : 'default'}>{w.status}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              const newRate = prompt(`Update Daily Wage for "${w.workerName}":`, w.dailyWageRate.toString());
                              if (newRate) {
                                w.dailyWageRate = parseFloat(newRate) || w.dailyWageRate;
                                setWorkers([...workers]);
                              }
                            }}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                            title="Edit Worker Profile"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete worker "${w.workerName}"?`)) {
                                setWorkers(workers.filter(x => x.id !== w.id));
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                            title="Delete Worker"
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
      ) : (
        /* Tab 2: Daily Wage Disbursements */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Project Name</th>
                  <th className="px-4 py-3.5 text-right">Manpower Breakdown</th>
                  <th className="px-4 py-3.5 text-right">Total Workers</th>
                  <th className="px-4 py-3.5 text-right">Total Wage Payout</th>
                  <th className="px-4 py-3.5">Payment Mode</th>
                  <th className="px-4 py-3.5">Supervisor In Charge</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {disbursements.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{d.date}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{d.projectName}</td>
                    <td className="px-4 py-3.5 text-right text-[11px]">
                      Masons: <span className="font-bold text-blue-700">{d.masonsCount}</span> | Coolies: <span className="font-bold text-emerald-700">{d.cooliesCount}</span> | Ops: <span className="font-bold text-amber-700">{d.operatorsCount}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900">{d.totalManpowerCount} Workers</td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-800 text-sm">{formatINR(d.totalDisbursementAmount)}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">{d.paymentMode}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{d.supervisorInCharge}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Delete wage disbursement entry for date ${d.date}?`)) {
                            setDisbursements(disbursements.filter(x => x.id !== d.id));
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                        title="Delete Disbursement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Wage Disbursement Modal */}
      <Modal
        isOpen={isDisbOpen}
        onClose={() => setIsDisbOpen(false)}
        title="Record Daily Labour Wage Disbursement"
        subtitle="Log daily muster roll manpower count & total cash/UPI wage payout"
        maxWidth="lg"
      >
        <form onSubmit={handleAddDisbursementSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Masons Count *</label>
              <input
                type="number"
                required
                value={disbForm.masonsCount}
                onChange={(e) => {
                  const cnt = parseInt(e.target.value) || 0;
                  setDisbForm({ ...disbForm, masonsCount: cnt, masonsWageTotal: cnt * 1100 });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Coolies Count *</label>
              <input
                type="number"
                required
                value={disbForm.cooliesCount}
                onChange={(e) => {
                  const cnt = parseInt(e.target.value) || 0;
                  setDisbForm({ ...disbForm, cooliesCount: cnt, cooliesWageTotal: cnt * 650 });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Operators Count *</label>
              <input
                type="number"
                required
                value={disbForm.operatorsCount}
                onChange={(e) => setDisbForm({ ...disbForm, operatorsCount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Masons Total Wage (INR)</label>
              <input
                type="number"
                value={disbForm.masonsWageTotal}
                onChange={(e) => setDisbForm({ ...disbForm, masonsWageTotal: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Coolies Total Wage (INR)</label>
              <input
                type="number"
                value={disbForm.cooliesWageTotal}
                onChange={(e) => setDisbForm({ ...disbForm, cooliesWageTotal: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Mode *</label>
            <select
              value={disbForm.paymentMode}
              onChange={(e) => setDisbForm({ ...disbForm, paymentMode: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
            >
              <option value="Cash">Direct Cash Handover (Site Muster Roll)</option>
              <option value="Bank Transfer / UPI">Bank Transfer / UPI Payout</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDisbOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md"
            >
              Confirm Wage Disbursement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
