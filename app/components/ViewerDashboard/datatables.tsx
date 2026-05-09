"use client";

import { useState, useEffect } from "react";

interface Layer {
  id: number;
  layer_name: string;
  layer_type: string;
  category_id?: number;
  lgu_id?: number;
  metadata?: any;
  is_visible: boolean;
}

interface LayerAttribute {
  id: number;
  layer_id: number;
  attribute_name: string;
  attribute_type: string;
  attribute_value: any;
  created_at?: string;
}

const Datatables = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [layerAttributes, setLayerAttributes] = useState<LayerAttribute[]>([]);
  const [loadingLayers, setLoadingLayers] = useState(true);
  
  // Initialize with mock data on component mount
  useEffect(() => {
    initializeMockData();
  }, []);

  // Fetch attributes when layer selection changes
  useEffect(() => {
    if (selectedLayer && selectedLayer !== 'all') {
      fetchLayerAttributes(selectedLayer);
    }
  }, [selectedLayer]);

  const initializeMockData = () => {
    const mockLayers = [
      {
        id: 1,
        layer_name: 'Ibaan Boundary',
        layer_type: 'boundary',
        is_visible: true,
        category_id: 1,
        lgu_id: 1,
        metadata: { source: 'official', year: 2023 }
      },
      {
        id: 2,
        layer_name: 'Ibaan Road Network',
        layer_type: 'road',
        is_visible: true,
        category_id: 2,
        lgu_id: 1,
        metadata: { source: 'GIS', year: 2023 }
      },
      {
        id: 3,
        layer_name: 'Ibaan Waterways',
        layer_type: 'waterway',
        is_visible: true,
        category_id: 3,
        lgu_id: 1,
        metadata: { source: 'hydrology', year: 2023 }
      },
      {
        id: 4,
        layer_name: 'Buildings',
        layer_type: 'building',
        is_visible: true,
        category_id: 4,
        lgu_id: 1,
        metadata: { source: 'satellite', year: 2023 }
      },
      {
        id: 5,
        layer_name: 'Land Use',
        layer_type: 'landuse',
        is_visible: true,
        category_id: 5,
        lgu_id: 1,
        metadata: { source: 'planning', year: 2023 }
      }
    ];
    setLayers(mockLayers);
    setLoadingLayers(false);
  };

  const fetchLayerAttributes = async (layerId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/layer-attributes?layerId=${layerId}`);
      const result = await response.json();
      
      if (result.success) {
        setLayerAttributes(result.data);
        setAllData(result.data);
      } else {
        setError('Failed to fetch layer attributes');
      }
    } catch (err) {
      console.error('Error fetching layer attributes:', err);
      setError('Error loading layer attributes');
    } finally {
      setLoading(false);
    }
  };

  
  const itemsPerPage = 15;
  const totalItems = allData.length;

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = allData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(totalItems / itemsPerPage);


  return (
    <div className="flex flex-col bg-white">
      {/* Layer Selector */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <label htmlFor="layer-select" className="text-sm font-medium text-gray-700">
            Select Layer:
          </label>
          <select
            id="layer-select"
            value={selectedLayer}
            onChange={(e) => {
              setSelectedLayer(e.target.value);
              setCurrentPage(1); // Reset to first page when layer changes
            }}
            disabled={loadingLayers}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">Select a layer...</option>
            {layers.map((layer) => (
              <option key={layer.id} value={layer.id.toString()}>
                {layer.layer_name} ({layer.layer_type})
              </option>
            ))}
          </select>
          {loadingLayers && (
            <span className="text-sm text-gray-500">Loading layers...</span>
          )}
        </div>
      </div>

      {/* Data Table Card */}
      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">
              Loading layer attributes...
            </div>
          </div>
        ) : selectedLayer === 'all' || !selectedLayer ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Please select a layer to view its attributes</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <div className="overflow-x-auto h-auto">
            <table className="min-w-full">
              <thead className="font-bold">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Attribute
                  </th>
                  {currentData.map((item, index) => (
                    <th key={item.id || index} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {item.attribute_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b border-gray-100">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                    Value
                  </td>
                  {currentData.map((item, index) => (
                    <td key={`value-${item.id || index}`} className="px-4 py-3 text-sm text-gray-900">
                      {item.attribute_type === 'date' 
                        ? new Date(item.attribute_value).toLocaleDateString()
                        : item.attribute_type === 'number'
                        ? typeof item.attribute_value === 'number' 
                          ? item.attribute_value.toLocaleString()
                          : item.attribute_value
                        : item.attribute_value
                      }
                    </td>
                  ))}
                </tr>
                <tr className="bg-blue-50 border-b border-gray-100">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                    Type
                  </td>
                  {currentData.map((item, index) => (
                    <td key={`type-${item.id || index}`} className="px-4 py-3 text-sm text-gray-600">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {item.attribute_type}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="bg-white border-b border-gray-100">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                    Created Date
                  </td>
                  {currentData.map((item, index) => (
                    <td key={`date-${item.id || index}`} className="px-4 py-3 text-sm text-gray-600">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination - Fixed at bottom */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 sticky">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm rounded-md ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === page
                    ? 'bg-[#318855] text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-sm rounded-md ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Datatables;