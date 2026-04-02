"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchAccessData } from '@/app/actions/getProjectData';

const AccessByProject = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxValue, setMaxValue] = useState(10); // Dynamic max value

  // Calculate grid lines based on max value
  const getGridLines = (max: number) => {
    if (max <= 5) return [0, 1, 2, 3, 4, 5];
    if (max <= 10) return [0, 2, 4, 6, 8, 10];
    if (max <= 20) return [0, 5, 10, 15, 20];
    return [0, Math.ceil(max * 0.25), Math.ceil(max * 0.5), Math.ceil(max * 0.75), max];
  };

  const gridLines = getGridLines(maxValue);

  useEffect(() => {
    fetchAccessData().then(dbData => {
      setData(dbData);
      // Set max value based on data (with some padding)
      if (dbData.length > 0) {
        const maxCount = Math.max(...dbData.map(item => item.value));
        setMaxValue(Math.max(maxCount + 1, 5)); // At least 5, with padding
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="w-full rounded-3xl py-8 px-8 bg-gray-50">
      <h2 className="text-[20px] font-bold -mt-[25px] text-gray-900 mb-10">Access By Project</h2>
      
      <div className="relative h-[160px] ml-10 mr-4 mb-8">
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
            <div key={index} className="flex flex-col items-center flex-1 group relative 
            h-full justify-end">
              
              {/* Tooltip on Hover */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[12px] py-1 px-3 rounded-lg transition-all duration-300 z-20 whitespace-nowrap shadow-xl">
                {item.value.toLocaleString()}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
              </div>

              {/* Bar - Styled to match Block.jpg (fully rounded) */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                style={{ backgroundColor: item.color }}
                className="w-[28px] md:w-[36px] rounded-full cursor-pointer 
                hover:brightness-110 transition-all shadow-sm"
              />

              {/* X-Axis Label */}
              <div className="absolute -bottom-10 w-full text-center">
                <span className="text-[10px] line-clamp-2 leading-[1.2] text-gray-500 
                font-medium  wrap
                 ">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-[220px]">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default AccessByProject;