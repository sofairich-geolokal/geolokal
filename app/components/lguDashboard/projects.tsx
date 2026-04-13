"use client";

import React, { useState, useEffect } from 'react';
import ProjectCards from './projectCards';
import MapPopup from './MapPopup'; 
import ProjectDetailPopup from './ProjectDetailPopup';
import { Eye, Edit, Trash2, MapPin } from 'lucide-react';

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
  latitude?: number;
  longitude?: number;
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectForMap, setSelectedProjectForMap] = useState<Project | null>(null);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lguRoles, setLguRoles] = useState<string[]>([]);
  const [lguRolesLoading, setLguRolesLoading] = useState(false);

  // Form state for new project
  const [newProject, setNewProject] = useState({
    title: '',
    category: 'Smart City',
    dataTypes: 'Raster (GeoTIFF)',
    team: 'Design team',
    accessLevel: 'Public',
    description: ''
  });

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; 

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        
        const cleanDescription = (text: string) => {
          return text.replace(/\[cite:\s*\d+\]/g, '').trim();
        };

        const formattedData = data.map((p: any) => ({
          id: p["Project ID"],
          title: p["Project Title"],
          category: p["Category"],
          description: cleanDescription(p["Details"] || ""),
          dataTypes: p["Data Format"] || "Vector (SHP)", 
          lgu: p["LGU Location"],
          accessLevel: p["Security Level"] || "LGU Restricted",
          lastUpdated: new Date(p["Date Created"]).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          status: p["Current Status"] || 'Draft',
          latitude: p["Lat"] ? parseFloat(p["Lat"]) : undefined,      // Convert to number
          longitude: p["Long"] ? parseFloat(p["Long"]) : undefined     // Convert to number
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

  const fetchLguRoles = async () => {
    setLguRolesLoading(true);
    try {
      const response = await fetch('/api/lgu-roles');
      const data = await response.json();
      setLguRoles(data.roles || []);
    } catch (error) {
      console.error("Failed to fetch LGU roles:", error);
      setLguRoles(['Ibaan', 'Binangonan', 'San Mateo']); // Fallback options
    } finally {
      setLguRolesLoading(false);
    }
  };

  useEffect(() => {
    if (showCreateModal && lguRoles.length === 0) {
      fetchLguRoles();
    }
  }, [showCreateModal]);

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      alert('Please enter a project name');
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newProject.title,
          category: newProject.category,
          dataTypes: newProject.dataTypes,
          team: newProject.team,
          accessLevel: newProject.accessLevel,
          description: newProject.description,
          lgu: 'Default LGU', 
          status: 'Draft' as const
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const createdProject = result.project;
        
        const formattedProject = {
          ...createdProject,
          dataTypes: createdProject.dataTypes || "Vector (SHP)",
          accessLevel: createdProject.accessLevel || "LGU Restricted",
          lastUpdated: new Date().toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        };
        
        setProjects([formattedProject, ...projects]);
        resetForm();
        alert('Project created successfully!');
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleDeleteProject = async (id: number | string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const response = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProjects(projects.filter(p => p.id !== id));
        alert('Project deleted successfully');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const resetForm = () => {
    setNewProject({
      title: '',
      category: 'Smart City',
      dataTypes: 'Raster (GeoTIFF)',
      team: 'Design team',
      accessLevel: 'Public',
      description: ''
    });
    setShowCreateModal(false);
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading GeoLokal Projects...</div>;

  return (
    <div className="w-full font-sans p-6 bg-white relative">
      <ProjectCards />
      
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-black">Projects Management</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold py-2.5 px-6 rounded-lg transition-all"
          >
            Create New Project
          </button>
          <button className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold py-2.5 px-6 rounded-lg transition-all">
            Export Projects Records
          </button>
        </div>
      </div>

      <div className="bg-[#f8f9fc] rounded-3xl overflow-hidden border border-gray-100 
      shadow-sm flex flex-col min-h-[370px]">
        <div className="overflow-x-auto flex-grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-800 font-bold text-[12px]">
                <th className="px-4 py-5 w-[15%]">Project Title</th>
                <th className="px-2 py-5 w-[10%]">Category</th>
                <th className='px-2 py-5 w-[24%]'>Description</th>
                <th className="px-2 py-5 w-[12%]">Data Types</th>
                <th className="px-2 py-5 w-[10%] text-center">Access Level</th>
                <th className="px-2 py-5 w-[12%] text-center">Last Updated</th>
                <th className="px-2 py-5 w-[10%] text-center">Status</th>
                <th className="px-2 py-5 w-[10%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-gray-700">
              {currentProjects.map((project, index) => (
                <tr key={index} className={`${index % 2 === 0 ? 'bg-[#eeeffc]' : 'bg-transparent'} 
                hover:bg-gray-50 transition-colors max-h-[100px]`}>
                  <td className="px-4 py-2 font-normal align-top text-left">{project.title}</td>
                  <td className="px-4 py-2 align-top text-left">{project.category}</td>
                  <td className="px-4 py-2 align-top text-left text-gray-500 line-clamp-4">{project.description || "No description provided"}</td>
                  <td className="px-4 py-2 align-top text-left">{project.dataTypes}</td>
                  <td className="px-4 py-2 align-top text-center">{project.accessLevel}</td>
                  <td className="px-4 py-2 align-top text-center">{project.lastUpdated}</td>
                  <td className="px-2 py-2 align-top text-center">
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold inline-block min-w-[90px] ${getStatusStyle(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 align-top text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => setSelectedProjectForMap(project)}
                        className="p-2 text-white bg-black rounded-full transition-all"
                        title="View Map"
                      >
                        <MapPin size={16} />
                      </button>
                      <button 
                        onClick={() => setSelectedProjectForDetails(project)}
                        className="p-2 text-white bg-green-900 rounded-full transition-all"
                        title="View Project Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="p-2 text-white bg-blue-900 rounded-full transition-all"
                        title="Edit Project"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-2 text-white bg-red-900 rounded-full transition-all"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Footer --- */}
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
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => paginate(index + 1)}
                className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${
                  currentPage === index + 1 ? 'bg-[#2d4369] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#eeeffc] hover:text-[#2d4369]'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#eeeffc] text-[#2d4369] hover:bg-[#2d4369] hover:text-white'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedProjectForMap && (
        <MapPopup 
          project={selectedProjectForMap} 
          onClose={() => setSelectedProjectForMap(null)} 
        />
      )}

      {selectedProjectForDetails && (
        <ProjectDetailPopup 
          project={selectedProjectForDetails} 
          onClose={() => setSelectedProjectForDetails(null)} 
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create new project</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project name
                </label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select 
                  value={newProject.category}
                  onChange={(e) => setNewProject({...newProject, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Smart City</option>
                  <option>Infrastructure</option>
                  <option>Environmental</option>
                  <option>Urban Planning</option>
                  <option>Transportation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Types
                </label>
                <select 
                  value={newProject.dataTypes}
                  onChange={(e) => setNewProject({...newProject, dataTypes: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Raster (GeoTIFF)</option>
                  <option>Vector (SHP)</option>
                  <option>Point Cloud</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a team
                </label>
                <select 
                  value={newProject.team}
                  onChange={(e) => setNewProject({...newProject, team: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Design team</option>
                  <option>Development team</option>
                  <option>QA team</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Level
                </label>
                <select 
                  value={newProject.accessLevel}
                  onChange={(e) => setNewProject({...newProject, accessLevel: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Public</option>
                  <option>LGU Restricted</option>
                  <option>Private</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                  placeholder="Complete project details"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Create project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;