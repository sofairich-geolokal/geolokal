import React from 'react';
import Sidebar from '@/app/components/lguDashboard/Sidebar';
import { requireLguRole, getUserData } from '@/lib/auth';
import TitleSetter from '@/app/components/TitleSetter';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication and enforce LGU role
  const userData = await requireLguRole();

  return (
    <>
      <TitleSetter title="LGU Portal" />
      <div className="flex h-screen bg-[#f3f4f9] overflow-hidden">
        {/* 1. Sidebar - Fixed width, high contrast */}
        <Sidebar />

        {/* 2. Main Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* 3. Top Header / Breadcrumbs Section */}
          <header className="h-16 bg-[#1C1C1C] flex items-center justify-between px-8 
          border-b border-gray-200 shadow-sm shrink-0">
            <div className="flex items-center space-x-2 text-sm text-white ">
              <span>Dashboard</span>
              <span className="text-white">/</span>
              <span>User</span>
              <span className="text-white">/</span>
              <span className="text-white font-normal capitalize">LGU</span>
              <span className="text-white">/</span>
              <span className="text-white font-normal capitalize">{userData?.username || 'Admin'}</span>
            </div>
            
            <div className="flex items-center space-x-8 text-sm capitalize text-white">
              <p>
                <span className="font-bold capitalize">Username:</span> {userData?.username || 'Unknown User'}
              </p>
              <p>
                <span className="font-bold capitalize">Location:</span> {userData?.location || 'Not Assigned'}
              </p>
            </div>
          </header>

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