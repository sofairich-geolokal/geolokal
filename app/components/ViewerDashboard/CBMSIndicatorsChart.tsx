'use client';

import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Activity } from 'lucide-react';

interface CBMSData {
  indicator_code: string;
  average_value: number;
}

interface CBMSIndicatorsChartProps {
  data: CBMSData[];
  isLoading?: boolean;
}

// Mock data matching the radar chart image exactly
const mockData = [
  { indicator: 'Poverty', current: 65, target: 85, fullMark: 100 },
  { indicator: 'Employment', current: 70, target: 90, fullMark: 100 },
  { indicator: 'Literacy', current: 85, target: 95, fullMark: 100 },
  { indicator: 'Health Access', current: 60, target: 80, fullMark: 100 },
  { indicator: 'Sanitation', current: 75, target: 85, fullMark: 100 },
  { indicator: 'Water Access', current: 80, target: 90, fullMark: 100 }
];

export default function CBMSIndicatorsChart({ data, isLoading = false }: CBMSIndicatorsChartProps) {
  // Use mock data to match the image exactly
  const chartData = mockData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">{payload[0].payload.indicator}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.7, type: "spring" }}
            className="bg-green-100 p-2 rounded-lg"
          >
            <Activity className="w-5 h-5 text-green-600" />
          </motion.div>
          <div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-lg font-semibold text-gray-900"
            >
              CBMS Indicators
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-sm text-gray-600"
            >
              Community-based monitoring system
            </motion.p>
          </div>
        </div>
      </div>

      <div className="h-80">
        {isLoading ? (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-full w-full bg-gray-200 rounded-lg"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
              <PolarGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb"
                radialLines={true}
              />
              <PolarAngleAxis 
                dataKey="indicator"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                className="text-sm"
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                tickCount={6}
              />
              <Radar
                name="Current"
                dataKey="current"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="#3B82F6"
                fillOpacity={0.3}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Radar
                name="Target"
                dataKey="target"
                stroke="#EF4444"
                strokeWidth={2}
                fill="#EF4444"
                fillOpacity={0.3}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '12px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Performance Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-4 grid grid-cols-3 gap-4"
      >
        <div className="text-center">
          <p className="text-xs text-gray-600">Average Performance</p>
          <p className="text-lg font-bold text-blue-600">72.5%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Target Achievement</p>
          <p className="text-lg font-bold text-green-600">85.4%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Gap Analysis</p>
          <p className="text-lg font-bold text-red-600">-12.9%</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
