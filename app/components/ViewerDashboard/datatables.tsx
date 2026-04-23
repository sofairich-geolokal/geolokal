"use client";

import { useState } from "react";

const Datatables = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Display the three main layers data - 5 rows per category
  const allData = [
    // Administrative Boundaries - 5 entries
    {
      location: 'Administrative Boundaries - Route 1',
      population: 45000,
      households: 9000,
      povertyRate: '15.2%',
      employmentRate: '78.5%',
      status: 'Good',
      agency: 'NAMRIA',
      category: 'DRRM',
      layerType: 'boundary',
      opacity: 80,
      downloadable: 'Yes',
      latitude: 13.7421,
      longitude: 121.1089
    },
    {
      location: 'Administrative Boundaries - Route 2',
      population: 42000,
      households: 8400,
      povertyRate: '16.8%',
      employmentRate: '76.2%',
      status: 'Good',
      agency: 'NAMRIA',
      category: 'DRRM',
      layerType: 'boundary',
      opacity: 80,
      downloadable: 'Yes',
      latitude: 13.7550,
      longitude: 121.1250
    },
    {
      location: 'Administrative Boundaries - Route 3',
      population: 38000,
      households: 7600,
      povertyRate: '18.5%',
      employmentRate: '74.8%',
      status: 'Moderate',
      agency: 'NAMRIA',
      category: 'DRRM',
      layerType: 'boundary',
      opacity: 80,
      downloadable: 'Yes',
      latitude: 13.7300,
      longitude: 121.0950
    },
    {
      location: 'Administrative Boundaries - Route 4',
      population: 41000,
      households: 8200,
      povertyRate: '17.2%',
      employmentRate: '75.9%',
      status: 'Good',
      agency: 'NAMRIA',
      category: 'DRRM',
      layerType: 'boundary',
      opacity: 80,
      downloadable: 'Yes',
      latitude: 13.7480,
      longitude: 121.1180
    },
    {
      location: 'Administrative Boundaries - Route 5',
      population: 39000,
      households: 7800,
      povertyRate: '19.1%',
      employmentRate: '73.5%',
      status: 'Moderate',
      agency: 'NAMRIA',
      category: 'DRRM',
      layerType: 'boundary',
      opacity: 80,
      downloadable: 'Yes',
      latitude: 13.7350,
      longitude: 121.1020
    },
    // Road Networks - 5 entries
    {
      location: 'Road Networks - Route 1',
      population: 32000,
      households: 6400,
      povertyRate: '18.7%',
      employmentRate: '75.2%',
      status: 'Moderate',
      agency: 'DPWH',
      category: 'Infrastructure',
      layerType: 'road',
      opacity: 90,
      downloadable: 'Yes',
      latitude: 14.5995,
      longitude: 120.9842
    },
    {
      location: 'Road Networks - Route 2',
      population: 35000,
      households: 7000,
      povertyRate: '17.5%',
      employmentRate: '76.8%',
      status: 'Good',
      agency: 'DPWH',
      category: 'Infrastructure',
      layerType: 'road',
      opacity: 90,
      downloadable: 'Yes',
      latitude: 14.6100,
      longitude: 120.9950
    },
    {
      location: 'Road Networks - Route 3',
      population: 29000,
      households: 5800,
      povertyRate: '20.3%',
      employmentRate: '72.1%',
      status: 'Moderate',
      agency: 'DPWH',
      category: 'Infrastructure',
      layerType: 'road',
      opacity: 90,
      downloadable: 'Yes',
      latitude: 14.5880,
      longitude: 120.9730
    },
    {
      location: 'Road Networks - Route 4',
      population: 31000,
      households: 6200,
      povertyRate: '19.6%',
      employmentRate: '73.9%',
      status: 'Moderate',
      agency: 'DPWH',
      category: 'Infrastructure',
      layerType: 'road',
      opacity: 90,
      downloadable: 'Yes',
      latitude: 14.5950,
      longitude: 120.9800
    },
    {
      location: 'Road Networks - Route 5',
      population: 33000,
      households: 6600,
      povertyRate: '18.2%',
      employmentRate: '74.5%',
      status: 'Good',
      agency: 'DPWH',
      category: 'Infrastructure',
      layerType: 'road',
      opacity: 90,
      downloadable: 'Yes',
      latitude: 14.6050,
      longitude: 120.9900
    },
    // Waterways - 5 entries
    {
      location: 'Waterways - Route 1',
      population: 28000,
      households: 5600,
      povertyRate: '22.1%',
      employmentRate: '71.8%',
      status: 'Moderate',
      agency: 'DENR',
      category: 'Environmental',
      layerType: 'waterway',
      opacity: 70,
      downloadable: 'Yes',
      latitude: 13.4124,
      longitude: 122.5619
    },
    {
      location: 'Waterways - Route 2',
      population: 26000,
      households: 5200,
      povertyRate: '24.5%',
      employmentRate: '69.2%',
      status: 'Bad',
      agency: 'DENR',
      category: 'Environmental',
      layerType: 'waterway',
      opacity: 70,
      downloadable: 'Yes',
      latitude: 13.4250,
      longitude: 122.5750
    },
    {
      location: 'Waterways - Route 3',
      population: 30000,
      households: 6000,
      povertyRate: '20.8%',
      employmentRate: '73.5%',
      status: 'Moderate',
      agency: 'DENR',
      category: 'Environmental',
      layerType: 'waterway',
      opacity: 70,
      downloadable: 'Yes',
      latitude: 13.4000,
      longitude: 122.5480
    },
    {
      location: 'Waterways - Route 4',
      population: 27000,
      households: 5400,
      povertyRate: '23.2%',
      employmentRate: '70.8%',
      status: 'Moderate',
      agency: 'DENR',
      category: 'Environmental',
      layerType: 'waterway',
      opacity: 70,
      downloadable: 'Yes',
      latitude: 13.4180,
      longitude: 122.5550
    },
    {
      location: 'Waterways - Route 5',
      population: 29000,
      households: 5800,
      povertyRate: '21.7%',
      employmentRate: '72.4%',
      status: 'Moderate',
      agency: 'DENR',
      category: 'Environmental',
      layerType: 'waterway',
      opacity: 70,
      downloadable: 'Yes',
      latitude: 13.4080,
      longitude: 122.5680
    }
  ];
  
  const itemsPerPage = 15;
  const totalItems = allData.length;

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
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Agency
                </th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Category
                </th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Layer Type
                </th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Opacity
                </th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Downloadable
                </th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Latitude
                </th>
                <th className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
                  Longitude
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item, index) => (
                <tr key={item.location} className={index % 2 === 0 ? "bg-white border-b border-gray-100" : "bg-blue-50 border-b border-gray-100"}>
                  <td className="px-6 py-2 text-sm text-gray-900 font-medium">
                    {item.location}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.population.toLocaleString()}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.households.toLocaleString()}
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
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.agency}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.category}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.layerType}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.opacity}%
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.downloadable}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.latitude.toFixed(4)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600">
                    {item.longitude.toFixed(4)}
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