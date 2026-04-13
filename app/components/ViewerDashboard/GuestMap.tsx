"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Menu, Layers, Globe, Ruler, CircleDot, 
  Download, ExternalLink, ChevronRight, 
  ChevronLeft, X, MoveUp, Save, Download as DownloadIcon
} from 'lucide-react';

const MapRenderer = dynamic(() => import('./MapRenderer'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center text-white">Initializing...</div> 
});

export default function GuestMap() {
  const brandColor = "#318855";

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [activeRightPanel, setActiveRightPanel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Layer Name');
  const [searchQuery, setSearchQuery] = useState('');

  // Static Available Layers for Guest Users - Same as viewer portal
  const [availableLayers] = useState([
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
      category: 'DRRM'
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
      category: 'Infrastructure'
    },
    { 
      id: 10003, 
      title: 'Waterways', 
      agency: 'DENR', 
      description: 'Rivers, streams, and water bodies',
      geometry: [
        [13.4124, 122.5619],
        [14.5995, 120.9842],
        [15.1570, 120.6344],
        [13.4124, 122.5619]
      ],
      layer_type: 'waterway',
      opacity: 0.7,
      category: 'Environmental'
    },
    { 
      id: 10004, 
      title: 'Active Faults', 
      agency: 'PHIVOLCS', 
      description: 'Active fault lines and seismic hazards',
      geometry: [
        [15.0, 120.3],
        [15.1, 120.4],
        [15.2, 120.6],
        [15.3, 120.8],
        [15.4, 120.9],
        [15.5, 121.0],
        [15.4, 121.1],
        [15.3, 121.0],
        [15.2, 120.9],
        [15.1, 120.7],
        [15.0, 120.5],
        [15.0, 120.3]
      ],
      layer_type: 'hazard',
      opacity: 0.8,
      category: 'DRRM'
    },
    { 
      id: 10005, 
      title: 'Land Cover 2025', 
      agency: 'NAMRIA', 
      description: 'Current land use classification',
      geometry: [
        [12.8, 121.0],
        [13.0, 121.1],
        [13.2, 121.3],
        [13.4, 121.4],
        [13.6, 121.5],
        [13.8, 121.6],
        [13.9, 121.5],
        [13.7, 121.4],
        [13.5, 121.3],
        [13.3, 121.2],
        [13.1, 121.1],
        [12.9, 121.0],
        [12.8, 121.0]
      ],
      layer_type: 'landuse',
      opacity: 0.3,
      category: 'Environmental'
    },
    { 
      id: 10006, 
      title: 'Population Density', 
      agency: 'PSA', 
      description: 'Population distribution by area',
      geometry: [
        [15.1570, 120.6344],
        [15.1570, 120.9644],
        [15.1570, 120.8344],
        [15.1570, 120.6344]
      ],
      layer_type: 'population',
      opacity: 0.3,
      category: 'Demographic'
    }
  ]);

  const [loadedLayers, setLoadedLayers] = useState<any[]>([]);
  const [mapView, setMapView] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [bufferData, setBufferData] = useState<any>(null);
  const [basemap, setBasemap] = useState('Open Street Map');
  const [savedMaps, setSavedMaps] = useState<any[]>([]);
  const [mapNameInput, setMapNameInput] = useState('');
  const [legendsOpen, setLegendsOpen] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Check if user is logged in
  const isLoggedIn = () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('loggedInUser');
      return user !== null && user !== undefined;
    }
    return false;
  };

  const [xyInput, setXyInput] = useState({ lat: '', lng: '' });
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
        setMeasureInput(prev => ({
          ...prev,
          startPoint: coordString,
          clickMode: 'end',
          visualElements: {
            ...prev.visualElements,
            markers: [newPoint],
            lines: []
          }
        }));
      } else {
        const bearing = measureInput.measureType === 'bearing' 
          ? calculateBearing(measureInput.visualElements.markers[0], newPoint)
          : measureInput.bearing;
        
        setMeasureInput(prev => ({
          ...prev,
          endPoint: coordString,
          distance: calculateDistance(prev.startPoint, coordString),
          bearing,
          clickMode: 'start',
          visualElements: {
            markers: [prev.visualElements.markers[0], newPoint],
            lines: [[prev.visualElements.markers[0], newPoint]]
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
      setLoadedLayers([{ ...layer, visible: true, opacity: 0.5, color: randomColor }, ...loadedLayers]);
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

  const handleGotoXY = () => {
    const lat = parseFloat(xyInput.lat);
    const lng = parseFloat(xyInput.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapView({ lat, lng, zoom: 15 });
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
      measureType: measureInput.measureType,
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

  // Save map functionality (works without login)
  const saveMap = async () => {
    if (!mapNameInput.trim()) {
      alert('Please enter a name for your map');
      return;
    }

    const mapData = {
      name: mapNameInput,
      userId: 'guest',
      basemap: basemap,
      layers: loadedLayers,
      mapView: mapView,
      settings: {
        bufferData: bufferData,
        measureInput: measureInput
      }
    };

    try {
      // Save to database for guest users
      const response = await fetch('/api/saved-maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: null, // Allow guest users to save maps
          map_name: mapNameInput,
          map_description: `Guest map with ${loadedLayers.length} layers`,
          map_config: mapData,
          is_guest: true // Mark as guest save
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMapNameInput('');
        alert('Map saved successfully! Guest maps are stored temporarily.');
      } else {
        throw new Error(data.error || 'Failed to save map');
      }
    } catch (error) {
      console.error('Error saving map:', error);
      alert('Failed to save map. Please try again.');
    }
  };

  // Download map functionality (requires login)
  const downloadMap = async (format: 'json' | 'geojson' | 'pdf' | 'image') => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      alert('Please login first to download maps. Click on the profile icon to login.');
      return;
    }
    
    // Show guest user message
    alert('Download functionality requires login. Please login to access download features.');
  };

  return (
    <div className="relative h-screen w-full bg-[#f8f9fa] overflow-hidden flex flex-col font-sans">
      
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
              Layer Name
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 bg-gray-50 max-h-[40vh]">
            <ul className="space-y-1">
              {availableLayers.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase())).map(layer => (
                <li key={layer.id} className="p-2 bg-white border rounded hover:border-[#318855] cursor-pointer text-xs flex justify-between group">
                  <span className="font-medium text-gray-700">{layer.title}</span>
                  <button onClick={() => addLayer(layer)} style={{ color: brandColor }} className="opacity-0 group-hover:opacity-100 font-bold">+ Add</button>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ borderTop: `4px solid ${brandColor}` }} className="flex-1 bg-white flex flex-col">
             <div style={{ backgroundColor: brandColor }} className="p-2 text-xs font-bold flex items-center text-white">
               <Layers size={14} className="mr-2" /> Loaded Layers
             </div>
             <div className="flex-1 overflow-y-auto p-1">
               {loadedLayers.map((layer) => (
                 <div key={layer.id} className="flex items-center gap-2 p-2 border-b text-[11px] hover:bg-gray-50">
                   <button onClick={() => removeLayer(layer.id)} className="text-red-500 font-bold text-lg leading-none">×</button>
                   <input type="checkbox" checked={layer.visible} onChange={() => toggleLayerVisibility(layer.id)} className="accent-[#318855]" />
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: layer.color }}></div>
                   <span className="flex-1 font-medium truncate">{layer.title}</span>
                   <input type="range" value={layer.opacity} onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))} className="w-12 accent-[#318855]" min="0.1" max="1" step="0.1" />
                 </div>
               ))}
             </div>
          </div>
        </div>

        {!leftPanelOpen && (
          <button onClick={() => setLeftPanelOpen(true)} className="absolute top-4 left-0 z-[1600] bg-white p-2 rounded-r shadow-lg border">
            <ChevronRight size={24} color={brandColor} />
          </button>
        )}

        <div className="w-full h-full z-0" ref={mapContainerRef}>
          <MapRenderer 
            layers={loadedLayers} 
            mapView={mapView} 
            bufferData={bufferData} 
            basemap={basemap}
            onMapClick={handleMapClick}
            isMeasuring={measureInput.isMeasuring}
            measureVisualElements={measureInput.visualElements}
            boundaryLayerVisible={false}
            boundaryLayerHighlighted={false}
            roadNetworkLayerVisible={false}
            roadNetworkLayerHighlighted={false}
            waterwaysLayerVisible={false}
            waterwaysLayerHighlighted={false}
          />
        </div>

        {/* Legends Box - Left Bottom Side */}
        {loadedLayers.length > 0 && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-white shadow-lg border border-gray-200 rounded-lg p-3 max-w-xs">
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
                {loadedLayers.filter(layer => layer.visible).map((layer) => (
                  <div key={layer.id} className="flex items-center space-x-2 text-xs">
                    {/* Layer Color/Shape Indicator */}
                    <div className="flex items-center space-x-1">
                      {/* Determine shape based on layer type */}
                      {layer.title.includes('Administrative') || layer.title.includes('Boundary') ? (
                        <div className="w-4 h-4 border-2" style={{ 
                          borderColor: '#3b82f6', 
                          backgroundColor: 'rgba(219, 234, 254, 0.3)' 
                        }}></div>
                      ) : layer.title.includes('Road') || layer.title.includes('Network') ? (
                        <div className="w-4 h-0.5" style={{ 
                          backgroundColor: '#16a34a',
                          height: '3px'
                        }}></div>
                      ) : layer.title.includes('River') || layer.title.includes('Water') ? (
                        <div className="w-4 h-4 rounded-full" style={{ 
                          backgroundColor: '#0ea5e9',
                          border: '1px solid #0ea5e9'
                        }}></div>
                      ) : layer.title.includes('Hazard') || layer.title.includes('Fault') ? (
                        <div className="w-4 h-4" style={{ 
                          backgroundColor: '#dc2626',
                          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                        }}></div>
                      ) : layer.title.includes('Land Use') ? (
                        <div className="w-4 h-4 rounded-sm" style={{ 
                          backgroundColor: '#86efac',
                          border: '1px solid #86efac'
                        }}></div>
                      ) : layer.title.includes('Population') ? (
                        <div className="w-4 h-4 rounded-full" style={{ 
                          backgroundColor: '#fca5a5',
                          border: '1px solid #fca5a5'
                        }}></div>
                      ) : (
                        <div className="w-4 h-4 rounded" style={{ 
                          backgroundColor: layer.color || '#d1d5db'
                        }}></div>
                      )}
                    </div>
                    
                    {/* Layer Title */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-700 truncate">{layer.title}</div>
                      <div className="text-gray-500 text-[10px]">{layer.agency}</div>
                    </div>
                    
                    {/* Opacity Indicator */}
                    <div className="text-gray-400 text-[10px]">
                      {Math.round((layer.opacity || 0.5) * 100)}%
                    </div>
                  </div>
                ))}
                
                {loadedLayers.filter(layer => layer.visible).length === 0 && (
                  <div className="text-gray-500 text-xs italic">No visible layers</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right Toolbar */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-1">
          <ToolIcon active={activeRightPanel === 'basemap'} onClick={() => setActiveRightPanel('basemap')} icon={<Globe size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'measure'} onClick={() => setActiveRightPanel('measure')} icon={<Ruler size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'xy'} onClick={() => setActiveRightPanel('xy')} label="XY" brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'save'} onClick={() => setActiveRightPanel('save')} icon={<Save size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'download'} onClick={() => setActiveRightPanel('download')} icon={<DownloadIcon size={18} />} brandColor={brandColor} />
        </div>

        {/* Right Panel Body */}
        {activeRightPanel && (
          <div className="absolute top-4 right-16 z-[1000] w-80 bg-[#333] text-white shadow-2xl border border-gray-600">
            <div style={{ backgroundColor: brandColor }} className="text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs uppercase">
              <div className="flex items-center"><ChevronRight size={14} className="mr-1 stroke-[3px]" /> {activeRightPanel}</div>
              <button onClick={() => setActiveRightPanel(null)}><X size={18} /></button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {activeRightPanel === 'basemap' && (
                <select value={basemap} onChange={(e) => setBasemap(e.target.value)} className="w-full bg-white text-black p-2 rounded">
                  <option>Open Street Map</option>
                  <option>Satellite Map</option>
                  <option>Terrain Map</option>
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
                    </>
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

              {activeRightPanel === 'save' && (
                <div className="space-y-3">
                   <input 
                     type="text" 
                     placeholder="Enter map name" 
                     value={mapNameInput}
                     onChange={(e) => setMapNameInput(e.target.value)}
                     className="w-full text-white p-2 rounded bg-gray-700" 
                   />
                   <button 
                     onClick={saveMap} 
                     style={{ backgroundColor: brandColor }} 
                     className="w-full text-white font-bold py-2 rounded"
                   >
                     Save Map
                   </button>
                   <div className="border-t border-gray-600 pt-3">
                     <div className="text-xs text-gray-400">
                       <div>Guest users can save maps</div>
                       <div>Login required for downloads</div>
                     </div>
                   </div>
                 </div>
              )}

              {activeRightPanel === 'download' && (
                <div className="space-y-3">
                   <div className="text-center text-white mb-2">
                     Download your customized Philippine map
                   </div>
                   <div className="space-y-2">
                     <div className="text-xs font-medium">Download Format:</div>
                     <button 
                       onClick={() => downloadMap('json')} 
                       style={{ backgroundColor: brandColor }} 
                       className="w-full text-white font-bold py-2 rounded text-xs"
                     >
                       Download as JSON
                     </button>
                     <button 
                       onClick={() => downloadMap('geojson')} 
                       style={{ backgroundColor: brandColor }} 
                       className="w-full text-white font-bold py-2 rounded text-xs"
                     >
                       Download as GeoJSON
                     </button>
                     <button 
                       onClick={() => downloadMap('pdf')} 
                       style={{ backgroundColor: brandColor }} 
                       className="w-full text-white font-bold py-2 rounded text-xs"
                     >
                       Download as PDF Report
                     </button>
                     <button 
                       onClick={() => downloadMap('image')} 
                       style={{ backgroundColor: brandColor }} 
                       className="w-full text-white font-bold py-2 rounded text-xs"
                     >
                       Download as Image
                     </button>
                   </div>
                   <div className="border-t border-gray-600 pt-3">
                     <div className="text-xs text-red-400">
                       <div className="mb-1">Login required to download maps</div>
                       <div>Click on profile icon to login</div>
                     </div>
                   </div>
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
