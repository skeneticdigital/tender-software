import React, { useState, useEffect } from 'react';
import { Warehouse, Truck, CheckCircle2, AlertTriangle, Send, Download, Layers, Pencil, Trash2 } from 'lucide-react';
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

  // Dispatch Modal
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    projectId: '',
    materialId: '',
    quantity: 100,
    vehicleNumber: 'KA-01-EA-9912',
    driverName: 'Ramesh Kumar',
    batchNumber: 'BT-2026-08'
  });

  // Receive Modal
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    dispatchId: '',
    receivedQuantity: 100,
    damagedQuantity: 0,
    remarks: ''
  });

  // Consumption Modal
  const [isConsumeOpen, setIsConsumeOpen] = useState(false);
  const [consumeForm, setConsumeForm] = useState({
    projectId: '',
    materialId: '',
    quantityConsumed: 50,
    workCategory: 'Column Concrete Pouring'
  });

  // Edit Stock Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    currentStock: 0,
    reorderLevel: 0
  });

  const openEditModal = (item: any) => {
    setEditId(item.id);
    setEditForm({
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    try {
      await api.updateMaterial(editId, editForm);
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.dispatchMaterial(dispatchForm);
      setIsDispatchOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    }
  };

  const handleConsumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.consumeMaterial(consumeForm);
      setIsConsumeOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Consumption logging failed');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory & Site Material Movements</h1>
          <p className="text-xs text-slate-500 mt-1">Central yard stock, inter-site material dispatch, site receiving verification & daily consumption log</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsDispatchOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            Dispatch to Site
          </button>
          <button
            onClick={() => setIsConsumeOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            Log Work Consumption
          </button>
        </div>
      </div>

      {/* Central Stock Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Central Yard Stock vs Dispatched vs Consumed</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Material Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-right">Central Yard Stock</th>
                <th className="px-4 py-3.5 text-right">Total Dispatched</th>
                <th className="px-4 py-3.5 text-right">Total Consumed</th>
                <th className="px-4 py-3.5 text-right">Reorder Level</th>
                <th className="px-4 py-3.5">Alert</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading stock records...</td></tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{item.name || item.materialName || item.materialCode}</div>
                      <div className="text-[10px] text-slate-400">{item.materialCode}</div>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-700">{item.category || 'Construction Materials'}</td>

                    <td className="px-4 py-3.5 text-right font-black text-slate-900 text-sm">
                      {item.centralStock || item.currentStock || 0} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-blue-700">
                      {item.totalDispatched || 0} {item.unit}
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                      {item.totalConsumed || 0} {item.unit}
                    </td>

                    <td className="px-4 py-3.5 text-right text-slate-600 font-medium">
                      {item.reorderLevel || 0} {item.unit}
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
                        title="Click to update stock level"
                      >
                        <Badge variant={item.isLowStock ? 'danger' : 'success'}>
                          {item.isLowStock ? 'Reorder Needed' : 'Normal'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-bold transition-colors border border-blue-200 flex items-center gap-1"
                          title="Update Inventory Stock"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Update
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete item "${item.name || item.materialCode}"?`)) {
                              setInventory(prev => prev.filter(x => x.id !== item.id));
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-rose-100"
                          title="Delete Inventory Item"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            >
              {inventory.map(m => (
                <option key={m.id} value={m.id}>{m.name} (Stock: {m.currentStock} {m.unit})</option>
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Batch Number</label>
              <input
                type="text"
                value={dispatchForm.batchNumber}
                onChange={(e) => setDispatchForm({ ...dispatchForm, batchNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                value={dispatchForm.vehicleNumber}
                onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Driver Name</label>
              <input
                type="text"
                value={dispatchForm.driverName}
                onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsDispatchOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">Confirm Dispatch</button>
          </div>
        </form>
      </Modal>

      {/* Consume Modal */}
      <Modal
        isOpen={isConsumeOpen}
        onClose={() => setIsConsumeOpen(false)}
        title="Log Site Work Consumption"
        subtitle="Supervisor entry for material used in daily construction BOQ work"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            >
              {inventory.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Work Category *</label>
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

      {/* Edit Stock Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Inventory Stock"
        subtitle="Update central stock quantities and reorder thresholds"
        maxWidth="sm"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Current Central Stock *</label>
            <input
              type="number"
              required
              value={editForm.currentStock}
              onChange={(e) => setEditForm({ ...editForm, currentStock: Number(e.target.value) })}
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">Update Stock</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
