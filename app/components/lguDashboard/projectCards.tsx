"use client";

import React from 'react';

interface ProjectStat {
  label: string;
  value: string;
  color: string;
}

const ProjectCards = () => {
  const stats: ProjectStat[] = [
    { 
      label: "Total Projects", 
      value: "2,318", 
      color: "bg-[#f3a61f]" // Warm Yellow
    },
    { 
      label: "Cancelled", 
      value: "2,318", 
      color: "bg-[#ff3b3b]" // Bright Red
    },
    { 
      label: "Pending", 
      value: "2,318", 
      color: "bg-[#ea8426]" // Orange
    },
    { 
      label: "Completed", 
      value: "2,318", 
      color: "bg-[#555b5e]" // Dark Grey
    },
  ];

  return (
    <div className="w-full px-0 py-0 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.color} flex flex-col items-center justify-center p-6 rounded-[32px] shadow-md transition-transform hover:scale-[1.02] cursor-default`}
          >
            <span className="text-white text-lg mb-2">
              {stat.label}
            </span>
            <span className="text-white  md:text-4xl font-bold">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectCards;