'use client';
import { useState, useEffect } from 'react';
import shp from 'shpjs';

interface ExportLayer {
  id: number;
  layer_name: string;
  layer_type: string;
  is_downloadable: boolean;
  bbox?: any;
}

interface ExportRequest {
  layers: number[];
  format: 'shapefile' | 'geojson' | 'kml' | 'csv' | 'geopackage';
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  projection?: string;
  includeAttributes?: boolean;
  email?: string;
}

const DataExport = () => {
  const [layers, setLayers] = useState<ExportLayer[]>([]);
  const [selectedLayers, setSelectedLayers] = useState<number[]>([]);
  const [exportSettings, setExportSettings] = useState<ExportRequest>({
    layers: [],
    format: 'geojson',
    includeAttributes: true,
    projection: 'EPSG:4326',
  });
  const [loading, setLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchLayers();
    fetchExportHistory();
  }, []);

  const fetchLayers = async () => {
    try {
      const response = await fetch('/api/layers');
      const data = await response.json();
      
      if (data.success) {
        setLayers(data.data.filter((layer: ExportLayer) => layer.is_downloadable));
      }
    } catch (error) {
      console.error('Failed to fetch layers:', error);
    }
  };

  const fetchExportHistory = async () => {
    try {
      const response = await fetch('/api/exports/history');
      const data = await response.json();
      
      if (data.success) {
        setExportHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch export history:', error);
    }
  };

  const handleLayerToggle = (layerId: number) => {
    setSelectedLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  const handleExport = async () => {
    if (selectedLayers.length === 0) {
      alert('Please select at least one layer to export.');
      return;
    }

    setLoading(true);
    
    try {
      const exportRequest: ExportRequest = {
        ...exportSettings,
        layers: selectedLayers,
      };

      const response = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportRequest),
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.download_url) {
          // Direct download
          window.open(result.download_url, '_blank');
        } else if (result.email_sent) {
          alert('Export request submitted. Download link will be sent to your email.');
        }
        
        fetchExportHistory();
      } else {
        alert('Export failed: ' + result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleData = async (format: string) => {
    try {
      const response = await fetch(`/api/exports/sample?format=${format}`);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sample-data.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Sample download error:', error);
    }
  };

  const getFormatDescription = (format: string) => {
    const descriptions: { [key: string]: string } = {
      shapefile: 'ESRI Shapefile - Standard GIS format with multiple files',
      geojson: 'GeoJSON - Web-friendly format for geographic data',
      kml: 'KML - Google Earth format',
      csv: 'CSV - Comma-separated values with coordinates',
      geopackage: 'GeoPackage - Modern GIS container format',
    };
    return descriptions[format] || '';
  };

  const getFormatIcon = (format: string) => {
    const icons: { [key: string]: string } = {
      shapefile: '📁',
      geojson: '🌐',
      kml: '🗺️',
      csv: '📊',
      geopackage: '📦',
    };
    return icons[format] || '📄';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Data Download & Export</h2>

      {/* Layer Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Select Layers to Export</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedLayers.includes(layer.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleLayerToggle(layer.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{layer.layer_name}</div>
                  <div className="text-sm text-gray-600">{layer.layer_type.toUpperCase()}</div>
                </div>
                <div className="text-lg">
                  {selectedLayers.includes(layer.id) ? '✅' : '⬜'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {layers.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No downloadable layers available
          </div>
        )}

        <div className="text-sm text-gray-600">
          Selected: {selectedLayers.length} layer(s)
        </div>
      </div>

      {/* Export Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Export Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="space-y-2">
              {(['shapefile', 'geojson', 'kml', 'csv', 'geopackage'] as const).map((format) => (
                <label key={format} className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="format"
                    value={format}
                    checked={exportSettings.format === format}
                    onChange={(e) => setExportSettings({ ...exportSettings, format: e.target.value as any })}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFormatIcon(format)}</span>
                      <span className="font-medium text-gray-800">{format.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-gray-600">{getFormatDescription(format)}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Basic Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Basic Options
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Projection</label>
                <select
                  value={exportSettings.projection}
                  onChange={(e) => setExportSettings({ ...exportSettings, projection: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="EPSG:4326">EPSG:4326 (WGS 84)</option>
                  <option value="EPSG:3857">EPSG:3857 (Web Mercator)</option>
                  <option value="EPSG:3123">EPSG:3123 (Philippines Zone III)</option>
                  <option value="EPSG:3124">EPSG:3124 (Philippines Zone IV)</option>
                  <option value="EPSG:3125">EPSG:3125 (Philippines Zone V)</option>
                </select>
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportSettings.includeAttributes}
                  onChange={(e) => setExportSettings({ ...exportSettings, includeAttributes: e.target.checked })}
                  className="mr-2"
                />
                Include attribute data
              </label>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={exportSettings.email || ''}
                  onChange={(e) => setExportSettings({ ...exportSettings, email: e.target.value })}
                  placeholder="Receive download link via email"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mt-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Bounding Box (optional)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">North</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Max latitude"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">South</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Min latitude"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">East</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Max longitude"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">West</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Min longitude"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mt-6">
          <button
            onClick={handleExport}
            disabled={loading || selectedLayers.length === 0}
            className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : '📤 Export Data'}
          </button>
        </div>
      </div>

      {/* Sample Data */}
      <div className="mb-8 border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Sample Data Downloads</h3>
        <p className="text-sm text-gray-600 mb-4">
          Download sample datasets in different formats to test compatibility with your GIS software.
        </p>
        <div className="flex flex-wrap gap-3">
          {(['geojson', 'shapefile', 'kml', 'csv'] as const).map((format) => (
            <button
              key={format}
              onClick={() => downloadSampleData(format)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
            >
              {getFormatIcon(format)} Sample {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Export History */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Export History</h3>
        
        {exportHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No export history</div>
        ) : (
          <div className="space-y-2">
            {exportHistory.map((export_item) => (
              <div key={export_item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">
                      {export_item.layers?.length || 0} layer(s) - {export_item.format?.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(export_item.created_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {export_item.status || 'Processing'}
                    </div>
                  </div>
                  {export_item.download_url && (
                    <a
                      href={export_item.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Guidelines */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Usage Guidelines</h3>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Data Usage Terms</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Data is provided for research, planning, and educational purposes</li>
            <li>• Commercial use requires explicit permission from data owners</li>
            <li>• Always cite the data source in your outputs</li>
            <li>• Some datasets may have usage restrictions or licensing requirements</li>
            <li>• Large exports may take time to process and will be sent via email</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataExport;
