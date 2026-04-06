"use client";

import React, { useEffect, useState } from 'react';
import { Users, MapPin, FolderOpen, Activity, TrendingUp, Database } from 'lucide-react';

interface DashboardStats {
  users: {
    total_users: number;
    superadmin_count: number;
    lgu_count: number;
    viewer_count: number;
    new_users_30_days: number;
  };
  lgus: {
    total_lgus: number;
    active_lgus: number;
  };
  projects: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    new_projects_30_days: number;
  };
  maps: {
    total_maps: number;
    new_maps_30_days: number;
    unique_categories: number;
  };
  activities: {
    total_activities: number;
    activities_7_days: number;
    activities_today: number;
  };
  exports: {
    total_exports: number;
    exports_30_days: number;
  };
  storage: {
    total_geometry_size: number;
    total_data_size: number;
  };
  recentActivities: Array<{
    actor: string;
    action: string;
    details: string;
    formatted_date: string;
  }>;
  userGrowth: Array<{
    month: string;
    new_users: number;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/superadmin/dashboard/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setStats(data);
      } catch (error: any) {
        console.error('Dashboard fetch error:', error);
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-600">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Superadmin Dashboard</h1>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{stats.users.total_users}</p>
              <p className="text-xs text-blue-600 mt-1">+{stats.users.new_users_30_days} in 30 days</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Active LGUs</p>
              <p className="text-2xl font-bold text-green-900">{stats.lgus.active_lgus}</p>
              <p className="text-xs text-green-600 mt-1">of {stats.lgus.total_lgus} total</p>
            </div>
            <MapPin className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Total Projects</p>
              <p className="text-2xl font-bold text-purple-900">{stats.projects.total_projects}</p>
              <p className="text-xs text-purple-600 mt-1">{stats.projects.active_projects} active</p>
            </div>
            <FolderOpen className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Total Maps</p>
              <p className="text-2xl font-bold text-orange-900">{stats.maps.total_maps}</p>
              <p className="text-xs text-orange-600 mt-1">{stats.maps.unique_categories} categories</p>
            </div>
            <MapPin className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Superadmins</span>
              <span className="font-semibold text-red-600">{stats.users.superadmin_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">LGU Users</span>
              <span className="font-semibold text-blue-600">{stats.users.lgu_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Viewers</span>
              <span className="font-semibold text-green-600">{stats.users.viewer_count}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Activities</span>
              <span className="font-semibold">{stats.activities.total_activities}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last 7 Days</span>
              <span className="font-semibold">{stats.activities.activities_7_days}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Today</span>
              <span className="font-semibold">{stats.activities.activities_today}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-2">
          {stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <span className="font-medium text-gray-900">{activity.actor}</span>
                  <span className="text-gray-600 mx-2">•</span>
                  <span className="text-gray-700">{activity.action}</span>
                </div>
                <span className="text-sm text-gray-500">{activity.formatted_date}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activities</p>
          )}
        </div>
      </div>

      {/* Storage & Data Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Storage Usage</h3>
            <Database className="h-5 w-5 text-gray-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Geometry Data</span>
              <span className="font-medium">{formatBytes(stats.storage.total_geometry_size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Other Data</span>
              <span className="font-medium">{formatBytes(stats.storage.total_data_size)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Export Activity</h3>
            <TrendingUp className="h-5 w-5 text-gray-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Exports</span>
              <span className="font-medium">{stats.exports.total_exports}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last 30 Days</span>
              <span className="font-medium">{stats.exports.exports_30_days}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Project Status</h3>
            <Activity className="h-5 w-5 text-gray-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Active</span>
              <span className="font-medium text-green-600">{stats.projects.active_projects}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium text-blue-600">{stats.projects.completed_projects}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
