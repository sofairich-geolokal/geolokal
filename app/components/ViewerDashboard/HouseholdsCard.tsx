'use client';

import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

interface HouseholdsCardProps {
  households: number;
  isLoading?: boolean;
}

export default function HouseholdsCard({ households, isLoading = false }: HouseholdsCardProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-sm font-medium text-gray-600 mb-1"
          >
            Households
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 100 }}
            className="text-3xl font-bold text-gray-900"
          >
            {isLoading ? (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="h-8 w-32 bg-gray-200 rounded"
              />
            ) : (
              formatNumber(households)
            )}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-xs text-gray-500 mt-1"
          >
            Total households
          </motion.p>
        </div>
        <motion.div
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.7, type: "spring" }}
          className="bg-green-100 p-3 rounded-full"
        >
          <Home className="w-6 h-6 text-green-600" />
        </motion.div>
      </div>
    </motion.div>
  );
}
