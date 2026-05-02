"use client";

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { FolderOpen, MapPin, Users, Activity, Database, TrendingUp } from 'lucide-react';
import DataTablePopup from '../DataTablePopup';

interface StatData {
  title: string;
  value: number | string;
  growth: number;
  positive: boolean;
  bgColor: string;
  icon: React.ReactNode;
}

// Fixed types for the animated counter
function Counter({ value }: { value: string | number }) {
  const numericValue = typeof value === 'number' ? value : parseInt(value.replace(/,/g, ''), 10);
  
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
  const [stats, setStats] = useState<StatData[]>([
    {
      title: 'Total Projects',
      value: 0,
      growth: 0,
      positive: true,
      bgColor: 'bg-purple-50',
      icon: <FolderOpen className="h-6 w-6 text-purple-600" />
    },
    {
      title: 'Active Users',
      value: 0,
      growth: 0,
      positive: true,
      bgColor: 'bg-blue-50',
      icon: <Users className="h-6 w-6 text-blue-600" />
    },
    {
      title: 'Map Layers',
      value: 0,
      growth: 0,
      positive: true,
      bgColor: 'bg-green-50',
      icon: <MapPin className="h-6 w-6 text-green-600" />
    },
    {
      title: 'Data Sources',
      value: 0,
      growth: 0,
      positive: true,
      bgColor: 'bg-orange-50',
      icon: <Database className="h-6 w-6 text-orange-600" />
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [popupState, setPopupState] = useState({
    isOpen: false,
    title: '',
    endpoint: '',
    columns: [] as { key: string; label: string; format?: 'date' | 'currency' | undefined }[]
  });

  const openPopup = (title: string) => {
    const config = getPopupConfig(title);
    setPopupState({
      isOpen: true,
      title,
      endpoint: config.endpoint,
      columns: config.columns
    });
  };

  const closePopup = () => {
    setPopupState(prev => ({ ...prev, isOpen: false }));
  };

  const getPopupConfig = (title: string): { endpoint: string; columns: { key: string; label: string; format?: 'date' | 'currency' | undefined }[] } => {
    switch (title) {
      case 'Total Projects':
        return {
          endpoint: '/api/projects',
          columns: [
            { key: 'Project ID', label: 'Project ID' },
            { key: 'Project Title', label: 'Project Title' },
            { key: 'Category', label: 'Category' },
            { key: 'LGU Location', label: 'LGU Location' },
            { key: 'Current Status', label: 'Status' },
            { key: 'Date Created', label: 'Date Created', format: 'date' }
          ]
        };
      case 'Active Users':
        return {
          endpoint: '/api/users',
          columns: [
            { key: 'username', label: 'Username' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            { key: 'created_at', label: 'Member Since', format: 'date' }
          ]
        };
      case 'Map Layers':
        return {
          endpoint: '/api/lgu/map-layers',
          columns: [
            { key: 'area', label: 'Area/Layer Name' },
            { key: 'location', label: 'Location' },
            { key: 'layerType', label: 'Layer Type' },
            { key: 'agency', label: 'Agency' },
            { key: 'category', label: 'Category' },
            { key: 'population', label: 'Population' },
            { key: 'households', label: 'Households' },
            { key: 'povertyRate', label: 'Poverty Rate' },
            { key: 'employmentRate', label: 'Employment Rate' },
            { key: 'status', label: 'Status' }
          ]
        };
      case 'Data Sources':
        return {
          endpoint: '/api/stats/sources',
          columns: [
            { key: 'Layer', label: 'Layer Name' },
            { key: 'Location', label: 'Location' },
            { key: 'Color', label: 'Color' },
            { key: 'Category', label: 'Category' },
            { key: 'Agency', label: 'Agency' },
            
          ]
        };
      default:
        return {
          endpoint: '',
          columns: []
        };
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch projects count
        const projectsResponse = await fetch('/api/projects');
        const projectsData = await projectsResponse.json();
        const projectsCount = Array.isArray(projectsData) ? projectsData.length : 0;

        // Fetch users count  
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        const usersCount = Array.isArray(usersData) ? usersData.length : 0;

        // Fetch map layers count
        const mapsResponse = await fetch('/api/stats/map-layers');
        const mapsData = await mapsResponse.json();
        const mapsCount = Array.isArray(mapsData) ? mapsData.length : 0;

        // Fetch data sources count
        const sourcesResponse = await fetch('/api/stats/sources');
        const sourcesData = await sourcesResponse.json();
        const sourcesCount = Array.isArray(sourcesData) ? sourcesData.length : 0;

        setStats([
          {
            title: 'Total Projects',
            value: projectsCount,
            growth: 0,
            positive: true,
            bgColor: 'bg-purple-50',
            icon: <FolderOpen className="h-6 w-6 text-purple-600" />
          },
          {
            title: 'Active Users',
            value: usersCount,
            growth: 0,
            positive: true,
            bgColor: 'bg-blue-50',
            icon: <Users className="h-6 w-6 text-blue-600" />
          },
          {
            title: 'Map Layers',
            value: mapsCount,
            growth: 0,
            positive: true,
            bgColor: 'bg-green-50',
            icon: <MapPin className="h-6 w-6 text-green-600" />
          },
          {
            title: 'Data Sources',
            value: sourcesCount,
            growth: 0,
            positive: true,
            bgColor: 'bg-orange-50',
            icon: <Database className="h-6 w-6 text-orange-600" />
          }
        ]);
      } catch (error) {
        console.error('Failed to fetch LGU stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-0 sm:p-6 bg-white h-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="p-6 rounded-3xl shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-6 bg-white h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {stats.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer`}
            onClick={() => openPopup(stat.title)}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-700 text-md font-medium">{stat.title}</p>
              {stat.icon}
            </div>
            <div className="flex items-end justify-between gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tabular-nums tracking-tight">
                <Counter value={stat.value} />
              </h2>
              {stat.growth > 0 && (
                <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap bg-green-50 text-green-600">
                  +{stat.growth} ↗
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      <DataTablePopup
        isOpen={popupState.isOpen}
        onClose={closePopup}
        title={popupState.title}
        endpoint={popupState.endpoint}
        columns={popupState.columns}
      />
    </div>
  );
}
