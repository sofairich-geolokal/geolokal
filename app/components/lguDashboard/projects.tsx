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
  location?: string;
  mapLink?: string;
  embeddedMapLink?: string;
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectForMap, setSelectedProjectForMap] = useState<Project | null>(null);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Project | null>(null);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lguRoles, setLguRoles] = useState<string[]>([]);
  const [lguRolesLoading, setLguRolesLoading] = useState(false);
  const [projectCategories, setProjectCategories] = useState<string[]>([]);
  const [teamOptions, setTeamOptions] = useState<string[]>([]);
  const [dataTypeOptions, setDataTypeOptions] = useState<string[]>([]);
  const [dynamicDataLoading, setDynamicDataLoading] = useState(false);

  // Form state for new project
  const [newProject, setNewProject] = useState({
    title: '',
    category: '',
    dataTypes: '',
    team: '',
    accessLevel: 'Public',
    description: '',
    location: '',
    mapLink: '',
    embeddedMapLink: '',
    status: 'Draft'
  });

  // Form state for editing project
  const [editProject, setEditProject] = useState({
    title: '',
    category: '',
    dataTypes: '',
    team: '',
    accessLevel: 'Public',
    description: '',
    location: '',
    mapLink: '',
    embeddedMapLink: '',
    status: 'Draft'
  });

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  // Fetch dynamic data for dropdowns
  const fetchDynamicData = async () => {
    try {
      setDynamicDataLoading(true);
      
      // Fetch project categories
      const categoriesResponse = await fetch('/api/projects/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        const categories = categoriesData.map((cat: any) => cat.name);
        setProjectCategories(categories);
        
        // Set default category to first available
        if (categories.length > 0 && !newProject.category) {
          setNewProject(prev => ({ ...prev, category: categories[0] }));
          setEditProject(prev => ({ ...prev, category: categories[0] }));
        }
      }

      // Fetch team options (mock data for now, can be made dynamic later)
      const teams = ['Design team', 'Development team', 'QA team', 'Research team', 'Implementation team'];
      setTeamOptions(teams);
      
      if (teams.length > 0 && !newProject.team) {
        setNewProject(prev => ({ ...prev, team: teams[0] }));
        setEditProject(prev => ({ ...prev, team: teams[0] }));
      }

      // Fetch data type options (mock data for now, can be made dynamic later)
      const dataTypes = ['Raster (GeoTIFF)', 'Vector (SHP)', 'Point Cloud', 'CAD (DWG)', 'KML/KMZ'];
      setDataTypeOptions(dataTypes);
      
      if (dataTypes.length > 0 && !newProject.dataTypes) {
        setNewProject(prev => ({ ...prev, dataTypes: dataTypes[0] }));
        setEditProject(prev => ({ ...prev, dataTypes: dataTypes[0] }));
      }
      
    } catch (error) {
      console.error('Error fetching dynamic data:', error);
      // Fallback to hardcoded options
      const fallbackCategories = ['Smart City', 'Infrastructure', 'Environmental', 'Urban Planning', 'Transportation'];
      const fallbackTeams = ['Design team', 'Development team', 'QA team'];
      const fallbackDataTypes = ['Raster (GeoTIFF)', 'Vector (SHP)', 'Point Cloud'];
      
      setProjectCategories(fallbackCategories);
      setTeamOptions(fallbackTeams);
      setDataTypeOptions(fallbackDataTypes);
      
      if (!newProject.category) {
        setNewProject(prev => ({ ...prev, category: fallbackCategories[0] }));
        setEditProject(prev => ({ ...prev, category: fallbackCategories[0] }));
      }
      if (!newProject.team) {
        setNewProject(prev => ({ ...prev, team: fallbackTeams[0] }));
        setEditProject(prev => ({ ...prev, team: fallbackTeams[0] }));
      }
      if (!newProject.dataTypes) {
        setNewProject(prev => ({ ...prev, dataTypes: fallbackDataTypes[0] }));
        setEditProject(prev => ({ ...prev, dataTypes: fallbackDataTypes[0] }));
      }
    } finally {
      setDynamicDataLoading(false);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        
        const cleanDescription = (text: string) => {
          return text.replace(/\[cite:\s*\d+\]/g, '').trim();
        };

        const formattedData = data.map((p: any) => {
          const description = cleanDescription(p["Details"] || "");
          // Extract location from description if it exists
          const locationMatch = description.match(/Location:\s*(.+?)(?:\n\n|$)/);
          const location = locationMatch ? locationMatch[1].trim() : '';
          
          // Extract map link from description if it exists
          const mapLinkMatch = description.match(/Map Link:\s*(.+?)(?:\n\n|$)/);
          const mapLink = mapLinkMatch ? mapLinkMatch[1].trim() : '';
          
          // Extract embedded map link from description if it exists
          const embeddedMapLinkMatch = description.match(/Embedded Map:\s*(.+?)(?:\n\n|$)/);
          const embeddedMapLink = embeddedMapLinkMatch ? embeddedMapLinkMatch[1].trim() : '';
          
          // Clean description by removing all extracted fields
          const cleanDescriptionWithoutFields = description
            .replace(/Location:\s*.+?(?:\n\n|$)/, '')
            .replace(/Map Link:\s*.+?(?:\n\n|$)/, '')
            .replace(/Embedded Map:\s*.+?(?:\n\n|$)/, '')
            .trim();
          
          return {
            id: p["Project ID"],
            title: p["Project Title"],
            category: p["Category"],
            description: cleanDescriptionWithoutFields,
            dataTypes: p["Data Format"] || "Vector (SHP)", 
            lgu: p["LGU Location"],
            accessLevel: p["Security Level"] || "LGU Restricted",
            lastUpdated: new Date(p["Date Created"]).toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }),
            status: p["Current Status"] || 'Draft',
            latitude: p["Lat"] ? parseFloat(p["Lat"]) : undefined,      // Convert to number
            longitude: p["Long"] ? parseFloat(p["Long"]) : undefined,     // Convert to number
            location: location,
            mapLink: mapLink,
            embeddedMapLink: embeddedMapLink
          };
        });

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

  useEffect(() => {
    fetchDynamicData();
  }, []);

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
          categoryId: 1, // Default category ID for Smart City
          description: newProject.description + 
            (newProject.location ? `\n\nLocation: ${newProject.location}` : '') +
            (newProject.mapLink ? `\n\nMap Link: ${newProject.mapLink}` : '') +
            (newProject.embeddedMapLink ? `\n\nEmbedded Map: ${newProject.embeddedMapLink}` : ''),
          dataTypes: newProject.dataTypes,
          lguId: 1, // Default LGU ID
          accessLevel: newProject.accessLevel,
          team: newProject.team,
          status: newProject.status
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const createdProject = result.project;
        
        const formattedProject = {
          id: createdProject.id,
          title: createdProject.project_name,
          category: newProject.category, // Use the category from form state
          description: createdProject.description || "",
          dataTypes: createdProject.dataTypes || "Vector (SHP)",
          lgu: "Default LGU",
          accessLevel: createdProject.access_level || "Public",
          lastUpdated: new Date().toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          status: createdProject.status || 'Draft',
          latitude: createdProject.latitude,
          longitude: createdProject.longitude
        };
        
        // Refresh the projects list to ensure we have the latest data from database
        setTimeout(() => {
          window.location.reload(); // Simple refresh to ensure data consistency
        }, 1000);
        
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

  const handleEditProject = (project: Project) => {
    // Extract location from description if it exists
    const locationMatch = project.description.match(/Location:\s*(.+?)(?:\n\n|$)/);
    const location = locationMatch ? locationMatch[1].trim() : '';
    
    // Clean description by removing location field
    const cleanDescriptionWithoutFields = project.description
      .replace(/Location:\s*.+?(?:\n\n|$)/, '')
      .trim();

    setEditProject({
      title: project.title,
      category: project.category,
      dataTypes: project.dataTypes,
      team: 'Design team', // Default team since it's not stored in database
      accessLevel: project.accessLevel,
      description: cleanDescriptionWithoutFields,
      location: location,
      mapLink: project.mapLink || '',
      embeddedMapLink: project.embeddedMapLink || '',
      status: project.status
    });
    setSelectedProjectForEdit(project);
  };

  const handleUpdateProject = async () => {
    if (!selectedProjectForEdit || !editProject.title.trim()) {
      alert('Please enter a project name');
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedProjectForEdit.id,
          title: editProject.title,
          categoryId: 1, // Default category ID for Smart City
          description: editProject.description + 
            (editProject.location ? `\n\nLocation: ${editProject.location}` : ''),
          dataTypes: editProject.dataTypes,
          lguId: 1, // Default LGU ID
          accessLevel: editProject.accessLevel,
          team: editProject.team,
          status: editProject.status,
          latitude: selectedProjectForEdit.latitude || 0,
          longitude: selectedProjectForEdit.longitude || 0
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedProject = result.project;
        
        // Update the project in the list
        setProjects(projects.map(p => 
          p.id === selectedProjectForEdit.id 
            ? {
                ...p,
                title: updatedProject.project_name,
                category: editProject.category,
                description: editProject.description,
                dataTypes: updatedProject.dataTypes || "Vector (SHP)",
                accessLevel: updatedProject.access_level || "Public",
                status: updatedProject.status || 'Draft',
                location: editProject.location,
                lastUpdated: new Date().toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })
              }
            : p
        ));
        
        setSelectedProjectForEdit(null);
        alert('Project updated successfully!');
      } else {
        throw new Error('Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleDeleteProject = async (id: number | string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const response = await fetch(`/api/projects?id=${id}`, { 
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setProjects(projects.filter(p => p.id !== id));
        alert('Project deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        alert(`Failed to delete project: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete project. Please check your network connection and try again.');
    }
  };

  const resetForm = () => {
    setNewProject({
      title: '',
      category: projectCategories[0] || 'Smart City',
      dataTypes: dataTypeOptions[0] || 'Raster (GeoTIFF)',
      team: teamOptions[0] || 'Design team',
      accessLevel: 'Public',
      description: '',
      location: '',
      mapLink: '',
      embeddedMapLink: '',
      status: 'Draft'
    });
    setShowCreateModal(false);
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading GeoLokal Projects...</div>;

  return (
    <div className="w-full font-sans p-6 bg-white relative">
      <ProjectCards projects={projects} />
      
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
              <tr className="text-gray-800 font-bold text-[15px]">
                <th className="px-3 py-5 w-[18%]">Project Title</th>
                <th className="px-3 py-5 w-[8%]">Category</th>
                <th className="px-3 py-5 w-[10%] text-left">Access Level</th>
                <th className="px-3 py-5 w-[13%] text-left">Last Updated</th>
                <th className="px-3 py-5 w-[10%] text-center">Status</th>
                <th className="px-3 py-5 w-[10%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-gray-700">
              {currentProjects.map((project, index) => (
                <tr key={index} className={`${index % 2 === 0 ? 'bg-[#eeeffc]' : 'bg-transparent'} 
                hover:bg-gray-50 transition-colors max-h-[100px]`}>
                  <td className="px-4 py-2 font-normal align-top text-left"><h2>{project.title}</h2></td>
                  <td className="px-4 py-2 align-top text-left">{project.category}</td>
                  <td className="px-4 py-2 align-top text-left">{project.accessLevel}</td>
                  <td className="px-4 py-2 align-top text-left">{project.lastUpdated}</td>
                  <td className="px-2 py-2 align-top text-center">
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold inline-block min-w-[90px] ${getStatusStyle(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 align-top text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => setSelectedProjectForMap(project)}
                        className="p-2 text-white bg-gray-800/80 rounded-full transition-all"
                        title="View Map"
                      >
                        <MapPin size={14} />
                      </button>
                      <button 
                        onClick={() => setSelectedProjectForDetails(project)}
                        className="p-2 text-white bg-green-900 rounded-full transition-all"
                        title="View Project Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => handleEditProject(project)}
                        className="p-2 text-white bg-blue-900 rounded-full transition-all"
                        title="Edit Project"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-2 text-white bg-red-900 rounded-full transition-all"
                        title="Delete Project"
                      >
                        <Trash2 size={14} />
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-6xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Create new project</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3">
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
                  disabled={dynamicDataLoading}
                >
                  {projectCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
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
                  disabled={dynamicDataLoading}
                >
                  {dataTypeOptions.map((dataType) => (
                    <option key={dataType} value={dataType}>{dataType}</option>
                  ))}
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
                  disabled={dynamicDataLoading}
                >
                  {teamOptions.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newProject.location}
                  onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <select 
                  value={newProject.status}
                  onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Published">Published</option>
                  <option value="Syncing">Syncing</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
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

      {selectedProjectForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-6xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Edit project</h2>
              <button
                onClick={() => setSelectedProjectForEdit(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project name
                </label>
                <input
                  type="text"
                  value={editProject.title}
                  onChange={(e) => setEditProject({...editProject, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select 
                  value={editProject.category}
                  onChange={(e) => setEditProject({...editProject, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={dynamicDataLoading}
                >
                  {projectCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Types
                </label>
                <select 
                  value={editProject.dataTypes}
                  onChange={(e) => setEditProject({...editProject, dataTypes: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={dynamicDataLoading}
                >
                  {dataTypeOptions.map((dataType) => (
                    <option key={dataType} value={dataType}>{dataType}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a team
                </label>
                <select 
                  value={editProject.team}
                  onChange={(e) => setEditProject({...editProject, team: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={dynamicDataLoading}
                >
                  {teamOptions.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Level
                </label>
                <select 
                  value={editProject.accessLevel}
                  onChange={(e) => setEditProject({...editProject, accessLevel: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Public</option>
                  <option>LGU Restricted</option>
                  <option>Private</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={editProject.location}
                  onChange={(e) => setEditProject({...editProject, location: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project location"
                />
              </div>

              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <select 
                  value={editProject.status}
                  onChange={(e) => setEditProject({...editProject, status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Published">Published</option>
                  <option value="Syncing">Syncing</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editProject.description}
                  onChange={(e) => setEditProject({...editProject, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  placeholder="Complete project details"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => setSelectedProjectForEdit(null)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProject}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Update project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;