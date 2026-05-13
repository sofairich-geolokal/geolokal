"use client";

import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, Filter, UserPlus, Shield, Eye as EyeIcon, Copy } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  lgu_id: string | null;
  location: string | null;
  created: string;
  created_by: string | null;
  lgu_name: string | null;
}

interface LGU {
  id: number;
  name: string;
  province: string;
}

interface LGUStats {
  totalLGUAdmins: number;
  activeLGUAdmins: number;
  loggedInLGUAdmins: number;
  removedLGUAdmins: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'lgu',
    location: '',
    lgu_id: ''
  });
  const [lgus, setLgus] = useState<LGU[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);
  const [lguStats, setLguStats] = useState<LGUStats>({
    totalLGUAdmins: 0,
    activeLGUAdmins: 0,
    loggedInLGUAdmins: 0,
    removedLGUAdmins: 0,
  });
  const [lastStatsUpdate, setLastStatsUpdate] = useState<number>(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch LGU stats
  const fetchLGUStats = async () => {
    try {
      console.log("Fetching LGU stats...");
      
      // Implement simple caching - only fetch stats if data changed or 30 seconds passed
      const now = Date.now();
      const timeSinceLastUpdate = now - lastStatsUpdate;
      const thirtySeconds = 30 * 1000;
      
      if (users.length > 0 && timeSinceLastUpdate < thirtySeconds) {
        console.log('Using cached LGU stats data');
        return; // Use existing stats
      }
      
      const response = await fetch('/api/superadmin/lgus/stats', {
        credentials: 'include'
      });
      console.log("LGU Stats response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("LGU Stats API error response:", errorText);
        throw new Error("LGU Stats Server Error");
      }
      
      const data = await response.json();
      console.log("LGU Stats data received:", data);
      setLguStats({
        totalLGUAdmins: data.totalLGUAdmins || 0,
        activeLGUAdmins: data.activeLGUAdmins || 0,
        loggedInLGUAdmins: data.loggedinLGUAdmins || 0,
        removedLGUAdmins: data.removedLGUAdmins || 0,
      });
      
      // Update last stats update time
      setLastStatsUpdate(Date.now());
    } catch (err: unknown) {
      console.error("LGU Stats fetch error:", err);
      // Keep default values on error and implement fallback
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // If connection timeout, try to calculate stats from local data
      if (errorMessage.includes('connection timeout') || errorMessage.includes('connection slots')) {
        console.warn('LGU Stats API failed, using fallback calculation from local data');
        // Calculate stats from current users array
        const totalLGUAdmins = users.filter(user => user.role.toLowerCase() === 'lgu').length;
        const activeLGUAdmins = totalLGUAdmins;
        
        setLguStats({
          totalLGUAdmins,
          activeLGUAdmins,
          loggedInLGUAdmins: activeLGUAdmins,
          removedLGUAdmins: 0
        });
        return;
      }
      
      // Keep default values on other errors
    }
  };

  // Fetch LGUs for dropdown
  const fetchLGUs = async () => {
    try {
      const response = await fetch('/api/superadmin/lgus', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch LGUs');
      }
      
      const data = await response.json();
      setLgus(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch LGUs error:", err);
    }
  };

  // Fetch users from superadmin API
  const fetchUsers = async () => {
    try {
      console.log("Fetching users from /api/superadmin/users");
      const response = await fetch('/api/superadmin/users', {
        credentials: 'include'
      });
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text available');
        console.error("=== API ERROR DEBUG ===");
        console.error("API Response Status:", response.status);
        console.error("API Response Status Text:", response.statusText);
        console.error("API Response Headers:", Object.fromEntries(response.headers.entries()));
        console.error("API Response Text:", errorText);
        console.error("API Response URL:", response.url);
        
        let errorData: { error?: string } = {};
        try {
          errorData = await response.json();
        } catch (e) {
          console.error("Failed to parse error response as JSON:", e);
        }
        
        console.error("API Error Data:", errorData);
        console.error("=== END DEBUG ===");
        
        const errorMessage = errorData.error || `HTTP ${response.status}: ${errorText || 'Failed to fetch users'}`;
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log("Users data received:", data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch users error:", err);
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch LGU users
  const fetchLGUUsers = async () => {
    try {
      console.log("Fetching LGU users from /api/lgu/users");
      const response = await fetch('/api/lgu/users', {
        credentials: 'include'
      });
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch LGU users`);
      }
      const data = await response.json();
      console.log("LGU Users data received:", data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch LGU users error:", err);
      setError(err.message || 'Failed to load LGU users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLGUs();
    fetchLGUStats();
  }, []);

  useEffect(() => {
    let filtered = users.filter(user => user.role.toLowerCase() === 'lgu');

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lgu_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm]);

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    return Array.from({ length: 12 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  // Toggle password visibility
  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Copy password to clipboard
  const copyPassword = async (user: User) => {
    try {
      await navigator.clipboard.writeText(user.password_hash);
      setCopiedPassword(user.id);
      setTimeout(() => setCopiedPassword(null), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  // Handle user deletion
  const handleDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const response = await fetch('/api/superadmin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userIds: selectedUsers })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error("Delete users API error:", response.status, errorText);
        
        let errorData: { error?: string } = {};
        try {
          errorData = await response.json();
        } catch (e) {
          console.error("Failed to parse delete error response as JSON");
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${errorText || 'Failed to delete users'}`);
      }

      await fetchUsers();
      setSelectedUsers([]);
    } catch (error: any) {
      console.error("Delete users error:", error);
      setError(error.message || 'Failed to delete users');
    }
  };

  // Handle opening edit modal
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      location: user.location || '',
      lgu_id: user.lgu_id || ''
    });
    setShowEditModal(true);
  };

  // Handle viewing LGU admin dashboard
  const handleViewDashboard = (user: User) => {
    // Open the LGU admin dashboard in a new tab using superadmin bypass route
    const tempToken = `superadmin_lgu_access_${user.id}_${Date.now()}`;
    const dashboardUrl = `/lgu-dashboard/superadmin-access?userId=${user.id}&token=${tempToken}`;
    window.open(dashboardUrl, '_blank');
  };

  // Handle user creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Auto-generate password since field is removed
      const autoPassword = generateStrongPassword();
      const submitData = {
        ...formData,
        password: autoPassword
      };

      const response = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to create user';
        throw new Error(errorMessage);
      }

      // Show success message
      setSuccess(`LGU Admin "${formData.username}" created successfully!`);
      setError(null); // Clear any existing error
      
      // Refresh users list
      await fetchUsers();
      
      // Refresh stats after creating user and invalidate cache
      setLastStatsUpdate(0);
      fetchLGUStats();
      
      // Reset form (excluding password and location)
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'lgu',
        location: '',
        lgu_id: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error: any) {
      setError(error.message || 'Failed to create LGU Admin');
      setSuccess(null); // Clear success message on error
    }
  };

  // Handle user update
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;
    
    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        location: formData.location,
        ...(formData.password && { password: formData.password }) // Only include password if provided
      };

      const response = await fetch(`/api/superadmin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to update user';
        throw new Error(errorMessage);
      }

      // Show success message
      setSuccess(`User "${formData.username}" updated successfully!`);
      setError(null); // Clear any existing error
      
      // Refresh users list
      await fetchUsers();
      
      // Close modal and reset form
      setShowEditModal(false);
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'lgu',
        location: '',
        lgu_id: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error: any) {
      setError(error.message || 'Failed to update user');
      setSuccess(null); // Clear success message on error
    }
  };

  // Updated Clear Users function to delete from Database [cite: 236]
  const clearUsers = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete all viewers from the database?");
    if (!confirmDelete) return;

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers([]);
        setCurrentPage(1);
      } else {
        const result = await response.json();
        alert(`Deletion Error: ${result.error || "Failed to clear users"}`);
      }
    } catch (err: any) {
      console.error("Error clearing users:", err);
      alert("Failed to reach server to clear database.");
    }
  };

  const exportToCSV = () => {
    if (!users || users.length === 0) return;
    const headers = ["Username,Email,Role,Created"];
    const rows = users.map(user => 
      `${user.username},${user.email},${user.role},"${user.created}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "user_management_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const lguStatsCards = [
    { label: "Total LGUs", value: lguStats.totalLGUAdmins.toString(), color: "bg-[#f3a61f]" },
    { label: "Active LGUs", value: lguStats.activeLGUAdmins.toString(), color: "bg-[#5ebf8c]" },
    { label: "Loggedin LGUs", value: lguStats.loggedInLGUAdmins.toString(), color: "bg-[#555b5e]" },
    { label: "Removed LGUs", value: lguStats.removedLGUAdmins.toString(), color: "bg-[#e84b4b]" },
  ];

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'lgu':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'viewer':
        return <EyeIcon className="h-4 w-4 text-green-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'lgu':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  
  return (
    <div className="p-2 md:p-4 bg-white font-sans flex flex-col">
      

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
        <div className="lg:col-span-1 bg-[#f8f9fc] p-4 rounded-2xl border 
        border-gray-100 shadow-sm h-fit">
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Username</label>
              <input 
                type="text" 
                name="username" 
                value={formData.username} 
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="LGU.Admin1" 
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-400 outline-none" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="admin@lgu.gov.ph" 
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-400 outline-none" 
                required
              />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all">Create LGU Admin</button>
          </form>
        </div>

        <div className="col-span-1 grid grid-cols-2 lg:grid-cols-2 gap-4 w-full">
          {lguStatsCards.map((stat: { label: string; value: string; color: string }) => (
            <div 
              key={stat.label} 
              className={`${stat.color} p-4 rounded-3xl text-white flex flex-col justify-center items-center shadow-md cursor-pointer hover:opacity-90 transition-opacity`}
            >
              <span className="text-lg font-small mb-1">{stat.label}</span>
              <span className="text-4xl font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search LGU admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button onClick={exportToCSV} className="bg-[#cc7a00] hover:bg-[#b36b00] text-white px-6 py-2.5 rounded-lg font-bold transition-all">Export LGU Admins</button>

        {selectedUsers.length > 0 && (
          <button
            onClick={handleDeleteUsers}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 inline mr-2" />
            Delete Selected ({selectedUsers.length})
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-2">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === currentUsers.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(currentUsers.map(u => u.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="text-left p-2 font-semibold text-gray-900">User</th>
              <th className="text-left p-2 font-semibold text-gray-900">Email</th>
              <th className="text-left p-2 font-semibold text-gray-900">Password</th>
              <th className="text-left p-2 font-semibold text-gray-900">LGU Name</th>
              <th className="text-left p-2 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="p-2">
                  <div>
                    <div className="font-medium text-gray-900">{user.username}</div>
                  </div>
                </td>
                <td className="p-2">
                  <div>
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className={`text-sm flex-1 ${visiblePasswords.has(user.id) ? 'bg-red-100 text-red-700 px-2 py-1 rounded font-mono' : 'text-gray-600'}`}>
                      {visiblePasswords.has(user.id) ? user.password_hash : '********'}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title={visiblePasswords.has(user.id) ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => copyPassword(user)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Copy password"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {copiedPassword === user.id && (
                    <div className="text-xs text-green-600 mt-1">Copied!</div>
                  )}
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      LGU Admin
                    </span>
                  </div>
                </td>
                <td className="p-2">
                  <div className="text-sm text-gray-900">{user.lgu_name || 'No LGU assigned'}</div>
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewDashboard(user)}
                      className="bg-green-600 text-white hover:bg-green-700 rounded-full p-2"
                      title="View Dashboard"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEditClick(user)}
                      className="bg-blue-600 text-white hover:bg-blue-700 rounded-full p-2"
                      title="Edit User"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => toggleUserSelection(user.id)}
                      className="bg-red-600 text-white hover:bg-red-700 rounded-full p-2"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-2 px-4 mt-0 flex justify-between items-center shadow-sm">
        <div className="text-sm text-gray-600">
          Showing {currentUsers.length} of {filteredUsers.length} users
          {totalPages > 1 && (
            <span className="ml-2">({Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length})</span>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New LGU Admin</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
  
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, password: generateStrongPassword()})}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Generate
                  </button>
                </div>
              </div>
              
                            
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Location</option>
                  <option value="Ibaan, Batangas">Ibaan, Batangas</option>
                  <option value="Teresa, Rizal">Teresa, Rizal</option>
                  <option value="Binangonan, Rizal">Binangonan, Rizal</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Select the primary location for this user</p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create LGU Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"

                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"

                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Leave empty to keep current password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to keep current password</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="lgu">LGU User</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Location</option>
                  <option value="Ibaan, Batangas">Ibaan, Batangas</option>
                  <option value="Teresa, Rizal">Teresa, Rizal</option>
                  <option value="Binangonan, Rizal">Binangonan, Rizal</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Select the primary location for this user</p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData({
                      username: '',
                      email: '',
                      password: '',
                      role: 'lgu',
                      location: '',
                      lgu_id: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mt-4">
          {success}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
