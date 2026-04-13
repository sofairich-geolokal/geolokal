"use client";

import React, { useState, useEffect } from 'react';

interface User {
  username: string;
  email: string;
  password_hash: string; 
  role: string;
  created: string;
}

interface ViewerStats {
  totalViewers: number;
  activeViewers: number;
  loggedInViewers: number;
  removedViewers: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ViewerStats>({
    totalViewers: 0,
    activeViewers: 0,
    loggedInViewers: 0,
    removedViewers: 0,
  });
  const [showRemovedPopup, setShowRemovedPopup] = useState(false);
  const [removedUsers, setRemovedUsers] = useState<User[]>([]);
  const [removedLoading, setRemovedLoading] = useState(false);

  // Pagination State - Supporting User Journey Story 2
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  // Function to generate a strong 10-character alphanumeric password
  const generateStrongPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 10 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error("Server Error");
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error("Connection error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log("Frontend - Fetching stats...");
      // Use original stats endpoint with debugging
      const response = await fetch('/api/users/stats');
      console.log("Frontend - Stats response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Frontend - Stats API error response:", errorText);
        throw new Error("Stats Server Error");
      }
      
      const data = await response.json();
      console.log("Frontend - Stats data received:", data);
      setStats({
        totalViewers: data.totalViewers || 0,
        activeViewers: data.activeViewers || 0,
        loggedInViewers: data.loggedInViewers || 0,
        removedViewers: data.removedViewers || 0,
      });
    } catch (err: unknown) {
      console.error("Frontend - Stats fetch error:", err);
      // Keep default values on error
    }
  };

  const fetchRemovedUsers = async () => {
    setRemovedLoading(true);
    try {
      const response = await fetch('/api/users/removed');
      if (!response.ok) throw new Error("Server Error");
      const data = await response.json();
      setRemovedUsers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error("Error fetching removed users:", err);
      setRemovedUsers([]);
    } finally {
      setRemovedLoading(false);
    }
  };

  const handleOpenRemovedPopup = () => {
    setShowRemovedPopup(true);
    fetchRemovedUsers();
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateViewer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email) return;

    const strongPassword = generateStrongPassword();

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          password: strongPassword, // Reverted to 'password' for the API request payload
          role: 'Viewer' // Role is fixed to Viewer per prototype requirements
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show user-friendly error instead of raw database error
        const errorMsg = result.error || "Failed to create user";
        if (errorMsg.includes("value too long") || errorMsg.includes("character varying")) {
          alert("Unable to create viewer. Please contact system administrator.");
        } else {
          alert(`Error: ${errorMsg}`);
        }
        return;
      }

      setUsers((prev) => [result, ...prev]);
      setFormData({ username: '', email: '' });
      setCurrentPage(1);
      // Refresh stats after creating a user
      fetchStats();
    } catch (err: unknown) {
      console.error("Error creating user:", err);
      alert("Failed to reach server. Check your database connection.");
    }
  };

  // Updated Clear Users function to delete from Database
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
        // Refresh stats after clearing users
        fetchStats();
      } else {
        const result = await response.json();
        alert(`Deletion Error: ${result.error || "Failed to clear users"}`);
      }
    } catch (err: any) {
      console.error("Error clearing users:", err);
      alert("Failed to reach server to clear database.");
    }
  };

  // Delete individual user
  const deleteUser = async (username: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete viewer "${username}"?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers((prev) => prev.filter((user) => user.username !== username));
        // Refresh stats after deleting user
        fetchStats();
      } else {
        const result = await response.json();
        alert(`Deletion Error: ${result.error || "Failed to delete user"}`);
      }
    } catch (err: any) {
      console.error("Error deleting user:", err);
      alert("Failed to reach server to delete user.");
    }
  };

  const exportToCSV = () => {
    if (!users || users.length === 0) return;
    const headers = ["Username,Email,Password,Role,Created"];
    const rows = users.map(user => 
      `${user.username},${user.email},${user.password_hash},${user.role},"${user.created}"` // Changed to password_hash
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
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const statsCards = [
    { label: "Total Viewers", value: stats.totalViewers.toString(), color: "bg-[#f3a61f]" },
    { label: "Active Viewers", value: stats.activeViewers.toString(), color: "bg-[#5ebf8c]" },
    { label: "Loggedin Viewers", value: stats.loggedInViewers.toString(), color: "bg-[#555b5e]" },
    { label: "Removed Viewers", value: stats.removedViewers.toString(), color: "bg-[#e84b4b]" },
  ];

  if (loading) return <div className="p-2 text-center font-bold">Initializing GeoLokal Access Control...</div>;

  return (
    <div className="p-2 md:p-4 bg-white font-sans flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start 
      md:items-center mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm italic">Authenticated via GeoLokal Data Tier.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="bg-[#cc7a00] hover:bg-[#b36b00] text-white px-6 py-2.5 rounded-lg font-bold transition-all">Export Users</button>
          {/* <button onClick={clearUsers} className="bg-[#e84b4b] hover:bg-[#d43f3f] text-white px-6 py-2.5 rounded-lg font-bold transition-all">Clear Users</button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
        <div className="lg:col-span-1 bg-[#f8f9fc] p-4 rounded-2xl border 
        border-gray-100 shadow-sm h-fit">
          <form onSubmit={handleCreateViewer} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleInputChange} placeholder="Ibaan.Viewer1" className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="testuser@ibaan.gov.ph" className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-400 outline-none" />
            </div>
            <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-all">Create Viewer</button>
          </form>
        </div>

        <div className="lg:col-span-1 grid grid-cols-2 gap-4">
          {statsCards.map((stat: { label: string; value: string; color: string }) => (
            <div 
              key={stat.label} 
              className={`${stat.color} p-4 rounded-3xl text-white flex flex-col justify-center items-center shadow-md cursor-pointer hover:opacity-90 transition-opacity ${stat.label === 'Removed Viewers' ? 'hover:scale-105' : ''}`}
              onClick={stat.label === 'Removed Viewers' ? handleOpenRemovedPopup : undefined}
            >
              <span className="text-lg font-small mb-1">{stat.label}</span>
              <span className="text-4xl font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-grow bg-[#f8f9fc] rounded-2xl border border-gray-100 shadow-sm flex flex-col relative pb-16 overflow-hidden">
        <div className="overflow-x-auto flex-grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-800 font-bold text-[14px] bg-white border-b 
              border-gray-100">
                <th className="px-6 py-2">Username</th>
                <th className="px-6 py-2">Email</th>
                <th className="px-6 py-2">Password</th>
                <th className="px-6 py-2">Role</th>
                <th className="px-6 py-2">Created</th>
                <th className="px-6 py-2">Remove</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {currentUsers.length > 0 ? (
                currentUsers.map((user, index) => (
                  <tr key={index} className={`${index % 2 === 0 ? 'bg-[#eeeffc]' : 'bg-transparent'} text-gray-700 hover:bg-white/50 transition-colors`}>
                    <td className="px-6 py-2 font-medium">{user.username}</td>
                    <td className="px-6 py-2">{user.email}</td>
                    <td className="px-6 py-2 font-mono text-[#2d4369] font-bold">
                      {user.password_hash} {/* Changed from user.password to user.password_hash */}
                    </td>
                    <td className="px-6 py-2">
                      <span className="bg-white/60 px-2 py-1 rounded border border-gray-200 uppercase text-[10px] font-bold">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap italic">{user.created}</td>
                    <td className="px-6 py-2">
                      <button
                        onClick={() => deleteUser(user.username)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                        title="Delete user"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center z-10">
          <span className="text-xs text-gray-500 font-medium">
            Showing <span className="text-black">{indexOfFirstItem + 1}</span> to <span className="text-black">{Math.min(indexOfLastItem, users.length)}</span> of <span className="text-black">{users.length}</span> entries
          </span>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-1.5 text-xs font-bold rounded bg-gray-100 text-gray-600 disabled:opacity-50 hover:bg-[#eeeffc]"
            >
              Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 text-xs font-bold rounded transition-all ${currentPage === i + 1 ? 'bg-[#2d4369] text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1.5 text-xs font-bold rounded bg-gray-100 text-gray-600 disabled:opacity-50 hover:bg-[#eeeffc]"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Removed Viewers Popup */}
      {showRemovedPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Removed Viewers</h2>
              <button
                onClick={() => setShowRemovedPopup(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-grow p-4">
              {removedLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : removedUsers.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gray-800 font-bold text-[14px] bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2">Username</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px]">
                    {removedUsers.map((user, index) => (
                      <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} text-gray-700`}>
                        <td className="px-4 py-2 font-medium">{user.username}</td>
                        <td className="px-4 py-2">{user.email}</td>
                        <td className="px-4 py-2">
                          <span className="bg-red-100 px-2 py-1 rounded border border-red-200 uppercase text-[10px] font-bold text-red-700">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap italic">{user.created}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-gray-400 italic">No removed viewers found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;