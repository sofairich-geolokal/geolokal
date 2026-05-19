"use client";

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Layers, Globe, Ruler, CircleDot, ChevronRight, X } from 'lucide-react';
import { GeoPortalService } from '@/lib/geoportal';

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
    parcelLots: true,
    landCover: false,
    climateType: false,
  });

  const [mapView, setMapView] = useState<{ lat: number; lng: number; zoom: number } | null>({ lat: 13.86, lng: 121.15, zoom: 16 });
  const [bufferData, setBufferData] = useState<any>(null);
  const [legendsOpen, setLegendsOpen] = useState(true);
  const [savedLayers, setSavedLayers] = useState<any[]>([]);
  const [loadingLayers, setLoadingLayers] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Main layers setup - matching ViewerMap
  const mainLayers = [
    {
      id: 10001,
      title: 'Administrative Boundaries',
      agency: 'NAMRIA',
      description: 'City and barangay boundaries',
      layer_type: 'boundary',
      opacity: 0.8,
      category: 'DRRM',
      is_main_layer: true
    },
    {
      id: 10002,
      title: 'Road Networks',
      agency: 'DPWH',
      description: 'Road networks and transportation infrastructure',
      layer_type: 'road',
      opacity: 0.9,
      category: 'Infrastructure',
      is_main_layer: true
    },
    {
      id: 10003,
      title: 'Waterways',
      agency: 'DENR',
      description: 'Rivers, streams, and water bodies',
      layer_type: 'waterway',
      opacity: 0.7,
      category: 'Environmental',
      is_main_layer: true
    },
    {
      id: 10006,
      title: 'Parcel Lots',
      agency: 'LGU',
      description: 'Land parcel boundaries and cadastral data',
      layer_type: 'parcel',
      opacity: 0.7,
      category: 'Land Management',
      is_main_layer: true
    },
    {
      id: 10004,
      title: 'Land Cover (NAMRIA 2020)',
      agency: 'NAMRIA',
      description: 'Land Cover map of the Philippines',
      layer_type: 'landcover',
      opacity: 0.7,
      category: 'Environmental',
      is_main_layer: true,
      is_external: true,
      external_url: 'https://services3.arcgis.com/pNwij5WvjK23c10k/ArcGIS/rest/services/Land_Cover__NAMRIA_2020_/FeatureServer/0'
    },
    {
      id: 10005,
      title: 'Climate Type (PAGASA)',
      agency: 'PAGASA',
      description: 'Philippine Climate Type Classification',
      layer_type: 'climate',
      opacity: 0.7,
      category: 'Environmental',
      is_main_layer: true,
      is_external: true,
      external_url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/Philippine_Climate_Type/FeatureServer/0'
    }
  ];

  const [xyInput, setXyInput] = useState({ lat: '', lng: '' });
  const [bufferInput, setBufferInput] = useState({ 
    bufferType: 'point' as 'point' | 'line' | 'circle' | 'polygon',
    distance: '', 
    unit: 'kilometers' as 'kilometers' | 'meters' | 'miles' | 'feet'
  });
  const [measureInput, setMeasureInput] = useState<{ 
    startPoint: string; 
    endPoint: string; 
    distance: string;
    area: string;
    isMeasuring: boolean;
    measurementType: 'distance' | 'area';
    clickMode: string;
    visualElements: {
      lines: number[][];
      markers: { lat: number; lng: number }[]
      polygon: number[][]
    }
  }>({ 
    startPoint: '', 
    endPoint: '', 
    distance: '0.00 km',
    area: '0.00 km²',
    isMeasuring: false,
    measurementType: 'distance',
    clickMode: 'start',
    visualElements: {
      lines: [],
      markers: [],
      polygon: []
    }
  });

  // Handle map click for measurement
  const handleMapClick = (lat: number, lng: number) => {
    if (activeRightPanel !== 'measure' || !measureInput.isMeasuring) return;
    
    const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    if (measureInput.measurementType === 'distance') {
      if (measureInput.clickMode === 'start') {
        handleMeasurePointChange('startPoint', coordString);
        setMeasureInput(prev => ({ 
          ...prev, 
          clickMode: 'end',
          visualElements: {
            markers: [{ lat, lng }],
            lines: [],
            polygon: []
          }
        }));
      } else {
        handleMeasurePointChange('endPoint', coordString);
        const startCoords = measureInput.startPoint.split(',').map(c => parseFloat(c.trim()));
        setMeasureInput(prev => ({ 
          ...prev, 
          clickMode: 'start',
          visualElements: {
            markers: [
              { lat: startCoords[0], lng: startCoords[1] },
              { lat, lng }
            ],
            lines: [[startCoords[0], startCoords[1]], [lat, lng]],
            polygon: []
          }
        }));
      }
    } else if (measureInput.measurementType === 'area') {
      // For area measurement, keep adding points to create polygon
      setMeasureInput(prev => ({
        ...prev,
        visualElements: {
          ...prev.visualElements,
          markers: [...prev.visualElements.markers, { lat, lng }],
          polygon: [...prev.visualElements.polygon, [lat, lng]]
        }
      }));
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

  // Calculate area from polygon coordinates using Shoelace formula
  const calculateArea = (polygon: number[][]) => {
    if (polygon.length < 3) {
      return {
        km2: '0.00',
        m2: '0.00',
        mi2: '0.00',
        ft2: '0.00',
        ha: '0.00'
      };
    }
    
    try {
      // Convert to radians for spherical calculation
      const R = 6371; // Earth's radius in km
      let area = 0;
      
      for (let i = 0; i < polygon.length; i++) {
        const j = (i + 1) % polygon.length;
        const lat1 = polygon[i][0] * Math.PI / 180;
        const lng1 = polygon[i][1] * Math.PI / 180;
        const lat2 = polygon[j][0] * Math.PI / 180;
        const lng2 = polygon[j][1] * Math.PI / 180;
        
        area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
      }
      
      area = Math.abs(area * R * R / 2);
      
      // Convert to different units
      const areaKm2 = area;
      const areaM2 = area * 1000000;
      const areaMi2 = area * 0.386102;
      const areaFt2 = area * 10763910;
      const areaHa = area * 100;
      
      return {
        km2: areaKm2.toFixed(2),
        m2: areaM2.toFixed(2),
        mi2: areaMi2.toFixed(2),
        ft2: areaFt2.toFixed(2),
        ha: areaHa.toFixed(2)
      };
    } catch (error) {
      return {
        km2: '0.00',
        m2: '0.00',
        mi2: '0.00',
        ft2: '0.00',
        ha: '0.00'
      };
    }
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
      area: '0.00 km²',
      isMeasuring: false,
      measurementType: 'distance',
      clickMode: 'start',
      visualElements: {
        lines: [],
        markers: [],
        polygon: []
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
      setLoadingLayers(true);
      try {
        const dbResponse = await fetch('/api/layers');
        let dbLayers = [];
        
        if (dbResponse.ok) {
          const dbResult = await dbResponse.json();
          if (dbResult.success && dbResult.data) {
            dbLayers = dbResult.data.map((layer: any) => ({
              id: layer.id,
              title: layer.layer_name,
              agency: layer.city_muni_master?.name || 'Database',
              description: layer.metadata?.description || `Dynamic layer: ${layer.layer_name}`,
              geometry: layer.metadata?.geojson || null,
              layer_type: layer.layer_type,
              style_config: layer.style_config,
              opacity: layer.opacity || 0.7,
              is_downloadable: layer.is_downloadable,
              category: layer.project_categories?.name || 'General',
              metadata: layer.metadata
            }));
          }
        }

        try {
          const geoPortalLayers = await GeoPortalService.fetchAllLayers();
          const formattedGeoPortalLayers = geoPortalLayers.map((layer, index) => ({
            id: 2000 + index, 
            title: layer.title,
            agency: layer.attribution,
            description: layer.description,
            geometry: layer.geometry || null,
            layer_type: layer.service === 'ArcGIS REST' ? 'arcgis' : 'wms',
            style_config: layer.style,
            opacity: layer.style.opacity || 0.7,
            category: layer.category,
            metadata: {
              ...layer.properties,
              wmsUrl: layer.wmsUrl,
              wmsLayer: layer.wmsLayer,
              arcgisUrl: layer.arcgisUrl,
              service: layer.service,
              layer: layer.layer,
              is_geoportal: true
            }
          }));
          
          const combinedLayers = [...mainLayers, ...dbLayers, ...formattedGeoPortalLayers];
          setSavedLayers(combinedLayers);
        } catch (fetchError) {
          setSavedLayers([...mainLayers, ...dbLayers]);
        }
        
      } catch (error) {
        console.error('Error in fetchSavedLayers:', error);
        setSavedLayers(mainLayers);
      } finally {
        setLoadingLayers(false);
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
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#318855] focus:border-transparent"
                />
                {isSearching ? (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#318855]"></div>
                  </div>
                ) : (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                    checked={layers.parcelLots}
                    onChange={(e) => setLayers(prev => ({ ...prev, parcelLots: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Parcel Lots</span>
                </label>
                {/* Temporarily hidden Land Cover (NAMRIA) layer */}
                {/* <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#318855] focus:ring-[#318855]" 
                    checked={layers.landCover}
                    onChange={(e) => setLayers(prev => ({ ...prev, landCover: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Land Cover (NAMRIA)</span>
                </label> */}
                {/* Temporarily hidden Climate Type (PAGASA) layer */}
                {/* <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#318855] focus:ring-[#318855]" 
                    checked={layers.climateType}
                    onChange={(e) => setLayers(prev => ({ ...prev, climateType: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Climate Type (PAGASA)</span>
                </label> */}
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
            roadNetworkLayerHighlighted={true}
            waterwaysLayerVisible={layers.rivers}
            waterwaysLayerHighlighted={false}
            parcelLotsVisible={layers.parcelLots}
            landCoverLayerVisible={layers.landCover}
            landCoverLayerHighlighted={false}
            climateTypeLayerVisible={layers.climateType}
            climateTypeLayerHighlighted={false}
            onBoundaryBoundsReady={null}
            onRoadBoundsReady={null}
            onWaterwayBoundsReady={null}
            onParcelLotsBoundsReady={null}
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
                    <div className="w-4 h-4 border-2 border-dashed rounded-sm" style={{ 
                      borderColor: '#0000FF', 
                      backgroundColor: 'transparent' 
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
                      backgroundColor: '#7d8b8f',
                      height: '3px'
                    }}></div>
                  )}
                  {key === 'rivers' && (
                    <div className="w-4 h-0.5" style={{ 
                      backgroundColor: '#2563eb',
                      height: '3px'
                    }}></div>
                  )}
                  {key === 'parcelLots' && (
                    <div className="w-4 h-4 border-2 rounded-sm" style={{ 
                      borderColor: '#e67e22', 
                      backgroundColor: 'rgba(230, 126, 34, 0.2)' 
                    }}></div>
                  )}
                  {key === 'riverBoundary' && (
                    <div className="w-4 h-4 border-2 border-dashed rounded-sm" style={{ 
                      borderColor: '#87CEEB',
                      backgroundColor: 'rgba(135, 206, 235, 0.2)'
                    }}></div>
                  )}
                  {/* Temporarily hidden Land Cover (NAMRIA) legend */}
                  {/* {key === 'landCover' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#228B22' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFD700' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#DC143C' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4169E1' }}></div>
                    </div>
                  )} */}
                  {/* Temporarily hidden Climate Type (PAGASA) legend */}
                  {/* {key === 'climateType' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF6B35' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4A90E2' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#50C878' }}></div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#9B59B6' }}></div>
                    </div>
                  )} */}
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
                  <div className="text-white text-sm font-bold mb-2">Buffer Type</div>
                  <div className="flex flex-col space-y-2">
                    {['Point', 'Line', 'Circle', 'Polygon'].map(type => (
                      <label key={type} className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio text-[#318855]"
                          name="bufferType"
                          value={type.toLowerCase()}
                          checked={bufferInput.bufferType === type.toLowerCase()}
                          onChange={(e) => setBufferInput({ ...bufferInput, bufferType: e.target.value as 'point' | 'line' | 'circle' | 'polygon' })}
                        />
                        <span className="ml-2 text-white">{type}</span>
                      </label>
                    ))}
                  </div>

                  <div className="text-white text-sm font-bold mt-4 mb-2">Parameters</div>
                  <input 
                    type="number" 
                    placeholder="Distance" 
                    value={bufferInput.distance}
                    onChange={(e) => setBufferInput({...bufferInput, distance: e.target.value})}
                    className="w-full text-white p-2 rounded bg-gray-700 mb-2"
                  />
                  <select
                    value={bufferInput.unit}
                    onChange={(e) => setBufferInput({...bufferInput, unit: e.target.value as 'kilometers' | 'meters' | 'miles' | 'feet'})}
                    className="w-full text-white p-2 rounded bg-gray-700"
                  >
                    <option value="kilometers">Kilometers</option>
                    <option value="meters">Meters</option>
                    <option value="miles">Miles</option>
                    <option value="feet">Feet</option>
                  </select>
                  <button onClick={() => setBufferData(bufferInput)} style={{ backgroundColor: brandColor }} className="w-full text-white font-bold py-2 rounded mt-3">Go</button>
                </div>
              )}

              {activeRightPanel === 'measure' && (
                <div className="space-y-3">
                  {/* Measurement Type Tabs */}
                  <div className="flex border-b border-gray-600">
                    <button 
                      onClick={() => setMeasureInput(prev => ({ ...prev, measurementType: 'distance' }))}
                      className={`flex-1 py-2 text-xs font-medium ${measureInput.measurementType === 'distance' ? 'text-white border-b-2 border-[#318855]' : 'text-gray-400'}`}
                    >
                      Distance
                    </button>
                    <button 
                      onClick={() => setMeasureInput(prev => ({ ...prev, measurementType: 'area' }))}
                      className={`flex-1 py-2 text-xs font-medium ${measureInput.measurementType === 'area' ? 'text-white border-b-2 border-[#318855]' : 'text-gray-400'}`}
                    >
                      Area
                    </button>
                  </div>

                  <div className="text-center text-white mb-2">
                    {measureInput.isMeasuring 
                      ? measureInput.measurementType === 'distance'
                        ? `Click on map to set ${measureInput.clickMode === 'start' ? 'start' : 'end'} point`
                        : `Click on map to add polygon vertices (min 3 points)`
                      : 'Click toggle to enable map measurement'
                    }
                  </div>
                  <button 
                    onClick={toggleMeasurementMode}
                    style={{ backgroundColor: measureInput.isMeasuring ? brandColor : '#666' }} 
                    className="w-full text-white font-bold py-2 rounded mb-3"
                  >
                    {measureInput.isMeasuring ? 'Stop Measurement' : 'Start Measurement'}
                  </button>

                  {measureInput.measurementType === 'distance' && (
                    <>
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
                    </>
                  )}

                  {measureInput.measurementType === 'area' && measureInput.visualElements.polygon.length >= 3 && (
                    <div className="mt-3 p-3 bg-gray-700 rounded">
                      <div className="text-xs font-bold text-gray-300 mb-2">Result</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-gray-400">km²:</span><span className="text-white">{calculateArea(measureInput.visualElements.polygon).km2}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">m²:</span><span className="text-white">{calculateArea(measureInput.visualElements.polygon).m2}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">mi²:</span><span className="text-white">{calculateArea(measureInput.visualElements.polygon).mi2}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">ft²:</span><span className="text-white">{calculateArea(measureInput.visualElements.polygon).ft2}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">M²:</span><span className="text-white">{calculateArea(measureInput.visualElements.polygon).ha}</span></div>
                      </div>
                    </div>
                  )}

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