"use client";

import React, { useState, useEffect } from 'react';

interface ProjectStat {
  label: string;
  value: string | number;
  color: string;
}

const ProjectCards = () => {
  const [stats, setStats] = useState<ProjectStat[]>([
    { label: "Total Projects", value: "0", color: "bg-[#f3a61f]" },
    { label: "Failed", value: "0", color: "bg-[#ff3b3b]" },
    { label: "In Progress", value: "0", color: "bg-[#5ebf8c]" },
    { label: "Published", value: "0", color: "bg-[#555b5e]" },
    {label: "Draft", value: "0", color: "bg-[#ffbe01]"}
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/projects');
        const projects = await response.json();

        // Calculate counts based on database status
        const total = projects.length;
        const failed = projects.filter((p: any) => p.status === 'Failed').length;
        const inProgress = projects.filter((p: any) => p.status === 'In Progress').length;
        const published = projects.filter((p: any) => p.status === 'Published').length;
         const draft = projects.filter((p: any) => p.status === 'Draft').length;
        const syncing = projects.filter((p: any) => p.status === 'Syncing').length;
        setStats([
          { label: "Total Projects", value: total.toLocaleString(), color: "bg-[#555b5e]" },
          { label: "Failed", value: failed.toLocaleString(), color: "bg-[#ff3b3b]" },
          { label: "Syncing", value: syncing.toLocaleString(), color: "bg-[#f59e0b]" },
        
          { label: "In Progress", value: inProgress.toLocaleString(), color: "bg-[#5ebf8c]" },
          { label: "Completed", value: published.toLocaleString(), color: "bg-[#79cd01]" },
          { label: "Draft", value: draft.toLocaleString(), color: "bg-[#ffbe01]" },
        
        ]);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="w-full px-0 py-0 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.color} flex flex-col items-center justify-center p-2 
            rounded-[20px] shadow-md transition-transform hover:scale-[1.02] 
            cursor-default `}
          >
            <span className="text-white text-lg mb-0 font-small">
              {stat.label}
            </span>
            <span className="text-white text-3xl font-bold">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectCards;