'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ViewerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to location selection page
    router.push('/viewerDashboard/location-selection');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#318855]"></div>
    </div>
  );
}
