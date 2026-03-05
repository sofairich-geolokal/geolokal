"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

const AccessByProject = ({ data = [] }: { data: ChartData[] }) => {
  const maxValue = 30000;
  // Define the steps for your grid lines
  const gridLines = [0, 10000, 20000, 30000];

  return (
    <div className="w-full min-h-[280px] max-w-2xl rounded-2xl px-4 py-0 font-sans">
      <h2 className="text-[18px] font-bold text-[#1a1a1a] mb-8 text-left">Access By Project</h2>
      
      <div className="relative h-[180px] ml-10 mr-4">
        {/* Y-Axis Labels & Grid Lines */}
        <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none">
          {gridLines.map((line) => (
            <div key={line} className="relative w-full flex items-center">
              {/* The Label */}
              <span className="absolute -left-10 text-[13px] text-[#9ca3af]">
                {line === 0 ? "0" : `${line / 1000}K`}
              </span>
              {/* The Horizontal Line */}
              <div className="w-full border-t border-gray-100" />
            </div>
          ))}
        </div>

        {/* Chart Bars Container */}
        <div className="relative flex justify-around items-end w-full h-full pb-[1px] z-10">
          <AnimatePresence>
            {data.map((item, index) => {
              const heightPercentage = Math.min((item.value / maxValue) * 100, 100);

              return (
                <div key={item.label} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                  {/* Animated Bar */}
                  <motion.div
                    key={`${item.label}-${item.value}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercentage}%` }}
                    exit={{ height: 0 }}
                    transition={{ 
                      duration: 1.2, 
                      delay: index * 0.1, 
                      ease: [0.33, 1, 0.68, 1] 
                    }}
                    style={{ backgroundColor: item.color }}
                    className="w-[32px] md:w-[38px] rounded-t-full cursor-pointer relative group-hover:brightness-110 transition-all duration-300"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white text-[11px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 shadow-xl whitespace-nowrap">
                      {item.value.toLocaleString()}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1f2937] rotate-45"></div>
                    </div>
                  </motion.div>
                  
                  {/* X-Axis Labels */}
                  <span className="absolute -bottom-8 text-[13px] text-[#9ca3af] whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AccessByProject;