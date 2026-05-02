"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ProjectData {
  category: string;
  count: number;
  color: string;
}

const ProjectCountByCategory = () => {
  const [data, setData] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate grid lines based on max count
  const getGridLines = (max: number) => {
    if (max <= 5) return [0, 1, 2, 3, 4, 5];
    if (max <= 10) return [0, 2, 4, 6, 8, 10];
    if (max <= 20) return [0, 5, 10, 15, 20];
    if (max <= 50) return [0, 10, 20, 30, 40, 50];
    return [0, 20, 40, 60, 80, 100];
  };

  const gridLines = getGridLines(maxCount);

  // Function to fetch and update data
  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/projects-by-category');
      const dbData = await response.json();
      
      if (Array.isArray(dbData)) {
        setData(dbData);
        setLastUpdated(new Date());
        
        // Set max count based on data
        if (dbData.length > 0) {
          const maxProjects = Math.max(...dbData.map(item => item.count));
          setMaxCount(Math.max(maxProjects * 1.2, 5));
        }
      } else {
        console.error("API did not return an array:", dbData);
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching project count data:', err);
      setError('Failed to load project data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Real-time updates - poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  return (
    <div className="w-full rounded-3xl py-8 px-8 bg-gray-50">
      {/* Header with real-time status */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-[20px] font-bold -mt-[25px] text-gray-900">Project Count by Category</h2>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="relative h-[200px] ml-10 mr-4 mb-12">
        {/* Y-Axis & Grid Lines */}
        <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none">
          {gridLines.map((line) => (
            <div key={line} className="relative w-full flex items-center">
              <span className="absolute -left-12 text-[14px] text-gray-400 font-medium">
                {line.toString()}
              </span>
              <div className="w-full border-t border-gray-100" />
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div className="relative flex justify-around items-end w-full h-full z-10 px-4">
          {!loading && data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 group relative h-full justify-end">
              
              {/* Tooltip on Hover */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[11px] py-2 px-3 rounded-lg transition-all duration-300 z-20 whitespace-nowrap shadow-xl">
                <div className="font-semibold mb-1">{item.category}</div>
                <div>Projects: {item.count}</div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
              </div>

              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((item.count / maxCount) * 100, 5)}%` }}
                transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                style={{ backgroundColor: item.color }}
                className="w-[56px] md:w-[72px] rounded-t-lg cursor-pointer hover:brightness-110 transition-all shadow-sm"
              />

              {/* X-Axis Label */}
              <div className="absolute -bottom-8 w-full text-center">
                <span className="text-[10px] line-clamp-2 leading-[1.2] text-gray-500 font-medium">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-[220px]">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* No data message */}
      {!loading && data.length === 0 && (
        <div className="flex items-center justify-center h-[220px] text-gray-500 text-sm">
          No projects found
        </div>
      )}
    </div>
  );
};

export default ProjectCountByCategory;
