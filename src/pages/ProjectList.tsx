import React, { useState, useEffect } from 'react';
import { HardHat, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { api, formatLakhsCr } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

interface ProjectListProps {
  onSelectProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create/Edit Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    projectName: '',
    contractNumber: `CONT/2026/${Math.floor(1000 + Math.random() * 9000)}`,
    client: '',
    location: '',
    startDate: new Date().toISOString().split('T')[0],
    plannedCompletionDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    contractValue: 50000000,
    awardedAmount: 48500000,
    completionPercentage: 0,
    status: 'Active' as const,
    remarks: ''
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.getProjects({ search, status: statusFilter });
      setProjects(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      await api.createProject(formData);
      setIsCreateOpen(false);
      fetchProjects();
    } catch (err: any) {
      setFormError(err.message || 'Error creating project');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (p: Project) => {
    setFormData({
      projectName: p.projectName,
      contractNumber: p.contractNumber,
      client: p.client,
      location: p.location,
      startDate: new Date(p.startDate).toISOString().split('T')[0],
      plannedCompletionDate: new Date(p.plannedCompletionDate).toISOString().split('T')[0],
      contractValue: p.contractValue,
      awardedAmount: p.awardedAmount,
      completionPercentage: p.completionPercentage,
      status: p.status,
      remarks: p.remarks || ''
    });
    setEditId(p.id);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (editId) {
        await api.updateProject(editId, formData);
        setIsEditOpen(false);
        fetchProjects();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error updating project');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Management</h1>
          <p className="text-xs text-slate-500 mt-1">Monitor active construction projects, site execution, contract valuation & progress completion</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              projectName: '',
              contractNumber: `CONT/2026/${Math.floor(1000 + Math.random() * 9000)}`,
              client: '',
              location: '',
              startDate: new Date().toISOString().split('T')[0],
              plannedCompletionDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
              contractValue: 50000000,
              awardedAmount: 48500000,
              completionPercentage: 0,
              status: 'Active',
              remarks: ''
            });
            setIsCreateOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Direct Project
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
            placeholder="Search projects by Name, Contract No, Client, Location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Near Completion">Near Completion</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Contract No</th>
                <th className="px-6 py-4">Project Details</th>
                <th className="px-6 py-4">Client & Location</th>
                <th className="px-6 py-4 text-right">Value (₹)</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">Loading active projects...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No projects found matching criteria.</td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr 
                    key={p.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => onSelectProject(p.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-blue-600">{p.contractNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 max-w-xs truncate">{p.projectName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500">{p.client}</div>
                      <div className="text-xs text-slate-400">{p.location}</div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-bold text-slate-700">
                      {formatLakhsCr(p.contractValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden w-24">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${p.completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-blue-600">{p.completionPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={p.status === 'Active' ? 'success' : 'info'}>{p.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(p);
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit Project"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete project "${p.projectName}"?`)) {
                              setProjects(prev => prev.filter(x => x.id !== p.id));
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                          title="Delete Project"
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

      {/* Create / Edit Project Modal Form (Shared UI) */}
      {(isCreateOpen || isEditOpen) && (
        <Modal
          isOpen={isCreateOpen || isEditOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setIsEditOpen(false);
          }}
          title={isEditOpen ? "Edit Project Details" : "Create Direct Construction Project"}
          subtitle={isEditOpen ? "Modify contract details and status" : "Manually register a new construction work order without a prior tender record"}
          maxWidth="3xl"
        >
          <form onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
            {formError && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{formError}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contract Number *</label>
                <input
                  type="text"
                  required
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Client Authority *</label>
                <input
                  type="text"
                  required
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Site Location *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contract Value (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.contractValue}
                  onChange={(e) => setFormData({ ...formData, contractValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Completion Percentage (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.completionPercentage}
                  onChange={(e) => setFormData({ ...formData, completionPercentage: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="Near Completion">Near Completion</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Planned Completion Date *</label>
                <input
                  type="date"
                  required
                  value={formData.plannedCompletionDate}
                  onChange={(e) => setFormData({ ...formData, plannedCompletionDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                {isEditOpen ? "Save Changes" : "Save Project"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
