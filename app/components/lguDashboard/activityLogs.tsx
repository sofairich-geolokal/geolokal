"use client";

import React, { useState } from 'react';

interface AuditLog {
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

const initialData: AuditLog[] = [
  { timestamp: "Feb 2, 2026 08:00 AM", actor: "Ibaan, Admin", action: "USER_CREATE", details: "Created viewer test (testmail@g.vm)" },
  { timestamp: "Feb 11, 2026 08:50 AM", actor: "Ibaan, Admin", action: "USER_CREATE", details: "Created viewer 123 (123@dfs.mm)" },
  { timestamp: "Feb 13, 2026 09:20 AM", actor: "Ibaan, Admin", action: "RESET_DEMO", details: "Reset users and audit logs" },
  { timestamp: "Jan 10, 2026 10:40 AM", actor: "Ibaan, Admin", action: "USER_UPDATE", details: "Reset users and audit logs" },
  { timestamp: "Jan 14, 2026 10:40 AM", actor: "Ibaan, Admin", action: "USER_UPDATE", details: "Reset users and audit logs" },
  { timestamp: "Jan 13, 2026 10:40 AM", actor: "Ibaan, Admin", action: "USER_UPDATE", details: "Reset users and audit logs" },
  { timestamp: "Jan 12, 2026 11:00 AM", actor: "Ibaan, Admin", action: "USER_DELETE", details: "Reset users and audit logs" },
];

const ActivityLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>(initialData);

  // Function to handle CSV Export
  const exportToCSV = () => {
    if (logs.length === 0) return;

    const headers = ["Timestamp", "Actor", "Action", "Details"];
    const csvContent = [
      headers.join(","), 
      ...logs.map(log => `${log.timestamp},${log.actor},${log.action},"${log.details.replace(/"/g, '""')}"`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "audit_logs.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to clear (hide) records
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="w-full font-sans p-6 bg-white">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black mb-1">Audit Logs</h1>
          <p className="text-gray-600 text-[15px]">
            Logs are written on <span className="ml-1">create user, clear user, and reset demo.</span>
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={exportToCSV}
            className="bg-[#cc7a00] hover:bg-[#b36b00] text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
            disabled={logs.length === 0}
          >
            Export CSV
          </button>
          <button 
            onClick={clearLogs}
            className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#f8f9fc] rounded-3xl overflow-hidden border border-gray-100 shadow-sm min-h-[200px] flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-800 font-bold text-[15px]">
                <th className="px-6 py-5">Timestamp</th>
                <th className="px-6 py-5">Actor</th>
                <th className="px-6 py-5">Action</th>
                <th className="px-6 py-5">Details</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <tr 
                    key={index} 
                    className={`${index % 2 === 0 ? 'bg-[#eeeffc]' : 'bg-transparent'} text-gray-700`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-6 py-4">{log.actor}</td>
                    <td className="px-6 py-4 font-medium">{log.action}</td>
                    <td className="px-6 py-4">{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;