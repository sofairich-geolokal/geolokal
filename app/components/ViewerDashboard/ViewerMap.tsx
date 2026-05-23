"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Menu, Layers, Globe, Ruler, CircleDot, 
  Download, ExternalLink, ChevronRight, 
  ChevronLeft, X, MoveUp, Save, Eye, ZoomIn, ZoomOut
} from 'lucide-react';

// Import layer components
import BoundaryLayer from './BoundaryLayer';
import RoadNetworksLayer from './RoadNetworksLayer';
import WaterwaysLayer from './WaterwaysLayer';
import { GeoPortalService } from '@/lib/geoportal';
import GeoPortalSync from '../GeoPortalSync';

const MapRenderer = dynamic(() => import('./MapRenderer'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center text-white">Initializing...</div> 
});

export default function ViewerMap() {
  const brandColor = "#318855";

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [activeRightPanel, setActiveRightPanel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Viewer-specific layers - will be fetched from GeoPortal API
  const [availableLayers, setAvailableLayers] = useState<any[]>([]);
  const [loadingLayers, setLoadingLayers] = useState(false);

  // State for managing the layers visibility
  const [adminBoundaryVisible, setAdminBoundaryVisible] = useState(true);
  const [roadNetworksVisible, setRoadNetworksVisible] = useState(true);
  const [riversVisible, setRiversVisible] = useState(true);
  const [parcelLotsVisible, setParcelLotsVisible] = useState(true); // Added Parcel Lots
  const [landCoverVisible, setLandCoverVisible] = useState(false);
  const [climateTypeVisible, setClimateTypeVisible] = useState(false);
  
  // State for dynamic layer visibility (from database)
  const [dynamicLayerVisibility, setDynamicLayerVisibility] = useState<Record<number, boolean>>({});

  // Hover states
  const [boundaryHovered, setBoundaryHovered] = useState(false);
  const [roadNetworksHovered, setRoadNetworksHovered] = useState(false);
  const [riversHovered, setRiversHovered] = useState(false);
  const [parcelLotsHovered, setParcelLotsHovered] = useState(false);
  const [landCoverHovered, setLandCoverHovered] = useState(false);
  const [climateTypeHovered, setClimateTypeHovered] = useState(false);
  
  // Hover states for right toolbar icons
  const [layersHovered, setLayersHovered] = useState(false);
  const [basemapHovered, setBasemapHovered] = useState(false);
  const [measureHovered, setMeasureHovered] = useState(false);
  const [xyHovered, setXyHovered] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);

  // Main layers setup
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
    // Temporarily hidden Land Cover (NAMRIA) layer
    // {
    //   id: 10004,
    //   title: 'Land Cover (NAMRIA 2020)',
    //   agency: 'NAMRIA',
    //   description: 'Land Cover map of the Philippines',
    //   layer_type: 'landcover',
    //   opacity: 0.7,
    //   category: 'Environmental',
    //   is_main_layer: true,
    //   is_external: true,
    //   external_url: 'https://services3.arcgis.com/pNwij5WvjK23c10k/ArcGIS/rest/services/Land_Cover__NAMRIA_2020_/FeatureServer/0'
    // },
    // Temporarily hidden Climate Type (PAGASA) layer
    // {
    //   id: 10005,
    //   title: 'Climate Type (PAGASA)',
    //   agency: 'PAGASA',
    //   description: 'Philippine Climate Type Classification',
    //   layer_type: 'climate',
    //   opacity: 0.7,
    //   category: 'Environmental',
    //   is_main_layer: true,
    //   is_external: true,
    //   external_url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/Philippine_Climate_Type/FeatureServer/0'
    // }
  ];

  // Search functionality
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=PH`,
        { headers: { 'User-Agent': 'GeoLokal/1.0' } }
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
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        searchLocations(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

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

  const fetchGeoPortalLayers = async () => {
    setLoadingLayers(true);
    try {
        const dbResponse = await fetch('/api/layers?visible=true');
        let dbLayers = [];
        
        if (dbResponse.ok) {
          const dbResult = await dbResponse.json();
          if (dbResult.success && dbResult.data) {
            dbLayers = await Promise.all(dbResult.data.map(async (layer: any) => {
              let geometry = layer.metadata?.geojson || null;
              
              // Load GeoJSON from file if geojson_file is present
              if (layer.metadata?.geojson_file && !geometry) {
                try {
                  const geojsonResponse = await fetch(`/data/${layer.metadata.geojson_file}`);
                  if (geojsonResponse.ok) {
                    geometry = await geojsonResponse.json();
                  }
                } catch (fileError) {
                  console.error('Error loading GeoJSON file:', layer.metadata.geojson_file, fileError);
                }
              }
              
              // Set visibility for new layers (default to visible if not in state)
              const isVisible = dynamicLayerVisibility[layer.id] !== undefined 
                ? dynamicLayerVisibility[layer.id] 
                : (layer.is_visible !== false);
              
              return {
                id: layer.id,
                title: layer.layer_name,
                agency: layer.city_muni_master?.name || 'Database',
                description: layer.metadata?.description || `Dynamic layer: ${layer.layer_name}`,
                geometry: geometry,
                layer_type: layer.layer_type,
                style_config: layer.style_config,
                opacity: layer.opacity || 0.7,
                is_downloadable: layer.is_downloadable,
                category: layer.project_categories?.name || 'General',
                metadata: layer.metadata,
                visible: isVisible
              };
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
            },
            visible: false
          }));
          
          const combinedLayers = [...mainLayers, ...dbLayers, ...formattedGeoPortalLayers];
          setAvailableLayers(combinedLayers);
        } catch (fetchError) {
          setAvailableLayers([...mainLayers, ...dbLayers]);
        }
        
      } catch (error) {
        console.error('Error in fetchGeoPortalLayers:', error);
        setAvailableLayers(mainLayers);
      } finally {
        setLoadingLayers(false);
      }
    };

  useEffect(() => {
    fetchGeoPortalLayers();

    // Listen for layer updates from upload component
    const handleLayersUpdated = () => {
      console.log('Layers updated event received, refreshing layers...');
      fetchGeoPortalLayers();
    };

    window.addEventListener('layersUpdated', handleLayersUpdated);

    return () => {
      window.removeEventListener('layersUpdated', handleLayersUpdated);
    };
  }, []);

  const [loadedLayers, setLoadedLayers] = useState<any[]>([]);
  const [mapView, setMapView] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [bufferData, setBufferData] = useState<any>(null);
  const [basemap, setBasemap] = useState('Open Street Map');
  const [legendsOpen, setLegendsOpen] = useState(true);
  const [xyInput, setXyInput] = useState({ lat: '', lng: '' });
  const [currentZoom, setCurrentZoom] = useState(6);
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

  const toggleLayerVisibility = (id: number) => {
    // Synchronize specialized visibility states for main infrastructure layers
    if (id === 10001) setAdminBoundaryVisible(!adminBoundaryVisible);
    if (id === 10002) setRoadNetworksVisible(!roadNetworksVisible);
    if (id === 10003) setRiversVisible(!riversVisible);
    if (id === 10006) setParcelLotsVisible(!parcelLotsVisible);

    const isDynamicLayer = availableLayers.find(l => l.id === id && !l.is_main_layer);
    
    if (isDynamicLayer) {
      // Update dynamic layer visibility state
      setDynamicLayerVisibility(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
      // Update availableLayers to reflect the change
      setAvailableLayers(prev => prev.map(layer => 
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      ));
    }
  };

  const isLayerLoaded = (layerId: number) => {
    // Check specialized visibility states for main infrastructure layers
    if (layerId === 10001) return adminBoundaryVisible;
    if (layerId === 10002) return roadNetworksVisible;
    if (layerId === 10003) return riversVisible;
    if (layerId === 10006) return parcelLotsVisible;

    // Check if it's a dynamic layer (from database)
    const dynamicLayer = availableLayers.find(l => l.id === layerId && !l.is_main_layer);
    if (dynamicLayer) {
      return dynamicLayer.visible;
    }
    return false;
  };

  const updateLayerOpacity = (id: number, opacity: number) => {
    setLoadedLayers(loadedLayers.map(layer => 
      layer.id === id ? { ...layer, opacity } : layer
    ));
  };

  const getLayerColor = (layerTitle: string) => {
    if (layerTitle.includes('Administrative') || layerTitle.includes('Boundary')) {
      return '#8f058a'; // Purple from map.tsx
    } else if (layerTitle.includes('Road') || layerTitle.includes('Network')) {
      return '#7d8b8f'; // Grayish from map.tsx
    } else if (layerTitle.includes('Water') || layerTitle.includes('River') || layerTitle.includes('Waterway')) {
      return '#2591d9'; // Blue from map.tsx
    } else if (layerTitle.includes('Parcel')) {
      return '#eba878'; // Orange-ish from map.tsx
    } else if (layerTitle.includes('Land Cover')) {
      return '#22c55e'; // Green from map.tsx
    } else if (layerTitle.includes('Climate')) {
      return '#3d3d3d'; // Grey from map.tsx
    } else {
      return '#6b7280'; 
    }
  };

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

  const handleGotoXY = () => {
    const lat = parseFloat(xyInput.lat);
    const lng = parseFloat(xyInput.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapView({ lat, lng, zoom: 15 });
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + 1, 18);
    setCurrentZoom(newZoom);
    if (mapView) setMapView({ ...mapView, zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - 1, 1);
    setCurrentZoom(newZoom);
    if (mapView) setMapView({ ...mapView, zoom: newZoom });
  };

  const toggleMeasurementMode = () => {
    setMeasureInput(prev => ({ ...prev, isMeasuring: !prev.isMeasuring, clickMode: 'start' }));
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

  const handleMeasureTypeChange = (type: 'distance' | 'area') => {
    setMeasureInput(prev => ({ ...prev, measurementType: type }));
  };

  const handleMeasurePointChange = (field: 'startPoint' | 'endPoint', value: string) => {
    const newMeasureInput = { ...measureInput, [field]: value };
    const distance = calculateDistance(newMeasureInput.startPoint, newMeasureInput.endPoint);
    setMeasureInput({ ...newMeasureInput, distance, visualElements: measureInput.visualElements });
  };

  return (
    <div className="relative h-full w-full min-h-screen bg-[#f8f9fa] overflow-hidden flex flex-col font-sans">
      <main className="flex-1 relative overflow-hidden">
        
        {/* Left Panel */}
        <div className={`absolute top-0 left-0 m-4 z-[1500] transition-transform duration-300 rounded-lg bg-white border-r`} style={{ width: '280px' }}>
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
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 accent-orange-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f1a10d] focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-[1001]">
                  {searchResults.map((result, index) => (
                    <div key={index} onClick={() => handleSearchSelect(result)} className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <div className="text-xs font-medium text-gray-900">{result.display_name}</div>
                      <div className="text-xs text-gray-500 capitalize">{result.type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Basemap Selection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Base Map</h4>
              <div className="space-y-2">
                {['Open Street Map', 'Satellite (Esri)'].map(bm => (
                  <label key={bm} className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" name="basemap" className="w-4 h-4 text-orange-600 focus:ring-orange-500" 
                      checked={basemap === bm} onChange={() => setBasemap(bm)} 
                    />
                    <span className="text-sm text-gray-700">{bm}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Layer Selection */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Layers</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-600" checked={adminBoundaryVisible} onChange={(e) => setAdminBoundaryVisible(e.target.checked)} />
                  <span className="text-sm text-gray-700">Admin Boundary</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-600" checked={roadNetworksVisible} onChange={(e) => setRoadNetworksVisible(e.target.checked)} />
                  <span className="text-sm text-gray-700">Road Networks</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-600" checked={riversVisible} onChange={(e) => setRiversVisible(e.target.checked)} />
                  <span className="text-sm text-gray-700">Rivers</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-600" checked={parcelLotsVisible} onChange={(e) => setParcelLotsVisible(e.target.checked)} />
                  <span className="text-sm text-gray-700">Parcel Lots</span>
                </label>
                {/* Temporarily hidden Land Cover (NAMRIA) layer */}
                {/* <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-600" checked={landCoverVisible} onChange={(e) => setLandCoverVisible(e.target.checked)} />
                  <span className="text-sm text-gray-700">Land Cover (NAMRIA)</span>
                </label> */}
                {/* Temporarily hidden Climate Type (PAGASA) layer */}
                {/* <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-600" checked={climateTypeVisible} onChange={(e) => setClimateTypeVisible(e.target.checked)} />
                  <span className="text-sm text-gray-700">Climate Type (PAGASA)</span>
                </label> */}
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="w-full h-full z-0">
          <MapRenderer 
            key="viewer-map-instance" layers={availableLayers} mapView={mapView} bufferData={bufferData} basemap={basemap}
            onMapClick={handleMapClick} isMeasuring={measureInput.isMeasuring} measureVisualElements={measureInput.visualElements}
            boundaryLayerVisible={adminBoundaryVisible} roadNetworkLayerVisible={roadNetworksVisible} waterwaysLayerVisible={riversVisible}
            landCoverLayerVisible={landCoverVisible} climateTypeLayerVisible={climateTypeVisible} parcelLotsVisible={parcelLotsVisible}
            initialZoom={15}
          />
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col space-y-1">
          <button onClick={handleZoomIn} className="bg-white p-2 rounded shadow-lg border border-gray-200 hover:bg-gray-50"><ZoomIn size={20} color={brandColor} /></button>
          <button onClick={handleZoomOut} className="bg-white p-2 rounded shadow-lg border border-gray-200 hover:bg-gray-50"><ZoomOut size={20} color={brandColor} /></button>
        </div>

        {/* Right Toolbar */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-1">
          <ToolIcon active={activeRightPanel === 'layers'} onClick={() => setActiveRightPanel('layers')} icon={<Layers size={18} />} brandColor={brandColor} onMouseEnter={() => setLayersHovered(true)} onMouseLeave={() => setLayersHovered(false)} />
          <ToolIcon active={activeRightPanel === 'basemap'} onClick={() => setActiveRightPanel('basemap')} icon={<Globe size={18} />} brandColor={brandColor} onMouseEnter={() => setBasemapHovered(true)} onMouseLeave={() => setBasemapHovered(false)} />
          <ToolIcon active={activeRightPanel === 'measure'} onClick={() => setActiveRightPanel('measure')} icon={<Ruler size={18} />} brandColor={brandColor} onMouseEnter={() => setMeasureHovered(true)} onMouseLeave={() => setMeasureHovered(false)} />
          <ToolIcon active={activeRightPanel === 'xy'} onClick={() => setActiveRightPanel('xy')} label="XY" brandColor={brandColor} onMouseEnter={() => setXyHovered(true)} onMouseLeave={() => setXyHovered(false)} />
        </div>

        {/* Legends Box */}
        <div className="absolute top-50 right-4 z-[1000] bg-white shadow-lg border border-gray-200 rounded-lg max-w-xs">
          <div style={{ backgroundColor: brandColor }} className="px-3 py-2 flex items-center justify-between rounded-t-lg">
            <h3 className="text-xs font-bold text-white flex items-center"><Layers size={12} className="mr-1" /> Legends</h3>
          </div>
          <div className="p-2">
            {legendsOpen && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[
                  { id: 1, title: 'Administrative Boundaries', layer_type: 'boundary', color: '#0000FF', shape: 'polygon' },
                  { id: 2, title: 'Road Networks', layer_type: 'road', color: '#696969', shape: 'line' },
                  { id: 3, title: 'Waterways', layer_type: 'waterway', color: '#2591d9', shape: 'water' },
                  { id: 4, title: 'Parcel Lots', layer_type: 'parcel', color: '#FFFFFF', shape: 'polygon' }
                  // Temporarily hidden Land Cover (NAMRIA) layer
                  // { id: 5, title: 'Land Cover', layer_type: 'landcover', color: '#22c55e', shape: 'polygon' },
                  // Temporarily hidden Climate Type (PAGASA) layer
                  // { id: 6, title: 'Climate Type', layer_type: 'climate', color: '#3b82f6', shape: 'polygon' }
                ].map((layer) => (
                  <div key={layer.id} className="flex items-center space-x-2 text-xs">
                    {layer.shape === 'polygon' && (
                      layer.title === 'Parcel Lots' 
                        ? <div className="w-4 h-4 border-2 border-white bg-orange-500/40"></div>
                        : layer.title === 'Administrative Boundaries'
                          ? <div className="w-4 h-4 border-2 border-dashed" style={{ borderColor: layer.color, backgroundColor: 'transparent' }}></div>
                          : <div className="w-4 h-4 border-2" style={{ borderColor: layer.color, backgroundColor: `${layer.color}1a` }}></div>
                    )}
                    {layer.shape === 'line' && <div className="w-4 h-0.5" style={{ backgroundColor: layer.color, height: '3px' }}></div>}
                    {layer.shape === 'water' && (
                      <div className="w-4 h-4">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 8 Q 8 2, 14 8 Q 8 14, 2 8" stroke={layer.color} strokeWidth="1.5" fill="none"/>
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-700 truncate">{layer.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel Body */}
        {activeRightPanel && (
          <div className="absolute top-4 right-16 z-[1000] w-64 bg-[#333] text-white shadow-2xl border border-gray-600">
            <div style={{ backgroundColor: brandColor }} className="text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs uppercase cursor-pointer">
              <div className="flex items-center"><ChevronRight size={14} className="mr-1 stroke-[3px]" /> {activeRightPanel}</div>
              <button onClick={() => setActiveRightPanel(null)}><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4 text-xs">
              {activeRightPanel === 'layers' && (
                <div className="space-y-3">
                  <GeoPortalSync />
                  {availableLayers.map((layer) => (
                    <div key={layer.id} className="flex items-center justify-between p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600" onClick={() => toggleLayerVisibility(layer.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLayerColor(layer.title) }}></div>
                        <span className="text-white text-xs">{layer.title}</span>
                      </div>
                      <input type="checkbox" checked={isLayerLoaded(layer.id)} onChange={() => toggleLayerVisibility(layer.id)} className="w-4 h-4 accent-blue-600" onClick={(e) => e.stopPropagation()}/>
                    </div>
                  ))}
                </div>
              )}
              {activeRightPanel === 'basemap' && (
                <select value={basemap} onChange={(e) => setBasemap(e.target.value)} className="w-full bg-white text-black p-2 rounded">
                  {['Open Street Map', 'Satellite (Esri)'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
              {activeRightPanel === 'xy' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><label>Lat</label><input type="text" value={xyInput.lat} onChange={(e) => setXyInput({...xyInput, lat: e.target.value})} className="w-32 text-white p-1 rounded bg-gray-700" /></div>
                  <div className="flex items-center justify-between"><label>Lng</label><input type="text" value={xyInput.lng} onChange={(e) => setXyInput({...xyInput, lng: e.target.value})} className="w-32 text-white p-1 rounded bg-gray-700" /></div>
                  <button onClick={handleGotoXY} style={{ backgroundColor: brandColor }} className="w-full text-white font-bold py-2 rounded">Go</button>
                </div>
              )}
              {activeRightPanel === 'measure' && (
                <div className="space-y-3">
                  {/* Measurement Type Tabs */}
                  <div className="flex border-b border-gray-600">
                    <button 
                      onClick={() => handleMeasureTypeChange('distance')}
                      className={`flex-1 py-2 text-xs font-medium ${measureInput.measurementType === 'distance' ? 'text-white border-b-2 border-[#318855]' : 'text-gray-400'}`}
                    >
                      Distance
                    </button>
                    <button 
                      onClick={() => handleMeasureTypeChange('area')}
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
                        <div className="flex justify-between"><span className="text-gray-400">ha:</span><span className="text-white">{calculateArea(measureInput.visualElements.polygon).ha}</span></div>
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

function ToolIcon({ active, onClick, icon, label, brandColor, ...props }: any) {
  return (
    <button 
      suppressHydrationWarning={true} onClick={onClick} 
      style={active ? { backgroundColor: brandColor } : { backgroundColor: '#333' }} 
      className={`w-10 h-10 flex items-center justify-center border-b border-gray-600 text-white shadow-sm`}
      {...props}
    >
      {icon || <span className="font-bold text-xs">{label}</span>}
    </button>
  );
}