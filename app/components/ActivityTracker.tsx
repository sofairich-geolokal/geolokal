'use client';
import { useState, useEffect } from 'react';

interface Activity {
  id: number;
  session_id: string;
  activity_type: string;
  activity_data: any;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  map_bounds: any;
  zoom_level: number;
  active_layers: number[];
  duration_ms: number;
  users?: {
    id: number;
    username: string;
    email: string;
  };
  map_layers?: {
    id: number;
    layer_name: string;
  };
}

interface ActivityStats {
  activity_type: string;
  count: number;
}

const ActivityTracker = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ActivityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    activity_type: '',
    session_id: '',
    limit: '50',
  });

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.activity_type) params.append('activity_type', filter.activity_type);
      if (filter.session_id) params.append('session_id', filter.session_id);
      if (filter.limit) params.append('limit', filter.limit);

      const response = await fetch(`/api/activity?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.data);
        setStats(data.stats || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      view: '👁️',
      zoom: '🔍',
      pan: '🤚',
      layer_toggle: '🔄',
      measurement: '📏',
      draw: '✏️',
      download: '💾',
      export_config: '📤',
      projection_change: '🌐',
      layer_opacity_change: '🎨',
      draw_edit: '✏️',
      draw_delete: '🗑️',
    };
    return icons[type] || '📄';
  };

  const formatDuration = (ms: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActivityTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const exportActivities = () => {
    const csv = [
      'Timestamp,Session ID,Activity Type,User,IP Address,Duration,Zoom Level,Active Layers',
      ...activities.map(activity => [
        formatTimestamp(activity.timestamp),
        activity.session_id,
        getActivityTypeLabel(activity.activity_type),
        activity.users?.username || 'Anonymous',
        activity.ip_address,
        formatDuration(activity.duration_ms || 0),
        activity.zoom_level || 'N/A',
        (activity.active_layers || []).join(';'),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Activity Tracker & Audit Log</h2>
        <button
          onClick={exportActivities}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
          <select
            value={filter.activity_type}
            onChange={(e) => setFilter({ ...filter, activity_type: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="view">View</option>
            <option value="zoom">Zoom</option>
            <option value="pan">Pan</option>
            <option value="layer_toggle">Layer Toggle</option>
            <option value="measurement">Measurement</option>
            <option value="draw">Drawing</option>
            <option value="download">Download</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Session ID</label>
          <input
            type="text"
            value={filter.session_id}
            onChange={(e) => setFilter({ ...filter, session_id: e.target.value })}
            placeholder="Filter by session"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
          <select
            value={filter.limit}
            onChange={(e) => setFilter({ ...filter, limit: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={() => setFilter({ activity_type: '', session_id: '', limit: '50' })}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Activity Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {stats.map((stat) => (
            <div key={stat.activity_type} className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getActivityIcon(stat.activity_type)}</span>
                <div>
                  <div className="text-xs text-gray-600">{getActivityTypeLabel(stat.activity_type)}</div>
                  <div className="text-lg font-bold text-blue-600">{stat.count}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No activities found</div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
                    <span className="font-medium text-gray-800">
                      {getActivityTypeLabel(activity.activity_type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Session:</span> {activity.session_id}
                    </div>
                    <div>
                      <span className="font-medium">User:</span> {activity.users?.username || 'Anonymous'}
                    </div>
                    <div>
                      <span className="font-medium">IP:</span> {activity.ip_address}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {formatDuration(activity.duration_ms || 0)}
                    </div>
                    <div>
                      <span className="font-medium">Zoom:</span> {activity.zoom_level || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Layers:</span> {(activity.active_layers || []).length} active
                    </div>
                  </div>
                  
                  {activity.map_layers && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Layer:</span> {activity.map_layers.layer_name}
                    </div>
                  )}
                  
                  {activity.activity_data && Object.keys(activity.activity_data).length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Details:</span>
                      <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(activity.activity_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityTracker;
