'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users as UsersIcon, Plus, Edit, Trash2, Search, Eye, X, CheckCircle2 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  joinDate: string;
  lastActive: string;
  permissions: string[];
}

export default function UsersDashboard() {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin',
      status: 'Active',
      joinDate: '2024-01-15',
      lastActive: '2 hours ago',
      permissions: ['read', 'write', 'delete', 'manage_users'],
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Security Manager',
      status: 'Active',
      joinDate: '2024-02-20',
      lastActive: '30 minutes ago',
      permissions: ['read', 'write', 'manage_policies'],
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'Analyst',
      status: 'Active',
      joinDate: '2024-03-10',
      lastActive: '1 day ago',
      permissions: ['read', 'write'],
    },
    {
      id: 4,
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      role: 'Analyst',
      status: 'Inactive',
      joinDate: '2024-04-05',
      lastActive: '2 weeks ago',
      permissions: ['read'],
    },
    {
      id: 5,
      name: 'Tom Brown',
      email: 'tom@example.com',
      role: 'Viewer',
      status: 'Active',
      joinDate: '2024-05-12',
      lastActive: '3 hours ago',
      permissions: ['read'],
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedDetailsUser, setSelectedDetailsUser] = useState<User | null>(null);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Analyst',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification('');
    }, 3000);
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

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      showNotification('User deleted successfully');
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(prev =>
        prev.map(u =>
          u.id === editingUser.id
            ? { ...u, ...formData }
            : u
        )
      );
      showNotification('User updated successfully');
    } else {
      const newUser: User = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        joinDate: new Date().toISOString().split('T')[0],
        lastActive: 'now',
        permissions: formData.role === 'Admin' ? ['read', 'write', 'delete', 'manage_users'] : ['read'],
      };
      setUsers(prev => [...prev, newUser]);
      showNotification('User created successfully');
    }
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
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-semibold transition cursor-pointer shadow-lg shadow-orange-950/20"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {notification && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900 rounded-lg p-4 flex gap-4 flex-wrap border border-slate-800">
        <div className="flex-1 min-w-64 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-3 py-2">
          <Search className="w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-white placeholder-slate-500 outline-none flex-1"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-slate-950 text-slate-300 px-3 py-2 rounded border border-slate-800 focus:border-orange-500 outline-none font-medium"
        >
          <option value="all">All Roles</option>
          {roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-950 text-slate-300 px-3 py-2 rounded border border-slate-800 focus:border-orange-500 outline-none font-medium"
        >
          <option value="all">All Status</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950 border-b border-slate-800">
                <tr className="text-slate-400 font-semibold text-sm">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="px-6 py-4 text-sm text-white font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/10">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.status === 'Active'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/10'
                          : 'bg-red-500/10 text-red-400 border border-red-500/10'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{user.joinDate}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{user.lastActive}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedDetailsUser(user)}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-green-400 transition cursor-pointer"
                          title="View profile details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-blue-400 transition cursor-pointer"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-red-400 transition cursor-pointer"
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
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-slate-500 font-semibold">
              No users found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit / Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="e.g. john@company.com"
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition font-semibold"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedDetailsUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">User Profile Details</h2>
              <button
                onClick={() => setSelectedDetailsUser(null)}
                className="text-slate-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-lg border border-slate-850">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-extrabold shadow-md">
                  {selectedDetailsUser.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedDetailsUser.name}</h3>
                  <p className="text-sm text-slate-500">{selectedDetailsUser.email}</p>
                </div>
              </div>

              {/* Grid Metadata details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">User ID</p>
                  <p className="text-white font-mono mt-1 font-semibold">#USR-00{selectedDetailsUser.id}</p>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Account Status</p>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedDetailsUser.status === 'Active'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/10'
                        : 'bg-red-500/10 text-red-400 border border-red-500/10'
                    }`}>
                      {selectedDetailsUser.status}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Join Date</p>
                  <p className="text-white mt-1 font-semibold">{selectedDetailsUser.joinDate || 'N/A'}</p>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Last Active</p>
                  <p className="text-white mt-1 font-semibold">{selectedDetailsUser.lastActive || 'N/A'}</p>
                </div>
              </div>

              {/* Permissions & Capabilities */}
              <div>
                <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-2">Inherited active permissions</p>
                <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-850 flex flex-wrap gap-2">
                  {selectedDetailsUser.permissions && selectedDetailsUser.permissions.length > 0 ? (
                    selectedDetailsUser.permissions.map(perm => (
                      <span key={perm} className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-600/15 text-orange-400 border border-orange-500/10">
                        {perm}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No direct permissions assigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-850 mt-6">
              <button
                type="button"
                onClick={() => setSelectedDetailsUser(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg transition font-semibold"
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
