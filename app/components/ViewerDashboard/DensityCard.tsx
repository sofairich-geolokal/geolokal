'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface DensityCardProps {
  density: number; // population per square kilometer
  isLoading?: boolean;
}

export default function DensityCard({ density, isLoading = false }: DensityCardProps) {
  const formatDensity = (density: number) => {
    if (density >= 1000) {
      return `${(density / 1000).toFixed(1)}k/km²`;
    }
    return `${density.toFixed(0)}/km²`;
  };

  const getDensityLevel = (density: number) => {
    if (density >= 1000) return { level: 'High', color: 'text-red-600', bg: 'bg-red-100' };
    if (density >= 500) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const densityInfo = getDensityLevel(density);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-sm font-medium text-gray-600 mb-1"
          >
            Density
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5, type: "spring", stiffness: 100 }}
            className="text-3xl font-bold text-gray-900"
          >
            {isLoading ? (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="h-8 w-32 bg-gray-200 rounded"
              />
            ) : (
              formatDensity(density)
            )}
          </motion.h3>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex items-center gap-2 mt-1"
          >
            <span className={`text-xs px-2 py-1 rounded-full ${densityInfo.bg} ${densityInfo.color} font-medium`}>
              {densityInfo.level}
            </span>
            <span className="text-xs text-gray-500">
              per km²
            </span>
          </motion.div>
        </div>
        <motion.div
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.7, type: "spring" }}
          className="bg-purple-100 p-3 rounded-full"
        >
          <TrendingUp className="w-6 h-6 text-purple-600" />
        </motion.div>
      </div>
    </motion.div>
  );
}
