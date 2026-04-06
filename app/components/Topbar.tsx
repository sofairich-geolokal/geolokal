import { ChevronRight } from "lucide-react";

export default function Topbar() {
  return (
    <header className="bg-[#1C1C1C] text-white py-4 px-8 flex justify-between 
    items-center border-b border-gray-800">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-white">
        <span>Dashboard</span>
        <ChevronRight size={14} />
        <span>User</span>
        <ChevronRight size={14} />
        <span className="text-white">Ibaan Admin</span>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-white-400">User: </span>
          <span className="font-semibold text-white">Ibaan Admin</span>
        </div>
        <div>
          <span className="text-white-400">LGU: </span>
          <span className="font-semibold text-white">Ibaan, Batangas</span>
        </div>
      </div>
    </header>
  );
}