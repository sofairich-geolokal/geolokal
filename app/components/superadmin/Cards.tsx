"use client";

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Users, MapPin, FolderOpen, Activity, Database, TrendingUp } from 'lucide-react';

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

export default function SuperadminCards() {
  const [stats, setStats] = useState<StatData[]>([
    {
      title: 'Total Users',
      value: 0,
      growth: 0,
      positive: true,
      bgColor: 'bg-blue-50',
      icon: <Users className="h-6 w-6 text-blue-600" />
    },
    {
      title: 'Active LGUs',
      value: 0,
      growth: 0,
      positive: true,
      bgColor: 'bg-green-50',
      icon: <MapPin className="h-6 w-6 text-green-600" />
    },
    {
      title: 'Total Projects',
      value: 0,
      growth: 0,
      positive: true,
      bgColor: 'bg-purple-50',
      icon: <FolderOpen className="h-6 w-6 text-purple-600" />
    },
    {
      title: 'System Activities',
      value: 0,
      growth: 0,
      positive: true,
      bgColor: 'bg-orange-50',
      icon: <Activity className="h-6 w-6 text-orange-600" />
    }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/superadmin/dashboard/stats', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data) {
          setStats([
            {
              title: 'Total Users',
              value: data.users?.total_users || 0,
              growth: data.users?.new_users_30_days || 0,
              positive: true,
              bgColor: 'bg-blue-50',
              icon: <Users className="h-6 w-6 text-blue-600" />
            },
            {
              title: 'Active LGUs',
              value: data.lgus?.active_lgus || 0,
              growth: 0,
              positive: true,
              bgColor: 'bg-green-50',
              icon: <MapPin className="h-6 w-6 text-green-600" />
            },
            {
              title: 'Total Projects',
              value: data.projects?.total_projects || 0,
              growth: data.projects?.new_projects_30_days || 0,
              positive: true,
              bgColor: 'bg-purple-50',
              icon: <FolderOpen className="h-6 w-6 text-purple-600" />
            },
            {
              title: 'System Activities',
              value: data.activities?.total_activities || 0,
              growth: data.activities?.activities_7_days || 0,
              positive: true,
              bgColor: 'bg-orange-50',
              icon: <Activity className="h-6 w-6 text-orange-600" />
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch superadmin stats:', error);
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
            className={`${stat.bgColor} p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300`}
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
    </div>
  );
}
