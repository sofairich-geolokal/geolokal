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

        // Store the LGU user context immediately without API call for faster access
        const mockLGUUser = {
          id: userId,
          username: 'LGU User',
          location: 'Ibaan',
          role: 'lgu'
        };
        
        localStorage.setItem('tempLGUUser', JSON.stringify(mockLGUUser));
        localStorage.setItem('superadminAccess', 'true');
        setLguUserId(userId);
        
        // Update UI elements immediately
        const usernameElements = document.querySelectorAll('#superadmin-username, #superadmin-username-display');
        const locationElement = document.querySelector('#superadmin-location-display');
        
        usernameElements.forEach(el => {
          if (el) el.textContent = mockLGUUser.username || 'Unknown User';
        });
        
        if (locationElement) {
          locationElement.textContent = mockLGUUser.location || 'Not Assigned';
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to access LGU dashboard');
        setLoading(false);
      }
    };

    accessLGUDashboard();
  }, [searchParams]);

  // Add fetch interceptor for API calls
  useEffect(() => {
    if (!lguUserId) return;

    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === 'string' && input.includes('/api/')) {
        // Add LGU user context to API calls
        const headers = new Headers(init?.headers);
        headers.set('x-lgu-user-id', lguUserId);
        
        // Redirect to superadmin-specific endpoints if they exist
        let url = input;
        if (input.includes('/api/stats/sources')) {
          url = '/api/stats/sources-superadmin';
        }
        
        return originalFetch(url, {
          ...init,
          headers: headers
        });
      }
      return originalFetch(input, init);
    };

    return () => {
      // Restore original fetch
      window.fetch = originalFetch;
    };
  }, [lguUserId]);

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
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={() => router.back()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lguUserId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg">
            <p className="font-medium">No User Context</p>
            <p className="text-sm mt-1">Unable to determine LGU user context</p>
          </div>
        </div>
      </div>
    );
  }

  return <UserManagement />;
}
