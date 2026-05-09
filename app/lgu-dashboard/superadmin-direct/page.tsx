'use client';

import { useEffect, useState } from 'react';
import UserManagement from '../../components/lguDashboard/users';

export default function SuperadminDirectPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set superadmin access mode immediately
    localStorage.setItem('superadminDirectAccess', 'true');
    localStorage.setItem('superadminUser', JSON.stringify({ username: 'Superadmin', role: 'superadmin' }));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Accessing LGU Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f9] p-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 text-sm mt-1">Superadmin Direct Access Mode</p>
          </div>
          <div className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold">
            SUPERADMIN ACCESS
          </div>
        </div>
        <UserManagement />
      </div>
    </div>
  );
}
