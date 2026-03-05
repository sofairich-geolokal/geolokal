"use client";

import React, { useState } from 'react';
import ProjectCards from './projectCards';

interface Project {
  title: string;
  category: string;
  dataTypes: string;
  lgu: string;
  accessLevel: string;
  lastUpdated: string;
  status: 'In Progress' | 'Published' | 'Syncing' | 'Draft' | 'Failed';
  link: string;
}

const initialProjects: Project[] = [
  { title: "Comprehensive Land", category: "Land Use", dataTypes: "Vector (Shapefile)", lgu: "Ibaan, Batangas", accessLevel: "LGU Restricted", lastUpdated: "Feb 2, 2026 08:00 AM", status: "In Progress", link: "#" },
  { title: "Hazard Susceptibility", category: "DRRM", dataTypes: "Raster (GeoTIFF)", lgu: "Ibaan, Batangas", accessLevel: "Public", lastUpdated: "Feb 11, 2026 08:50 AM", status: "Published", link: "#" },
  { title: "Property Tax Parcels", category: "Revenue", dataTypes: "Vector (GPKG)", lgu: "Ibaan, Batangas", accessLevel: "Private", lastUpdated: "Feb 13, 2026 09:20 AM", status: "Syncing", link: "#" },
  { title: "Socio-Economic CBMS", category: "Socio Economics", dataTypes: "Document (CSV/PDF)", lgu: "Ibaan, Batangas", accessLevel: "LGU Restricted", lastUpdated: "Jan 10, 2026 10:40 AM", status: "Draft", link: "#" },
  { title: "Infrastructure Map", category: "Smart City", dataTypes: "Vector (Shapefile)", lgu: "Ibaan, Batangas", accessLevel: "Private", lastUpdated: "Jan 12, 2026 11:00 AM", status: "Failed", link: "#" },
];

const ProjectManagement = () => {
  const [projects] = useState<Project[]>(initialProjects);

  // Helper to render status badges with correct colors
  const getStatusStyle = (status: Project['status']) => {
    switch (status) {
      case 'In Progress': return 'bg-[#1a1a1a] text-white';
      case 'Published': return 'bg-[#d97706] text-white';
      case 'Syncing': return 'bg-[#f59e0b] text-white';
      case 'Draft': return 'bg-[#facc15] text-black';
      case 'Failed': return 'bg-[#ef4444] text-white';
      default: return 'bg-gray-200';
    }
  };

  const exportRecords = () => {
    const headers = ["Project Title", "Category", "Data Types", "LGU", "Access Level", "Last Updated", "Status"];
    const csvContent = [
      headers.join(","),
      ...projects.map(p => `"${p.title}","${p.category}","${p.dataTypes}","${p.lgu}","${p.accessLevel}","${p.lastUpdated}","${p.status}"`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "project_records.csv";
    link.click();
  };

  return (
    <div className="w-full font-sans p-6 bg-white">
      <ProjectCards />
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-black">Projects Management</h1>
        <button 
          onClick={exportRecords}
          className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold py-2.5 px-6 rounded-lg transition-all"
        >
          Export Projects Records
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-[#f8f9fc] rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-800 font-bold text-[14px]">
                <th className="px-2 py-5">Project Title</th>
                <th className="px-2 py-5">Category</th>
                <th className="px-2 py-5">Data Types</th>
                <th className="px-2 py-5">LGU</th>
                <th className="px-2 py-5">Access Level</th>
                <th className="px-2 py-5">Last Updated</th>
                <th className="px-2 py-5">Status</th>
                <th className="px-2 py-5">Link</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-gray-700">
              {projects.map((project, index) => (
                <tr 
                  key={index} 
                  className={`${index % 2 === 0 ? 'bg-[#eeeffc]' : 'bg-transparent'}`}
                >
                  <td className="px-2 py-4 font-medium max-w-[150px]">{project.title}</td>
                  <td className="px-2 py-4">{project.category}</td>
                  <td className="px-2 py-4">{project.dataTypes}</td>
                  <td className="px-2 py-4">{project.lgu}</td>
                  <td className="px-2 py-4">{project.accessLevel}</td>
                  <td className="px-2 py-4 whitespace-nowrap">{project.lastUpdated}</td>
                  <td className="px-2 py-4">
                    <span className={`px-4 py-1.5 rounded-full text-[12px] font-bold inline-block min-w-[100px] text-center ${getStatusStyle(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-2 py-4">
                    <button className="bg-[#2d4369] hover:bg-[#1e2e4a] text-white px-4 py-1.5 rounded-full font-bold text-[12px] transition-colors whitespace-nowrap">
                      Open Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagement;