"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GeoportalLayer {
  id: string;
  title: string;
  description?: string;
  abstract?: string;
  keywords?: string;
  data_type: string;
  agency: string;
  download_url?: string;
  service_url?: string;
  metadata_url?: string;
  bbox_xmin?: number;
  bbox_ymin?: number;
  bbox_xmax?: number;
  bbox_ymax?: number;
  coordinate_system?: string;
  last_updated: string;
  is_active: boolean;
  categories?: Array<{ name: string; category_id: string }>;
}

interface Filters {
  search: string;
  agency: string;
  data_type: string;
  category: string;
  has_download: boolean;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data: GeoportalLayer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    agencies: Array<{ agency: string; count: number }>;
    dataTypes: Array<{ data_type: string; count: number }>;
    categories: Array<{ name: string; count: number }>;
  };
}

export default function GeoportalExplorer() {
  const [layers, setLayers] = useState<GeoportalLayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    agency: '',
    data_type: '',
    category: '',
    has_download: false
  });
  const [availableFilters, setAvailableFilters] = useState<ApiResponse['filters']>({
    agencies: [],
    dataTypes: [],
    categories: []
  });
  const [pagination, setPagination] = useState<ApiResponse['pagination']>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [selectedLayer, setSelectedLayer] = useState<GeoportalLayer | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  // Fetch layers
  const fetchLayers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.agency && { agency: filters.agency }),
        ...(filters.data_type && { data_type: filters.data_type }),
        ...(filters.category && { category: filters.category }),
        ...(filters.has_download && { has_download: 'true' })
      });

      const response = await fetch(`/api/geoportal/layers?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setLayers(data.data);
        setPagination(data.pagination);
        setAvailableFilters(data.filters);
      } else {
        throw new Error(data.message || 'Failed to fetch layers');
      }
    } catch (error) {
      console.error('Error fetching layers:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/geoportal/sync');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  // Trigger sync
  const triggerSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/geoportal/sync', { method: 'POST' });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Sync completed:', data.message);
        // Refresh data after sync
        await fetchLayers(pagination.page);
        await fetchSyncStatus();
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchLayers(page);
  };

  // Initial data fetch
  useEffect(() => {
    fetchLayers();
    fetchSyncStatus();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (pagination.page === 1) {
      fetchLayers(1);
    } else {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchLayers(1);
    }
  }, [filters]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Geoportal Data Explorer</h1>
          <p className="text-gray-600">Browse and search geospatial data from the Philippine Geoportal</p>
          
          {/* Sync Status */}
          {syncStatus && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Last sync: {syncStatus.syncStatus?.sync_date ? 
                      formatDate(syncStatus.syncStatus.sync_date) : 
                      'No sync performed'
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    Total layers: {syncStatus.statistics?.total_layers || 0} | 
                    Active: {syncStatus.statistics?.active_layers || 0}
                  </p>
                </div>
                <button
                  onClick={triggerSync}
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {syncing ? 'Syncing...' : 'Sync Data'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search layers..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
              <select
                value={filters.agency}
                onChange={(e) => handleFilterChange('agency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Agencies</option>
                {availableFilters.agencies.map(agency => (
                  <option key={agency.agency} value={agency.agency}>
                    {agency.agency} ({agency.count})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
              <select
                value={filters.data_type}
                onChange={(e) => handleFilterChange('data_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {availableFilters.dataTypes.map(type => (
                  <option key={type.data_type} value={type.data_type}>
                    {type.data_type} ({type.count})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {availableFilters.categories.map(category => (
                  <option key={category.name} value={category.name}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.has_download}
                onChange={(e) => handleFilterChange('has_download', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Only show downloadable layers</span>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Layers List */}
        {!loading && !error && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing {layers.length} of {pagination.total} layers
              </p>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence>
                {layers.map((layer, index) => (
                  <motion.div
                    key={layer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedLayer(layer)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{layer.title}</h3>
                        
                        {layer.description && (
                          <p className="text-gray-600 mb-2 line-clamp-2">{layer.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {layer.data_type}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {layer.agency}
                          </span>
                          {layer.download_url && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Downloadable
                            </span>
                          )}
                          {layer.categories?.map(cat => (
                            <span key={cat.category_id} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                              {cat.name}
                            </span>
                          ))}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Last updated: {formatDate(layer.last_updated)}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        {layer.download_url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle download
                              window.open(layer.download_url, '_blank');
                            }}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                          >
                            Download
                          </button>
                        )}
                        
                        {layer.metadata_url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(layer.metadata_url, '_blank');
                            }}
                            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                          >
                            Metadata
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Layer Detail Modal */}
        <AnimatePresence>
          {selectedLayer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedLayer(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedLayer.title}</h2>
                    <button
                      onClick={() => setSelectedLayer(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedLayer.description && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                        <p className="text-gray-600">{selectedLayer.description}</p>
                      </div>
                    )}
                    
                    {selectedLayer.abstract && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Abstract</h3>
                        <p className="text-gray-600">{selectedLayer.abstract}</p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Properties</h3>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="font-medium text-gray-700">Agency:</dt>
                          <dd className="text-gray-600">{selectedLayer.agency}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">Data Type:</dt>
                          <dd className="text-gray-600">{selectedLayer.data_type}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">Coordinate System:</dt>
                          <dd className="text-gray-600">{selectedLayer.coordinate_system || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">Last Updated:</dt>
                          <dd className="text-gray-600">{formatDate(selectedLayer.last_updated)}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    {selectedLayer.keywords && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Keywords</h3>
                        <p className="text-gray-600">{selectedLayer.keywords}</p>
                      </div>
                    )}
                    
                    {selectedLayer.categories && selectedLayer.categories.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Categories</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedLayer.categories.map(cat => (
                            <span key={cat.category_id} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-4">
                      {selectedLayer.download_url && (
                        <button
                          onClick={() => window.open(selectedLayer.download_url, '_blank')}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Download Data
                        </button>
                      )}
                      {selectedLayer.service_url && (
                        <button
                          onClick={() => window.open(selectedLayer.service_url, '_blank')}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          View Service
                        </button>
                      )}
                      {selectedLayer.metadata_url && (
                        <button
                          onClick={() => window.open(selectedLayer.metadata_url, '_blank')}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          View Metadata
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
