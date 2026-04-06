"use client";

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import DataTablePopup from './DataTablePopup';
import MapDataDashboard from './MapDataDashboard';

interface StatData {
  title: string;
  value: number | string;
  growth: number;
  positive: boolean;
  bgColor: string;
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
  const [stats, setStats] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupState, setPopupState] = useState({
    isOpen: false,
    title: '',
    endpoint: '',
    columns: [] as { key: string; label: string; format?: 'date' | 'currency' | undefined }[]
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        // Check if data is an array, otherwise use empty array
        if (Array.isArray(data)) {
          setStats(data);
        } else {
          console.error('API did not return an array:', data);
          setStats([]);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
      case 'Total Tax Parcel':
        return {
          endpoint: '/api/stats/tax-parcels',
          columns: [
            { key: 'parcel_no', label: 'Parcel Number' },
            { key: 'owner_name', label: 'Owner Name' },
            { key: 'valuation', label: 'Valuation', format: 'currency' },
            { key: 'created_at', label: 'Created At', format: 'date' }
          ]
        };
      case 'CBMS Indicator':
        return {
          endpoint: '/api/stats/cbms-indicators',
          columns: [
            { key: 'indicator_code', label: 'Indicator Code' },
            { key: 'indicator_value', label: 'Value' },
            { key: 'status', label: 'Status' },
            { key: 'updated_at', label: 'Updated At', format: 'date' }
          ]
        };
      case 'Active Users':
        return {
          endpoint: '/api/stats/active-users',
          columns: [
            { key: 'username', label: 'Username' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            { key: 'created_at', label: 'Member Since', format: 'date' }
          ]
        };
      case 'System Uptime':
        return {
          endpoint: '/api/stats/system-logs',
          columns: [
            { key: 'actor', label: 'User' },
            { key: 'action', label: 'Action' },
            { key: 'details', label: 'Details' },
            { key: 'timestamp', label: 'Timestamp', format: 'date' }
          ]
        };
      default:
        return {
          endpoint: '',
          columns: []
        };
    }
  };

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
        {stats.length === 0 ? (
          ['Total Tax Parcel', 'CBMS Indicator', 'System Uptime', 'Active Users'].map((title, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => openPopup(title)}
            >
              <p className="text-black-500 text-md font-medium mb-2">{title}</p>
              <div className="flex items-end justify-between gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tabular-nums tracking-tight">
                  --
                </h2>
                <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap bg-gray-100 text-gray-600">
                  No data
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.bgColor} p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer`}
              onClick={() => openPopup(stat.title)}
            >
              <p className="text-black-500 text-md font-medium mb-2">{stat.title}</p>
              <div className="flex items-end justify-between gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tabular-nums tracking-tight">
                  <Counter value={stat.value} />
                </h2>
                <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                  stat.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {stat.positive ? '+' : '-'}{stat.growth}% {stat.positive ? '↗' : '↘'}
                </span>
              </div>
            </motion.div>
          ))
        )}
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