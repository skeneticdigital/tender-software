import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Pencil, Trash2, Fuel, Clock, Gauge, IndianRupee, Wrench } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { MachineryItem, MachineryLog } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const MachineryModule: React.FC = () => {
  const [machinery, setMachinery] = useState<MachineryItem[]>([]);
  const [logs, setLogs] = useState<MachineryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fleet' | 'logs'>('fleet');
  const [search, setSearch] = useState('');

  // Log Modal
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logForm, setLogForm] = useState({
    machineId: '',
    operatingHours: 8.0,
    dieselFilledLitres: 65,
    fuelCost: 6175,
    operatorSalary: 2240,
    rentalExpense: 0,
    workDoneDescription: 'Site clearing and earth excavation for road embankment'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mList, lList] = await Promise.all([
        api.getMachinery(),
        api.getMachineryLogs()
      ]);
      setMachinery(mList);
      setLogs(lList);
      if (mList.length > 0) setLogForm(prev => ({ ...prev, machineId: mList[0].id }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mac = machinery.find(m => m.id === logForm.machineId);
    const newLog: MachineryLog = {
      id: `mlog-${Date.now()}`,
      machineId: logForm.machineId,
      machineName: mac ? mac.name : 'Heavy Equipment Machine',
      date: new Date().toISOString().split('T')[0],
      projectId: 'p-001',
      projectName: 'Madurai Ring Road Expansion Project',
      operatingHours: logForm.operatingHours,
      startMeterReading: mac ? mac.totalOperatingHours : 1000,
      endMeterReading: mac ? mac.totalOperatingHours + logForm.operatingHours : 1008,
      dieselFilledLitres: logForm.dieselFilledLitres,
      fuelCost: logForm.fuelCost,
      operatorSalary: logForm.operatorSalary,
      rentalExpense: logForm.rentalExpense,
      totalDailyExpense: logForm.fuelCost + logForm.operatorSalary + logForm.rentalExpense,
      workDoneDescription: logForm.workDoneDescription
    };

    setLogs([newLog, ...logs]);
    setIsLogOpen(false);
  };

  const handleAddMachine = () => {
    const name = prompt('Enter Machinery Name (e.g. Caterpillar Excavator 20T):', 'Caterpillar 320D Excavator');
    if (!name) return;
    const cat = prompt('Enter Category (Earthmoving / Compaction / Paving / Lifting Crane):', 'Earthmoving');

    const newMac: MachineryItem = {
      id: `mac-${Date.now()}`,
      machineCode: `MCH-EXC-${Math.floor(Math.random() * 90 + 10)}`,
      name: name,
      category: (cat as any) || 'Earthmoving',
      ownership: 'Owned',
      dailyRentalRate: 0,
      hourlyOperatorRate: 320,
      dieselConsumptionLitresPerHr: 14.5,
      totalOperatingHours: 450,
      currentSite: 'Madurai Ring Road Site #1',
      status: 'Active Operating'
    };

    setMachinery([newMac, ...machinery]);
  };

  const filteredFleet = machinery.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.machineCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Machinery & Heavy Equipment Management</h1>
          <p className="text-xs text-slate-500 mt-1">Tracks JCBs, rollers, excavators, meter operating hours, diesel/fuel consumption & rental expense ledgers</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLogOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Fuel className="w-4 h-4 text-amber-400" />
            Log Daily Operating & Fuel
          </button>
          <button
            onClick={handleAddMachine}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Machinery
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'fleet' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Heavy Fleet Registry ({machinery.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Meter & Fuel Logs ({logs.length})
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search machinery fleet..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tab 1: Machinery Fleet Table */}
      {activeTab === 'fleet' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Machine Code & Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Ownership</th>
                  <th className="px-4 py-3.5 text-right">Operating Hours</th>
                  <th className="px-4 py-3.5 text-right">Fuel Consumption</th>
                  <th className="px-4 py-3.5 text-right">Operator Rate</th>
                  <th className="px-4 py-3.5">Current Site</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">Loading machinery fleet...</td></tr>
                ) : filteredFleet.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-400">No machinery items registered.</td></tr>
                ) : (
                  filteredFleet.map((mac) => (
                    <tr key={mac.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{mac.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{mac.machineCode}</div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">{mac.category}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={mac.ownership === 'Owned' ? 'success' : 'purple'}>
                          {mac.ownership} {mac.rentalVendor ? `(${mac.rentalVendor})` : ''}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-blue-900 text-sm">{mac.totalOperatingHours} hrs</td>
                      <td className="px-4 py-3.5 text-right font-bold text-amber-700">{mac.dieselConsumptionLitresPerHr} L/hr</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-800">{formatINR(mac.hourlyOperatorRate)}/hr</td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{mac.currentSite}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={mac.status === 'Active Operating' ? 'success' : 'warning'}>{mac.status}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              const newHrs = prompt(`Update Total Operating Hours for "${mac.name}":`, mac.totalOperatingHours.toString());
                              if (newHrs) {
                                mac.totalOperatingHours = parseFloat(newHrs) || mac.totalOperatingHours;
                                setMachinery([...machinery]);
                              }
                            }}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                            title="Edit Equipment Details"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete machinery "${mac.name}"?`)) {
                                setMachinery(machinery.filter(x => x.id !== mac.id));
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                            title="Delete Machinery"
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
        /* Tab 2: Daily Meter & Fuel Logs */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Date & Machine</th>
                  <th className="px-4 py-3.5">Project Name</th>
                  <th className="px-4 py-3.5 text-right">Hours Worked</th>
                  <th className="px-4 py-3.5 text-right">Diesel Filled</th>
                  <th className="px-4 py-3.5 text-right">Fuel Cost</th>
                  <th className="px-4 py-3.5 text-right">Operator Salary</th>
                  <th className="px-4 py-3.5 text-right">Total Daily Expense</th>
                  <th className="px-4 py-3.5">Work Done Description</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{log.machineName}</div>
                      <div className="text-[10px] text-slate-400">{log.date}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{log.projectName}</td>
                    <td className="px-4 py-3.5 text-right font-black text-blue-900">{log.operatingHours} hrs</td>
                    <td className="px-4 py-3.5 text-right font-bold text-amber-700">{log.dieselFilledLitres} Litres</td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-700">{formatINR(log.fuelCost)}</td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-700">{formatINR(log.operatorSalary)}</td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-800 text-sm">{formatINR(log.totalDailyExpense)}</td>
                    <td className="px-4 py-3.5 font-normal text-slate-600">{log.workDoneDescription}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Delete machinery log entry for "${log.machineName}" on ${log.date}?`)) {
                            setLogs(logs.filter(x => x.id !== log.id));
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                        title="Delete Log Entry"
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

      {/* Log Daily Machinery Modal */}
      <Modal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        title="Log Daily Machinery Operating Hours & Fuel Expense"
        subtitle="Record daily hour meter readings, diesel filling and operator wages"
        maxWidth="xl"
      >
        <form onSubmit={handleAddLogSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Machinery Equipment *</label>
            <select
              value={logForm.machineId}
              onChange={(e) => setLogForm({ ...logForm, machineId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
            >
              {machinery.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.machineCode})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Operating Hours Worked *</label>
              <input
                type="number"
                step="0.5"
                required
                value={logForm.operatingHours}
                onChange={(e) => setLogForm({ ...logForm, operatingHours: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Diesel Filled (Litres) *</label>
              <input
                type="number"
                required
                value={logForm.dieselFilledLitres}
                onChange={(e) => {
                  const litres = parseFloat(e.target.value) || 0;
                  setLogForm({ ...logForm, dieselFilledLitres: litres, fuelCost: litres * 95 });
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fuel Expense (INR) *</label>
              <input
                type="number"
                required
                value={logForm.fuelCost}
                onChange={(e) => setLogForm({ ...logForm, fuelCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Operator Salary Payout (INR) *</label>
              <input
                type="number"
                required
                value={logForm.operatorSalary}
                onChange={(e) => setLogForm({ ...logForm, operatorSalary: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Work Description / Chainage Details</label>
            <textarea
              rows={2}
              value={logForm.workDoneDescription}
              onChange={(e) => setLogForm({ ...logForm, workDoneDescription: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsLogOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md"
            >
              Save Machinery Log Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
