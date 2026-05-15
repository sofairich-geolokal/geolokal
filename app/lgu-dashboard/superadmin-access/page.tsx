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

        // Define the LGU user context expected by UserManagement
        const mockLGUUser = {
          id: userId,
          username: 'LGU Administrator',
          location: 'Ibaan',
          role: 'lgu'
        };
        
        // Essential keys used by UserManagement for API headers
        localStorage.setItem('tempLGUUser', JSON.stringify(mockLGUUser));
        localStorage.setItem('superadminAccess', 'true');
        localStorage.setItem('superadminDirectAccess', 'false'); // Ensure direct mode is off
        
        setLguUserId(userId);
        
        // Update UI elements for the wrapper dashboard layout
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

  // Global Fetch Interceptor to ensure ALL underlying components
  // use the correct Superadmin-to-LGU headers.
  useEffect(() => {
    if (!lguUserId) return;

    const originalFetch = window.fetch;
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      // Only intercept internal API calls
      if (typeof input === 'string' && input.includes('/api/')) {
        const headers = new Headers(init?.headers || {});
        
        // Apply the same logic found in UserManagement fetch calls
        headers.set('Content-Type', 'application/json');
        headers.set('x-lgu-user-id', lguUserId);
        
        // Handle specific route redirections for Superadmin views
        let url = input;
        if (input.includes('/api/stats/sources')) {
          url = '/api/stats/sources-superadmin';
        }
        
        // If UserManagement calls /api/users/stats, ensure it carries the ID
        // The headers set above handle this.
        
        return originalFetch(url, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Initializing LGU Access Tier...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white border border-red-200 text-red-700 px-8 py-6 rounded-2xl shadow-sm text-center">
            <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-bold text-lg">Access Denied</p>
            <p className="text-sm mt-2 opacity-80">{error}</p>
            <button 
              onClick={() => router.back()}
              className="mt-6 w-full bg-gray-900 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-black transition-all"
            >
              Return to Superadmin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Once loading is finished and LGU context is set in LocalStorage,
  // UserManagement will mount and its own useEffects will trigger,
  // using the fetch interceptor or the localStorage logic we set up.
  return (
    <div className="min-h-screen bg-white">
      <UserManagement />
    </div>
  );
}