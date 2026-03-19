"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Added useRouter
import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter(); // Initialize router

  const navItems = [
    { name: "Dashboard", href: "/viewerDashboard/dashboard", icon: "/icons/dashboard.png" },
    { name: "Data Tables", href: "/viewerDashboard/datatables", icon: "/icons/maintenance.png" },
     { name: "Maps", href: "/viewerDashboard/map", icon: "/icons/map.png" },
    //  { name: "Upload Files", href: "/viewerDashboard/upload", icon: "/icons/map.png" },
    ];

  // Logout handler
  const handleLogout = () => {
    // If you use cookies or local storage for auth, clear them here
    // localStorage.removeItem('token'); 
    // Redirect to login page
    router.push("/viewerDashboard/viewerlogin"); 
  };
  return (
    <aside className="w-[200px] bg-white text-black flex flex-col h-screen p-2 shrink-0 border-r border-gray-300">
      {/* LGU Circular Logo */}
      <div className="flex justify-center pt-2 pb-4">
        <div className="w-30 h-30 relative">
          <Image 
            src="/images/logolg.png" 
            alt="Ibaan LGU Logo" 
            fill
            className="object-contain"
            priority 
          />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 mb-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-2 rounded-2xl transition-all
                  duration-300 ${
                isActive 
                  ? "bg-[#318855] text-white font-bold" 
                  : "text-black hover:text-white hover:bg-[#318855]"
              }`}
            >
              <div className="relative w-4 h-4 brightness-0 invert">
                <Image src={item.icon} alt={item.name} fill className="object-contain" />
              </div>
              <span className="text-sm tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* High-Impact Quick Links Section
      <div className="bg-[#BF7004] text-white rounded-2xl 
        px-4 py-2 space-y-4 overflow-y-auto">
        <SidebarSection 
          title="DRRM" 
          icon="/icons/valley.png" 
          items={["Hazards", "Critical Facilities"]} 
        />
        <SidebarSection 
          title="Land Use" 
          icon="/icons/maps.png" 
          items={["CLUP", "Zoning", "Basemaps"]} 
        />
        <SidebarSection 
          title="Interactive Maps" 
          icon="/icons/placeholder.png" 
          items={["Leaflet Viewer"]} 
        />
      </div> */}

      {/* High-Contrast Logout */}
      <div className="mt-auto">
        <button 
          onClick={handleLogout} // Added click handler
          className="w-full bg-[#E53E3E] py-2 rounded-2xl text-sm text-white hover:bg-red-700 transition-colors active:scale-95"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

const SidebarSection = ({ title, icon, items }: { title: string; icon: string; items: string[] }) => {
  const [isOpen, setIsOpen] = useState(true); // Default open to match the image view

  return (
    <div className="w-full">
      <div className="flex items-center space-x-3 mb-0">
        <div className="relative w-4 h-4 brightness-0 invert">
          <Image src={icon} alt={title} fill className="object-contain" />
        </div>
        <h3 className="font-extrabold text-sm tracking-tighter pb-1">{title}</h3>
      </div>
      <ul className="ml-7 space-y-1">
        {items.map((item) => (
          <li 
            key={item} 
            className="text-sm font-medium text-white/90 cursor-pointer hover:text-white transition-colors"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;