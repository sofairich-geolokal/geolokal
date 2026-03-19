"use client";

import React, { useState, useEffect } from 'react';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Direct import of MapRenderer
import MapRenderer from './MapRenderer';

// Create a simple map component without complex dynamic imports
const Map = () => {
  const [layers, setLayers] = useState({
    street: true,
    satellite: false,
    heatMap: false,
    buildings: false,
    measure: false,
    boundary: false,
    roadNetworks: false,
    waterways: false,
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<any[]>([]);

  useEffect(() => {
    // Load Leaflet on client side only
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        // Fix for default marker icon
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        setMapLoaded(true);
      });
    }
  }, []);

  const toggleLayer = (layerName: keyof typeof layers) => {
    setLayers(prevLayers => ({
      ...prevLayers,
      [layerName]: !prevLayers[layerName],
    }));
  };

  const selectCategory = (categoryName: string) => {
    setSelectedCategory(prevCategory => 
      prevCategory === categoryName ? null : categoryName
    );
  };

  const getHighlightIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'buildings': '/icons/building-highlight.svg',
      'heatMap': '/icons/map-pin-green.svg',
      'measure': '/icons/signpost-orange.svg',
      'boundary': '/icons/signpost-green.svg',
      'roadNetworks': '/icons/signpost-gray.svg',
      'waterways': '/icons/signpost-blue.svg',
      'drawTools': '/icons/draw-tool-highlight.svg',
      'measureTool': '/icons/measure-tool-highlight.svg',
      'analysisPanel': '/icons/analysis-panel-highlight.svg',
    };
    return iconMap[categoryName] || '/icons/map-pin-green.svg';
  };

  const toggleAnalysis = () => {
    setShowAnalysis(!showAnalysis);
  };

  const toggleDrawMode = () => {
    setDrawMode(!drawMode);
    setMeasureMode(false); // Only one mode at a time
  };

  const toggleMeasureMode = () => {
    setMeasureMode(!measureMode);
    setDrawMode(false); // Only one mode at a time
  };

  const clearSelection = () => {
    setSelectedFeatures([]);
  };

  if (!mapLoaded) {
    return (
      <div className="relative  w-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full 
    bg-gray-100 overflow-hidden">
      {/* Layer Controls Panel */} 
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 w-64 
      max-h-[calc(80vh)]
       overflow-y-auto">
        <h3 className="font-semibold text-gray-800 mb-4">Layers</h3>
        <div className="space-y-3">
          {/* Street Layer */}
          <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={layers.street}
                onChange={() => toggleLayer('street')}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Street</span>
            </div>
            <div className="w-5 h-5 bg-blue-500 rounded"></div>
          </label>

          {/* Satellite Layer */}
          <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={layers.satellite}
                onChange={() => toggleLayer('satellite')}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Satellite</span>
            </div>
            <div className="w-5 h-5 bg-green-500 rounded"></div>
          </label>

          {/* Heat Map Layer */}
          <div className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50"
               onClick={() => selectCategory('heatMap')}>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={layers.heatMap}
                onChange={() => toggleLayer('heatMap')}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Heat Map</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-red-500 rounded"></div>
              {selectedCategory === 'heatMap' && (
                <img src={getHighlightIcon('heatMap')} alt="highlight" className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* Buildings Layer */}
          <div className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50"
               onClick={() => selectCategory('buildings')}>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={layers.buildings}
                onChange={() => toggleLayer('buildings')}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Buildings</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-purple-500 rounded"></div>
              {selectedCategory === 'buildings' && (
                <img src={getHighlightIcon('buildings')} alt="highlight" className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* Measure Tool */}
          <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={layers.measure}
                onChange={() => toggleLayer('measure')}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Measure</span>
            </div>
            <div className="w-5 h-5 bg-orange-500 rounded"></div>
          </label>

          {/* Shapefile Layers */}
          <div className="pt-3 mt-3 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-600 mb-2">SHAPEFILE LAYERS</h4>
            
            {/* Boundary Layer */}
            <div className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50"
                 onClick={() => selectCategory('boundary')}>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={layers.boundary}
                  onChange={() => toggleLayer('boundary')}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Ibaan Boundary</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-500 rounded-full"></div>
                {selectedCategory === 'boundary' && (
                  <img src={getHighlightIcon('boundary')} alt="highlight" className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Road Networks Layer */}
            <div className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50"
                 onClick={() => selectCategory('roadNetworks')}>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={layers.roadNetworks}
                  onChange={() => toggleLayer('roadNetworks')}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Road Networks</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-800 rounded"></div>
                {selectedCategory === 'roadNetworks' && (
                  <img src={getHighlightIcon('roadNetworks')} alt="highlight" className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Waterways Layer */}
            <div className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50"
                 onClick={() => selectCategory('waterways')}>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={layers.waterways}
                  onChange={() => toggleLayer('waterways')}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Waterways</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-blue-500 rounded"></div>
                {selectedCategory === 'waterways' && (
                  <img src={getHighlightIcon('waterways')} alt="highlight" className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <MapRenderer layers={layers} selectedCategory={selectedCategory} />

      {/* Advanced Tools Panel */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 w-64 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h3 className="font-semibold text-gray-800 mb-3">Advanced Tools</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50"
               onClick={() => selectCategory('drawTools')}>
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDrawMode();
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  drawMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📐 Draw Tools
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {selectedCategory === 'drawTools' && (
                <img src={getHighlightIcon('drawTools')} alt="highlight" className="w-4 h-4" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50"
               onClick={() => selectCategory('measureTool')}>
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMeasureMode();
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  measureMode 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📏 Measure Tool
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {selectedCategory === 'measureTool' && (
                <img src={getHighlightIcon('measureTool')} alt="highlight" className="w-4 h-4" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-50"
               onClick={() => selectCategory('analysisPanel')}>
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAnalysis();
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  showAnalysis 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 Analysis Panel
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {selectedCategory === 'analysisPanel' && (
                <img src={getHighlightIcon('analysisPanel')} alt="highlight" className="w-4 h-4" />
              )}
            </div>
          </div>
          
          {selectedFeatures.length > 0 && (
            <button
              onClick={clearSelection}
              className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200"
            >
              🗑️ Clear Selection ({selectedFeatures.length})
            </button>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
          {selectedFeatures.length > 0 
            ? `${selectedFeatures.length} feature(s) selected`
            : 'No features selected'
          }
        </div>
      </div>

      {/* Map Info Panel */}
      <div className="absolute bottom-60 right-4 z-10 bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm text-gray-600">
          <p>Coordinates: <span className="font-mono">13.7595°N, 121.1258°E</span></p>
          <p>Zoom Level: <span className="font-mono">12</span></p>
        </div>
      </div>
    </div>
  );
};

export default Map;