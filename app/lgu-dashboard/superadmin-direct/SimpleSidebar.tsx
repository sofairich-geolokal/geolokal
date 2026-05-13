"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

const SimpleSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/lgu-dashboard/dashboard", icon: "/icons/dashboard.png" },
    { name: "Users Management", href: "/lgu-dashboard/users", icon: "/icons/maintenance.png" },
    { name: "Audit Logs", href: "/lgu-dashboard/audit", icon: "/icons/audit.png" },
    { name: "Projects", href: "/lgu-dashboard/projects", icon: "/icons/spatial.png" },
    { name: "Maps", href: "/lgu-dashboard/maps", icon: "/icons/map.png" },
    { name: "Upload Shapefiles", href: "/lgu-dashboard/upload", icon: "/icons/placeholder.png" },
  ];

  return (
    <div className="w-64 bg-[#1C1C1C] text-white flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Image
            src="/images/logolg.png"
            alt="LGU Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-xl font-bold">LGU Portal</h1>
            <p className="text-xs text-gray-400">Superadmin Access</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <Image
                    src={item.icon}
                    alt={item.name}
                    width={20}
                    height={20}
                  />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-700">
        <div className="bg-yellow-500 text-black px-3 py-2 rounded-lg text-center">
          <p className="text-xs font-medium">Superadmin Mode</p>
          <p className="text-xs">Read-Only Access</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleSidebar;
