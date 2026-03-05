"use client";

import React, { useState } from 'react';

interface User {
  username: string;
  email: string;
  password: string;
  role: string;
  created: string;
}

const initialUsers: User[] = [
  { username: "Test", email: "testmail@g.vm", password: "Nbmi34sdf", role: "Viewer", created: "Feb 2, 2026 08:00 AM" },
  { username: "123", email: "123@dfs.mm", password: "Nbmi34sdf", role: "Viewer", created: "Feb 11, 2026 08:50 AM" },
  { username: "Admin", email: "admin@ibn.com", password: "Nbmi34sdf", role: "Viewer", created: "Feb 13, 2026 09:20 AM" },
  { username: "Rukhsar", email: "rnasir15@gmail.com", password: "Nbmi34sdf", role: "Viewer", created: "Jan 10, 2026 10:40 AM" },
  { username: "Arhum", email: "akhters49@gmail.com", password: "Nbmi34sdf", role: "Viewer", created: "Jan 12, 2026 11:00 AM" },
];

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [formData, setFormData] = useState({ username: '', email: '' });

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Create New User
  const handleCreateViewer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email) return;

    const newUser: User = {
      username: formData.username,
      email: formData.email,
      password: "Nbmi" + Math.random().toString(36).substring(7), // Mock password
      role: "Viewer",
      created: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };

    setUsers([newUser, ...users]);
    setFormData({ username: '', email: '' });
  };

  // Clear Users
  const clearUsers = () => setUsers([]);

  // Export Users to CSV
  const exportToCSV = () => {
    if (users.length === 0) return;

    const headers = ["Username,Email,Password,Role,Created"];
    const rows = users.map(user => 
      `${user.username},${user.email},${user.password},${user.role},"${user.created}"`
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

  const stats = [
    { label: "Total Users", value: "2,318", color: "bg-[#f3a61f]" },
    { label: "Active Users", value: "2,318", color: "bg-[#5ebf8c]" },
    { label: "Offline Users", value: "2,318", color: "bg-[#555b5e]" },
    { label: "Removed", value: "2,318", color: "bg-[#e84b4b]" },
  ];

  return (
    <div className="p-4 md:p-8 bg-white min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm italic">Create new user and email. Role is fixed to viewer (Prototype).</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="bg-[#cc7a00] hover:bg-[#b36b00] text-white px-6 py-2.5 rounded-lg font-bold transition-all"
          >
            Export Users
          </button>
          <button 
            onClick={clearUsers}
            className="bg-[#e84b4b] hover:bg-[#d43f3f] text-white px-6 py-2.5 rounded-lg font-bold transition-all"
          >
            Clear Users
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Form Section */}
        <div className="lg:col-span-1 bg-[#f8f9fc] p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
          <form onSubmit={handleCreateViewer} className="space-y-2">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Ibaan.Viewer1"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Testuser@gmail.com"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all"
            >
              Create Viewer
            </button>
          </form>
        </div>

        {/* Right: Stats Grid */}
        <div className="lg:col-span-1 grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`${stat.color} p-6 rounded-3xl text-white flex flex-col justify-center items-center shadow-md aspect-video md:aspect-auto`}>
              <span className="text-lg md:text-md font-small mb-1">{stat.label}</span>
              <span className="text-3xl md:text-4xl font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Table Section */}
      <div className="mt-8 bg-[#f8f9fc] rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-800 font-bold text-[15px]">
                <th className="px-6 py-5">Username</th>
                <th className="px-6 py-5">Email</th>
                <th className="px-6 py-5">Password</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Created</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr 
                    key={index} 
                    className={`${index % 2 === 0 ? 'bg-[#eeeffc]' : 'bg-transparent'} text-gray-700`}
                  >
                    <td className="px-6 py-5 font-medium">{user.username}</td>
                    <td className="px-6 py-5">{user.email}</td>
                    <td className="px-6 py-5">{user.password}</td>
                    <td className="px-6 py-5">{user.role}</td>
                    <td className="px-6 py-5 whitespace-nowrap">{user.created}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">
                    No users currently managed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;