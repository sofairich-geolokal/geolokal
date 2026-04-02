'use client';
import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Ruler, 
  Target, 
  Globe, 
  Download,
  Share2,
  Crosshair,
  Layers,
  Settings,
  X
} from 'lucide-react';

interface BufferSettings {
  distance: number;
  unit: 'kilometers' | 'meters' | 'miles' | 'feet';
  type: 'point' | 'line' | 'polygon' | 'circle';
}

interface GotoXYSettings {
  latitude: string;
  longitude: string;
}

interface MeasurementSettings {
  type: 'area' | 'distance';
  result: string;
}

interface BasemapSettings {
  selected: string;
}

const AdvancedToolsPanel = () => {
  const map = useMap();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Tool states
  const [bufferSettings, setBufferSettings] = useState<BufferSettings>({
    distance: 1,
    unit: 'kilometers',
    type: 'point'
  });
  
  const [gotoXYSettings, setGotoXYSettings] = useState<GotoXYSettings>({
    latitude: '',
    longitude: ''
  });
  
  const [measurementSettings, setMeasurementSettings] = useState<MeasurementSettings>({
    type: 'distance',
    result: ''
  });
  
  const [basemapSettings, setBasemapSettings] = useState<BasemapSettings>({
    selected: 'OpenStreetMap'
  });

  const basemaps = [
    { name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
    { name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
    { name: 'Philippine Basemap', url: 'https://geoportal.gov.ph/arcgis/rest/services/Basemap/Philippine_Basemap/MapServer/tile/{z}/{y}/{x}' },
    { name: 'GeoNode Streets', url: process.env.NEXT_PUBLIC_GEONODE_URL + '/geoserver/wms' },
    { name: 'GeoNode Satellite', url: process.env.NEXT_PUBLIC_GEONODE_URL + '/geoserver/wms' },
    { name: 'NAMRIA Basemap', url: 'https://geoportal.gov.ph/arcgis/rest/services/Basemap/NAMRIA_Basemap/MapServer/tile/{z}/{y}/{x}' }
  ];

  const units = [
    { value: 'kilometers', label: 'Kilometers' },
    { value: 'meters', label: 'Meters' },
    { value: 'miles', label: 'Miles' },
    { value: 'feet', label: 'Feet' }
  ];

  const bufferTypes = [
    { value: 'point', label: 'Point' },
    { value: 'line', label: 'Line' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'circle', label: 'Circle' }
  ];

  const tools = [
    { id: 'basemap', icon: Globe, title: 'Basemap' },
    { id: 'measure', icon: Ruler, title: 'Measurement' },
    { id: 'goto', icon: Crosshair, title: 'Goto XY' },
    { id: 'target', icon: Target, title: 'Target' },
    { id: 'download', icon: Download, title: 'Download' },
    { id: 'share', icon: Share2, title: 'Share' }
  ];

  const handleBufferCreate = () => {
    console.log('Creating buffer:', bufferSettings);
    // TODO: Implement buffer creation logic
    // This would involve creating a buffer around selected geometry
    // using the specified distance and unit
  };

  const handleGotoXY = () => {
    const lat = parseFloat(gotoXYSettings.latitude);
    const lng = parseFloat(gotoXYSettings.longitude);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], 15);
      L.marker([lat, lng]).addTo(map)
        .bindPopup(`Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        .openPopup();
    }
  };

  const handleMeasurement = () => {
    console.log('Starting measurement:', measurementSettings.type);
    // TODO: Implement measurement logic
    // This would enable drawing tools for area or distance measurement
  };

  const handleBasemapChange = (basemapName: string) => {
    setBasemapSettings({ selected: basemapName });
    
    // Find the basemap configuration
    const basemap = basemaps.find(b => b.name === basemapName);
    if (basemap) {
      // Remove existing tile layers
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });
      
      // Add new basemap
      if (basemap.name.includes('GeoNode')) {
        // For GeoNode WMS layers
        L.tileLayer.wms(basemap.url, {
          layers: basemap.name.includes('Streets') ? 'geonode:streets' : 'geonode:satellite',
          format: 'image/png',
          transparent: false,
          attribution: 'GeoNode'
        }).addTo(map);
      } else {
        // For standard tile layers
        L.tileLayer(basemap.url, {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
      }
    }
  };

  const handleDownload = () => {
    // Get current map bounds and center
    const bounds = map.getBounds();
    const center = map.getCenter();
    const zoom = map.getZoom();
    
    // Create map configuration
    const mapConfig = {
      center: { lat: center.lat, lng: center.lng },
      zoom: zoom,
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      },
      basemap: basemapSettings.selected,
      timestamp: new Date().toISOString()
    };
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(mapConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geolokal-map-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const shareUrl = `${window.location.origin}?lat=${center.lat.toFixed(6)}&lng=${center.lng.toFixed(6)}&zoom=${zoom}&basemap=${basemapSettings.selected}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Map link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link');
    });
  };

  const handleTarget = () => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 15);
          L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup('Your Location')
            .openPopup();
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const renderToolContent = () => {
    switch (activeTool) {
      case 'buffer':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-gray-800">Buffer Analysis</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buffer Type
              </label>
              <select
                value={bufferSettings.type}
                onChange={(e) => setBufferSettings(prev => ({ 
                  ...prev, 
                  type: e.target.value as BufferSettings['type'] 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {bufferTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance
              </label>
              <input
                type="number"
                value={bufferSettings.distance}
                onChange={(e) => setBufferSettings(prev => ({ 
                  ...prev, 
                  distance: parseFloat(e.target.value) || 0 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={bufferSettings.unit}
                onChange={(e) => setBufferSettings(prev => ({ 
                  ...prev, 
                  unit: e.target.value as BufferSettings['unit'] 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {units.map(unit => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleBufferCreate}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              Create Buffer
            </button>
          </div>
        );

      case 'goto':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-gray-800">Goto XY</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="text"
                value={gotoXYSettings.latitude}
                onChange={(e) => setGotoXYSettings(prev => ({ 
                  ...prev, 
                  latitude: e.target.value 
                }))}
                placeholder="e.g., 14.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="text"
                value={gotoXYSettings.longitude}
                onChange={(e) => setGotoXYSettings(prev => ({ 
                  ...prev, 
                  longitude: e.target.value 
                }))}
                placeholder="e.g., 121.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleGotoXY}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              Go
            </button>
          </div>
        );

      case 'measure':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-gray-800">Measurement</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Measurement Type
              </label>
              <select
                value={measurementSettings.type}
                onChange={(e) => setMeasurementSettings(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'area' | 'distance' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="distance">Distance</option>
                <option value="area">Area</option>
              </select>
            </div>

            {measurementSettings.result && (
              <div className="p-3 bg-gray-100 rounded-md">
                <p className="text-sm font-medium text-gray-700">Result:</p>
                <p className="text-lg font-semibold text-gray-900">{measurementSettings.result}</p>
              </div>
            )}

            <button
              onClick={handleMeasurement}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              Start Measurement
            </button>
          </div>
        );

      case 'basemap':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-gray-800">Basemap</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Basemap
              </label>
              <select
                value={basemapSettings.selected}
                onChange={(e) => handleBasemapChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {basemaps.map(basemap => (
                  <option key={basemap.name} value={basemap.name}>
                    {basemap.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Advanced Tools</h3>
            <p className="text-sm text-gray-600">Select a tool from the icons above to get started.</p>
          </div>
        );
    }
  };

  const handleToolClick = (toolId: string) => {
    if (toolId === 'download') {
      handleDownload();
    } else if (toolId === 'share') {
      handleShare();
    } else {
      setActiveTool(activeTool === toolId ? null : toolId);
    }
  };

  return (
    <div className={`absolute right-4 top-4 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-80'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="font-semibold text-gray-800">Advanced Tools</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isCollapsed ? <Settings className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Tool Icons */}
      <div className={`flex ${isCollapsed ? 'flex-col' : 'flex-row'} gap-2 p-3 border-b border-gray-200`}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`p-2 rounded transition-colors ${
                activeTool === tool.id 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              title={tool.title}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Tool Content */}
      {!isCollapsed && (
        <div className="max-h-96 overflow-y-auto">
          {renderToolContent()}
        </div>
      )}
    </div>
  );
};

export default AdvancedToolsPanel;
