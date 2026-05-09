'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/components/lguDashboard/Sidebar';
import { getUserData, getAuthUser } from '@/lib/auth';
import TitleSetter from '@/app/components/TitleSetter';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if superadmin access is enabled
        const isSuperadminAccess = localStorage.getItem('superadminAccess') === 'true' || 
                                  localStorage.getItem('superadminDirectAccess') === 'true';

        if (isSuperadminAccess) {
          // Get LGU user data from localStorage when superadmin is accessing
          const tempLGUUser = localStorage.getItem('tempLGUUser');
          if (tempLGUUser) {
            const lguUser = JSON.parse(tempLGUUser);
            setUserData({
              username: lguUser.username || 'LGU Admin',
              location: lguUser.location || 'Ibaan',
              role: lguUser.role || 'lgu'
            });
          } else {
            // Fallback to mock data
            setUserData({
              username: 'LGU Admin',
              location: 'Ibaan',
              role: 'lgu'
            });
          }
        } else {
          // For normal routes, use mock data for now to avoid auth issues
          setUserData({
            username: 'LGU User',
            location: 'Ibaan',
            role: 'lgu'
          });
        }
      } catch (error) {
        console.error('Access check failed:', error);
        // Fallback to mock data
        setUserData({
          username: 'Superadmin',
          location: 'Ibaan',
          role: 'superadmin'
        });
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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