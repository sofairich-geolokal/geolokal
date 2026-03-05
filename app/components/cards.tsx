"use client";

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

// Fixed types for the animated counter
function Counter({ value }: { value: string }) {
  const numericValue = parseInt(value.replace(/,/g, ''), 10);
  
  // Initialize spring with a number
  const count = useSpring(0, { bounce: 0, duration: 2000 });
  
  // Explicitly typing 'latest' as a number
  const rounded = useTransform(count, (latest: number) => 
    Math.round(latest).toLocaleString()
  );

  useEffect(() => {
    count.set(numericValue);
  }, [count, numericValue]);

  return <motion.span>{rounded}</motion.span>;
}

export default function Cards() {
  const stats = [
    { 
      title: "Total Tax Parcel", 
      value: "7,265", 
      growth: "+11.01%", 
      positive: true,
      bgColor: "bg-gray-50" 
    },
    { 
      title: "CBMS Indicator", 
      value: "3,671", 
      growth: "-0.03%", 
      positive: false,
      bgColor: "bg-blue-50 " 
    },
    { 
      title: "System Uptime", 
      value: "156", 
      growth: "+15.03%", 
      positive: true,
      bgColor: "bg-gray-50" // Soft Purple
    },
    { 
      title: "Active Users", 
      value: "2,318", 
      growth: "+6.08%", 
      positive: true,
      bgColor: "bg-blue-50 " // Soft Emerald
    },
  ];

  return (
    <div className="p-0 sm:p-6 bg-white h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {stats.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            // Added ${stat.bgColor} here and kept all other classes the same
            className={`${stat.bgColor} p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300`}
          >
            <p className="text-black-500 text-md font-medium mb-2">{stat.title}</p>
            <div className="flex items-end justify-between gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tabular-nums tracking-tight">
                <Counter value={stat.value} />
              </h2>
              <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                stat.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {stat.growth} {stat.positive ? '↗' : '↘'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}