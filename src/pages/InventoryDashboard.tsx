import React, { useState, useEffect } from 'react';
import { Warehouse, Truck, CheckCircle2, AlertTriangle, Send, Download, Layers, Pencil, Trash2, Plus, Save } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Material, Project } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { StatCard } from '../components/ui/StatCard';

export const InventoryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Material Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    materialCode: 'MAT-AGG-20',
    materialName: '',
    category: 'Construction Materials',
    unit: 'Bags',
    centralStock: 500,
    totalDispatched: 0,
    totalConsumed: 0,
    reorderLevel: 200,
    status: 'Normal'
  });

  // Edit Stock & Full Item Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    materialCode: '',
    materialName: '',
    category: 'Construction Materials',
    unit: 'Bags',
    centralStock: 0,
    totalDispatched: 0,
    totalConsumed: 0,
    reorderLevel: 0,
    status: 'Normal'
  });

  // Dispatch Modal
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    projectId: '',
    materialId: '',
    quantity: 100,
    vehicleNumber: 'TN-59-C-9912',
    driverName: 'Ramesh Kumar',
    batchNumber: 'BT-2026-08'
  });

  // Consumption Modal
  const [isConsumeOpen, setIsConsumeOpen] = useState(false);
  const [consumeForm, setConsumeForm] = useState({
    projectId: '',
    materialId: '',
    quantityConsumed: 50,
    workCategory: 'Column Concrete Pouring'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inv, projs] = await Promise.all([
        api.getInventory(),
        api.getProjects()
      ]);
      setInventory(inv);
      setProjects(projs);
      if (projs.length > 0) {
        setDispatchForm(prev => ({ ...prev, projectId: projs[0].id }));
        setConsumeForm(prev => ({ ...prev, projectId: projs[0].id }));
      }
      if (inv.length > 0) {
        setDispatchForm(prev => ({ ...prev, materialId: inv[0].id }));
        setConsumeForm(prev => ({ ...prev, materialId: inv[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setAddForm({
      materialCode: `MAT-${Math.floor(Math.random() * 899 + 100)}`,
      materialName: '',
      category: 'Construction Materials',
      unit: 'Bags',
      centralStock: 500,
      totalDispatched: 0,
      totalConsumed: 0,
      reorderLevel: 200,
      status: 'Normal'
    });
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem = {
      id: `inv-${Date.now()}`,
      materialId: `m-${Date.now()}`,
      materialCode: addForm.materialCode || `MAT-${Date.now()}`,
      materialName: addForm.materialName || 'New Inventory Item',
      category: addForm.category || 'Construction Materials',
      unit: addForm.unit || 'Bags',
      centralStock: Number(addForm.centralStock) || 0,
      currentStock: Number(addForm.centralStock) || 0,
      totalDispatched: Number(addForm.totalDispatched) || 0,
      totalConsumed: Number(addForm.totalConsumed) || 0,
      reorderLevel: Number(addForm.reorderLevel) || 0,
      status: addForm.status || 'Normal',
      isLowStock: Number(addForm.centralStock) <= Number(addForm.reorderLevel)
    };

    setInventory([newItem, ...inventory]);
    setIsAddOpen(false);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditForm({
      materialCode: item.materialCode || item.code || '',
      materialName: item.materialName || item.name || '',
      category: item.category || 'Construction Materials',
      unit: item.unit || 'Bags',
      centralStock: item.centralStock ?? item.currentStock ?? 0,
      totalDispatched: item.totalDispatched ?? item.dispatchedQty ?? 0,
      totalConsumed: item.totalConsumed ?? item.consumedQty ?? 0,
      reorderLevel: item.reorderLevel ?? 0,
      status: item.status || 'Normal'
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const stock = Number(editForm.centralStock) || 0;
    const reorder = Number(editForm.reorderLevel) || 0;
    const isLow = stock <= reorder;

    const updated = inventory.map(item => item.id === editingItem.id ? {
      ...item,
      ...editForm,
      centralStock: stock,
      currentStock: stock,
      totalDispatched: Number(editForm.totalDispatched) || 0,
      totalConsumed: Number(editForm.totalConsumed) || 0,
      reorderLevel: reorder,
      isLowStock: isLow,
      status: isLow ? 'Reorder Needed' : editForm.status
    } : item);

    setInventory(updated);
    setIsEditOpen(false);
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.dispatchMaterial(dispatchForm);
      setIsDispatchOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleConsumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.consumeMaterial(consumeForm);
      setIsConsumeOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory & Site Material Movements</h1>
          <p className="text-xs text-slate-500 mt-1">Central yard stock, inter-site material dispatch, site receiving verification & daily consumption log</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Material Stock
          </button>
          <button
            onClick={() => setIsDispatchOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            Dispatch to Site
          </button>
          <button
            onClick={() => setIsConsumeOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            Log Work Consumption
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-black text-slate-900">Central Yard Stock vs Dispatched vs Consumed</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Material Name & Code</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-right">Central Yard Stock</th>
                <th className="px-4 py-3.5 text-right">Total Dispatched</th>
                <th className="px-4 py-3.5 text-right">Total Consumed</th>
                <th className="px-4 py-3.5 text-right">Reorder Level</th>
                <th className="px-4 py-3.5">Alert</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading inventory stock...</td></tr>
              ) : inventory.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No inventory materials recorded.</td></tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <div>{item.materialName || item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.materialCode || item.code}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">{item.category || 'Construction Materials'}</td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900 text-sm">
                      {item.centralStock ?? item.currentStock ?? 0} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-blue-700">
                      {item.totalDispatched ?? item.dispatchedQty ?? 0} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                      {item.totalConsumed ?? item.consumedQty ?? 0} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-600">
                      {item.reorderLevel} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={item.isLowStock || item.status === 'Reorder Needed' ? 'danger' : 'success'}>
                        {item.isLowStock || item.status === 'Reorder Needed' ? 'Reorder Needed' : 'Normal'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-bold transition-colors border border-blue-200 flex items-center gap-1"
                          title="Update All Columns"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Update
                        </button>
                        <button
                          onClick={() => {
                            setInventory(prev => prev.filter(x => x.id !== item.id));
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-rose-100"
                          title="Delete Material"
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

      {/* Requirement 4 & 5: Project Material Spending & Consumption Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Project-wise Material Expenditure & Consumption Cost</h3>
            <p className="text-xs text-slate-500 mt-0.5">Track materials spent, project names & calculated expenditure per project</p>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-bold">
            Project-Wise Analytics
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Project Name</th>
                <th className="px-4 py-3.5">Material Name & Category</th>
                <th className="px-4 py-3.5 text-right">Dispatched Qty</th>
                <th className="px-4 py-3.5 text-right">Consumed Qty</th>
                <th className="px-4 py-3.5 text-right">Est. Unit Rate (₹)</th>
                <th className="px-4 py-3.5 text-right">Project Spent Cost (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {projects.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">Loading project expenditure breakdown...</td></tr>
              ) : (
                projects.map((proj, pIdx) => {
                  // Mock material usage linked to each project
                  const projMats = [
                    { matName: 'OPC 53 Grade Cement', category: 'Cement & Concrete', unit: 'Bags', dispatched: 1200 + (pIdx * 200), consumed: 1150 + (pIdx * 180), unitRate: 380 },
                    { matName: 'TMT Steel Bars 12mm Fe550D', category: 'Steel & Metals', unit: 'MT', dispatched: 45 + (pIdx * 10), consumed: 40 + (pIdx * 8), unitRate: 64500 },
                    { matName: 'Manufactured Sand (M-Sand)', category: 'Aggregates & Sand', unit: 'Cu.M', dispatched: 350 + (pIdx * 50), consumed: 320 + (pIdx * 40), unitRate: 1450 }
                  ];

                  const totalProjectSpend = projMats.reduce((sum, item) => sum + (item.consumed * item.unitRate), 0);

                  return (
                    <React.Fragment key={proj.id}>
                      <tr className="bg-blue-50/50 border-t-2 border-slate-200">
                        <td colSpan={5} className="px-4 py-2.5 font-black text-slate-900 text-sm">
                          🏗️ {proj.projectName} <span className="text-xs font-normal text-slate-500">({proj.client})</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-black text-blue-900 text-sm">
                          Total Material Spent: {formatINR(totalProjectSpend)}
                        </td>
                      </tr>
                      {projMats.map((m, mIdx) => {
                        const matSpentCost = m.consumed * m.unitRate;
                        return (
                          <tr key={mIdx} className="hover:bg-slate-50/80">
                            <td className="px-4 py-2.5 font-semibold text-slate-500 pl-8">↳ {proj.contractNumber}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-800">
                              {m.matName} <span className="text-[10px] font-normal text-slate-400">({m.category})</span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{m.dispatched} {m.unit}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-emerald-700">{m.consumed} {m.unit}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-slate-600">{formatINR(m.unitRate)} / {m.unit}</td>
                            <td className="px-4 py-2.5 text-right font-black text-emerald-800">{formatINR(matSpentCost)}</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add New Inventory Material */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Inventory Material Stock"
        subtitle="Register raw materials, cement, steel, aggregates or fuel in central yard"
        maxWidth="xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Item Code *</label>
              <input
                type="text"
                required
                value={addForm.materialCode}
                onChange={(e) => setAddForm({ ...addForm, materialCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Material Name *</label>
              <input
                type="text"
                required
                value={addForm.materialName}
                onChange={(e) => setAddForm({ ...addForm, materialName: e.target.value })}
                placeholder="e.g. OPC 53 Grade Cement"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                required
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit of Measure *</label>
              <input
                type="text"
                required
                value={addForm.unit}
                onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                placeholder="e.g. Bags / MT / cu.m"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reorder Level *</label>
              <input
                type="number"
                required
                value={addForm.reorderLevel}
                onChange={(e) => setAddForm({ ...addForm, reorderLevel: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Central Yard Stock *</label>
              <input
                type="number"
                required
                value={addForm.centralStock}
                onChange={(e) => setAddForm({ ...addForm, centralStock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Dispatched</label>
              <input
                type="number"
                value={addForm.totalDispatched}
                onChange={(e) => setAddForm({ ...addForm, totalDispatched: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Consumed</label>
              <input
                type="number"
                value={addForm.totalConsumed}
                onChange={(e) => setAddForm({ ...addForm, totalConsumed: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-1.5">
              <Save className="w-4 h-4" /> Save Material
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit All Columns Inventory Item Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={editingItem ? `Update Material: ${editingItem.materialCode || editingItem.code}` : 'Edit Inventory Stock'}
        subtitle="Full column edit for material name, category, stock quantities, dispatched & consumed"
        maxWidth="xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Item Code *</label>
              <input
                type="text"
                required
                value={editForm.materialCode}
                onChange={(e) => setEditForm({ ...editForm, materialCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Material Name *</label>
              <input
                type="text"
                required
                value={editForm.materialName}
                onChange={(e) => setEditForm({ ...editForm, materialName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                required
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit of Measure *</label>
              <input
                type="text"
                required
                value={editForm.unit}
                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reorder Level *</label>
              <input
                type="number"
                required
                value={editForm.reorderLevel}
                onChange={(e) => setEditForm({ ...editForm, reorderLevel: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Central Yard Stock *</label>
              <input
                type="number"
                required
                value={editForm.centralStock}
                onChange={(e) => setEditForm({ ...editForm, centralStock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Dispatched</label>
              <input
                type="number"
                value={editForm.totalDispatched}
                onChange={(e) => setEditForm({ ...editForm, totalDispatched: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Consumed</label>
              <input
                type="number"
                value={editForm.totalConsumed}
                onChange={(e) => setEditForm({ ...editForm, totalConsumed: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-1.5">
              <Save className="w-4 h-4" /> Save Inventory Material
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispatch Modal */}
      <Modal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        title="Dispatch Material to Construction Site"
        subtitle="Deducts stock from Central Yard and registers gate pass vehicle transport"
        maxWidth="md"
      >
        <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Destination Project *</label>
            <select
              required
              value={dispatchForm.projectId}
              onChange={(e) => setDispatchForm({ ...dispatchForm, projectId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectName} ({p.contractNumber})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Material Item *</label>
            <select
              required
              value={dispatchForm.materialId}
              onChange={(e) => setDispatchForm({ ...dispatchForm, materialId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            >
              {inventory.map(m => (
                <option key={m.id} value={m.id}>{m.materialName || m.name} ({m.materialCode || m.code}) - Stock: {m.centralStock ?? m.currentStock}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity to Dispatch *</label>
              <input
                type="number"
                required
                value={dispatchForm.quantity}
                onChange={(e) => setDispatchForm({ ...dispatchForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Vehicle / Lorry Ref *</label>
              <input
                type="text"
                required
                value={dispatchForm.vehicleNumber}
                onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsDispatchOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">Confirm Dispatch</button>
          </div>
        </form>
      </Modal>

      {/* Consumption Modal */}
      <Modal
        isOpen={isConsumeOpen}
        onClose={() => setIsConsumeOpen(false)}
        title="Log Site Work Consumption"
        subtitle="Records actual structural usage of materials against BOQ items"
        maxWidth="md"
      >
        <form onSubmit={handleConsumeSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Project Site *</label>
            <select
              required
              value={consumeForm.projectId}
              onChange={(e) => setConsumeForm({ ...consumeForm, projectId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Material Consumed *</label>
            <select
              required
              value={consumeForm.materialId}
              onChange={(e) => setConsumeForm({ ...consumeForm, materialId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            >
              {inventory.map(m => (
                <option key={m.id} value={m.id}>{m.materialName || m.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity Consumed *</label>
              <input
                type="number"
                required
                value={consumeForm.quantityConsumed}
                onChange={(e) => setConsumeForm({ ...consumeForm, quantityConsumed: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Work Description / Structural Part</label>
              <input
                type="text"
                required
                value={consumeForm.workCategory}
                onChange={(e) => setConsumeForm({ ...consumeForm, workCategory: e.target.value })}
                placeholder="e.g. Slab Reinforcement"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsConsumeOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">Save Consumption Log</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
