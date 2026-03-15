"use client";
import { ChevronRight, Settings, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getTopbarData, getCurrentUser } from "@/app/actions/topbar";

export default function Topbar() {
  const [data, setData] = useState({ username: "Loading...", lgu: "...", role: "" });
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
          setData({ username: 'Guest', lgu: 'N/A', role: 'Viewer' });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setData({ username: 'Error', lgu: 'Failed to load', role: '' });
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
      {/* Dynamic Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>{data.role === 'Admin' ? 'Global System' : 'LGU Portal'}</span>
        <ChevronRight size={14} />
        <span className="text-white font-medium">{data.lgu}</span> 
      </div>

      <div className="flex items-center gap-6 text-sm">
        {/* Role Badge */}
        <div className="flex items-center gap-2">
           <span className="text-gray-400 font-bold">Role: </span>
           <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRoleBadgeColor(data.role)}`}>
             {data.role}
           </span>
        </div>
        
        <div className="h-6 w-px bg-gray-700"></div>

        {/* User Profile Info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-white font-medium leading-none">{data.username}</p>
          </div>
          <UserCircle className="text-gray-400" size={24} />
          {/* Settings icon hidden for Viewers */}
          {data.role !== "Viewer" && (
            <Settings className="text-gray-500 hover:text-white cursor-pointer transition-colors" size={18} />
          )}
        </div>
      </div>
    </header>
  );
}