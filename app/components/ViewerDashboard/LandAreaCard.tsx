'use client';

import { motion } from 'framer-motion';
import { Map } from 'lucide-react';

interface LandAreaCardProps {
  landArea: number; // in square meters
  isLoading?: boolean;
}

export default function LandAreaCard({ landArea, isLoading = false }: LandAreaCardProps) {
  const formatArea = (areaSqM: number) => {
    if (areaSqM >= 1000000) {
      return `${(areaSqM / 1000000).toFixed(2)} km²`;
    } else if (areaSqM >= 10000) {
      return `${(areaSqM / 10000).toFixed(2)} ha`;
    } else {
      return `${areaSqM.toFixed(0)} m²`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-sm font-medium text-gray-600 mb-1"
          >
            Land Area
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 100 }}
            className="text-3xl font-bold text-gray-900"
          >
            {isLoading ? (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="h-8 w-32 bg-gray-200 rounded"
              />
            ) : (
              formatArea(landArea)
            )}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-xs text-gray-500 mt-1"
          >
            Total land area
          </motion.p>
        </div>
        <motion.div
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.7, type: "spring" }}
          className="bg-orange-100 p-3 rounded-full"
        >
          <Map className="w-6 h-6 text-orange-600" />
        </motion.div>
      </div>
    </motion.div>
  );
}
