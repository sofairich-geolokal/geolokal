"use client";
import { ChevronRight, Settings, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getTopbarData, getCurrentUser } from "@/app/actions/topbar";

export default function Topbar() {
  const [data, setData] = useState({ username: "Loading...", location: "...", role: "" });
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUserId = await getCurrentUser();
        if (currentUserId) {
          setUserId(Number(currentUserId));
          const result = await getTopbarData(currentUserId);
          setData(result);
        } else {
          setData({ username: 'Guest', location: 'N/A', role: 'Viewer' });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setData({ username: 'Error', location: 'Failed to load', role: '' });
      }
    }
    loadUserData();
  }, []);

  // Helper to color code roles based on your GeoLokal theme
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-600/20 text-red-500';
      case 'LGU': return 'bg-orange-600/20 text-orange-500';
      case 'Editor': return 'bg-blue-600/20 text-blue-500';
      default: return 'bg-gray-600/20 text-gray-500';
    }
  };

  return (
    <header className="bg-[#1A1A1A] text-white py-4 px-8 flex justify-between items-center border-b border-gray-800">
      {/* Dynamic Breadcrumbs with Role */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Dashboard</span>
        <ChevronRight size={14} />
        <span>User</span>
        <ChevronRight size={14} />
        <span className="text-white font-medium capitalize">LGU</span> 
      </div>

      {/* User Info on Right Side */}
      <div className="text-right">
        <div style={{ display: 'inline-block' }}>
          <p className="text-sm text-white" 
          style={{ display: 'inline', marginRight: '8px' }}>
            <b>Username: </b>{data.username}
          </p>
          <p 
            className="text-sm text-white"
            style={{ display: 'inline' }}
          >
            <b>Location: </b>{data.location}
          </p>
        </div>
      </div>
    </header>
  );
}