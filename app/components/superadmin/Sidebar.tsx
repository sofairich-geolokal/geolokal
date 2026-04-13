"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Dashboard", href: "/superadmin/dashboard", icon: "/icons/dashboard.png" },
    { name: "Users Management", href: "/superadmin/users", icon: "/icons/maintenance.png" },
    { name: "Audit Logs", href: "/superadmin/audit", icon: "/icons/audit.png" },
    //{ name: "Projects", href: "/superadmin/projects", icon: "/icons/spatial.png" },
    //{ name: "Maps", href: "/superadmin/maps", icon: "/icons/map.png" },
  ];

  // Logout handler
  const handleLogout = () => {
    router.push("/superadmin/login"); 
  };

  return (
    <aside className="w-[200px] bg-[#112E57] text-white flex flex-col h-screen p-2 shrink-0">
      {/* Superadmin Circular Logo */}
      <div className="flex justify-center pt-2 pb-4">
        <div className="w-20 h-20 relative">
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
                  ? "bg-[#BF7004] text-white font-bold" 
                  : "text-white hover:text-orange-400"
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

      {/* High-Contrast Logout */}
      <div className="mt-auto">
        <button 
          onClick={handleLogout}
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