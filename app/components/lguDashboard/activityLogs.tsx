"use client";

import React, { useState, useEffect } from 'react';

interface AuditLog {
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  created_by: string;
  id?: number;
}

const ActivityLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const itemsPerPage = 10; 

  // Mapping dictionary to convert initials to full words
  const actorMap: Record<string, string> = {
    "V": "Viewer",
    "L": "Ibaan LGU",
    "S": "Super Admin"
  };

  // Function to get role display name with brackets
  const getRoleDisplay = (role: string) => {
    const roleName = actorMap[role] || role;
    return `${roleName} [${role}]`;
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        if (!response.ok) throw new Error("Failed to fetch logs");
        const data = await response.json();

        // Debug: Log the raw data from API
        console.log("Raw API data:", data);

        const formattedData = (Array.isArray(data) ? data : []).map((log: any) => ({
          ...log,
          actor: log.actor,
          created_by: log.created_by || log.actor || "System"
        }));

        // Debug: Log the formatted data
        console.log("Formatted data:", formattedData);

        setLogs(formattedData);
      } catch (err) {
        console.error("Audit Connection error:", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "Actor", "Action", "Details", "Created by"];
    const csvContent = [
      headers.join(","), 
      ...logs.map(log => `${log.timestamp},${log.actor},${log.action},"${log.details.replace(/"/g, '""')}",${log.created_by}`)
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

  const clearLogs = async () => {
    try {
      const response = await fetch('/api/logs/clear', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear logs from database');
      }
      
      const result = await response.json();
      console.log(result.message);
      
      // Clear the local state after successful database deletion
      setLogs([]);
    } catch (error: any) {
      console.error('Clear logs error:', error.message);
      alert('Failed to clear logs. Please try again.');
    }
  };

  const toggleLogSelection = (logId: number) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const deleteSelectedLogs = async () => {
    if (selectedLogs.length === 0) {
      alert('Please select at least one log entry to delete.');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedLogs.length} selected log entr${selectedLogs.length > 1 ? 'ies' : 'y'}?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch('/api/logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedLogs })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete selected logs');
      }
      
      const result = await response.json();
      console.log(result.message);
      
      // Remove deleted logs from local state
      setLogs(prev => prev.filter(log => !selectedLogs.includes(log.id || 0)));
      setSelectedLogs([]);
    } catch (error: any) {
      console.error('Delete logs error:', error.message);
      alert('Failed to delete selected logs. Please try again.');
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(logs.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  if (loading) return <div className="p-8 text-center font-bold">Loading System Audit Trail...</div>;

  return (
    <div className="w-full font-sans p-2 sm:p-4 md:p-6 bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start 
      sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-black mb-1">Audit Logs</h1>
          <p className="text-gray-600 text-sm md:text-[15px]">System activity tracking</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2 sm:gap-4">
          <button 
            onClick={exportToCSV}
            className="flex-1 sm:flex-none bg-[#cc7a00] hover:bg-[#b36b00] text-white text-sm font-semibold py-2 px-4 md:px-6 rounded-lg transition-colors disabled:opacity-50"
            disabled={logs.length === 0}
          >
            Export CSV
          </button>
          <button 
            onClick={deleteSelectedLogs}
            className="flex-1 sm:flex-none bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-semibold py-2 px-4 md:px-6 rounded-lg transition-colors disabled:opacity-50"
            disabled={selectedLogs.length === 0}
          >
            Delete Selected ({selectedLogs.length})
          </button>
          <button 
            onClick={clearLogs}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 md:px-6 rounded-lg transition-colors"
          >
            Delete All
          </button>
        </div>
      </div>

      <div className="bg-[#f8f9fc] rounded-2xl overflow-hidden border border-gray-100 
      shadow-sm min-h-[460px] flex flex-col">
        <div className="overflow-x-auto flex-grow">
          <table className="w-full text-left border-collapse min-w-[600px] lg:min-w-full">
            <thead>
              <tr className="text-gray-800 font-bold text-sm md:text-[15px] border-b border-gray-100">
                <th className="px-2 md:px-6 py-3">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLogs(currentLogs.map(log => log.id || 0));
                      } else {
                        setSelectedLogs([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 md:px-6 py-3">Timestamp</th>
                <th className="px-4 md:px-6 py-3">Actor</th>
                <th className="px-4 md:px-6 py-3">Action</th>
                <th className="lg:table-cell px-4 py-3">Details</th>
                <th className="px-4 md:px-6 py-3">Created by</th>
              </tr>
            </thead>
            <tbody className="text-xs md:text-[14px]">
              {currentLogs.length > 0 ? (
                currentLogs.map((log, index) => (
                  <tr 
                    key={index} 
                    className={`${index % 2 === 0 ? 'bg-[#eeeffc]' : 'bg-transparent'} text-gray-700 hover:bg-white/50 transition-colors`}
                  >
                    <td className="px-2 md:px-6 py-2">
                      <input
                        type="checkbox"
                        checked={selectedLogs.includes(log.id || 0)}
                        onChange={() => toggleLogSelection(log.id || 0)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-2 md:px-6 py-2 whitespace-nowrap">{log.timestamp}</td>
                    {/* Displaying the full actor name */}
                    <td className="px-2 md:px-6 py-2 font-bold text-[#2d4369]">{log.actor}</td>
                    <td className="px-2 md:px-6 py-2 font-medium">{log.action}</td>
                    <td className="lg:table-cell px-2 md:px-6 py-2">{log.details}</td>
                    <td className="px-2 md:px-6 py-2 font-medium text-gray-600">{log.created_by}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-4 bg-white border-t border-gray-100 mt-auto gap-4">
          <div className="text-xs md:text-sm text-gray-500 font-medium order-2 md:order-1 text-center md:text-left">
            Showing <span className="text-black">{indexOfFirstItem + 1}</span> to <span className="text-black">{Math.min(indexOfLastItem, logs.length)}</span> of <span className="text-black">{logs.length}</span> entries
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 order-1 md:order-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#eeeffc] text-[#2d4369] hover:bg-[#2d4369] hover:text-white'
              }`}
            >
              Prev
            </button>
            <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`min-w-[32px] h-8 flex items-center justify-center text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                    currentPage === i + 1 ? 'bg-[#2d4369] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#eeeffc] hover:text-[#2d4369]'
                    }`}
                >
                    {i + 1}
                </button>
                ))}
            </div>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#eeeffc] text-[#2d4369] hover:bg-[#2d4369] hover:text-white'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;