"use client";

import React, { useMemo } from 'react';

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

interface ProjectStat {
  label: string;
  value: string | number;
  color: string;
  status?: string;
}

interface ProjectCardsProps {
  projects?: Project[];
}

const ProjectCards = ({ projects = [] }: ProjectCardsProps) => {
  const stats = useMemo(() => {
    // Calculate counts based on project status
    const total = projects.length;
    const draft = projects.filter(p => p.status === 'Draft').length;
    const inProgress = projects.filter(p => p.status === 'In Progress').length;
    const published = projects.filter(p => p.status === 'Published').length;
    const syncing = projects.filter(p => p.status === 'Syncing').length;
    const failed = projects.filter(p => p.status === 'Failed').length;

    return [
      { label: "Total Projects", value: total.toLocaleString(), color: "bg-[#555b5e]" },
      { label: "Draft", value: draft.toLocaleString(), color: "bg-[#ffbe01]", status: "Draft" },
      { label: "In Progress", value: inProgress.toLocaleString(), color: "bg-[#5ebf8c]", status: "In Progress" },
      { label: "Published", value: published.toLocaleString(), color: "bg-[#79cd01]", status: "Published" },
      { label: "Syncing", value: syncing.toLocaleString(), color: "bg-[#f59e0b]", status: "Syncing" },
      { label: "Failed", value: failed.toLocaleString(), color: "bg-[#ff3b3b]", status: "Failed" }
    ];
  }, [projects]);

  return (
    <div className="w-full px-0 py-0 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.color} flex flex-col items-center justify-center p-3 
            rounded-[20px] shadow-md transition-all duration-300 hover:scale-[1.02] 
            cursor-default relative overflow-hidden group`}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <span className="text-white text-sm mb-1 font-medium text-center relative z-10">
              {stat.label}
            </span>
            <span className="text-white text-2xl lg:text-3xl font-bold relative z-10">
              {stat.value}
            </span>
            
            {/* Status indicator for status-based cards */}
            {stat.status && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-white/30 rounded-full"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectCards;