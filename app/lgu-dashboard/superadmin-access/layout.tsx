import React from 'react';
import TitleSetter from '@/app/components/TitleSetter';

export default function SuperadminAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For superadmin access, we'll get user data from localStorage on the client side
  // This bypasses the normal authentication requirement
  
  return (
    <>
      <TitleSetter title="LGU Portal - Superadmin Access" />
      <div className="flex h-screen bg-[#f3f4f9] overflow-hidden">
        {/* 1. Sidebar - Fixed width, high contrast */}
        

        {/* 2. Main Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          
         

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
