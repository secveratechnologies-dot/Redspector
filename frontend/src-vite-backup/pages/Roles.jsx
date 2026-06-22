import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Users } from 'lucide-react';
import Badge from '../components/Badge';
import { useAPI } from '../hooks/useAPI';

export default function Roles({ onNotify }) {
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [allPermissions, setAllPermissions] = useState([]);
  const { loading, fetchRoles, fetchPermissions, createRole, updateRole, deleteRole } = useAPI();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const rolesResult = await fetchRoles();
    const permissionsResult = await fetchPermissions();
    
    if (rolesResult.success) {
      setRoles(rolesResult.data);
    }
    if (permissionsResult.success) {
      setAllPermissions(permissionsResult.data);
    }
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setIsModalOpen(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setIsModalOpen(true);
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Are you sure? This role cannot be deleted if users are assigned.')) {
      const result = await deleteRole(roleId);
      if (result.success) {
        await loadData();
        onNotify('Role deleted successfully');
      }
    }
  };

  const handlePermissionToggle = (permissionName) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName]
    }));
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (editingRole) {
      const result = await updateRole(editingRole.id, formData);
      if (result.success) {
        onNotify('Role updated successfully');
      }
    } else {
      const result = await createRole(formData);
      if (result.success) {
        onNotify('Role created successfully');
      }
    }
    await loadData();
    setIsModalOpen(false);
  };

  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">Roles Management</h1>
        </div>
        <button
          onClick={handleAddRole}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(role => (
          <div key={role.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-orange-500 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{role.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{role.description}</p>
              </div>
              <div className="flex gap-2 ml-2">
                <button
                  onClick={() => handleEditRole(role)}
                  className="p-2 hover:bg-slate-700 rounded transition text-blue-400"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteRole(role.id)}
                  className="p-2 hover:bg-slate-700 rounded transition text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Permissions */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 mb-2 uppercase">Permissions ({role.permissions.length})</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.map(perm => (
                  <Badge key={perm} variant="green" label={perm} />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-700 pt-3">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {role.userCount} users
              </span>
              <span>{role.createdDate}</span>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No roles found. Create your first role to get started.
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </h2>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                  placeholder="e.g., Security Officer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows="2"
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none resize-none"
                  placeholder="Describe this role's purpose..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Permissions</label>
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                  <div key={category} className="mb-4">
                    <p className="text-xs font-semibold text-slate-400 mb-2 uppercase">{category}</p>
                    <div className="space-y-2 ml-2">
                      {perms.map(perm => (
                        <label key={perm.name} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(perm.name)}
                            onChange={() => handlePermissionToggle(perm.name)}
                            className="w-4 h-4 rounded accent-orange-500"
                          />
                          <span className="text-sm text-slate-300">{perm.name}</span>
                          <span className="text-xs text-slate-500">({perm.description})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
