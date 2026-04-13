"use client";

import React, { useEffect, useState } from 'react';
import { Users, MapPin, FolderOpen, Activity, TrendingUp, Database, Server, Clock, Eye } from 'lucide-react';

interface AdminDashboardStats {
  users: {
    total_users: number;
    superadmin_count: number;
    admin_count: number;
    lgu_count: number;
    viewer_count: number;
    new_users_30_days: number;
    active_users_7_days: number;
    active_users: number;
  };
  lgus: {
    total_lgus: number;
    active_lgus: number;
    viewer_lgus: number;
    users_with_lgu: number;
  };
  projects: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    pending_projects: number;
    new_projects_30_days: number;
    updated_projects_7_days: number;
  };
  maps: {
    total_maps: number;
    new_maps_30_days: number;
    unique_categories: number;
    visible_maps: number;
    downloadable_maps: number;
    maps_with_owner: number;
  };
  activities: {
    total_activities: number;
    activities_7_days: number;
    activities_today: number;
    activities_1_hour: number;
    unique_actors: number;
    unique_actions: number;
  };
  exports: {
    total_exports: number;
    exports_30_days: number;
    completed_exports: number;
    pending_exports: number;
    active_exports: number;
  };
  storage: {
    total_geometry_size: number;
    total_metadata_size: number;
    layers_with_geometry: number;
    layers_with_metadata: number;
  };
  health: {
    active_contributors: number;
    daily_new_layers: number;
    weekly_updated_layers: number;
    daily_active_users: number;
  };
  recentActivities: Array<{
    actor: string;
    action: string;
    details: string;
    formatted_date: string;
    timestamp: string;
    time_category: string;
  }>;
  userGrowth: Array<{
    month: string;
    new_users: number;
    new_lgu_users: number;
    new_viewer_users: number;
  }>;
  projectActivity: Array<{
    month: string;
    created_projects: number;
    active_projects: number;
    completed_projects: number;
  }>;
  sourceStats: Array<{
    source_type: string;
    count: number;
    visible_count: number;
    percentage: number;
  }>;
  lastUpdated: string;
  dataRefreshInterval: string;
  apiVersion: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard', {
          credentials: 'include'
        });
        
        console.log('Admin Dashboard API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Admin Dashboard API error response:', errorText);
          throw new Error(`Failed to fetch admin dashboard data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error: any) {
        console.error('Admin Dashboard fetch error:', error);
        
        const errorDetails = {
          message: error?.message || 'Unknown error',
          stack: error?.stack || 'No stack trace',
          status: error?.status || 'No status',
          statusText: error?.statusText || 'No status text',
          name: error?.name || 'Unknown error type',
          toString: error?.toString?.() || 'Cannot convert error to string'
        };
        
        console.error('Error details:', errorDetails);
        
        const errorMessage = error?.message || 
          (typeof error === 'string' ? error : 'Failed to load admin dashboard data');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboardData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchAdminDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Admin Dashboard...</p>
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="bg-white px-2">
      <div className="px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Last updated: {new Date(stats.lastUpdated).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              Refresh: {stats.dataRefreshInterval}
            </div>
          </div>
        </div>
      
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{formatNumber(stats.users.total_users)}</p>
                <p className="text-xs text-blue-600 mt-1">+{stats.users.new_users_30_days} in 30 days</p>
                <p className="text-xs text-blue-600">{stats.users.active_users_7_days} active this week</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Active LGUs</p>
                <p className="text-2xl font-bold text-green-900">{formatNumber(stats.lgus.active_lgus)}</p>
                <p className="text-xs text-green-600 mt-1">of {stats.lgus.total_lgus} total</p>
                <p className="text-xs text-green-600">{stats.lgus.users_with_lgu} users with LGU</p>
              </div>
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Projects</p>
                <p className="text-2xl font-bold text-purple-900">{formatNumber(stats.projects.total_projects)}</p>
                <p className="text-xs text-purple-600 mt-1">{stats.projects.active_projects} active</p>
                <p className="text-xs text-purple-600">{stats.projects.completed_projects} completed</p>
              </div>
              <FolderOpen className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Total Maps</p>
                <p className="text-2xl font-bold text-orange-900">{formatNumber(stats.maps.total_maps)}</p>
                <p className="text-xs text-orange-600 mt-1">{stats.maps.visible_maps} visible</p>
                <p className="text-xs text-orange-600">{stats.maps.unique_categories} categories</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* System Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">System Activity</p>
                <p className="text-2xl font-bold text-red-900">{formatNumber(stats.activities.total_activities)}</p>
                <p className="text-xs text-red-600 mt-1">{stats.activities.activities_today} today</p>
                <p className="text-xs text-red-600">{stats.activities.activities_1_hour} last hour</p>
              </div>
              <Activity className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">Storage Usage</p>
                <p className="text-2xl font-bold text-indigo-900">{formatBytes(stats.storage.total_geometry_size + stats.storage.total_metadata_size)}</p>
                <p className="text-xs text-indigo-600 mt-1">Geometry: {formatBytes(stats.storage.total_geometry_size)}</p>
                <p className="text-xs text-indigo-600">Metadata: {formatBytes(stats.storage.total_metadata_size)}</p>
              </div>
              <Database className="h-8 w-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-teal-50 rounded-xl p-6 border border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-600 text-sm font-medium">Export Requests</p>
                <p className="text-2xl font-bold text-teal-900">{formatNumber(stats.exports.total_exports)}</p>
                <p className="text-xs text-teal-600 mt-1">{stats.exports.completed_exports} completed</p>
                <p className="text-xs text-teal-600">{stats.exports.pending_exports} pending</p>
              </div>
              <TrendingUp className="h-8 w-8 text-teal-600" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">System Health</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.health.daily_active_users)}</p>
                <p className="text-xs text-gray-600 mt-1">Daily active users</p>
                <p className="text-xs text-gray-600">{stats.health.active_contributors} contributors</p>
              </div>
              <Server className="h-8 w-8 text-gray-600" />
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
                <span className="font-semibold text-red-600">{formatNumber(stats.users.superadmin_count)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Admins</span>
                <span className="font-semibold text-purple-600">{formatNumber(stats.users.admin_count)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">LGU Users</span>
                <span className="font-semibold text-blue-600">{formatNumber(stats.users.lgu_count)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Viewers</span>
                <span className="font-semibold text-green-600">{formatNumber(stats.users.viewer_count)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources</h3>
            <div className="space-y-3">
              {stats.sourceStats.map((source, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600 capitalize">{source.source_type}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatNumber(source.count)}</span>
                    <span className="text-xs text-gray-500 ml-2">({source.percentage}%)</span>
                  </div>
                </div>
              ))}
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
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.time_category === 'Just now' ? 'bg-green-500' :
                      activity.time_category === 'Today' ? 'bg-blue-500' :
                      activity.time_category === 'This week' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <span className="font-medium text-gray-900">{activity.actor}</span>
                      <span className="text-gray-600 mx-2">·</span>
                      <span className="text-gray-700">{activity.action}</span>
                      {activity.details && (
                        <span className="text-gray-500 text-sm ml-2">({activity.details})</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">{activity.formatted_date}</span>
                    <div className="text-xs text-gray-400">{activity.time_category}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activities</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
