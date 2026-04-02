'use client';
import { useState, useEffect, useRef } from 'react';

interface Layer3D {
  id: number;
  name: string;
  type: 'terrain' | 'imagery' | 'vector' | 'model3d';
  url: string;
  visible: boolean;
  opacity: number;
  style?: any;
}

interface ViewSettings {
  longitude: number;
  latitude: number;
  height: number;
  heading: number;
  pitch: number;
  roll: number;
}

const Map3DViewer = () => {
  const [layers, setLayers] = useState<Layer3D[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<Layer3D | null>(null);
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    longitude: 120.9842,
    latitude: 14.5995,
    height: 10000,
    heading: 0,
    pitch: -45,
    roll: 0,
  });
  const [showControls, setShowControls] = useState(true);
  const [terrainEnabled, setTerrainEnabled] = useState(true);
  const [atmosphereEnabled, setAtmosphereEnabled] = useState(true);
  const [fogEnabled, setFogEnabled] = useState(true);
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const cesiumViewerRef = useRef<any>(null);

  useEffect(() => {
    initialize3DMap();
    loadDefaultLayers();
    
    return () => {
      if (cesiumViewerRef.current) {
        cesiumViewerRef.current.destroy();
      }
    };
  }, []);

  const initialize3DMap = () => {
    // This would initialize CesiumJS in a real implementation
    // For now, we'll create a placeholder
    console.log('Initializing 3D map viewer...');
    
    // Mock Cesium viewer initialization
    setTimeout(() => {
      console.log('3D map initialized');
    }, 1000);
  };

  const loadDefaultLayers = () => {
    const defaultLayers: Layer3D[] = [
      {
        id: 1,
        name: 'Satellite Imagery',
        type: 'imagery',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        visible: true,
        opacity: 1.0,
      },
      {
        id: 2,
        name: 'Philippine Terrain',
        type: 'terrain',
        url: 'https://tiles.arcgis.com/tiles/.../terrain',
        visible: true,
        opacity: 1.0,
      },
      {
        id: 3,
        name: 'Building Footprints',
        type: 'vector',
        url: '/api/layers/3d/buildings',
        visible: false,
        opacity: 0.8,
      },
    ];
    
    setLayers(defaultLayers);
  };

  const handleLayerToggle = (layerId: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const handleOpacityChange = (layerId: number, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, opacity } : layer
    ));
  };

  const flyToLocation = (longitude: number, latitude: number, height: number = 1000) => {
    setViewSettings(prev => ({
      ...prev,
      longitude,
      latitude,
      height,
    }));
    
    // In real implementation, this would trigger Cesium camera flyTo
    console.log(`Flying to: ${longitude}, ${latitude} at ${height}m`);
  };

  const resetView = () => {
    setViewSettings({
      longitude: 120.9842,
      latitude: 14.5995,
      height: 10000,
      heading: 0,
      pitch: -45,
      roll: 0,
    });
  };

  const captureScreenshot = () => {
    // In real implementation, this would capture Cesium canvas
    const link = document.createElement('a');
    link.download = `3d-map-${Date.now()}.png`;
    link.href = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    link.click();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cesiumContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const getLayerIcon = (type: string) => {
    const icons = {
      terrain: '⛰️',
      imagery: '🗺️',
      vector: '📊',
      model3d: '🏗️',
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '800px' }}>
      {/* 3D Map Container */}
      <div 
        ref={cesiumContainerRef}
        className="relative w-full h-full bg-gradient-to-b from-blue-400 to-blue-600"
      >
        {/* Placeholder for Cesium viewer */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-6xl mb-4">🌍</div>
            <div className="text-xl font-semibold">3D Map Viewer</div>
            <div className="text-sm opacity-75 mt-2">CesiumJS would be initialized here</div>
            <div className="mt-4 text-xs opacity-50">
              Current View: {viewSettings.latitude.toFixed(4)}, {viewSettings.longitude.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-3">3D Layers</h3>
          <div className="space-y-2">
            {layers.map((layer) => (
              <div key={layer.id} className="border-b pb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getLayerIcon(layer.type)}</span>
                    <span className="text-sm font-medium text-gray-700">{layer.name}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={() => handleLayerToggle(layer.id)}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Opacity:</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={layer.opacity}
                    onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                    className="flex-1 text-xs"
                  />
                  <span className="text-xs text-gray-500">{layer.opacity.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Controls */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">View Controls</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (m)</label>
              <input
                type="number"
                value={viewSettings.height}
                onChange={(e) => setViewSettings({ ...viewSettings, height: parseInt(e.target.value) || 1000 })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                min="100"
                max="50000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heading (°)</label>
              <input
                type="number"
                value={viewSettings.heading}
                onChange={(e) => setViewSettings({ ...viewSettings, heading: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                min="0"
                max="360"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pitch (°)</label>
              <input
                type="number"
                value={viewSettings.pitch}
                onChange={(e) => setViewSettings({ ...viewSettings, pitch: parseInt(e.target.value) || -45 })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                min="-90"
                max="90"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={terrainEnabled}
                  onChange={(e) => setTerrainEnabled(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Terrain</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={atmosphereEnabled}
                  onChange={(e) => setAtmosphereEnabled(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Atmosphere</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={fogEnabled}
                  onChange={(e) => setFogEnabled(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Fog</span>
              </label>
            </div>

            <button
              onClick={resetView}
              className="w-full bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-sm"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Quick Location Buttons */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">Quick Locations</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => flyToLocation(120.9842, 14.5995, 5000)}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-xs"
            >
              Manila
            </button>
            <button
              onClick={() => flyToLocation(123.8854, 10.3157, 5000)}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-xs"
            >
              Cebu
            </button>
            <button
              onClick={() => flyToLocation(125.6128, 7.0731, 5000)}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-xs"
            >
              Davao
            </button>
            <button
              onClick={() => flyToLocation(120.8942, 16.4167, 8000)}
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-xs"
            >
              Baguio
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={captureScreenshot}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            title="Capture Screenshot"
          >
            📸
          </button>
          <button
            onClick={toggleFullscreen}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            title="Toggle Fullscreen"
          >
            🔳
          </button>
          <button
            onClick={() => setShowControls(!showControls)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            title="Toggle Controls"
          >
            ⚙️
          </button>
        </div>

        {/* Coordinate Display */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm">
          <div>Lat: {viewSettings.latitude.toFixed(4)}</div>
          <div>Lng: {viewSettings.longitude.toFixed(4)}</div>
          <div>Alt: {viewSettings.height}m</div>
        </div>

        {/* Performance Stats */}
        <div className="absolute top-4 right-1/2 transform translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-xs">
          <div>FPS: 60</div>
          <div>Terrain Tiles: 45</div>
          <div>Features: 1,234</div>
        </div>
      </div>
    </div>
  );
};

export default Map3DViewer;
