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
  population: {
    total_population: number;
    total_households: number;
  };
  landArea: {
    total_area_sqm: number;
  };
  buildingDistribution: Array<{
    category_id: number;
    count: number;
  }>;
  cbmsIndicators: Array<{
    indicator_code: string;
    average_value: number;
  }>;
  roadNetworks: {
    total_roads: number;
    total_length_km: number;
  };
}

export default function ViewerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDensity = () => {
    if (!stats) return 0;
    const population = stats.population.total_population;
    const areaSqKm = stats.landArea.total_area_sqm / 1000000; // Convert m² to km²
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
        <PopulationCard 
          population={stats?.population.total_population || 0} 
          isLoading={isLoading}
        />
        <HouseholdsCard 
          households={stats?.population.total_households || 0} 
          isLoading={isLoading}
        />
        <LandAreaCard 
          landArea={stats?.landArea.total_area_sqm || 0} 
          isLoading={isLoading}
        />
        <DensityCard 
          density={calculateDensity()} 
          isLoading={isLoading}
        />
      </div>

      {/* Charts Grid - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PopulationChart 
          data={[]} 
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
          data={stats?.roadNetworks || { total_roads: 0, total_length_km: 0 }} 
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
          onClick={fetchDashboardStats}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </motion.button>
      </motion.div>
    </div>
  );
}
