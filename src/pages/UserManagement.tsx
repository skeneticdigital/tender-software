import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, Check, Pencil, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { User, UserRole } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Modal
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'Site Supervisor' as UserRole,
    department: 'Site Engineering',
    phone: '',
    accessibleModules: ['dashboard'] as string[]
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [emailAlerts, setEmailAlerts] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        // Edit User
        const updated = await api.updateUser(editingUserId, {
          name: form.name,
          email: form.email,
          role: form.role,
          department: form.department,
          phone: form.phone,
          accessibleModules: form.accessibleModules
        });
        setUsers(prev => prev.map(u => u.id === editingUserId ? { ...u, ...updated } : u));
      } else {
        // Create User
        const created = await api.createUser(form);
        setUsers(prev => [...prev, created]);
      }
      setIsOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const openEditModal = (u: User) => {
    setEditingUserId(u.id);
    setForm({
      name: u.name,
      email: u.email,
      password: '', // Can't edit password here directly usually
      role: u.role as UserRole,
      department: u.department,
      phone: u.phone || '',
      accessibleModules: u.accessibleModules || ['dashboard']
    });
    setIsOpen(true);
  };

  const openCreateModal = () => {
    setEditingUserId(null);
    setForm({
      name: '',
      email: '',
      password: 'password123',
      role: 'Site Supervisor',
      department: 'Site Engineering',
      phone: '',
      accessibleModules: ['dashboard']
    });
    setIsOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User & Role Permission Management</h1>
          <p className="text-xs text-slate-500 mt-1">Configure user accounts, role personas (Tender Manager, PM, Supervisor, Accounts) & access controls</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={emailAlerts}
              onChange={(e) => {
                setEmailAlerts(e.target.checked);
              }}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
            />
            Receive Admin Email Alerts
          </label>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create User Persona
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3.5 text-center w-12">S.NO</th>
                <th className="px-4 py-3.5">User Identity & Email</th>
                <th className="px-4 py-3.5">Assigned Role Persona</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading users...</td></tr>
              ) : (
                users.map((u, index) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3.5 text-center font-mono text-slate-400 font-bold">{index + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                      {u.phone && <div className="text-[11px] text-slate-400 mt-0.5">{u.phone}</div>}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-blue-700">{u.role}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">{u.department}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.status === 'Active' ? 'success' : 'default'}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={async () => {
                            const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
                            try {
                              setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: newStatus } : x));
                              await api.updateUser(u.id, { status: newStatus });
                            } catch (err: any) {
                              console.error(err);
                            }
                          }}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded bg-slate-100"
                        >
                          Set {u.status === 'Active' ? 'Inactive' : 'Active'}
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              setUsers(prev => prev.filter(x => x.id !== u.id));
                              await api.deleteUser(u.id);
                            } catch (err: any) {
                              setUsers(prev => prev.filter(x => x.id !== u.id));
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                          title="Delete User"
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

      {/* Modal Form */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingUserId ? "Edit User Persona" : "Register New User Persona Account"}
        subtitle={editingUserId ? "Modify user details and access permissions" : "Specify email credentials and system access permissions"}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 "
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Assigned System Role *</label>
            <select
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-blue-700"
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Tender Manager">Tender Manager</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Site Supervisor">Site Supervisor</option>
              <option value="Accounts Manager">Accounts Manager</option>
              <option value="Management / Viewer">Management / Viewer</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-2 border-b pb-1">Module Access Permissions</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'tenders', label: 'Tenders' },
                { id: 'emd', label: 'EMD & Deposits' },
                { id: 'projects', label: 'Projects' },
                { id: 'materials', label: 'Material Master' },
                { id: 'inventory', label: 'Inventory & Dispatch' },
                { id: 'billing', label: 'Billing & Invoices' },
                { id: 'payments', label: 'Payment Tracking' },
                { id: 'retention', label: 'Retention Money' },
                { id: 'reports', label: 'Reports & Analytics' },
                { id: 'notifications', label: 'Notifications' }
              ].map(mod => (
                <label key={mod.id} className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.role === 'Admin' || form.role === 'Super Admin' || form.accessibleModules.includes(mod.id)}
                    disabled={form.role === 'Admin' || form.role === 'Super Admin'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm(f => ({ ...f, accessibleModules: [...f.accessibleModules, mod.id] }));
                      } else {
                        setForm(f => ({ ...f, accessibleModules: f.accessibleModules.filter(m => m !== mod.id) }));
                      }
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {mod.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold">
              {editingUserId ? "Save Changes" : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
