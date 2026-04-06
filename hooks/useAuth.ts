'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();

  useEffect(() => {
    // Check for auth token on client side
    const checkAuth = () => {
      const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      if (!authToken) {
        router.push('/lgu-login');
        return false;
      }
      return true;
    };

    // Check auth immediately
    if (!checkAuth()) {
      return;
    }

    // Set up periodic auth check (every 30 seconds)
    const interval = setInterval(checkAuth, 30000);

    return () => clearInterval(interval);
  }, [router]);

  return true;
}
