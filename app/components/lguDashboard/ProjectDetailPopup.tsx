"use client";

import React from 'react';

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
  sourceTypes?: SourceType[];
}

interface SourceType {
  id: number;
  name: string;
  description?: string;
  color: string;
}

interface ProjectDetailPopupProps {
  project: Project;
  onClose: () => void;
}

const ProjectDetailPopup = ({ project, onClose }: ProjectDetailPopupProps) => {
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header Section */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-3xl font-black text-gray-900 leading-tight">{project.title}</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
              {project.lgu} · {project.category}
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 rounded-full transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Section - Project Details */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Project Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {project.description || "No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-2xl p-6">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Data Types</h4>
                  <p className="text-blue-700 font-medium">{project.dataTypes}</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-6">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Access Level</h4>
                  <p className="text-green-700 font-medium">{project.accessLevel}</p>
                </div>
              </div>
            </div>

            {/* Sidebar Information */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Project Status</h4>
                <div className="flex items-center justify-center">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusStyle(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Project ID</h4>
                <p className="text-gray-700 font-mono">{project.id}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Last Updated</h4>
                <p className="text-gray-700">{project.lastUpdated}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Location</h4>
                <p className="text-gray-700">{project.lgu}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Category</h4>
                <p className="text-gray-700">{project.category}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPopup;
