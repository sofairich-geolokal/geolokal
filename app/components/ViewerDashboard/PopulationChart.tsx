'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users } from 'lucide-react';

interface PopulationData {
  barangay_name: string;
  population: number;
}

interface PopulationChartProps {
  data: PopulationData[];
  isLoading?: boolean;
}

// Mock data with actual Barangay names for Ibaan
const mockData = [
  { name: 'Barangay San Isidro', population: 18000, color: '#3B82F6' }, // Blue
  { name: 'Barangay Sabang', population: 30000, color: '#10B981' }, // Green
  { name: 'Barangay Tala', population: 22000, color: '#1E3A8A' }, // Dark Blue
  { name: 'Barangay Paligawan', population: 32000, color: '#3B82F6' }, // Blue
  { name: 'Barangay Mabalacat', population: 13000, color: '#EF4444' }  // Red
];

export default function PopulationChart({ data, isLoading = false }: PopulationChartProps) {
  // Transform API data to chart format
  const chartData = data && data.length > 0 ? data.map((item: any, index: number) => ({
    name: item.barangay_name || `Barangay ${(index + 1).toString().padStart(2, '0')}`,
    population: item.population || 0,
    color: getColor(index)
  })) : mockData;

  function getColor(index: number): string {
    const colors = ['#3B82F6', '#10B981', '#1E3A8A', '#3B82F6', '#EF4444'];
    return colors[index % colors.length];
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            Population: {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const formatYAxisTick = (value: any) => {
    if (value >= 1000) {
      return `${value / 1000}K`;
    }
    return value;
  };

  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const words = payload.value.split(' ');
    const midPoint = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, midPoint).join(' ');
    const secondLine = words.slice(midPoint).join(' ');
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={-4} textAnchor="middle" fontSize={12} fill="#6B7280">
          {firstLine}
        </text>
        {secondLine && (
          <text x={0} y={0} dy={12} textAnchor="middle" fontSize={12} fill="#6B7280">
            {secondLine}
          </text>
        )}
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-lg p-6 
      hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7, type: "spring" }}
            className="bg-blue-100 p-2 rounded-lg"
          >
            <Users className="w-5 h-5 text-blue-600" />
          </motion.div>
          <div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-lg font-semibold text-gray-900"
            >
              Population by Barangay
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-sm text-gray-600"
            >
              Demographics by location
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
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={<CustomXAxisTick />}
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                domain={[0, 35000]}
                ticks={[0, 10000, 20000, 30000]}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="population" radius={[8, 8, 0, 0]} animationDuration={1000}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-4 grid grid-cols-3 gap-4"
      >
        <div className="text-center">
          <p className="text-xs text-gray-600">Total Population</p>
          <p className="text-lg font-bold text-gray-900">
            {chartData.reduce((sum, item) => sum + item.population, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Highest</p>
          <p className="text-lg font-bold text-green-600">
            {Math.max(...chartData.map(item => item.population)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Average</p>
          <p className="text-lg font-bold text-blue-600">
            {Math.round(chartData.reduce((sum, item) => sum + item.population, 0) / chartData.length).toLocaleString()}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
