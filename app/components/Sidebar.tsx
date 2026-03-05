"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/lgu-dashboard/dashboard", icon: "/icons/dashboard.png" },
    { name: "Users Management", href: "/lgu-dashboard/users", icon: "/icons/maintenance.png" },
    { name: "Audit Logs", href: "/lgu-dashboard/audit", icon: "/icons/audit.png" },
    { name: "Projects", href: "/lgu-dashboard/projects", icon: "/icons/spatial.png" },
    { name: "Maps", href: "/lgu-dashboard/maps", icon: "/icons/map.png" },
  ];

  return (
    <aside className="w-[280px] bg-black text-white flex flex-col h-screen p-4 shrink-0 font-sans">
      {/* LGU Circular Logo */}
      <div className="flex justify-center pt-4 pb-10">
        <div className="w-24 h-24 relative">
          <Image 
            src="/logo.png" 
            alt="Ibaan LGU Logo" 
            fill 
            className="object-contain"
            priority 
          />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-2 mb-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? "bg-[#BF7004] text-white font-bold" 
                  : "text-white hover:text-orange-400"
              }`}
            >
              <div className="relative w-6 h-6 brightness-0 invert">
                <Image src={item.icon} alt={item.name} fill className="object-contain" />
              </div>
              <span className="text-lg tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* High-Impact Quick Links Section */}
      <div className="bg-[#BF7004] text-white rounded-2xl p-4 space-y-8 overflow-y-auto">
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
      </div>

      {/* High-Contrast Logout */}
      <div className="mt-auto pt-8">
        <button className="w-full bg-[#E53E3E] py-4 rounded-2xl font-bold text-xl text-white hover:bg-red-700 transition-colors active:scale-95">
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
      <div className="flex items-center space-x-4 mb-3">
        <div className="relative w-4 h-4 brightness-0 invert">
          <Image src={icon} alt={title} fill className="object-contain" />
        </div>
        <h3 className="font-extrabold text-xl tracking-tighter">{title}</h3>
      </div>
      <ul className="ml-11 space-y-2">
        {items.map((item) => (
          <li 
            key={item} 
            className="text-lg font-medium text-white/90 cursor-pointer hover:text-white transition-colors"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;