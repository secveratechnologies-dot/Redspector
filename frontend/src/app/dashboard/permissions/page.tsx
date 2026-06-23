'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Plus, Edit, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
  rolesCount: number;
  active: boolean;
}

export default function PermissionsDashboard() {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 1,
      name: 'read',
      description: 'View dashboards, reports, and data.',
      category: 'General',
      rolesCount: 4,
      active: true,
    },
    {
      id: 2,
      name: 'write',
      description: 'Create and modify reports and data.',
      category: 'General',
      rolesCount: 3,
      active: true,
    },
    {
      id: 3,
      name: 'delete',
      description: 'Delete reports and data.',
      category: 'General',
      rolesCount: 1,
      active: true,
    },
    {
      id: 4,
      name: 'manage_users',
      description: 'Add, edit, and remove users.',
      category: 'Admin',
      rolesCount: 1,
      active: true,
    },
    {
      id: 5,
      name: 'manage_roles',
      description: 'Create and modify roles.',
      category: 'Admin',
      rolesCount: 1,
      active: true,
    },
    {
      id: 6,
      name: 'manage_policies',
      description: 'Manage security policies.',
      category: 'Security',
      rolesCount: 2,
      active: true,
    },
    {
      id: 7,
      name: 'view_audit_logs',
      description: 'View system audit logs.',
      category: 'Security',
      rolesCount: 2,
      active: true,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    active: true,
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification('');
    }, 3000);
  };

  const handleAddPermission = () => {
    setEditingPermission(null);
    setFormData({
      name: '',
      description: '',
      category: 'General',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleEditPermission = (perm: Permission) => {
    setEditingPermission(perm);
    setFormData({
      name: perm.name,
      description: perm.description,
      category: perm.category,
      active: perm.active,
    });
    setIsModalOpen(true);
  };

  const handleDeletePermission = (permId: number) => {
    if (window.confirm('Are you sure? This will affect all roles currently using this permission.')) {
      setPermissions(prev => prev.filter(p => p.id !== permId));
      showNotification('Permission deleted successfully');
    }
  };

  const handleToggleActive = (permId: number) => {
    setPermissions(prev =>
      prev.map(p =>
        p.id === permId
          ? { ...p, active: !p.active }
          : p
      )
    );
    const perm = permissions.find(p => p.id === permId);
    showNotification(`Permission ${perm?.active ? 'deactivated' : 'activated'} successfully`);
  };

  const handleSavePermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPermission) {
      setPermissions(prev =>
        prev.map(p =>
          p.id === editingPermission.id
            ? { ...p, ...formData }
            : p
        )
      );
      showNotification('Permission updated successfully');
    } else {
      const newPerm: Permission = {
        id: Math.max(...permissions.map(p => p.id), 0) + 1,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        rolesCount: 0,
        active: formData.active,
      };
      setPermissions(prev => [...prev, newPerm]);
      showNotification('Permission created successfully');
    }
    setIsModalOpen(false);
  };

  const categories = Array.from(new Set(permissions.map(p => p.category))).sort();
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">Permissions Management</h1>
        </div>
        <button
          onClick={handleAddPermission}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-semibold transition cursor-pointer shadow-lg shadow-orange-950/20"
        >
          <Plus className="w-5 h-5" />
          Add Permission
        </button>
      </div>

      {notification && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Total Permissions</p>
            <p className="text-3xl font-extrabold text-white mt-2">{permissions.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Active Credentials</p>
            <p className="text-3xl font-extrabold text-green-400 mt-2">
              {permissions.filter(p => p.active).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5">
            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Categories</p>
            <p className="text-3xl font-extrabold text-orange-500 mt-2">{categories.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Permissions by Category */}
      <div className="space-y-6">
        {Object.entries(permissionsByCategory).map(([category, perms]) => (
          <Card key={category} className="bg-slate-900 border-slate-800 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">{category} Permissions</h3>
              </div>

              <div className="divide-y divide-slate-800/40">
                {perms.map(perm => (
                  <div
                    key={perm.id}
                    className={`px-6 py-4 flex items-start justify-between hover:bg-slate-850/20 transition-colors ${
                      !perm.active ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-bold text-white">{perm.name}</h4>
                        {perm.active ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        ) : (
                          <span className="text-[9px] font-extrabold uppercase bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-900/30">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-2 leading-relaxed">{perm.description}</p>
                      <p className="text-xs text-slate-500 mt-2 font-semibold">Mapped to {perm.rolesCount} active role(s)</p>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <button
                        onClick={() => handleToggleActive(perm.id)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                          perm.active
                            ? 'bg-green-950/20 text-green-400 border-green-900/30 hover:bg-green-950/40'
                            : 'bg-red-950/20 text-red-400 border-red-900/30 hover:bg-red-950/40'
                        }`}
                      >
                        {perm.active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleEditPermission(perm)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-blue-400 transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePermission(perm.id)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-red-400 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingPermission ? 'Edit Permission' : 'Add New Permission'}
            </h2>

            <form onSubmit={handleSavePermission} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Permission Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                  placeholder="e.g. read_billing_logs"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={2}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none resize-none transition"
                  placeholder="Describe what capabilities this token unlocks..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                >
                  <option value="General">General</option>
                  <option value="Admin">Admin</option>
                  <option value="Security">Security</option>
                  <option value="Reporting">Reporting</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-orange-600 focus:ring-orange-500 accent-orange-600"
                  />
                  <span className="text-sm font-semibold text-slate-300">Active / Enabled</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg transition font-semibold"
                >
                  Save Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
