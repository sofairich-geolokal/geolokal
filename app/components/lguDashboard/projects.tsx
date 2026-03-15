"use client";

import React, { useState, useEffect } from 'react';
import ProjectCards from './projectCards';
import MapPopup from './MapPopup'; // Import our new component

interface Project {
  id: number | string;
  title: string;
  category: string;
  description: string;
  dataTypes: string; 
  lgu: string;
  accessLevel: string; 
  lastUpdated: string;
  status: 'In Progress' | 'Published' | 'Syncing' | 'Draft' | 'Failed';
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; 

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        
        const formattedData = data.map((p: any) => ({
          ...p,
          dataTypes: p.dataTypes || "Vector (SHP)", 
          accessLevel: p.accessLevel || "LGU Restricted",
          lastUpdated: new Date(p.lastUpdated).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        }));

        setProjects(formattedData);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusStyle = (status: Project['status']) => {
    switch (status) {
      case 'In Progress': return 'bg-[#c36f01] text-white'; 
      case 'Published': return 'bg-[#22c55e] text-white'; 
      case 'Syncing': return 'bg-[#f59e0b] text-white'; 
      case 'Draft': return 'bg-[#FFD700] text-black'; 
      case 'Failed': return 'bg-[#ef4444] text-white'; 
      default: return 'bg-gray-200';
    }
  };

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = projects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(projects.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading GeoLokal Projects...</div>;

  return (
    <div className="w-full font-sans p-6 bg-white relative">
      <ProjectCards />
      
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-black">Projects Management</h1>
        <button className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold py-2.5 px-6 rounded-lg transition-all">
          Export Projects Records
        </button>
      </div>

      {/* Container Changes: 
          1. added 'flex flex-col'
          2. added 'min-h-[450px]' to ensure footer sticks to bottom when rows are few 
      */}
      <div className="bg-[#f8f9fc] rounded-3xl overflow-hidden border border-gray-100 
      shadow-sm flex flex-col min-h-[370px]">
        <div className="overflow-x-auto flex-grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-800 font-bold text-[14px]">
                <th className="px-4 py-5 w-[19%]">Project Title</th>
                <th className="px-2 py-5 w-[10%]">Category</th>
                <th className='px-2 py-5 w-[25%]'>Description</th>
                <th className="px-2 py-5 w-[12%]">Data Types</th>
                <th className="px-2 py-5 w-[8%] text-center">LGU</th>
                <th className="px-2 py-5 w-[12%] text-center">Access Level</th>
                <th className="px-2 py-5 w-[15%] text-center">Last Updated</th>
                <th className="px-2 py-5 w-[10%] text-center">Status</th>
                <th className="px-2 py-5 w-[7%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-gray-700">
              {currentProjects.map((project, index) => (
                <tr key={index} className={`${index % 2 === 0 ? 'bg-[#eeeffc]' : 'bg-transparent'} 
                hover:bg-gray-50 transition-colors max-h-[100px]`}>
                  <td className="px-4 py-2 font-bold align-top text-left">{project.title}</td>
                  <td className="px-4 py-2 align-top text-left">{project.category}</td>
                  <td className="px-4 py-2 align-top text-left text-gray-500">{project.description || "No description provided"}</td>
                  <td className="px-4 py-2 align-top text-left">{project.dataTypes}</td>
                  <td className="px-4 py-2 align-top text-center">{project.lgu}</td>
                  <td className="px-4 py-2 align-top text-center">{project.accessLevel}</td>
                  <td className="px-4 py-2 align-top text-center">{project.lastUpdated}</td>
                  <td className="px-2 py-2 align-top text-center">
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold inline-block min-w-[90px] ${getStatusStyle(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 align-top text-center">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="bg-[#2d4369] hover:bg-[#1e2e4a] text-white px-4 py-2 rounded-full font-bold text-[11px] transition-all whitespace-nowrap"
                    >
                      Open Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Footer --- */}
        {/* 'mt-auto' ensures it pushes to the bottom of the flex container */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-100 mt-auto">
          <div className="text-sm text-gray-500 font-medium">
            Showing <span className="text-black">{indexOfFirstItem + 1}</span> to <span className="text-black">{Math.min(indexOfLastItem, projects.length)}</span> of <span className="text-black">{projects.length}</span> projects
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#eeeffc] text-[#2d4369] hover:bg-[#2d4369] hover:text-white'
              }`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${
                  currentPage === i + 1 ? 'bg-[#2d4369] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#eeeffc] hover:text-[#2d4369]'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#eeeffc] text-[#2d4369] hover:bg-[#2d4369] hover:text-white'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Simplified Map Call */}
      {selectedProject && (
        <MapPopup 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </div>
  );
};

export default ProjectManagement;