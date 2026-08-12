import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, AlertTriangle, Layers, Pencil, Trash2 } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Material } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const MaterialMaster: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Create/Edit Material Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: 'Cement & Concrete',
    unit: 'Bags',
    specification: 'OPC 53 Grade',
    minStockLevel: 100,
    reorderLevel: 250,
    currentStock: 1000,
    supplierName: 'UltraTech Cement Ltd',
    unitRate: 380,
    remarks: ''
  });

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.getMaterials({ search, category: categoryFilter });
      setMaterials(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [search, categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditOpen && editId) {
        await api.updateMaterial(editId, form);
        setIsEditOpen(false);
      } else {
        await api.createMaterial(form);
        setIsModalOpen(false);
      }
      fetchMaterials();
    } catch (err: any) {
      alert(err.message || 'Error saving material');
    }
  };

  const openEditModal = (m: Material) => {
    setForm({
      name: m.name,
      category: m.category,
      unit: m.unit,
      specification: m.specification || '',
      minStockLevel: m.minStockLevel || 0,
      reorderLevel: m.reorderLevel,
      currentStock: m.currentStock,
      supplierName: m.supplierName || '',
      unitRate: m.unitRate,
      remarks: m.remarks || ''
    });
    setEditId(m.id);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Material Master Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">Manage construction materials master list, unit rates, standard specifications & reorder thresholds</p>
        </div>
        <button
          onClick={() => {
            setForm({
              name: '',
              category: 'Cement & Concrete',
              unit: 'Bags',
              specification: 'OPC 53 Grade',
              minStockLevel: 100,
              reorderLevel: 250,
              currentStock: 1000,
              supplierName: 'UltraTech Cement Ltd',
              unitRate: 380,
              remarks: ''
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Material Item
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search material code, name, supplier..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
        >
          <option value="">All Categories</option>
          <option value="Cement & Concrete">Cement & Concrete</option>
          <option value="Steel & Metals">Steel & Metals</option>
          <option value="Aggregates & Sand">Aggregates & Sand</option>
          <option value="Bricks & Blocks">Bricks & Blocks</option>
          <option value="Pipes & Plumbing">Pipes & Plumbing</option>
        </select>
      </div>

      {/* Material Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Code & Material Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Unit Rate</th>
                <th className="px-4 py-3.5">Primary Supplier</th>
                <th className="px-4 py-3.5 text-right">Central Stock</th>
                <th className="px-4 py-3.5 text-right">Reorder Level</th>
                <th className="px-4 py-3.5">Stock Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading catalog...</td></tr>
              ) : (
                materials.map((m) => {
                  const isLow = m.currentStock < m.reorderLevel;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => openEditModal(m)}>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[10px] text-slate-400">{m.materialCode} | {m.specification}</div>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-700">{m.category}</td>

                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {formatINR(m.unitRate)} / {m.unit}
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-800">{m.supplierName}</td>

                      <td className="px-4 py-3.5 text-right font-black text-slate-900 text-sm">
                        {m.currentStock} <span className="text-xs font-normal text-slate-500">{m.unit}</span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-semibold text-slate-600">
                        {m.reorderLevel} {m.unit}
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant={isLow ? 'danger' : 'success'}>
                          {isLow ? 'Low Stock Alert' : 'Sufficient'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(m);
                            }}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Edit Material"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete material "${m.name}"?`)) {
                                setMaterials(prev => prev.filter(x => x.id !== m.id));
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                            title="Delete Material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {(isModalOpen || isEditOpen) && (
        <Modal
          isOpen={isModalOpen || isEditOpen}
          onClose={() => {
            setIsModalOpen(false);
            setIsEditOpen(false);
          }}
          title={isEditOpen ? "Edit Material Item" : "Add Material Item to Master Catalog"}
          subtitle="Specify standard specs, reorder limits and vendor rates"
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Portland Pozzolana Cement"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure *</label>
                <input
                  type="text"
                  required
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="Bags, MT, Cu.M, Sq.M"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Standard Unit Rate (₹)</label>
                <input
                  type="number"
                  value={form.unitRate}
                  onChange={(e) => setForm({ ...form, unitRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Level Threshold</label>
                <input
                  type="number"
                  value={form.reorderLevel}
                  onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Stock</label>
                <input
                  type="number"
                  value={form.currentStock}
                  onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Supplier</label>
                <input
                  type="text"
                  value={form.supplierName}
                  onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditOpen(false);
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                {isEditOpen ? "Save Changes" : "Save Material Item"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
