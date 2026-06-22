import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import Badge from '../components/Badge';
import { useAPI } from '../hooks/useAPI';

export default function Users({ onNotify }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedDetailsUser, setSelectedDetailsUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Analyst', status: 'Active' });
  const { loading, fetchUsers, createUser, updateUser, deleteUser } = useAPI();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const result = await fetchUsers();
    if (result.success) {
      setUsers(result.data);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'Analyst', status: 'Active' });
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const result = await deleteUser(userId);
      if (result.success) {
        await loadUsers();
        onNotify('User deleted successfully');
      }
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (editingUser) {
      const result = await updateUser(editingUser.id, formData);
      if (result.success) {
        onNotify('User updated successfully');
      }
    } else {
      const result = await createUser(formData);
      if (result.success) {
        onNotify('User created successfully');
      }
    }
    await loadUsers();
    setIsModalOpen(false);
  };

  const roles = ['Admin', 'Security Manager', 'Analyst', 'Viewer'];
  const statuses = ['Active', 'Inactive'];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersIcon className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">Users Management</h1>
        </div>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-4 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 flex items-center gap-2 bg-slate-700 rounded px-3 py-2">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-white placeholder-slate-400 outline-none flex-1"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
        >
          <option value="all">All Roles</option>
          {roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
        >
          <option value="all">All Status</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Joined</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Last Active</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-slate-700 transition">
                <td className="px-6 py-4 text-sm text-white font-medium">{user.name}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{user.email}</td>
                <td className="px-6 py-4 text-sm">
                  <Badge variant="blue" label={user.role} />
                </td>
                <td className="px-6 py-4 text-sm">
                  <Badge
                    variant={user.status === 'Active' ? 'green' : 'red'}
                    label={user.status}
                  />
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{user.joinDate}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{user.lastActive}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedDetailsUser(user)}
                      className="p-2 hover:bg-slate-600 rounded transition text-green-400 cursor-pointer"
                      title="View profile details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 hover:bg-slate-600 rounded transition text-blue-400 cursor-pointer"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 hover:bg-slate-600 rounded transition text-red-400 cursor-pointer"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No users found matching your criteria
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedDetailsUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">User Details</h2>
            
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 bg-slate-700/30 p-4 rounded-lg border border-slate-700">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {selectedDetailsUser.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedDetailsUser.name}</h3>
                  <p className="text-sm text-slate-400">{selectedDetailsUser.email}</p>
                </div>
              </div>

              {/* Grid Metadata details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-700/20 p-3 rounded border border-slate-700/50">
                  <p className="text-slate-400 text-xs uppercase font-semibold">User ID</p>
                  <p className="text-white font-mono mt-1">#USR-00{selectedDetailsUser.id}</p>
                </div>
                <div className="bg-slate-700/20 p-3 rounded border border-slate-700/50">
                  <p className="text-slate-400 text-xs uppercase font-semibold">Account Status</p>
                  <div className="mt-1">
                    <Badge variant={selectedDetailsUser.status === 'Active' ? 'green' : 'red'} label={selectedDetailsUser.status} />
                  </div>
                </div>
                <div className="bg-slate-700/20 p-3 rounded border border-slate-700/50">
                  <p className="text-slate-400 text-xs uppercase font-semibold">Join Date</p>
                  <p className="text-white mt-1">{selectedDetailsUser.joinDate || 'N/A'}</p>
                </div>
                <div className="bg-slate-700/20 p-3 rounded border border-slate-700/50">
                  <p className="text-slate-400 text-xs uppercase font-semibold">Last Active</p>
                  <p className="text-white mt-1">{selectedDetailsUser.lastActive || 'N/A'}</p>
                </div>
              </div>

              {/* Permissions & Capabilities */}
              <div>
                <p className="text-slate-400 text-xs uppercase font-semibold mb-2">Role & Capabilities ({selectedDetailsUser.role})</p>
                <div className="bg-slate-700/20 p-4 rounded border border-slate-700/50 space-y-2">
                  <p className="text-xs text-slate-400">Inherited active permissions on tenant framework:</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedDetailsUser.permissions && selectedDetailsUser.permissions.length > 0 ? (
                      selectedDetailsUser.permissions.map(perm => (
                        <Badge key={perm} variant="blue" label={perm} />
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No direct permissions assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-700 mt-6">
              <button
                type="button"
                onClick={() => setSelectedDetailsUser(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
