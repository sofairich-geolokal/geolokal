"use client";

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Layers, Globe, Ruler, CircleDot, ChevronRight, X } from 'lucide-react';

const MapRenderer = dynamic(() => import('@/app/components/ViewerDashboard/MapRenderer').then(mod => ({ default: mod.default })), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center text-white">Initializing...</div> 
});

export default function MapsDashboard() {
  const brandColor = "#318855";
  const [activeRightPanel, setActiveRightPanel] = useState<string | null>(null);
  const [mapType, setMapType] = useState('osm');
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Layer visibility state matching viewer dashboard
  const [layers, setLayers] = useState({
    adminBoundary: true,
    roadNetworks: true,
    rivers: true,
    landCover: false,
    climateType: false,
  });

  const [mapView, setMapView] = useState<{ lat: number; lng: number; zoom: number } | null>({ lat: 13.86, lng: 121.15, zoom: 16 });
  const [bufferData, setBufferData] = useState<any>(null);
  const [legendsOpen, setLegendsOpen] = useState(true);
  const [savedLayers, setSavedLayers] = useState<any[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [xyInput, setXyInput] = useState({ lat: '', lng: '' });
  const [bufferInput, setBufferInput] = useState({ type: 'Point', distance: '', unit: 'Kilometers' });
  const [measureInput, setMeasureInput] = useState<{ 
    startPoint: string; 
    endPoint: string; 
    distance: string;
    isMeasuring: boolean;
    clickMode: string;
    visualElements: {
      lines: never[];
      markers: never[]
    }
  }>({ 
    startPoint: '', 
    endPoint: '', 
    distance: '0.00 km',
    isMeasuring: false,
    clickMode: 'start',
    visualElements: {
      lines: [],
      markers: []
    }
  });

  // Handle map click for measurement
  const handleMapClick = (lat: number, lng: number) => {
    if (activeRightPanel !== 'measure' || !measureInput.isMeasuring) return;
    
    const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    if (measureInput.clickMode === 'start') {
      handleMeasurePointChange('startPoint', coordString);
      setMeasureInput(prev => ({ ...prev, clickMode: 'end' }));
    } else {
      handleMeasurePointChange('endPoint', coordString);
      setMeasureInput(prev => ({ ...prev, clickMode: 'start' }));
    }
  };

  // Toggle measurement mode
  const toggleMeasurementMode = () => {
    setMeasureInput(prev => ({
      ...prev,
      isMeasuring: !prev.isMeasuring,
      clickMode: 'start'
    }));
  };

  const handleGotoXY = () => {
    const lat = parseFloat(xyInput.lat);
    const lng = parseFloat(xyInput.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapView({ lat, lng, zoom: 15 });
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (startPoint: string, endPoint: string) => {
    try {
      const startCoords = startPoint.split(',').map(coord => parseFloat(coord.trim()));
      const endCoords = endPoint.split(',').map(coord => parseFloat(coord.trim()));
      
      if (startCoords.length !== 2 || endCoords.length !== 2) {
        return '0.00 km';
      }
      
      const [startLat, startLng] = startCoords;
      const [endLat, endLng] = endCoords;
      
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
        return '0.00 km';
      }
      
      const R = 6371;
      const dLat = (endLat - startLat) * Math.PI / 180;
      const dLng = (endLng - startLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return `${distance.toFixed(2)} km`;
    } catch (error) {
      return '0.00 km';
    }
  };

  const handleMeasurePointChange = (field: 'startPoint' | 'endPoint', value: string) => {
    const newMeasureInput = { ...measureInput, [field]: value };
    const distance = calculateDistance(newMeasureInput.startPoint, newMeasureInput.endPoint);
    setMeasureInput({ ...newMeasureInput, distance, visualElements: measureInput.visualElements });
  };

  const handleClearMeasurement = () => {
    setMeasureInput({
      startPoint: '',
      endPoint: '',
      distance: '0.00 km',
      isMeasuring: false,
      clickMode: 'start',
      visualElements: {
        lines: [],
        markers: []
      }
    });
  };

  // Search functionality
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Using Nominatim API for geocoding (free and open source)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=PH`,
        {
          headers: {
            'User-Agent': 'GeoLokal/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const results = data.map((item: any) => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type,
          importance: item.importance
        }));
        setSearchResults(results);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSelect = (result: any) => {
    setMapView({ lat: result.lat, lng: result.lng, zoom: 15 });
    setShowSearchResults(false);
    setSearchQuery(result.display_name);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    if (value.length > 2) {
      const timeoutId = setTimeout(() => {
        searchLocations(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearchResults]);

  useEffect(() => {
    const fetchSavedLayers = async () => {
      try {
        const response = await fetch('/api/layers');
        if (response.ok) {
          const result = await response.json();
          const layers = result.data
            .filter((layer: any) => layer.metadata?.geojson)
            .map((layer: any) => ({
              id: layer.id.toString(),
              title: layer.layer_name,
              name: layer.layer_name,
              geometry: layer.metadata.geojson,
              color: layer.metadata.color || layer.style_config?.color || '#333333',
              visible: layer.is_visible !== false,
              layer_type: layer.layer_type || 'vector',
              agency: 'Uploaded Shapefile',
              category: 'Custom Layer',
              is_downloadable: layer.is_downloadable || false
            }));
          setSavedLayers(layers);
        }
      } catch (err) {
        console.error('Error fetching saved layers:', err);
      }
    };

    fetchSavedLayers();
  }, []);

  return (
    <div className="relative h-screen w-full bg-[#f8f9fa] overflow-hidden flex flex-col font-sans">
      <main className="flex-1 relative overflow-hidden">
        
        {/* Left Panel - Matching ViewerMap exactly */}
        <div 
          className={`absolute top-0 left-0 m-4 h-full z-[1500] transition-transform duration-300 rounded-lg bg-white border-r
            translate-x-0`}
          style={{ width: '280px' }}
        >
         

          <div className="p-4 rounded-full bg-white">
            {/* Search Bar */}
            <div className="mb-6 search-container">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#318855] focus:border-transparent"
                />
                {isSearching ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#318855]"></div>
                  </div>
                ) : (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-[1001]">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => handleSearchSelect(result)}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-xs font-medium text-gray-900">{result.display_name}</div>
                      <div className="text-xs text-gray-500 capitalize">{result.type}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Results */}
              {showSearchResults && searchResults.length === 0 && !isSearching && searchQuery.length > 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[1001]">
                  <div className="px-3 py-2 text-xs text-gray-500">
                    No locations found
                  </div>
                </div>
              )}
            </div>

            {/* Basemap Selection - Radio Buttons */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Base Map</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="basemap"
                    className="w-4 h-4 text-[#318855] focus:ring-[#318855]" 
                    checked={mapType === 'osm'}
                    onChange={() => setMapType('osm')}
                  />
                  <span className="text-sm text-gray-700">Open Street Map</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="basemap"
                    className="w-4 h-4 text-[#318855] focus:ring-[#318855]" 
                    checked={mapType === 'satellite'}
                    onChange={() => setMapType('satellite')}
                  />
                  <span className="text-sm text-gray-700">Satellite (Esri)</span>
                </label>
              </div>
            </div>

            {/* Layer Selection - Checkboxes */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Layers</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#318855] focus:ring-[#318855]" 
                    checked={layers.adminBoundary}
                    onChange={(e) => setLayers(prev => ({ ...prev, adminBoundary: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Admin Boundary</span>
                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#318855] focus:ring-[#318855]" 
                    checked={layers.roadNetworks}
                    onChange={(e) => setLayers(prev => ({ ...prev, roadNetworks: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Road Networks</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#318855] focus:ring-[#318855]" 
                    checked={layers.rivers}
                    onChange={(e) => setLayers(prev => ({ ...prev, rivers: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Rivers</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#318855] focus:ring-[#318855]" 
                    checked={layers.landCover}
                    onChange={(e) => setLayers(prev => ({ ...prev, landCover: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Land Cover (NAMRIA)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#318855] focus:ring-[#318855]" 
                    checked={layers.climateType}
                    onChange={(e) => setLayers(prev => ({ ...prev, climateType: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Climate Type (PAGASA)</span>
                </label>
                              </div>
            </div>
          </div>

        </div>


        <div className="w-full h-full z-0" ref={mapContainerRef}>
          <MapRenderer 
            layers={savedLayers} 
            mapView={mapView} 
            bufferData={bufferData} 
            basemap={mapType === 'osm' ? 'Open Street Map' : 'Satellite (Esri)'}
            onMapClick={handleMapClick}
            isMeasuring={measureInput.isMeasuring}
            measureVisualElements={measureInput.visualElements}
            boundaryLayerVisible={layers.adminBoundary}
            boundaryLayerHighlighted={false}
            roadNetworkLayerVisible={layers.roadNetworks}
            roadNetworkLayerHighlighted={false}
            waterwaysLayerVisible={layers.rivers}
            waterwaysLayerHighlighted={false}
            landCoverLayerVisible={layers.landCover}
            landCoverLayerHighlighted={false}
            climateTypeLayerVisible={layers.climateType}
            climateTypeLayerHighlighted={false}
            onBoundaryBoundsReady={null}
            onRoadBoundsReady={null}
            onWaterwayBoundsReady={null}
            onLandCoverBoundsReady={null}
            onClimateTypeBoundsReady={null}
            initialZoom={15}
          />
        </div>

        {/* Legends Box - Right Side */}
        <div className="absolute top-50 right-4 z-[1000] bg-white shadow-lg border border-gray-200 rounded-lg p-3 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-700 flex items-center">
              <Layers size={12} className="mr-1" />
              Map Legends
            </h3>
            <button 
              onClick={() => setLegendsOpen(!legendsOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              {legendsOpen ? <X size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          
          {legendsOpen && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(layers).map(([key, _]) => (
                <div key={key} className="flex items-center space-x-2 text-xs">
                  {key === 'adminBoundary' && (
                    <div className="w-4 h-4 border-2 rounded-sm" style={{ 
                      borderColor: '#3b82f6', 
                      backgroundColor: 'rgba(59, 130, 246, 0.2)' 
                    }}></div>
                  )}
                  {key === 'evacuationCenter' && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ 
                      backgroundColor: '#3b82f6',
                      border: '2px solid #1e40af'
                    }}>
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                  {key === 'hazardArea' && (
                    <div className="w-4 h-4 rounded-full" style={{ 
                      backgroundColor: 'rgba(234, 88, 12, 0.3)',
                      border: '2px solid #ea580c'
                    }}></div>
                  )}
                  {key === 'roadNetworks' && (
                    <div className="w-4 h-0.5" style={{ 
                      backgroundColor: '#06a506',
                      height: '3px'
                    }}></div>
                  )}
                  {key === 'rivers' && (
                    <div className="w-4 h-0.5" style={{ 
                      backgroundColor: '#2563eb',
                      height: '3px'
                    }}></div>
                  )}
                  {key === 'riverBoundary' && (
                    <div className="w-4 h-4 border-2 border-dashed rounded-sm" style={{ 
                      borderColor: '#87CEEB',
                      backgroundColor: 'rgba(135, 206, 235, 0.2)'
                    }}></div>
                  )}
                  {key === 'landCover' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#228B22' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFD700' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#DC143C' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4169E1' }}></div>
                    </div>
                  )}
                  {key === 'climateType' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF6B35' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4A90E2' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#50C878' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#9B59B6' }}></div>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Toolbar */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-1">
          <ToolIcon active={activeRightPanel === 'measure'} onClick={() => setActiveRightPanel('measure')} icon={<Ruler size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'xy'} onClick={() => setActiveRightPanel('xy')} label="XY" brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'buffer'} onClick={() => setActiveRightPanel('buffer')} icon={<CircleDot size={18} />} brandColor={brandColor} />
        </div>

        {/* Right Panel Body */}
        {activeRightPanel && (
          <div className="absolute top-4 right-16 z-[1000] w-64 bg-[#333] text-white shadow-2xl border border-gray-600">
            <div style={{ backgroundColor: brandColor }} className="text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs uppercase">
              <div className="flex items-center"><ChevronRight size={14} className="mr-1 stroke-[3px]" /> {activeRightPanel}</div>
              <button onClick={() => setActiveRightPanel(null)}><X size={18} /></button>
            </div>

            <div className="p-4 space-y-4 text-xs">

              {activeRightPanel === 'xy' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><label>Latitude</label><input type="text" value={xyInput.lat} onChange={(e) => setXyInput({...xyInput, lat: e.target.value})} className="w-32 text-white p-1 rounded bg-gray-700" /></div>
                  <div className="flex items-center justify-between"><label>Longitude</label><input type="text" value={xyInput.lng} onChange={(e) => setXyInput({...xyInput, lng: e.target.value})} className="w-32 text-white p-1 rounded bg-gray-700" /></div>
                  <button onClick={handleGotoXY} style={{ backgroundColor: brandColor }} className="w-full text-white font-bold py-2 mt-2 rounded">Go</button>
                </div>
              )}

              {activeRightPanel === 'buffer' && (
                <div className="space-y-3">
                  <input type="text" placeholder="Distance" value={bufferInput.distance} onChange={(e) => setBufferInput({...bufferInput, distance: e.target.value})} className="w-full text-white p-2 rounded bg-gray-700" />
                  <button onClick={() => setBufferData(bufferInput)} style={{ backgroundColor: brandColor }} className="w-full text-white font-bold py-2 rounded">Go</button>
                </div>
              )}

              {activeRightPanel === 'measure' && (
                <div className="space-y-3">
                  <div className="text-center text-white mb-2">
                    {measureInput.isMeasuring 
                      ? `Click on map to set ${measureInput.clickMode === 'start' ? 'start' : 'end'} point` 
                      : 'Click toggle to enable map measurement'
                    }
                  </div>
                  <button 
                    onClick={toggleMeasurementMode}
                    style={{ backgroundColor: measureInput.isMeasuring ? brandColor : '#666' }} 
                    className="w-full text-white font-bold py-2 rounded mb-3"
                  >
                    {measureInput.isMeasuring ? 'Stop Map Measurement' : 'Start Map Measurement'}
                  </button>
                  <div className="flex items-center justify-between">
                    <label>Start Point:</label>
                    <input 
                      type="text" 
                      placeholder="lat, lng" 
                      value={measureInput.startPoint}
                      onChange={(e) => handleMeasurePointChange('startPoint', e.target.value)}
                      className="w-24 text-white p-1 rounded bg-gray-700 text-xs" 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label>End Point:</label>
                    <input 
                      type="text" 
                      placeholder="lat, lng" 
                      value={measureInput.endPoint}
                      onChange={(e) => handleMeasurePointChange('endPoint', e.target.value)}
                      className="w-24 text-white p-1 rounded bg-gray-700 text-xs" 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label>Distance:</label>
                    <input 
                      type="text" 
                      value={measureInput.distance} 
                      readOnly 
                      className="w-24 text-white p-1 rounded bg-gray-700 text-xs" 
                    />
                  </div>
                  <button 
                    onClick={handleClearMeasurement} 
                    style={{ backgroundColor: brandColor }} 
                    className="w-full text-white font-bold py-2 rounded"
                  >
                    Clear Measurement
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ToolIcon({ active, onClick, icon, label, brandColor }: any) {
  return (
    <button 
      key={`tool-${label || 'icon'}`}
      suppressHydrationWarning={true}
      onClick={onClick} 
      style={active ? { backgroundColor: brandColor } : { backgroundColor: '#333' }} 
      className={`w-10 h-10 flex items-center justify-center border-b border-gray-600 text-white shadow-sm`}
    >
      {icon || <span className="font-bold text-xs">{label}</span>}
    </button>
  );
}