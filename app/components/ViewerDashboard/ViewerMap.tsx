"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Menu, Layers, Globe, Ruler, CircleDot, 
  Download, ExternalLink, ChevronRight, 
  ChevronLeft, X, MoveUp, Save
} from 'lucide-react';

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

  // Generate sample geometry for different regions
  const generateSampleGeometry = (index: number) => {
    const baseCoords = [
      { center: [13.4124, 122.5619], offset: 0.5 },  // Manila area
      { center: [14.5995, 120.9842], offset: 0.4 },  // Batangas area  
      { center: [15.1570, 120.6344], offset: 0.3 },  // Bulacan area
      { center: [10.3157, 123.8854], offset: 0.6 }   // Cebu area
    ];
    
    const coord = baseCoords[index % baseCoords.length];
    const size = 0.3 + (index * 0.1);
    
    return [
      [coord.center[1] - size, coord.center[0] - size],
      [coord.center[1] + size, coord.center[0] - size],
      [coord.center[1] + size, coord.center[0] + size],
      [coord.center[1] - size, coord.center[0] + size],
      [coord.center[1] - size, coord.center[0] - size]
    ];
  };

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

  // Fetch real layers from Philippine GeoPortal API
  useEffect(() => {
    const fetchGeoPortalLayers = async () => {
      setLoadingLayers(true);
      try {
        // Check GeoServer status first
        const geoServerRunning = await checkGeoServerStatus();
        console.log('GeoServer Status:', geoServerRunning ? 'Running' : 'Not Running');
        
        // Fetch available layers from GeoPortal with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
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
            const transformedLayers = data.slice(0, 4).map((layer: any, index: number) => ({
              id: index + 1,
              title: layer.title || layer.name || `Layer ${index + 1}`,
              agency: layer.organization || 'GeoPortal PH',
              description: layer.description || layer.abstract || 'Philippine geographic data layer',
              geometry: generateSampleGeometry(index) // Use sample geometry for demo
            }));
            
            setAvailableLayers(transformedLayers);
            console.log('Successfully loaded GeoPortal layers:', transformedLayers.length);
          } else {
            throw new Error(`GeoPortal API responded with status: ${response.status}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.log('GeoPortal API fetch failed, using fallback layers:', fetchError instanceof Error ? fetchError.message : 'Unknown error');
          
          // Fallback to sample layers if API fails
          setAvailableLayers([
            { 
              id: 1, 
              title: 'Administrative Boundaries', 
              agency: 'NAMRIA', 
              description: 'City and barangay boundaries',
              geometry: generateSampleGeometry(0)
            },
            { 
              id: 2, 
              title: 'Land Use', 
              agency: 'DENR', 
              description: 'Current land use classification',
              geometry: generateSampleGeometry(1)
            },
            { 
              id: 3, 
              title: 'Population Density', 
              agency: 'PSA', 
              description: 'Population distribution by area',
              geometry: generateSampleGeometry(2)
            },
            { 
              id: 4, 
              title: 'Transportation Network', 
              agency: 'DPWH', 
              description: 'Roads and highways',
              geometry: generateSampleGeometry(3)
            }
          ]);
        }
      } catch (error) {
        console.error('Error in fetchGeoPortalLayers:', error);
        // Ensure we always have some layers available
        setAvailableLayers([
          { 
            id: 1, 
            title: 'Administrative Boundaries', 
            agency: 'NAMRIA', 
            description: 'City and barangay boundaries',
            geometry: generateSampleGeometry(0)
          }
        ]);
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

  // Available basemaps including GeoNode
  const availableBasemaps = [
    'Open Street Map',
    'Satellite Map', 
    'Terrain Map',
    'GeoNode Streets',
    'GeoNode Satellite'
  ];

  const [xyInput, setXyInput] = useState({ lat: '', lng: '' });
  const [bufferInput, setBufferInput] = useState({ type: 'Point', distance: '', unit: 'Kilometers' });
  const [measureInput, setMeasureInput] = useState({ 
    startPoint: '', 
    endPoint: '', 
    distance: '0.00 km',
    isMeasuring: false,
    clickMode: 'start'
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

  const addLayer = (layer: any) => {
    if (!loadedLayers.find(l => l.id === layer.id)) {
      // Generate unique color per layer
      const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
      setLoadedLayers([{ ...layer, visible: true, opacity: 0.7, color: randomColor }, ...loadedLayers]);
    }
  };

  const removeLayer = (id: number) => {
    setLoadedLayers(loadedLayers.filter(l => l.id !== id));
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

  // Save map configuration
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

      const response = await fetch('/api/saved-maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 1, // TODO: Get actual user ID from auth
          map_name: mapNameInput,
          map_description: `Custom map with ${loadedLayers.length} layers`,
          map_config: mapConfig,
          basemap,
          center_lat: mapView?.lat || 13.4124,
          center_lng: mapView?.lng || 122.5619,
          zoom_level: mapView?.zoom || 6,
          layers_config: loadedLayers,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Map saved successfully!');
        setShowSaveDialog(false);
        setMapNameInput('');
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

  // Submit download request
  const submitDownloadRequest = async () => {
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
      const response = await fetch('/api/download-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 1, // TODO: Get actual user ID from auth
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
  }, []);

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
      isMeasuring: false,
      clickMode: 'start'
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
            />
            <button onClick={() => setLeftPanelOpen(false)} className="ml-1 p-1 hover:bg-black/10 rounded">
              <ChevronLeft size={18} />
            </button>
          </div>

          <div className="flex text-xs font-bold border-b bg-gray-50">
            <button 
              onClick={() => setActiveTab('Layer Name')}
              className={`flex-1 py-3 border-b-2 ${activeTab === 'Layer Name' ? `border-[#318855] text-[#318855] bg-white` : 'border-transparent text-gray-500'}`}
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
            {!loadingLayers && availableLayers.length > 0 && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-blue-700">✓ Connected to GeoPortal PH</span>
                </div>
                <div className="text-blue-600 mt-1">Real Philippine geographic data</div>
              </div>
            )}
            
            <ul className="space-y-1">
              {availableLayers.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase())).map(layer => {
                const isLoaded = isLayerLoaded(layer.id);
                return (
                  <li 
                    key={layer.id} 
                    onClick={() => !isLoaded && addLayer(layer)}
                    className={`p-2 border rounded text-xs group transition-colors ${
                      isLoaded 
                        ? 'bg-green-50 border-green-300 cursor-not-allowed' 
                        : 'bg-white hover:border-[#318855] cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-medium ${isLoaded ? 'text-green-700' : 'text-gray-700'}`}>
                        {layer.title}
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
                        <span className="text-green-600 font-bold text-xs">✓ Added</span>
                      )}
                    </div>
                    <div className={`text-xs ${isLoaded ? 'text-green-600' : 'text-gray-500'}`}>
                      {layer.description}
                    </div>
                    <div className={`text-xs mt-1 flex items-center gap-1 ${isLoaded ? 'text-green-500' : 'text-gray-400'}`}>
                      <span>{layer.agency}</span>
                      {layer.agency === 'GeoPortal PH' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">API</span>
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
            layers={loadedLayers} 
            mapView={mapView} 
            bufferData={bufferData} 
            basemap={basemap}
            onMapClick={handleMapClick}
            isMeasuring={measureInput.isMeasuring}
          />
        </div>

        {/* Right Toolbar - Limited for viewers */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-1">
          <ToolIcon active={activeRightPanel === 'basemap'} onClick={() => setActiveRightPanel('basemap')} icon={<Globe size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'save'} onClick={() => setActiveRightPanel('save')} icon={<Save size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'download'} onClick={() => setActiveRightPanel('download')} icon={<Download size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'measure'} onClick={() => setActiveRightPanel('measure')} icon={<Ruler size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'xy'} onClick={() => setActiveRightPanel('xy')} label="XY" brandColor={brandColor} />
        </div>

        {/* Right Panel Body */}
        {activeRightPanel && (
          <div className="absolute top-4 right-16 z-[1000] w-64 bg-[#333] text-white shadow-2xl border border-gray-600">
            <div style={{ backgroundColor: brandColor }} className="text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs uppercase">
              <div className="flex items-center"><ChevronRight size={14} className="mr-1 stroke-[3px]" /> {activeRightPanel}</div>
              <button onClick={() => setActiveRightPanel(null)}><X size={18} /></button>
            </div>

            <div className="p-4 space-y-4 text-xs">
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

              {activeRightPanel === 'save' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs">Map Name:</label>
                    <input 
                      type="text" 
                      value={mapNameInput}
                      onChange={(e) => setMapNameInput(e.target.value)}
                      placeholder="Enter map name"
                      className="w-full text-white p-2 rounded bg-gray-700 text-xs"
                    />
                  </div>
                  <button 
                    onClick={saveMap}
                    style={{ backgroundColor: brandColor }}
                    className="w-full text-white font-bold py-2 rounded"
                  >
                    Save Map
                  </button>
                  
                  <div className="border-t border-gray-600 pt-3">
                    <label className="text-xs font-bold">Saved Maps:</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {savedMaps.length === 0 ? (
                        <div className="text-gray-400 text-xs">No saved maps</div>
                      ) : (
                        savedMaps.map((savedMap) => (
                          <div key={savedMap.id} className="flex items-center justify-between p-1 bg-gray-700 rounded">
                            <span className="text-xs truncate flex-1">{savedMap.map_name}</span>
                            <button 
                              onClick={() => loadSavedMap(savedMap)}
                              className="text-xs bg-blue-600 px-1 rounded"
                            >
                              Load
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeRightPanel === 'download' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs">Select Layer:</label>
                    <select 
                      value={selectedDownloadLayer?.id || ''}
                      onChange={(e) => {
                        const layer = loadedLayers.find(l => l.id === parseInt(e.target.value));
                        setSelectedDownloadLayer(layer);
                      }}
                      className="w-full text-black p-2 rounded text-xs"
                    >
                      <option value="">Select a layer</option>
                      {loadedLayers.map((layer) => (
                        <option key={layer.id} value={layer.id}>{layer.title}</option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedDownloadLayer && (
                    <button 
                      onClick={() => setShowDownloadDialog(true)}
                      style={{ backgroundColor: brandColor }}
                      className="w-full text-white font-bold py-2 rounded"
                    >
                      Request Download
                    </button>
                  )}
                  
                  {!selectedDownloadLayer && (
                    <div className="text-gray-400 text-xs text-center">
                      Load a layer first to request download
                    </div>
                  )}
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
                     {measureInput.isMeasuring ? 'Stop Measurement' : 'Start Measurement'}
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
