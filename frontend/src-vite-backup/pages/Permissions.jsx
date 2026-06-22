import React, { useState, useEffect } from 'react';
import { Lock, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import Badge from '../components/Badge';
import { useAPI } from '../hooks/useAPI';

export default function Permissions({ onNotify }) {
  const [permissions, setPermissions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    active: true
  });
  const { loading, fetchPermissions, createPermission, updatePermission, deletePermission, togglePermissionActive } = useAPI();

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    const result = await fetchPermissions();
    if (result.success) {
      setPermissions(result.data);
    }
  };

  const handleAddPermission = () => {
    setEditingPermission(null);
    setFormData({
      name: '',
      description: '',
      category: 'General',
      active: true
    });
    setIsModalOpen(true);
  };

  const handleEditPermission = (perm) => {
    setEditingPermission(perm);
    setFormData({
      name: perm.name,
      description: perm.description,
      category: perm.category,
      active: perm.active
    });
    setIsModalOpen(true);
  };

  const handleDeletePermission = async (permId) => {
    if (window.confirm('Are you sure? This will affect all roles using this permission.')) {
      const result = await deletePermission(permId);
      if (result.success) {
        await loadPermissions();
        onNotify('Permission deleted successfully');
      }
    }
  };

  const handleToggleActive = async (permId) => {
    const result = await togglePermissionActive(permId);
    if (result.success) {
      await loadPermissions();
      onNotify('Permission status updated');
    }
  };

  const handleSavePermission = async (e) => {
    e.preventDefault();
    if (editingPermission) {
      const result = await updatePermission(editingPermission.id, formData);
      if (result.success) {
        onNotify('Permission updated successfully');
      }
    } else {
      const result = await createPermission(formData);
      if (result.success) {
        onNotify('Permission created successfully');
      }
    }
    await loadPermissions();
    setIsModalOpen(false);
  };

  const categories = [...new Set(permissions.map(p => p.category))].sort();
  const permissionsByCategory = permissions.reduce((acc, perm) => {
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
          <Lock className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">Permissions Management</h1>
        </div>
        <button
          onClick={handleAddPermission}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Permission
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Total Permissions</p>
          <p className="text-3xl font-bold text-white mt-1">{permissions.length}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Active</p>
          <p className="text-3xl font-bold text-green-400 mt-1">
            {permissions.filter(p => p.active).length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Categories</p>
          <p className="text-3xl font-bold text-orange-400 mt-1">{categories.length}</p>
        </div>
      </div>

      {/* Permissions by Category */}
      <div className="space-y-6">
        {Object.entries(permissionsByCategory).map(([category, perms]) => (
          <div key={category} className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="bg-slate-900 px-6 py-3 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">{category} Permissions</h3>
            </div>

            <div className="divide-y divide-slate-700">
              {perms.map(perm => (
                <div
                  key={perm.id}
                  className={`px-6 py-4 flex items-start justify-between hover:bg-slate-700 transition ${
                    !perm.active ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{perm.name}</h4>
                      {perm.active ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{perm.description}</p>
                    <p className="text-xs text-slate-500 mt-2">Used in {perm.rolesCount} role(s)</p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(perm.id)}
                      title={perm.active ? 'Deactivate' : 'Activate'}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        perm.active
                          ? 'bg-green-900 text-green-200 hover:bg-green-800'
                          : 'bg-red-900 text-red-200 hover:bg-red-800'
                      }`}
                    >
                      {perm.active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleEditPermission(perm)}
                      className="p-2 hover:bg-slate-600 rounded transition text-blue-400"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePermission(perm.id)}
                      className="p-2 hover:bg-slate-600 rounded transition text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {permissions.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No permissions found. Create your first permission to get started.
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingPermission ? 'Edit Permission' : 'Add New Permission'}
            </h2>

            <form onSubmit={handleSavePermission} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Permission Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                  placeholder="e.g., audit_logs"
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
                  placeholder="Describe what this permission allows..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                >
                  <option value="General">General</option>
                  <option value="Admin">Admin</option>
                  <option value="Security">Security</option>
                  <option value="Reporting">Reporting</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded accent-orange-500"
                  />
                  <span className="text-sm text-slate-300">Active</span>
                </label>
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
                  {loading ? 'Saving...' : 'Save Permission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
