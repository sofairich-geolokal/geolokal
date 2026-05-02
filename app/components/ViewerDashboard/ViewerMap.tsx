"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Menu, Layers, Globe, Ruler, CircleDot, 
  Download, ExternalLink, ChevronRight, 
  ChevronLeft, X, MoveUp, Save, Eye, ZoomIn, ZoomOut
} from 'lucide-react';

// Import the layer components
import BoundaryLayer from './BoundaryLayer';
import RoadNetworksLayer from './RoadNetworksLayer';
import WaterwaysLayer from './WaterwaysLayer';

const MapRenderer = dynamic(() => import('./MapRenderer'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center text-white">Initializing...</div> 
});

export default function ViewerMap() {
  const brandColor = "#318855";

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [activeRightPanel, setActiveRightPanel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Layer Name');
  const [searchQuery, setSearchQuery] = useState('');

  // Viewer-specific layers - will be fetched from GeoPortal API
  const [availableLayers, setAvailableLayers] = useState<any[]>([]);
  const [loadingLayers, setLoadingLayers] = useState(false);

  // State for managing boundary, road network, and waterways layers
  const [boundaryLayerVisible, setBoundaryLayerVisible] = useState(false);
  const [boundaryLayerHighlighted, setBoundaryLayerHighlighted] = useState(false);
  const [roadNetworkLayerVisible, setRoadNetworkLayerVisible] = useState(false);
  const [roadNetworkLayerHighlighted, setRoadNetworkLayerHighlighted] = useState(false);
  const [waterwaysLayerVisible, setWaterwaysLayerVisible] = useState(false);
  const [waterwaysLayerHighlighted, setWaterwaysLayerHighlighted] = useState(false);

  // Three main layers that should always be available (same as superadmin)
  const mainLayers = [
    {
      id: 10001,
      title: 'Administrative Boundaries',
      agency: 'Geolokal',
      description: 'City and barangay boundaries from database',
      geometry: [
        [13.7421, 121.1089],
        [13.7421, 121.1412],
        [13.7756, 121.1412],
        [13.7756, 121.1089],
        [13.7421, 121.1089]
      ],
      layer_type: 'boundary',
      opacity: 0.8,
      category: 'DRRM',
      is_main_layer: true // Flag to identify main layers
    },
    {
      id: 10002,
      title: 'Road Networks',
      agency: 'DPWH',
      description: 'Road networks and transportation infrastructure',
      geometry: (() => {
        const baseCoords = [
          { center: [14.5995, 120.9842], offset: 0.4 },  // Batangas area  
          { center: [15.1570, 120.6344], offset: 0.3 },  // Bulacan area
          { center: [10.3157, 123.8854], offset: 0.6 }   // Cebu area
        ];
        
        const coord = baseCoords[101 % baseCoords.length];
        const size = 0.3 + (101 * 0.1);
        
        return [
          [coord.center[1] - size, coord.center[0] - size],
          [coord.center[1] + size, coord.center[0] - size],
          [coord.center[1] + size, coord.center[0] + size],
          [coord.center[1] - size, coord.center[0] - size]
        ];
      })(),
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
      geometry: [
        { center: [13.4124, 122.5619], offset: 0.5 },  // Manila area
        { center: [14.5995, 120.9842], offset: 0.4 },  // Batangas area  
        { center: [15.1570, 120.6344], offset: 0.3 },  // Bulacan area
        { center: [10.3157, 123.8854], offset: 0.6 }   // Cebu area
      ].map((coord, index) => {
        const size = 0.3 + (102 * 0.1);
        
        return [
          [coord.center[1] - size, coord.center[0] - size],
          [coord.center[1] + size, coord.center[0] - size],
          [coord.center[1] + size, coord.center[0] + size],
          [coord.center[1] - size, coord.center[0] - size]
        ];
      })[0],
      layer_type: 'waterway',
      opacity: 0.7,
      category: 'Environmental',
      is_main_layer: true
    }
  ];

  // Check GeoServer status
  const checkGeoServerStatus = async () => {
    try {
      // Try multiple GeoServer URLs with timeout
      const urls = [
        `${process.env.NEXT_PUBLIC_GEONODE_URL || 'http://localhost:8000'}/geoserver/web/`,
        'http://localhost:8080/geoserver/web/',
        'http://localhost:8000/geoserver/web/',
        'https://demo.geonode.org/geoserver/web/'
      ];
      
      for (const url of urls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'no-cors' // Avoid CORS issues for HEAD requests
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok || response.type === 'opaque') {
            console.log('GeoServer is accessible at:', url);
            return true;
          }
        } catch (err) {
          console.log(`Failed to connect to ${url}:`, err instanceof Error ? err.message : 'Unknown error');
          continue; // Try next URL
        }
      }
      
      console.log('GeoServer not accessible, using fallback mode');
      return false;
    } catch (error) {
      console.error('GeoServer status check failed:', error);
      return false;
    }
  };

  // Fetch real layers from Philippine GeoPortal API and database
  useEffect(() => {
    const fetchGeoPortalLayers = async () => {
      setLoadingLayers(true);
      try {
        // Check GeoServer status first
        const geoServerRunning = await checkGeoServerStatus();
        console.log('GeoServer Status:', geoServerRunning ? 'Running' : 'Not Running');
        
        // Fetch dynamic layers from database
        const dbResponse = await fetch('/api/layers?visible=true');
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
            console.log('Successfully loaded database layers:', dbLayers.length);
          }
        }

        // Add the three main layers that should always be available (same as superadmin)
        const mainLayers = [
          {
            id: 10001,
            title: 'Administrative Boundaries',
            agency: 'NAMRIA',
            description: 'City and barangay boundaries from database',
            geometry: [
              [13.7421, 121.1089],
              [13.7421, 121.1412],
              [13.7756, 121.1412],
              [13.7756, 121.1089],
              [13.7421, 121.1089]
            ],
            layer_type: 'boundary',
            opacity: 0.8,
            category: 'DRRM',
            is_main_layer: true // Flag to identify main layers
          },
          {
            id: 10002,
            title: 'Road Networks',
            agency: 'DPWH',
            description: 'Road networks and transportation infrastructure',
            geometry: [
              [14.5995, 120.9842],
              [14.5995, 121.1412],
              [14.5995, 121.1089],
              [14.5995, 120.9842]
            ],
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
            geometry: [
              { center: [13.4124, 122.5619], offset: 0.5 },  // Manila area
              { center: [14.5995, 120.9842], offset: 0.4 },  // Batangas area  
              { center: [15.1570, 120.6344], offset: 0.3 },  // Bulacan area
              { center: [10.3157, 123.8854], offset: 0.6 }   // Cebu area
            ].map((coord, index) => {
              const size = 0.3 + (102 * 0.1);
              
              return [
                [coord.center[1] - size, coord.center[0] - size],
                [coord.center[1] + size, coord.center[0] - size],
                [coord.center[1] + size, coord.center[0] + size],
                [coord.center[1] - size, coord.center[0] - size]
              ];
            })[0],
            layer_type: 'waterway',
            opacity: 0.7,
            category: 'Environmental',
            is_main_layer: true
          }
        ];

        // Combine database layers with main layers
        const allLayers = [...mainLayers, ...dbLayers];

        // Also try GeoPortal API for additional layers
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch('https://geoportal.gov.ph/api/v2/layers', {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            
            // Transform GeoPortal data to our layer format
            const geoPortalLayers = data.slice(0, 2).map((layer: any, index: number) => ({
              id: 2000 + index, // Use high IDs to avoid conflicts with main layers
              title: layer.title || layer.name || `GeoPortal Layer ${index + 1}`,
              agency: layer.organization || 'GeoPortal PH',
              description: layer.description || layer.abstract || 'Philippine geographic data layer',
              geometry: (() => {
                const baseCoords = [
                  { center: [13.4124, 122.5619], offset: 0.5 },  // Manila area
                  { center: [14.5995, 120.9842], offset: 0.4 },  // Batangas area  
                  { center: [15.1570, 120.6344], offset: 0.3 },  // Bulacan area
                  { center: [10.3157, 123.8854], offset: 0.6 }   // Cebu area
                ];
                
                const coord = baseCoords[(index + 10) % baseCoords.length];
                const size = 0.3 + ((index + 10) * 0.1);
                
                return [
                  [coord.center[1] - size, coord.center[0] - size],
                  [coord.center[1] + size, coord.center[0] - size],
                  [coord.center[1] + size, coord.center[0] + size],
                  [coord.center[1] - size, coord.center[0] - size]
                ];
              })(),
              is_geoportal: true
            }));
            
            // Combine all layers
            setAvailableLayers([...allLayers, ...geoPortalLayers]);
            console.log('Total layers loaded:', allLayers.length + geoPortalLayers.length);
          } else {
            throw new Error(`GeoPortal API responded with status: ${response.status}`);
          }
        } catch (fetchError) {
          console.log('GeoPortal API fetch failed, using only main layers:', fetchError instanceof Error ? fetchError.message : 'Unknown error');
          // Use only main layers if API fails
          setAvailableLayers(mainLayers);
        }
        
      } catch (error) {
        console.error('Error in fetchGeoPortalLayers:', error);
        // Ensure we always have some layers available
        if (mainLayers.length === 0) {
          setAvailableLayers([
            { 
              id: 1, 
              title: 'Administrative Boundaries', 
              agency: 'NAMRIA', 
              description: 'City and barangay boundaries',
              geometry: [
                [13.7421, 121.1089],
                [13.7421, 121.1412],
                [13.7756, 121.1412],
                [13.7756, 121.1089],
                [13.7421, 121.1089]
              ]
            },
            { 
              id: 2, 
              title: 'Land Use', 
              agency: 'DENR', 
              description: 'Current land use classification',
              geometry: [
                [14.5995, 120.9842],
                [14.5995, 121.1412],
                [14.5995, 121.1089],
                [14.5995, 120.9842]
              ]
            },
            { 
              id: 3, 
              title: 'Population Density', 
              agency: 'PSA', 
              description: 'Population distribution by area',
              geometry: [
                [15.1570, 120.6344],
                [15.1570, 120.9644],
                [15.1570, 120.8344],
                [15.1570, 120.6344]
              ]
            }
          ]);
        } else {
          setAvailableLayers(availableLayers);
        }
      } finally {
        setLoadingLayers(false);
      }
    };

    fetchGeoPortalLayers();
  }, []); 

  const [loadedLayers, setLoadedLayers] = useState<any[]>([]);
  const [mapView, setMapView] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [bufferData, setBufferData] = useState<any>(null);
  const [basemap, setBasemap] = useState('Open Street Map');
  const [legendsOpen, setLegendsOpen] = useState(true);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measuredArea, setMeasuredArea] = useState<number | null>(null);
  const [savedMaps, setSavedMaps] = useState<any[]>([]);
  const [mapNameInput, setMapNameInput] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [selectedDownloadLayer, setSelectedDownloadLayer] = useState<any>(null);
  const [downloadForm, setDownloadForm] = useState({
    official_email: '',
    client_name: '',
    sex: 'Male',
    address: '',
    office_agency: '',
    sector: '',
    purpose: '',
    official_contact_no: '',
    agree_terms: false,
    certify_info: false
  });

  // Available basemaps
  const availableBasemaps = [
    'Open Street Map',
    'Satellite Map', 
    'Terrain Map'
  ];

  const [xyInput, setXyInput] = useState({ lat: '', lng: '' });
  const [currentZoom, setCurrentZoom] = useState(6);
  const [bufferInput, setBufferInput] = useState({ type: 'Point', distance: '', unit: 'Kilometers' });
  const [measureInput, setMeasureInput] = useState({ 
    startPoint: '', 
    endPoint: '', 
    distance: '0.00 km',
    area: '0.00 km²',
    bearing: '0.00°',
    perimeter: '0.00 km',
    isMeasuring: false,
    clickMode: 'start',
    measureType: 'distance' as 'distance' | 'area' | 'bearing' | 'perimeter',
    points: [] as [number, number][],
    visualElements: {
      lines: [] as [number, number][][],
      markers: [] as [number, number][]
    }
  });

  // Handle map click for measurement
  const handleMapClick = (lat: number, lng: number) => {
    if (activeRightPanel !== 'measure' || !measureInput.isMeasuring) return;
    
    const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const newPoint: [number, number] = [lat, lng];
    
    if (measureInput.measureType === 'distance' || measureInput.measureType === 'bearing') {
      // Distance and Bearing measurement logic (2 points)
      if (measureInput.clickMode === 'start') {
        handleMeasurePointChange('startPoint', coordString);
        // Add marker for start point
        setMeasureInput(prev => ({
          ...prev,
          clickMode: 'end',
          visualElements: {
            ...prev.visualElements,
            markers: [newPoint],
            lines: []
          }
        }));
      } else {
        handleMeasurePointChange('endPoint', coordString);
        // Add marker for end point and create line between points
        const startPoint = measureInput.visualElements.markers[0];
        const bearing = measureInput.measureType === 'bearing' 
          ? calculateBearing(startPoint, newPoint)
          : measureInput.bearing;
        
        setMeasureInput(prev => ({
          ...prev,
          clickMode: 'start',
          bearing,
          visualElements: {
            markers: [startPoint, newPoint],
            lines: [[startPoint, newPoint]]
          }
        }));
      }
    } else {
      // Area and Perimeter measurement logic (multiple points)
      const newPoints = [...measureInput.points, newPoint];
      const newMarkers = [...measureInput.visualElements.markers, newPoint];
      
      // Create lines between consecutive points
      let newLines: [number, number][][] = [];
      if (newPoints.length > 1) {
        for (let i = 0; i < newPoints.length - 1; i++) {
          newLines.push([newPoints[i], newPoints[i + 1]]);
        }
        // Close the polygon if we have 3+ points
        if (newPoints.length >= 3) {
          newLines.push([newPoints[newPoints.length - 1], newPoints[0]]);
        }
      }
      
      // Calculate area and perimeter
      const area = newPoints.length >= 3 ? calculateArea(newPoints) : measureInput.area;
      const perimeter = newPoints.length >= 2 ? calculatePerimeter(newPoints) : measureInput.perimeter;
      
      setMeasureInput(prev => ({ 
        ...prev, 
        points: newPoints,
        area,
        perimeter,
        visualElements: {
          markers: newMarkers,
          lines: newLines
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

  const addLayer = (layer: any) => {
    if (!loadedLayers.find(l => l.id === layer.id)) {
      // Generate unique color per layer
      const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
      setLoadedLayers([{ ...layer, visible: true, opacity: 0.7, color: randomColor }, ...loadedLayers]);
      
      // Automatically enable corresponding layer visibility for main layers
      if (layer.title.includes('Administrative') || layer.title.includes('Boundary')) {
        setBoundaryLayerVisible(true);
      } else if (layer.title.includes('Road') || layer.title.includes('Network')) {
        setRoadNetworkLayerVisible(true);
      } else if (layer.title.includes('Water') || layer.title.includes('River') || layer.title.includes('Waterway')) {
        setWaterwaysLayerVisible(true);
      }
    }
  };

  const removeLayer = (id: number) => {
    // Find the layer being removed to check if it's a main layer
    const removedLayer = loadedLayers.find(l => l.id === id);
    
    // Hide corresponding layer visibility for main layers
    if (removedLayer) {
      if (removedLayer.title.includes('Administrative') || removedLayer.title.includes('Boundary')) {
        setBoundaryLayerVisible(false);
      } else if (removedLayer.title.includes('Road') || removedLayer.title.includes('Network')) {
        setRoadNetworkLayerVisible(false);
      } else if (removedLayer.title.includes('Water') || removedLayer.title.includes('River') || removedLayer.title.includes('Waterway')) {
        setWaterwaysLayerVisible(false);
      }
    }
    
    setLoadedLayers(loadedLayers.filter(l => l.id !== id));
  };

  // Remove Administrative Boundaries layer specifically
  const removeAdministrativeBoundaries = () => {
    setLoadedLayers(loadedLayers.filter(l => l.id !== 1));
  };

  const updateLayerOpacity = (id: number, opacity: number) => {
    setLoadedLayers(loadedLayers.map(layer => 
      layer.id === id ? { ...layer, opacity } : layer
    ));
  };

  const toggleLayerVisibility = (id: number) => {
    setLoadedLayers(loadedLayers.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const isLayerLoaded = (layerId: number) => {
    return loadedLayers.some(l => l.id === layerId);
  };

  // Check if user is logged in
  const isLoggedIn = () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('loggedInUser');
      return user !== null && user !== undefined;
    }
    return false;
  };

  // Save map configuration (works without login)
  const saveMap = async () => {
    if (!mapNameInput.trim()) {
      alert('Please enter a map name');
      return;
    }

    try {
      const mapConfig = {
        layers: loadedLayers,
        basemap,
        mapView,
        timestamp: new Date().toISOString()
      };

      // Save map without requiring login - use guest user ID or no user ID
      const response = await fetch('/api/saved-maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: null, // Allow guest users to save maps
          map_name: mapNameInput,
          map_description: `Custom map with ${loadedLayers.length} layers`,
          map_config: mapConfig,
          is_guest: !isLoggedIn() // Mark as guest save if not logged in
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Map saved successfully!');
        setMapNameInput('');
        setShowSaveDialog(false);
        // Refresh saved maps
        fetchSavedMaps();
      } else {
        alert('Failed to save map: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving map:', error);
      alert('Failed to save map');
    }
  };

  // Fetch saved maps
  const fetchSavedMaps = async () => {
    try {
      const response = await fetch('/api/saved-maps?userId=1'); // TODO: Get actual user ID
      const result = await response.json();
      
      if (result.success) {
        setSavedMaps(result.data);
      }
    } catch (error) {
      console.error('Error fetching saved maps:', error);
    }
  };

  // Load saved map
  const loadSavedMap = async (savedMap: any) => {
    try {
      const config = savedMap.map_config;
      
      // Restore layers
      setLoadedLayers(config.layers || []);
      
      // Restore basemap
      setBasemap(config.basemap || 'Open Street Map');
      
      // Restore map view
      if (config.mapView) {
        setMapView(config.mapView);
      }
      
      alert(`Loaded map: ${savedMap.map_name}`);
    } catch (error) {
      console.error('Error loading saved map:', error);
      alert('Failed to load saved map');
    }
  };

  // Submit download request (requires login)
  const submitDownloadRequest = async () => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      alert('Please login first to request downloads. Click on the profile icon to login.');
      return;
    }

    if (!downloadForm.official_email || !downloadForm.client_name) {
      alert('Email and name are required');
      return;
    }

    if (!downloadForm.agree_terms) {
      alert('You must agree to the terms and conditions');
      return;
    }

    if (!downloadForm.certify_info) {
      alert('You must certify the correctness of the information');
      return;
    }

    try {
      // Get user data from localStorage
      const userData = localStorage.getItem('loggedInUser');
      const user = userData ? JSON.parse(userData) : null;
      
      const response = await fetch('/api/download-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id || null,
          layer_id: selectedDownloadLayer.id,
          layer_name: selectedDownloadLayer.title,
          ...downloadForm,
          bbox: selectedDownloadLayer.geometry,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Download request submitted successfully! You will receive an email with the download link shortly.');
        setShowDownloadDialog(false);
        setSelectedDownloadLayer(null);
        // Reset form
        setDownloadForm({
          official_email: '',
          client_name: '',
          sex: 'Male',
          address: '',
          office_agency: '',
          sector: '',
          purpose: '',
          official_contact_no: '',
          agree_terms: false,
          certify_info: false
        });
      } else {
        alert('Failed to submit download request: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting download request:', error);
      alert('Failed to submit download request');
    }
  };

  // Initialize saved maps
  useEffect(() => {
    fetchSavedMaps();
    // Remove Administrative Boundaries layer on component mount
    removeAdministrativeBoundaries();
  }, []);

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
    if (mapView) {
      setMapView({ ...mapView, zoom: newZoom });
    } else {
      setMapView({ lat: 13.4124, lng: 122.5619, zoom: newZoom });
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - 1, 1);
    setCurrentZoom(newZoom);
    if (mapView) {
      setMapView({ ...mapView, zoom: newZoom });
    } else {
      setMapView({ lat: 13.4124, lng: 122.5619, zoom: newZoom });
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
      
      const R = 6371; // Earth's radius in kilometers
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

  const calculateArea = (points: [number, number][]): string => {
    try {
      if (points.length < 3) return '0.00 km²';
      
      // Using Shoelace formula for area calculation
      let area = 0;
      const n = points.length;
      
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i][0] * points[j][1];
        area -= points[j][0] * points[i][1];
      }
      
      area = Math.abs(area) / 2;
      
      // Convert to approximate square kilometers (rough conversion)
      // This is a simplified calculation - for more accuracy, use geodesic calculations
      const areaKm2 = area * 111 * 111; // Approximate conversion from degrees² to km²
      
      return `${areaKm2.toFixed(4)} km²`;
    } catch (error) {
      return '0.00 km²';
    }
  };

  const calculateBearing = (startPoint: [number, number], endPoint: [number, number]): string => {
    try {
      const [lat1, lon1] = startPoint;
      const [lat2, lon2] = endPoint;
      
      const lat1Rad = lat1 * Math.PI / 180;
      const lat2Rad = lat2 * Math.PI / 180;
      const deltaLonRad = (lon2 - lon1) * Math.PI / 180;
      
      const y = Math.sin(deltaLonRad) * Math.cos(lat2Rad);
      const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
                Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLonRad);
      
      const bearingRad = Math.atan2(y, x);
      const bearingDeg = (bearingRad * 180 / Math.PI + 360) % 360;
      
      return `${bearingDeg.toFixed(2)}°`;
    } catch (error) {
      return '0.00°';
    }
  };

  const calculatePerimeter = (points: [number, number][]): string => {
    try {
      if (points.length < 2) return '0.00 km';
      
      let perimeter = 0;
      const R = 6371; // Earth's radius in kilometers
      
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        const [lat1, lon1] = points[i];
        const [lat2, lon2] = points[j];
        
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        perimeter += R * c;
      }
      
      return `${perimeter.toFixed(2)} km`;
    } catch (error) {
      return '0.00 km';
    }
  };

  const handleMeasurePointChange = (field: 'startPoint' | 'endPoint', value: string) => {
    const newMeasureInput = { ...measureInput, [field]: value };
    const distance = calculateDistance(newMeasureInput.startPoint, newMeasureInput.endPoint);
    setMeasureInput({ ...newMeasureInput, distance });
  };

  const handleClearMeasurement = () => {
    setMeasureInput({
      startPoint: '',
      endPoint: '',
      distance: '0.00 km',
      area: '0.00 km²',
      bearing: '0.00°',
      perimeter: '0.00 km',
      isMeasuring: false,
      clickMode: 'start',
      measureType: measureInput.measureType, // Keep the current measurement type
      points: [],
      visualElements: {
        lines: [],
        markers: []
      }
    });
  };

  const handleMeasureTypeChange = (type: 'distance' | 'area' | 'bearing' | 'perimeter') => {
    setMeasureInput({
      startPoint: '',
      endPoint: '',
      distance: '0.00 km',
      area: '0.00 km²',
      bearing: '0.00°',
      perimeter: '0.00 km',
      isMeasuring: false,
      clickMode: 'start',
      measureType: type,
      points: [],
      visualElements: {
        lines: [],
        markers: []
      }
    });
  };

  return (
    <div className="relative h-full w-full min-h-screen bg-[#f8f9fa] overflow-hidden flex flex-col font-sans">
      
      <main className="flex-1 relative overflow-hidden">
        
        {/* Left Panel */}
        <div 
          className={`absolute top-0 left-0 h-full z-[1500] transition-transform duration-300 bg-white shadow-2xl border-r
            ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ width: '320px' }}
        >
          <div style={{ backgroundColor: brandColor }} className="p-2 flex items-center gap-1 text-white">
            <Layers size={20} />
            <input 
              type="text" 
              placeholder="Search layer"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-8 px-2 text-md rounded text-white outline-none"
              suppressHydrationWarning={true}
            />
            <button onClick={() => setLeftPanelOpen(false)} className="ml-1 p-1 hover:bg-black/10 rounded" suppressHydrationWarning={true}>
              <ChevronLeft size={18} />
            </button>
          </div>

          <div className="flex text-xs font-bold border-b bg-gray-50">
            <button
              onClick={() => setActiveTab('Layer Name')}
              className={`flex-1 py-3 border-b-2 ${activeTab === 'Layer Name' ? `border-[#318855] text-[#318855] bg-white` : 'border-transparent text-gray-500'}`}
              suppressHydrationWarning={true}
            >
              Available Layers
            </button>
            {loadingLayers && (
              <div className="px-2 py-1 text-blue-600 text-xs">
                <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></span>
                Loading...
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 bg-gray-50 max-h-[50vh]">
            {/* {!loadingLayers && availableLayers.length > 0 && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              </div>
            )} */}
            
            <ul className="space-y-1">
              {availableLayers.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase())).map(layer => {
                const isLoaded = isLayerLoaded(layer.id);
                const isMainLayer = layer.title.includes('Administrative') || layer.title.includes('Boundary') || 
                                  layer.title.includes('Road') || layer.title.includes('Network') || 
                                  layer.title.includes('Water') || layer.title.includes('River') || layer.title.includes('Waterway');
                
                return (
                  <li 
                    key={layer.id} 
                    onClick={() => !isLoaded && addLayer(layer)}
                    className={`p-2 border rounded text-xs group transition-colors ${
                      isLoaded 
                        ? 'bg-green-50 border-green-300 cursor-not-allowed' 
                        : isMainLayer
                          ? 'bg-blue-50 border-blue-300 hover:border-blue-500 cursor-pointer hover:bg-blue-100'
                          : 'bg-white hover:border-[#318855] cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-medium ${isLoaded ? 'text-green-700' : isMainLayer ? 'text-blue-700' : 'text-gray-700'}`}>
                        {layer.title}
                        {isMainLayer && !isLoaded && (
                          <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-1 rounded">Click to Apply</span>
                        )}
                      </span>
                      {!isLoaded && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addLayer(layer);
                          }} 
                          style={{ color: brandColor }} 
                          className="opacity-0 group-hover:opacity-100 font-bold"
                        >
                          + Add
                        </button>
                      )}
                      {isLoaded && (
                        <span className="text-green-600 font-bold text-xs">Applied</span>
                      )}
                    </div>
                    <div className={`text-xs ${isLoaded ? 'text-green-600' : isMainLayer ? 'text-blue-600' : 'text-gray-500'}`}>
                      {layer.description}
                    </div>
                    <div className={`text-xs mt-1 flex items-center gap-1 ${isLoaded ? 'text-green-500' : isMainLayer ? 'text-blue-500' : 'text-gray-400'}`}>
                      <span>{layer.agency}</span>
                      {layer.category && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">{layer.category}</span>
                      )}
                      {layer.layer_type && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-1 rounded">{layer.layer_type}</span>
                      )}
                      {layer.is_downloadable && (
                        <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Downloadable</span>
                      )}
                      {layer.is_geoportal && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">GeoPortal</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div style={{ borderTop: `4px solid ${brandColor}` }} className="flex-1 bg-white flex flex-col">
             <div style={{ backgroundColor: brandColor }} className="p-2 text-xs font-bold flex items-center text-white">
               <Layers size={14} className="mr-2" /> Active Layers
             </div>
             <div className="flex-1 overflow-y-auto p-1">
               {loadedLayers.length === 0 ? (
                 <div className="p-4 text-center text-gray-400 text-xs">
                   No layers loaded. Select layers from above to view them on the map.
                 </div>
               ) : (
                 loadedLayers.map((layer) => (
                   <div key={layer.id} className="flex items-center gap-2 p-2 border-b text-[11px] hover:bg-gray-50">
                     <button onClick={() => removeLayer(layer.id)} className="text-red-500 font-bold text-lg leading-none">×</button>
                     <input type="checkbox" checked={layer.visible} onChange={() => toggleLayerVisibility(layer.id)} className="accent-[#318855]" />
                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: layer.color }}></div>
                     <span className="flex-1 font-medium truncate">{layer.title}</span>
                     <input type="range" value={layer.opacity} onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))} className="w-12 accent-[#318855]" min="0.1" max="1" step="0.1" />
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>

        {!leftPanelOpen && (
          <button onClick={() => setLeftPanelOpen(true)} className="absolute top-4 left-0 z-[1600] bg-white p-2 rounded-r shadow-lg border">
            <ChevronRight size={24} color={brandColor} />
          </button>
        )}

        <div className="w-full h-full z-0">
          <MapRenderer 
            key="viewer-map-instance"
            layers={loadedLayers} 
            mapView={mapView} 
            bufferData={bufferData} 
            basemap={basemap}
            onMapClick={handleMapClick}
            isMeasuring={measureInput.isMeasuring}
            measureVisualElements={measureInput.visualElements}
            boundaryLayerVisible={boundaryLayerVisible}
            boundaryLayerHighlighted={boundaryLayerHighlighted}
            roadNetworkLayerVisible={roadNetworkLayerVisible}
            roadNetworkLayerHighlighted={roadNetworkLayerHighlighted}
            waterwaysLayerVisible={waterwaysLayerVisible}
            waterwaysLayerHighlighted={waterwaysLayerHighlighted}
            initialZoom={15}
          />
        </div>

        {/* Zoom Controls - Bottom Right */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col space-y-1">
          <button
            onClick={handleZoomIn}
            className="bg-white p-2 rounded shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Zoom In"
            suppressHydrationWarning={true}
          >
            <ZoomIn size={20} color={brandColor} />
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-white p-2 rounded shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Zoom Out"
            suppressHydrationWarning={true}
          >
            <ZoomOut size={20} color={brandColor} />
          </button>
        </div>

        {/* Right Toolbar - Limited for viewers */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-1">
          <ToolIcon active={activeRightPanel === 'layers'} onClick={() => setActiveRightPanel('layers')} icon={<Layers size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'basemap'} onClick={() => setActiveRightPanel('basemap')} icon={<Globe size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'measure'} onClick={() => setActiveRightPanel('measure')} icon={<Ruler size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'xy'} onClick={() => setActiveRightPanel('xy')} label="XY" brandColor={brandColor} />
        </div>

        {/* Legends Box - Right Side */}
        {(true) && (
          <div className="absolute top-50 right-4 z-[1000] bg-white shadow-lg border border-gray-200 rounded-lg max-w-xs">
            <div style={{ backgroundColor: brandColor }} className="px-3 py-2 flex items-center justify-between rounded-t-lg">
              <h3 className="text-xs font-bold text-white flex items-center">
                <Layers size={12} className="mr-1" />
                Legends
              </h3>
              {/* <button 
                onClick={() => setLegendsOpen(!legendsOpen)}
                className="text-white hover:text-gray-200"
              >
                {legendsOpen ? <X size={14} /> : <ChevronRight size={14} />}
              </button> */}
            </div>
            <div className="p-2">
              {legendsOpen && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {true ? (
                    <>
                      {[
                        { id: 1, title: 'Administrative Boundaries', agency: 'NAMRIA', layer_type: 'boundary', opacity: 0.5 },
                        { id: 2, title: 'Road Networks', agency: 'DPWH', layer_type: 'road', opacity: 0.5 },
                        { id: 3, title: 'Waterways', agency: 'DENR', layer_type: 'waterway', opacity: 0.5 }
                      ].map((layer) => {
                    // Get the actual layer color from the map renderer style logic
                    const getLayerLegendStyle = (layer: any) => {
                      if (layer.layer_type === 'boundary' || layer.title.includes('Administrative') || layer.title.includes('Boundary')) {
                        return {
                          color: '#3b82f6',
                          shape: 'polygon'
                        };
                      } else if (layer.layer_type === 'road' || layer.title.includes('Road') || layer.title.includes('Network')) {
                        return {
                          color: '#16a34a',
                          shape: 'line'
                        };
                      } else if (layer.layer_type === 'waterway' || layer.title.includes('River') || layer.title.includes('Water')) {
                        return {
                          color: '#0ea5e9',
                          shape: 'water'
                        };
                      } else if (layer.layer_type === 'hazard' || layer.title.includes('Hazard') || layer.title.includes('Risk')) {
                        return {
                          color: '#dc2626',
                          shape: 'diamond'
                        };
                      } else if (layer.layer_type === 'landuse' || layer.title.includes('Land Use')) {
                        return {
                          color: '#86efac',
                          shape: 'square'
                        };
                      } else if (layer.layer_type === 'population' || layer.title.includes('Population')) {
                        return {
                          color: '#fca5a5',
                          shape: 'circle'
                        };
                      } else if (layer.title.includes('Infrastructure')) {
                        return {
                          color: '#c084fc',
                          shape: 'square'
                        };
                      } else {
                        return {
                          color: layer.color || '#d1d5db',
                          shape: 'square'
                        };
                      }
                    };

                    const legendStyle = getLayerLegendStyle(layer);

                    return (
                      <div key={layer.id} className="flex items-center space-x-2 text-xs">
                        {/* Layer Color/Shape Indicator */}
                        <div className="flex items-center space-x-1">
                          {legendStyle.shape === 'polygon' ? (
                            <div className="w-4 h-4 border-2" style={{ 
                              borderColor: legendStyle.color, 
                              backgroundColor: 'rgba(59, 130, 246, 0.1)' 
                            }}></div>
                          ) : legendStyle.shape === 'line' ? (
                            <div className="w-4 h-0.5" style={{ 
                              backgroundColor: legendStyle.color,
                              height: '3px'
                            }}></div>
                          ) : legendStyle.shape === 'water' ? (
                            <div className="w-4 h-4 relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M2 8 Q 8 2, 14 8 Q 8 14, 2 8" 
                                        stroke={legendStyle.color} 
                                        strokeWidth="1.5" 
                                        fill="none"/>
                                  <path d="M4 8 Q 8 5, 12 8 Q 8 11, 4 8" 
                                        stroke={legendStyle.color} 
                                        strokeWidth="1" 
                                        fill="none" 
                                        opacity="0.6"/>
                                </svg>
                              </div>
                            </div>
                          ) : legendStyle.shape === 'diamond' ? (
                            <div className="w-4 h-4" style={{ 
                              backgroundColor: legendStyle.color,
                              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                            }}></div>
                          ) : legendStyle.shape === 'circle' ? (
                            <div className="w-4 h-4 rounded-full" style={{ 
                              backgroundColor: legendStyle.color,
                              border: `1px solid ${legendStyle.color}`
                            }}></div>
                          ) : (
                            <div className="w-4 h-4 rounded-sm" style={{ 
                              backgroundColor: legendStyle.color,
                              border: `1px solid ${legendStyle.color}`
                            }}></div>
                          )}
                        </div>
                        
                        {/* Layer Title */}
                        <div className="flex-1">
                          <div className="font-medium text-gray-700 truncate">{layer.title}</div>
                          <div className="text-gray-500 text-[10px]">{layer.agency || 'Unknown'}</div>
                        </div>
                        
                        {/* Opacity Indicator */}
                        <div className="text-gray-400 text-[10px]">
                          {Math.round((layer.opacity || 0.5) * 100)}%
                        </div>
                      </div>
                    );
                  })}
                  
                  
                  
                </>
              ) : (
                    <div className="text-gray-500 text-xs text-center py-4">
                      <div className="mb-2">🗺️</div>
                      {/* <div>No layers loaded</div> */}
                      <div className="text-gray-400 mt-1">Add layers from the left panel</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Panel Body */}
        {activeRightPanel && (
          <div className="absolute top-4 right-16 z-[1000] w-64 bg-[#333] text-white shadow-2xl border border-gray-600">
            <div style={{ backgroundColor: brandColor }} className="text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs uppercase">
              <div className="flex items-center"><ChevronRight size={14} className="mr-1 stroke-[3px]" /> {activeRightPanel}</div>
              <button onClick={() => setActiveRightPanel(null)}><X size={18} /></button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {activeRightPanel === 'layers' && (
                <div className="space-y-3">
                  <div className="text-center text-white mb-2">
                    <div className="font-semibold">Geographic Layers</div>
                    <div className="text-gray-400">Data from database</div>
                  </div>
                  
                  {/* Boundary Layer Control */}
                  <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(24, 49, 88)' }}></div>
                      <span className="text-white">Administrative Boundaries</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={boundaryLayerVisible} 
                      onChange={(e) => setBoundaryLayerVisible(e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </div>

                  {/* Road Networks Layer Control */}
                  <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#06a506ee' }}></div>
                      <span className="text-white">Road Networks</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={roadNetworkLayerVisible} 
                      onChange={(e) => setRoadNetworkLayerVisible(e.target.checked)}
                      className="w-4 h-4 accent-green-600"
                    />
                  </div>

                  {/* Waterways Layer Control */}
                  <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2563eb' }}></div>
                      <span className="text-white">Waterways</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={waterwaysLayerVisible} 
                      onChange={(e) => setWaterwaysLayerVisible(e.target.checked)}
                      className="w-4 h-4 accent-blue-500"
                    />
                  </div>

                  <div className="border-t border-gray-600 pt-3">
                    <div className="text-gray-400 text-xs">
                      <div> Layers are fetched dynamically from</div>
                      <div> the database with real geographic data</div>
                    </div>
                  </div>
                </div>
              )}

              {activeRightPanel === 'basemap' && (
                <select value={basemap} onChange={(e) => setBasemap(e.target.value)} className="w-full bg-white text-black p-2 rounded">
                  {availableBasemaps.map(basemap => (
                    <option key={basemap} value={basemap}>{basemap}</option>
                  ))}
                </select>
              )}

              {activeRightPanel === 'xy' && (
                <div className="space-y-3">
                   <div className="flex items-center justify-between"><label>Latitude</label><input type="text" value={xyInput.lat} onChange={(e) => setXyInput({...xyInput, lat: e.target.value})} className="w-32 text-white p-1 rounded bg-gray-700" /></div>
                   <div className="flex items-center justify-between"><label>Longitude</label><input type="text" value={xyInput.lng} onChange={(e) => setXyInput({...xyInput, lng: e.target.value})} className="w-32 text-white p-1 rounded bg-gray-700" /></div>
                   <button onClick={handleGotoXY} style={{ backgroundColor: brandColor }} className="w-full text-white font-bold py-2 mt-2 rounded">Go</button>
                </div>
              )}

              
              {activeRightPanel === 'measure' && (
                <div className="space-y-3">
                  {/* Measurement Type Selection - 4 Options */}
                  <div className="space-y-2">
                    <label className="text-white text-xs font-medium">Measurement Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleMeasureTypeChange('distance')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          measureInput.measureType === 'distance' 
                            ? 'bg-white text-gray-800' 
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                      >
                        Distance
                      </button>
                      <button
                        onClick={() => handleMeasureTypeChange('area')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          measureInput.measureType === 'area' 
                            ? 'bg-white text-gray-800' 
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                      >
                        Area
                      </button>
                      <button
                        onClick={() => handleMeasureTypeChange('bearing')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          measureInput.measureType === 'bearing' 
                            ? 'bg-white text-gray-800' 
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                      >
                        Bearing
                      </button>
                      <button
                        onClick={() => handleMeasureTypeChange('perimeter')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          measureInput.measureType === 'perimeter' 
                            ? 'bg-white text-gray-800' 
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                      >
                        Perimeter
                      </button>
                    </div>
                  </div>

                  <div className="text-center text-white mb-2">
                    {measureInput.isMeasuring 
                      ? (measureInput.measureType === 'distance' || measureInput.measureType === 'bearing')
                        ? `Click on map to set ${measureInput.clickMode === 'start' ? 'start' : 'end'} point` 
                        : `Click on map to add points (${measureInput.points.length} points)`
                      : 'Click toggle to enable map measurement'
                    }
                  </div>
                  
                  <button 
                    onClick={toggleMeasurementMode}
                    style={{ backgroundColor: measureInput.isMeasuring ? brandColor : '#666' }} 
                    className="w-full text-white font-bold py-2 rounded"
                  >
                    {measureInput.isMeasuring ? 'Stop Measurement' : 'Start Measurement'}
                  </button>

                  {/* Distance Measurement Fields */}
                  {measureInput.measureType === 'distance' && (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-white text-xs">Start Point:</label>
                        <input 
                          type="text" 
                          placeholder="lat, lng" 
                          value={measureInput.startPoint}
                          onChange={(e) => handleMeasurePointChange('startPoint', e.target.value)}
                          className="w-24 text-white p-1 rounded bg-gray-700 text-xs" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-white text-xs">End Point:</label>
                        <input 
                          type="text" 
                          placeholder="lat, lng" 
                          value={measureInput.endPoint}
                          onChange={(e) => handleMeasurePointChange('endPoint', e.target.value)}
                          className="w-24 text-white p-1 rounded bg-gray-700 text-xs" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-white text-xs">Distance:</label>
                        <input 
                          type="text" 
                          value={measureInput.distance} 
                          readOnly 
                          className="w-24 text-white p-1 rounded bg-gray-800 text-xs font-bold" 
                        />
                      </div>
                    </>
                  )}

                  {/* Area Measurement Fields */}
                  {measureInput.measureType === 'area' && (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-white text-xs">Points:</label>
                        <span className="text-white text-xs">{measureInput.points.length} points</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-white text-xs">Area:</label>
                        <input 
                          type="text" 
                          value={measureInput.area} 
                          readOnly 
                          className="w-24 text-white p-1 rounded bg-gray-800 text-xs font-bold" 
                        />
                      </div>
                      {measureInput.points.length > 0 && (
                        <div className="text-white text-xs bg-gray-700 rounded p-2">
                          <div className="font-medium mb-1">Points:</div>
                          {measureInput.points.map((point, index) => (
                            <div key={index} className="text-xs">
                              {index + 1}: {point[0].toFixed(6)}, {point[1].toFixed(6)}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Bearing Measurement Fields */}
                  {measureInput.measureType === 'bearing' && (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-white text-xs">Start Point:</label>
                        <input 
                          type="text" 
                          placeholder="lat, lng" 
                          value={measureInput.startPoint}
                          onChange={(e) => handleMeasurePointChange('startPoint', e.target.value)}
                          className="w-24 text-white p-1 rounded bg-gray-700 text-xs" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-white text-xs">End Point:</label>
                        <input 
                          type="text" 
                          placeholder="lat, lng" 
                          value={measureInput.endPoint}
                          onChange={(e) => handleMeasurePointChange('endPoint', e.target.value)}
                          className="w-24 text-white p-1 rounded bg-gray-700 text-xs" 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-white text-xs">Bearing:</label>
                        <input 
                          type="text" 
                          value={measureInput.bearing} 
                          readOnly 
                          className="w-24 text-white p-1 rounded bg-gray-800 text-xs font-bold" 
                        />
                      </div>
                    </>
                  )}

                  {/* Perimeter Measurement Fields */}
                  {measureInput.measureType === 'perimeter' && (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-white text-xs">Points:</label>
                        <span className="text-white text-xs">{measureInput.points.length} points</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-white text-xs">Perimeter:</label>
                        <input 
                          type="text" 
                          value={measureInput.perimeter} 
                          readOnly 
                          className="w-24 text-white p-1 rounded bg-gray-800 text-xs font-bold" 
                        />
                      </div>
                      {measureInput.points.length > 0 && (
                        <div className="text-white text-xs bg-gray-700 rounded p-2">
                          <div className="font-medium mb-1">Points:</div>
                          {measureInput.points.map((point, index) => (
                            <div key={index} className="text-xs">
                              {index + 1}: {point[0].toFixed(6)}, {point[1].toFixed(6)}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <button 
                    onClick={handleClearMeasurement} 
                    style={{ backgroundColor: brandColor }} 
                    className="w-full text-white font-bold py-2 rounded"
                  >
                    Clear Measurement
                  </button>
                  
                  <div className="border-t border-gray-600 pt-3">
                    <div className="text-gray-400 text-xs">
                      <div>Click on map to measure</div>
                      <div>
                        {measureInput.measureType === 'distance' && 'Distance: 2 points'}
                        {measureInput.measureType === 'area' && 'Area: 3+ points'}
                        {measureInput.measureType === 'bearing' && 'Bearing: 2 points'}
                        {measureInput.measureType === 'perimeter' && 'Perimeter: 2+ points'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Download Request Dialog */}
        {showDownloadDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Download Request Form</h2>
                <button 
                  onClick={() => setShowDownloadDialog(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Layer:</strong> {selectedDownloadLayer?.title}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  You will receive a download link via email after processing.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Official Email *</label>
                  <input 
                    type="email"
                    value={downloadForm.official_email}
                    onChange={(e) => setDownloadForm({...downloadForm, official_email: e.target.value})}
                    className="w-full p-2 border rounded text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input 
                    type="text"
                    value={downloadForm.client_name}
                    onChange={(e) => setDownloadForm({...downloadForm, client_name: e.target.value})}
                    className="w-full p-2 border rounded text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                  <select 
                    value={downloadForm.sex}
                    onChange={(e) => setDownloadForm({...downloadForm, sex: e.target.value})}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Office/Agency</label>
                  <input 
                    type="text"
                    value={downloadForm.office_agency}
                    onChange={(e) => setDownloadForm({...downloadForm, office_agency: e.target.value})}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input 
                    type="text"
                    value={downloadForm.address}
                    onChange={(e) => setDownloadForm({...downloadForm, address: e.target.value})}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                  <input 
                    type="text"
                    value={downloadForm.sector}
                    onChange={(e) => setDownloadForm({...downloadForm, sector: e.target.value})}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact No.</label>
                  <input 
                    type="text"
                    value={downloadForm.official_contact_no}
                    onChange={(e) => setDownloadForm({...downloadForm, official_contact_no: e.target.value})}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <textarea 
                    value={downloadForm.purpose}
                    onChange={(e) => setDownloadForm({...downloadForm, purpose: e.target.value})}
                    className="w-full p-2 border rounded text-sm"
                    rows={3}
                  />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <label className="flex items-center text-sm">
                    <input 
                      type="checkbox"
                      checked={downloadForm.agree_terms}
                      onChange={(e) => setDownloadForm({...downloadForm, agree_terms: e.target.checked})}
                      className="mr-2"
                    />
                    I agree to the <a href="#" className="text-blue-600 underline">Terms and Conditions</a>
                  </label>
                  
                  <label className="flex items-center text-sm">
                    <input 
                      type="checkbox"
                      checked={downloadForm.certify_info}
                      onChange={(e) => setDownloadForm({...downloadForm, certify_info: e.target.checked})}
                      className="mr-2"
                    />
                    I certify the correctness of the information provided
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowDownloadDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitDownloadRequest}
                  style={{ backgroundColor: brandColor }}
                  className="px-4 py-2 text-white rounded text-sm font-medium"
                >
                  Submit Request
                </button>
              </div>
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
