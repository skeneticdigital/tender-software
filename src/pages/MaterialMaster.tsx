import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, AlertTriangle, Layers, Pencil, Trash2, FileSpreadsheet, PlusCircle, Save } from 'lucide-react';
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

  // Bulk Add Modal State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkTab, setBulkTab] = useState<'table' | 'csv'>('table');
  const [bulkRows, setBulkRows] = useState<Array<{
    materialCode: string;
    name: string;
    category: string;
    unit: string;
    unitRate: number;
    supplierName: string;
    currentStock: number;
    reorderLevel: number;
  }>>([
    { materialCode: 'MAT-SND-01', name: 'Manufactured Sand (M-Sand)', category: 'Aggregates & Sand', unit: 'Cu.M', unitRate: 1450, supplierName: 'Vaigai Quarry Ops', currentStock: 450, reorderLevel: 150 },
    { materialCode: 'MAT-JEL-20', name: '20mm Blue Metal Jelly Aggregate', category: 'Aggregates & Sand', unit: 'Cu.M', unitRate: 1250, supplierName: 'Vaigai Quarry Ops', currentStock: 300, reorderLevel: 100 },
    { materialCode: 'MAT-STL-12', name: 'TMT Steel Bars 12mm Fe550D', category: 'Steel & Metals', unit: 'MT', unitRate: 64500, supplierName: 'Tata Tiscon Dealer', currentStock: 35, reorderLevel: 15 }
  ]);
  const [csvText, setCsvText] = useState('');

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

  // Bulk Add Handlers
  const handleAddBulkRow = () => {
    setBulkRows([
      ...bulkRows,
      {
        materialCode: `MAT-ITEM-${Math.floor(Math.random() * 899 + 100)}`,
        name: '',
        category: 'Construction Materials',
        unit: 'Cu.M',
        unitRate: 1000,
        supplierName: 'Local Supplier',
        currentStock: 100,
        reorderLevel: 50
      }
    ]);
  };

  const handleUpdateBulkRow = (index: number, field: string, val: any) => {
    const updated = [...bulkRows];
    updated[index] = { ...updated[index], [field]: val };
    setBulkRows(updated);
  };

  const handleRemoveBulkRow = (index: number) => {
    setBulkRows(bulkRows.filter((_, i) => i !== index));
  };

  const handleLoadStandardPreset = () => {
    setBulkRows([
      { materialCode: 'MAT-SND-01', name: 'Manufactured Sand (M-Sand)', category: 'Aggregates & Sand', unit: 'Cu.M', unitRate: 1450, supplierName: 'Vaigai Quarry Ops', currentStock: 450, reorderLevel: 150 },
      { materialCode: 'MAT-JEL-20', name: '20mm Blue Metal Jelly Aggregate', category: 'Aggregates & Sand', unit: 'Cu.M', unitRate: 1250, supplierName: 'Vaigai Quarry Ops', currentStock: 300, reorderLevel: 100 },
      { materialCode: 'MAT-STL-12', name: 'TMT Steel Bars 12mm Fe550D', category: 'Steel & Metals', unit: 'MT', unitRate: 64500, supplierName: 'Tata Tiscon Dealer', currentStock: 35, reorderLevel: 15 },
      { materialCode: 'MAT-BRK-RED', name: 'Standard First Class Red Clay Bricks', category: 'Bricks & Blocks', unit: 'Nos', unitRate: 11, supplierName: 'Madurai Chamber Kilns', currentStock: 25000, reorderLevel: 5000 },
      { materialCode: 'MAT-ADM-WP', name: 'Integral Waterproofing Concrete Admixture', category: 'Cement & Concrete', unit: 'Litres', unitRate: 240, supplierName: 'Fosroc Chemicals', currentStock: 500, reorderLevel: 100 }
    ]);
  };

  const handleSaveBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let newItems: Material[] = [];

    if (bulkTab === 'table') {
      newItems = bulkRows.map((r, idx) => ({
        id: `mat-bulk-${Date.now()}-${idx}`,
        materialCode: r.materialCode || `MAT-${Date.now()}-${idx}`,
        name: r.name || 'Bulk Material Item',
        category: r.category || 'Construction Materials',
        unit: r.unit || 'Bags',
        specification: 'Standard Construction Spec',
        minStockLevel: Math.round(r.reorderLevel / 2),
        reorderLevel: Number(r.reorderLevel) || 50,
        currentStock: Number(r.currentStock) || 0,
        supplierName: r.supplierName || 'Primary Vendor',
        unitRate: Number(r.unitRate) || 0,
        status: Number(r.currentStock) < Number(r.reorderLevel) ? 'Low Stock Alert' : 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    } else {
      // CSV parse
      const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      newItems = lines.map((line, idx) => {
        const parts = line.split(',').map(p => p.trim());
        return {
          id: `mat-csv-${Date.now()}-${idx}`,
          materialCode: parts[0] || `MAT-CSV-${idx + 1}`,
          name: parts[1] || 'CSV Material Item',
          category: parts[2] || 'Construction Materials',
          unit: parts[3] || 'Bags',
          specification: 'CSV Import Spec',
          minStockLevel: 50,
          reorderLevel: Number(parts[7]) || 100,
          currentStock: Number(parts[6]) || 500,
          supplierName: parts[5] || 'CSV Vendor',
          unitRate: Number(parts[4]) || 500,
          status: 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });
    }

    if (newItems.length > 0) {
      setMaterials([...newItems, ...materials]);
    }
    setIsBulkOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Material Master Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">Manage construction materials master list, unit rates, standard specifications & reorder thresholds</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk Add Materials
          </button>
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
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading catalog...</td></tr>
              ) : materials.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No material catalog items found.</td></tr>
              ) : (
                materials.map((m) => {
                  const isLow = m.currentStock < m.reorderLevel;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => openEditModal(m)}>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.materialCode} | {m.specification}</div>
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

      {/* Modal 1: Single Material Add & Edit */}
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

      {/* Modal 2: Bulk Add Materials Modal */}
      {isBulkOpen && (
        <Modal
          isOpen={isBulkOpen}
          onClose={() => setIsBulkOpen(false)}
          title="Bulk Add Construction Materials"
          subtitle="Add multiple material catalog items simultaneously using multi-row entry or CSV paste"
          maxWidth="4xl"
        >
          <form onSubmit={handleSaveBulkSubmit} className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkTab('table')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    bulkTab === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Multi-Row Form ({bulkRows.length} Items)
                </button>
                <button
                  type="button"
                  onClick={() => setBulkTab('csv')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    bulkTab === 'csv' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  CSV / Text Import
                </button>
              </div>

              {bulkTab === 'table' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadStandardPreset}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold"
                  >
                    ⚡ Load 5 Standard Construction Materials Preset
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBulkRow}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>
              )}
            </div>

            {bulkTab === 'table' ? (
              <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b font-bold text-slate-600 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Code *</th>
                      <th className="p-2.5">Material Name *</th>
                      <th className="p-2.5">Category *</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5">Rate (₹)</th>
                      <th className="p-2.5">Supplier</th>
                      <th className="p-2.5">Stock</th>
                      <th className="p-2.5">Reorder</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={row.materialCode}
                            onChange={(e) => handleUpdateBulkRow(idx, 'materialCode', e.target.value)}
                            className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={row.name}
                            onChange={(e) => handleUpdateBulkRow(idx, 'name', e.target.value)}
                            className="w-48 px-2 py-1 bg-white border border-slate-300 rounded font-semibold"
                            placeholder="e.g. M-Sand"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={row.category}
                            onChange={(e) => handleUpdateBulkRow(idx, 'category', e.target.value)}
                            className="w-32 px-2 py-1 bg-white border border-slate-300 rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={row.unit}
                            onChange={(e) => handleUpdateBulkRow(idx, 'unit', e.target.value)}
                            className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            required
                            value={row.unitRate}
                            onChange={(e) => handleUpdateBulkRow(idx, 'unitRate', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-blue-700"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.supplierName}
                            onChange={(e) => handleUpdateBulkRow(idx, 'supplierName', e.target.value)}
                            className="w-32 px-2 py-1 bg-white border border-slate-300 rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.currentStock}
                            onChange={(e) => handleUpdateBulkRow(idx, 'currentStock', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={row.reorderLevel}
                            onChange={(e) => handleUpdateBulkRow(idx, 'reorderLevel', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-slate-600"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBulkRow(idx)}
                            className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Paste Comma-Separated CSV Data (Code, Name, Category, Unit, Rate, Supplier, Stock, Reorder)</label>
                <textarea
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`MAT-SND-01, Manufactured Sand (M-Sand), Aggregates & Sand, Cu.M, 1450, Vaigai Quarry, 450, 150\nMAT-JEL-20, 20mm Blue Metal Jelly, Aggregates & Sand, Cu.M, 1250, Vaigai Quarry, 300, 100`}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save All Bulk Materials
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
