"use client";

import React, { useState, useEffect } from 'react';

interface User {
  username: string;
  email: string;
  password_hash: string; // Changed from 'password' to 'password_hash'
  role: string;
  created: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(true);

  // Pagination State - Supporting User Journey Story 2 [cite: 168]
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  // Function to generate a strong 10-character alphanumeric password [cite: 227]
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

  useEffect(() => {
    fetchUsers();
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
          password_hash: strongPassword, // Changed from 'password' to 'password_hash'
          role: 'Viewer' // Role is fixed to Viewer per prototype requirements [cite: 226]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Database Error: ${result.error || "Failed to create user"}`);
        return;
      }

      setUsers((prev) => [result, ...prev]);
      setFormData({ username: '', email: '' });
      setCurrentPage(1);
    } catch (err: unknown) {
      console.error("Error creating user:", err);
      alert("Failed to reach server. Check your database connection.");
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

  const stats = [
    { label: "Total Users", value: (users?.length || 0).toString(), color: "bg-[#f3a61f]" },
    { label: "Active Users", value: (users?.length || 0).toString(), color: "bg-[#5ebf8c]" },
    { label: "Offline Users", value: "0", color: "bg-[#555b5e]" },
    { label: "Removed", value: "0", color: "bg-[#e84b4b]" },
  ];

  if (loading) return <div className="p-2 text-center font-bold">Initializing GeoLokal Access Control...</div>;

  return (
    <div className="p-2 md:p-4 bg-white font-sans flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start 
      md:items-center mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm italic">Authenticated via GeoLokal Data Tier[cite: 75].</p>
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
          {stats.map((stat) => (
            <div key={stat.label} className={`${stat.color} p-4 rounded-3xl text-white flex flex-col justify-center items-center shadow-md`}>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No users found.</td>
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
    </div>
  );
};

export default UserManagement;