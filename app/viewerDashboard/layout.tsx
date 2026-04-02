'use client';

import React from 'react';
import ViewerSidebar from '@/app/components/ViewerDashboard/sidebar';
import { usePathname } from 'next/navigation';
import TopBar from '../components/ViewerDashboard/topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/viewerDashboard/viewerlogin';
  const isLocationSelectionPage = pathname === '/viewerDashboard/location-selection';

  if (isLoginPage || isLocationSelectionPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#f3f4f9] overflow-hidden">
      {/* 1. Sidebar - Fixed width, high contrast */}
      <ViewerSidebar />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        {/* 4. Scrollable Page Content */}
        <main className={`flex-1 overflow-y-auto p-0 ${pathname.includes('/map') ? 'p-0' : 'p-6'}`}>
          <div className={`${pathname.includes('/map') ? 'h-full w-full' : 'max-w-[1600px] mx-auto'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}