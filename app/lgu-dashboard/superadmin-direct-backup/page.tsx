'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserManagement from '../../components/lguDashboard/users';

export default function SuperadminDirectAccess() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSuperadminAccess = async () => {
      try {
        // Check if user is superadmin without requiring authentication
        const response = await fetch('/api/superadmin/direct-access', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Access denied');
        }

        const data = await response.json();
        
        if (data.success) {
          // Set superadmin access mode
          localStorage.setItem('superadminDirectAccess', 'true');
          localStorage.setItem('superadminUser', JSON.stringify(data.superadmin));
          setLoading(false);
        } else {
          setError(data.error || 'Access denied');
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to access LGU dashboard');
        setLoading(false);
      }
    };

    checkSuperadminAccess();
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <p className="font-medium">Access Denied</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <UserManagement />;
}
