'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UserManagement from '../../components/lguDashboard/users';

export default function SuperadminAccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lguUserId, setLguUserId] = useState<string | null>(null);

  useEffect(() => {
    const accessLGUDashboard = async () => {
      try {
        const userId = searchParams.get('userId');
        const tempToken = searchParams.get('token');

        if (!userId || !tempToken) {
          setError('Missing required parameters');
          setLoading(false);
          return;
        }

        // Mock LGU user context to satisfy UserManagement's state logic
        const mockLGUUser = {
          id: userId,
          username: 'LGU Administrator',
          location: 'Ibaan',
          role: 'lgu'
        };
        
        // Match the exact keys checked in UserManagement component
        localStorage.setItem('tempLGUUser', JSON.stringify(mockLGUUser));
        localStorage.setItem('superadminAccess', 'true');
        localStorage.setItem('superadminDirectAccess', 'false'); // Explicitly false for LGU-mode
        
        setLguUserId(userId);
        
        // Update shell UI elements if present
        const usernameElements = document.querySelectorAll('#superadmin-username, #superadmin-username-display');
        const locationElement = document.querySelector('#superadmin-location-display');
        
        usernameElements.forEach(el => {
          if (el) el.textContent = mockLGUUser.username;
        });
        
        if (locationElement) {
          locationElement.textContent = mockLGUUser.location;
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to access LGU dashboard');
        setLoading(false);
      }
    };

    accessLGUDashboard();
  }, [searchParams]);

  // Enhanced Fetch Interceptor
  useEffect(() => {
    if (!lguUserId) return;

    const originalFetch = window.fetch;
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (urlStr.includes('/api/')) {
        const headers = new Headers(init?.headers || {});
        
        // Inject the required x-lgu-user-id for the data tier
        headers.set('x-lgu-user-id', lguUserId);
        headers.set('Content-Type', 'application/json');

        // Route redirection for stats or specific superadmin-only logging
        let finalUrl = urlStr;
        if (urlStr.includes('/api/stats/sources')) {
          finalUrl = '/api/stats/sources-superadmin';
        }
        
        return originalFetch(finalUrl, {
          ...init,
          headers: headers
        });
      }
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [lguUserId]);

  if (loading) return <div className="p-10 text-center font-bold">Initializing GeoLokal Data Tier...</div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="bg-white border-2 border-red-100 p-8 rounded-2xl shadow-sm text-center max-w-sm">
          <p className="text-red-600 font-bold text-xl mb-2">Access Denied</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button onClick={() => router.back()} className="w-full bg-black text-white py-3 rounded-xl font-bold">Return</button>
        </div>
      </div>
    );
  }

  return <UserManagement />;
}