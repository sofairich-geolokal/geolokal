import React from 'react';
import Sidebar from '@/app/components/superadmin/Sidebar';
import Topbar from '@/app/components/superadmin/Topbar';
import { requireSuperadminRole } from '@/lib/auth';
import TitleSetter from '@/app/components/TitleSetter';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication and enforce superadmin role
  const userData = await requireSuperadminRole();

  return (
    <>
      <TitleSetter title="Admin Portal" />
      <div className="flex h-screen bg-[#f3f4f9] overflow-hidden">
        {/* 1. Sidebar - Fixed width, high contrast */}
        <Sidebar />

        {/* 2. Main Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* 3. Top Header / Breadcrumbs Section */}
          <Topbar />

          {/* 4. Scrollable Page Content */}
          <main className="flex-1 overflow-y-auto p-0">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}