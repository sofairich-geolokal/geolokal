"use client";

import { useState } from "react";

const Datatables = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 13;
  const totalItems = 13; // Simulated total items for pagination
  
  // Generate sample data for all pages
  const allData = Array.from({ length: totalItems }, (_, i) => ({
    location: `Barangay ${(i + 1).toString().padStart(2, '0')}`,
    population: Math.floor(Math.random() * 3000) + 1000,
    households: Math.floor(Math.random() * 500) + 200,
    povertyRate: (Math.random() * 10 + 10).toFixed(1) + '%',
    employmentRate: (Math.random() * 15 + 80).toFixed(1) + '%',
    status: i % 3 === 0 ? 'Good' : i % 3 === 1 ? 'Moderate' : 'Bad'
  }));

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = allData.slice(indexOfFirstItem, indexOfLastItem);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Good': return 'text-green-600';
      case 'Moderate': return 'text-orange-600';
      case 'Bad': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col  bg-white">
      {/* Data Table Card */}
      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto h-auto">
          <table className="min-w-full">
            <thead className="font-bold">
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Location
                </th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Population
                </th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Households
                </th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Poverty Rate
                </th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Employment Rate
                </th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item, index) => (
                <tr key={item.location} className={index % 2 === 0 ? "bg-white border-b border-gray-100" : "bg-blue-50 border-b border-gray-100"}>
                  <td className="px-6 py-2 text-sm text-gray-900">
                    {item.location}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.population.toLocaleString()}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.households}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.povertyRate}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.employmentRate}
                  </td>
                  <td className="px-6 py-2 text-sm">
                    <span className={`font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - Fixed at bottom */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 sticky">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm rounded-md ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === page
                    ? 'bg-[#318855] text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-sm rounded-md ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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

export default Datatables;