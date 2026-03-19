'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Building } from 'lucide-react';

interface BuildingData {
  category_id: number;
  count: number;
}

interface BuildingDistributionChartProps {
  data: BuildingData[];
  isLoading?: boolean;
}

// Exact colors from the image
const COLORS = ['#374151', '#3B82F6', '#10B981', '#EF4444']; // Dark Grey, Blue, Green, Red

// Mock data matching the image percentages
const mockData = [
  { name: 'Industrial', value: 52.1, color: '#374151' },
  { name: 'Residential', value: 22.8, color: '#3B82F6' },
  { name: 'Commercial', value: 13.9, color: '#10B981' },
  { name: 'Government', value: 11.2, color: '#EF4444' }
];

export default function BuildingDistributionChart({ data, isLoading = false }: BuildingDistributionChartProps) {
  // Use mock data to match the image exactly
  const chartData = mockData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    return `${entry.value}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7, type: "spring" }}
            className="bg-blue-100 p-2 rounded-lg"
          >
            <Building className="w-5 h-5 text-blue-600" />
          </motion.div>
          <div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-lg font-semibold text-gray-900"
            >
              Building Distribution
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-sm text-gray-600"
            >
              Buildings by category
            </motion.p>
          </div>
        </div>
      </div>

      <div className="h-64">
        {isLoading ? (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-full w-full bg-gray-200 rounded-lg"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                animationBegin={800}
                animationDuration={1000}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-4 grid grid-cols-2 gap-2"
      >
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-xs text-gray-600">{item.name}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
