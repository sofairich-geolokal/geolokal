'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import PopulationCard from './PopulationCard';
import HouseholdsCard from './HouseholdsCard';
import LandAreaCard from './LandAreaCard';
import DensityCard from './DensityCard';
import PopulationChart from './PopulationChart';
import BuildingDistributionChart from './BuildingDistributionChart';
import CBMSIndicatorsChart from './CBMSIndicatorsChart';
import RoadNetworksChart from './RoadNetworksChart';

interface DashboardStats {
  userCount: number;
  barangayCount: number;
  timestamp: string;
  population?: {
    total_population: number;
    total_households: number;
  };
  landArea?: {
    total_area_sqm: number;
  };
  buildingDistribution?: any[];
  cbmsIndicators?: any[];
  roadNetworks?: any[];
  populationByBarangay?: any[];
}

export default function ViewerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSimpleDashboardStats();
  }, []);

  const fetchSimpleDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch simple dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDensity = () => {
    if (!stats) return 0;
    const population = stats.userCount; // Use user count as proxy for population
    const areaSqKm = 1000; // Fixed area for calculation
    return areaSqKm > 0 ? Math.round(population / areaSqKm) : 0;
  };

  return (
    <div className=" bg-gray-50 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-0"
      >
      </motion.div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Users</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.userCount || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Barangays</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.barangayCount || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Last Updated</h3>
            <p className="text-sm text-gray-600">{stats?.timestamp || 'Never'}</p>
          </div>
        </div>
        <DensityCard 
          density={calculateDensity()} 
          isLoading={isLoading}
        />
      </div>

      {/* Charts Grid - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PopulationChart
          data={stats?.populationByBarangay || []}
          isLoading={isLoading}
        />
        <BuildingDistributionChart 
          data={stats?.buildingDistribution || []} 
          isLoading={isLoading}
        />
      </div>

      {/* Charts Grid - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CBMSIndicatorsChart 
          data={stats?.cbmsIndicators || []} 
          isLoading={isLoading}
        />
        <RoadNetworksChart
          data={stats?.roadNetworks || []}
          isLoading={isLoading}
        />
      </div>

      {/* Refresh Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="fixed bottom-6 right-6"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchSimpleDashboardStats}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </motion.button>
      </motion.div>
    </div>
  );
}
