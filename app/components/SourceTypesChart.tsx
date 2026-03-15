"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SourceData {
  label: string;
  percentage: number;
  value: number;
  color: string;
  status: string;
  lastUpdated: string;
  source: string;
  description: string;
}

export default function SourceTypesChart({ data }: { data: SourceData[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Debug logging
  console.log('SourceTypesChart received data:', JSON.stringify(data, null, 2));

  const size = 150;
  const strokeWidth = 35;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-full max-w-2xl p-4 font-sans flex flex-col md:flex-row gap-10" onMouseMove={handleMouseMove}>
      <div className="relative w-[200px] h-[200px]">
        <h2 className="absolute -top-10 left-0 text-xl mb-10 font-bold text-gray-900 whitespace-nowrap">
          Source Types Data
        </h2>
        
        <svg width={size} height={size} className="transform -rotate-90 mt-6">
          {data.map((item, index) => {
            const strokeDasharray = (item.percentage / 100) * circumference;
            const currentOffset = (cumulativeOffset / 100) * circumference;
            cumulativeOffset += item.percentage;

            return (
              <motion.circle
                key={item.label}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeDasharray} ${circumference}`}
                initial={{ strokeDashoffset: strokeDasharray }}
                animate={{ strokeDashoffset: -currentOffset }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                strokeLinecap="butt"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
          {/* Inner hole for the donut effect */}
          <circle cx={center} cy={center} r={radius - strokeWidth / 2} fill="white" />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-4 mt-10 w-full">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between group cursor-default">
            <div className="flex items-center gap-3">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }} 
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">
                {item.label}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-600">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>

      {/* --- HOVER TOAST (INSIGHTS) --- */}
      {hoveredIndex !== null && (
        <div 
          className="fixed z-50 pointer-events-none bg-gray-900 text-white p-3 rounded-lg shadow-xl text-xs flex flex-col gap-1 transition-opacity duration-200"
          style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
        >
          <span className="font-bold border-b border-gray-700 pb-1 mb-1">{data[hoveredIndex]?.label || 'Unknown'}</span>
          
          <span>📊 Contribution: {data[hoveredIndex]?.percentage || 0}%</span>
          <span>📈 Total Records: {data[hoveredIndex]?.value || 0}</span>
          <span>🔄 Status: {data[hoveredIndex]?.status || 'Unknown'}</span>
          <span>🗄️ Source: {data[hoveredIndex]?.source || 'Database'}</span>
          <span>⏰ Last Updated: {data[hoveredIndex]?.lastUpdated ? new Date(data[hoveredIndex].lastUpdated).toLocaleString() : 'Not available'}</span>
        </div>
      )}
      
    </div>
  );
}