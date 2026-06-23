'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Plus, Edit, Trash2, Users, CheckCircle2 } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdDate: string;
}

interface Permission {
  name: string;
  description: string;
  category: 'General' | 'Admin' | 'Security';
}

export default function RolesDashboard() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 1,
      name: 'Admin',
      description: 'Full system access and user management capabilities.',
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_roles', 'manage_policies'],
      userCount: 1,
      createdDate: '2024-01-01',
    },
    {
      id: 2,
      name: 'Security Manager',
      description: 'Can manage security policies, run vulnerability campaigns, and view all data.',
      permissions: ['read', 'write', 'manage_policies', 'view_audit_logs'],
      userCount: 1,
      createdDate: '2024-01-15',
    },
    {
      id: 3,
      name: 'Analyst',
      description: 'Can read and write findings and vulnerability reports.',
      permissions: ['read', 'write'],
      userCount: 2,
      createdDate: '2024-02-01',
    },
    {
      id: 4,
      name: 'Viewer',
      description: 'Read-only access to compliance dashboards and reporting downloads.',
      permissions: ['read'],
      userCount: 1,
      createdDate: '2024-02-15',
    },
  ]);

  const allPermissions: Permission[] = [
    { name: 'read', description: 'View dashboards, reports, and data', category: 'General' },
    { name: 'write', description: 'Create and modify reports and data', category: 'General' },
    { name: 'delete', description: 'Delete reports and data', category: 'General' },
    { name: 'manage_users', description: 'Add, edit, and remove users', category: 'Admin' },
    { name: 'manage_roles', description: 'Create and modify roles', category: 'Admin' },
    { name: 'manage_policies', description: 'Manage security policies', category: 'Security' },
    { name: 'view_audit_logs', description: 'View system audit logs', category: 'Security' },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification('');
    }, 3000);
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
    setIsModalOpen(true);
  };

  const handleDeleteRole = (roleId: number) => {
    const role = roles.find(r => r.id === roleId);
    if (role && role.userCount > 0) {
      alert('This role cannot be deleted while users are assigned to it.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this role?')) {
      setRoles(prev => prev.filter(r => r.id !== roleId));
      showNotification('Role deleted successfully');
    }
  };

  const handlePermissionToggle = (permName: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permName)
        ? prev.permissions.filter(p => p !== permName)
        : [...prev.permissions, permName],
    }));
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      setRoles(prev =>
        prev.map(r =>
          r.id === editingRole.id
            ? { ...r, ...formData }
            : r
        )
      );
      showNotification('Role updated successfully');
    } else {
      const newRole: Role = {
        id: Math.max(...roles.map(r => r.id), 0) + 1,
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        userCount: 0,
        createdDate: new Date().toISOString().split('T')[0],
      };
      setRoles(prev => [...prev, newRole]);
      showNotification('Role created successfully');
    }
    setIsModalOpen(false);
  };

  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
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
          <Shield className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">Roles Management</h1>
        </div>
        <button
          onClick={handleAddRole}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-semibold transition cursor-pointer shadow-lg shadow-orange-950/20"
        >
          <Plus className="w-5 h-5" />
          Add Role
        </button>
      </div>

      {notification && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <Card key={role.id} className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-all flex flex-col justify-between">
            <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{role.name}</h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{role.description}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-blue-400 transition cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Permissions */}
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    Permissions ({role.permissions.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map(perm => (
                      <span key={perm} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/10">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-850 pt-4">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Users className="w-4 h-4 text-slate-400" />
                  {role.userCount} users assigned
                </span>
                <span className="font-mono text-slate-500">{role.createdDate}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </h2>

            <form onSubmit={handleSaveRole} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Role Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                  placeholder="e.g. Compliance Auditor"
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
                  placeholder="e.g. Audit evaluation detailing security controls..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-3">Permissions Schema</label>
                <div className="space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="bg-slate-950 p-4 rounded-lg border border-slate-850">
                      <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">{category}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perms.map(perm => (
                          <label key={perm.name} className="flex items-start gap-2.5 cursor-pointer hover:text-white group">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm.name)}
                              onChange={() => handlePermissionToggle(perm.name)}
                              className="mt-0.5 w-4 h-4 rounded border-slate-700 text-orange-600 focus:ring-orange-500 accent-orange-600"
                            />
                            <div>
                              <span className="text-sm font-semibold text-slate-300 group-hover:text-white">
                                {perm.name}
                              </span>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                                {perm.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
