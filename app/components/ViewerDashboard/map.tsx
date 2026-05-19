"use client";

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Layers, Globe, Ruler, CircleDot, ChevronRight, X, Search } from 'lucide-react';

const MapRenderer = dynamic(() => import('./MapRenderer').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center text-white">Initializing...</div>
});

interface UploadedLayer {
  id: number;
  layer_name: string;
  layer_type: string;
  style_config: {
    color?: string;
    fillColor?: string;
    weight?: number;
    opacity?: number;
  };
  metadata: {
    geojson_file?: string;
    table_name?: string;
  };
  is_visible: boolean;
}

export default function GeoPortalMap() {
  const brandColor = "#318855";
  const [activeRightPanel, setActiveRightPanel] = useState<string | null>(null);
  const [mapType, setMapType] = useState('osm');

  // All layers set to false (unchecked) when page loads
  const [layers, setLayers] = useState({
    adminBoundary: false,
    roadNetworks: true,
    rivers: false,
    parcelLots: false,
  });

  const [uploadedLayers, setUploadedLayers] = useState<UploadedLayer[]>([]);
  const [uploadedLayersVisibility, setUploadedLayersVisibility] = useState<Record<number, boolean>>({});

  const [mapView, setMapView] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [layerBounds, setLayerBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [fitToBounds, setFitToBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [bufferData, setBufferData] = useState<any>(null);
  const [legendsOpen, setLegendsOpen] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [xyInput, setXyInput] = useState({ lat: '', lng: '' });
  const [bufferInput, setBufferInput] = useState({ type: 'Point', distance: '', unit: 'Kilometers', centerPoint: null as { lat: number; lng: number } | null });
  const [searchQuery, setSearchQuery] = useState('');
  const [measureInput, setMeasureInput] = useState<{
    startPoint: string;
    endPoint: string;
    distance: string;
    area: string;
    isMeasuring: boolean;
    measureType: 'distance' | 'area';
    clickMode: string;
    visualElements: {
      lines: [number, number][];
      markers: { lat: number; lng: number }[];
      polygon: [number, number][]
    }
  }>({
    startPoint: '',
    endPoint: '',
    distance: '0.00 km',
    area: '0.00 sq km',
    isMeasuring: false,
    measureType: 'distance',
    clickMode: 'start',
    visualElements: {
      lines: [],
      markers: [],
      polygon: []
    }
  });

  // Fetch uploaded layers from database
  useEffect(() => {
    const fetchUploadedLayers = async () => {
      try {
        const response = await fetch('/api/layers');
        const data = await response.json();
        if (data.success) {
          setUploadedLayers(data.data);
          // Initialize visibility state
          const visibility: Record<number, boolean> = {};
          data.data.forEach((layer: UploadedLayer) => {
            visibility[layer.id] = layer.is_visible;
          });
          setUploadedLayersVisibility(visibility);
        }
      } catch (error) {
        console.error('Error fetching uploaded layers:', error);
      }
    };

    fetchUploadedLayers();

    // Listen for layer updates from upload component
    const handleLayersUpdated = () => {
      fetchUploadedLayers();
    };

    window.addEventListener('layersUpdated', handleLayersUpdated);
    return () => window.removeEventListener('layersUpdated', handleLayersUpdated);
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    // Handle buffer center point selection
    if (activeRightPanel === 'buffer') {
      setBufferInput(prev => ({ ...prev, centerPoint: { lat, lng } }));
      setMapView({ lat, lng, zoom: 15 });
      return;
    }

    // Handle measurement point selection
    if (activeRightPanel !== 'measure' || !measureInput.isMeasuring) return;
    
    const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    if (measureInput.measureType === 'distance') {
      // Distance measurement (2 points)
      if (measureInput.clickMode === 'start') {
        handleMeasurePointChange('startPoint', coordString);
        setMeasureInput(prev => ({ 
          ...prev, 
          clickMode: 'end',
          visualElements: {
            ...prev.visualElements,
            markers: [{ lat, lng }]
          }
        }));
      } else {
        handleMeasurePointChange('endPoint', coordString);
        setMeasureInput(prev => ({ 
          ...prev, 
          clickMode: 'start',
          visualElements: {
            ...prev.visualElements,
            markers: [...prev.visualElements.markers, { lat, lng }],
            lines: [[prev.visualElements.markers[0].lat, prev.visualElements.markers[0].lng], [lat, lng]]
          }
        }));
      }
    } else {
      // Area measurement (multiple points)
      const newMarkers = [...measureInput.visualElements.markers, { lat, lng }];
      const newPolygon = newMarkers.map(m => [m.lat, m.lng] as [number, number]);
      
      setMeasureInput(prev => ({ 
        ...prev, 
        visualElements: {
          ...prev.visualElements,
          markers: newMarkers,
          polygon: newPolygon
        },
        area: calculateArea(newPolygon)
      }));
    }
  };

  const toggleMeasurementMode = () => {
    setMeasureInput(prev => ({
      ...prev,
      isMeasuring: !prev.isMeasuring,
      clickMode: 'start'
    }));
  };

  const setMeasureType = (type: 'distance' | 'area') => {
    setMeasureInput(prev => ({
      ...prev,
      measureType: type,
      visualElements: { lines: [], markers: [], polygon: [] },
      startPoint: '',
      endPoint: '',
      distance: '0.00 km',
      area: '0.00 sq km',
      clickMode: 'start'
    }));
  };

  const calculateArea = (coords: [number, number][]) => {
    if (coords.length < 3) return '0.00 sq km';
    try {
      // Using Shoelace formula for area calculation
      let area = 0;
      const n = coords.length;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += coords[i][0] * coords[j][1];
        area -= coords[j][0] * coords[i][1];
      }
      area = Math.abs(area) / 2;
      // Convert to approximate square kilometers (very rough approximation)
      // For accurate results, should use proper geodetic calculation
      const avgLat = coords.reduce((sum, c) => sum + c[0], 0) / n;
      const latFactor = Math.cos(avgLat * Math.PI / 180) * 111.32; // km per degree longitude
      const lngFactor = 110.57; // km per degree latitude
      area = area * latFactor * lngFactor / 1000000; // Convert to sq km
      return `${area.toFixed(4)} sq km`;
    } catch (error) {
      return '0.00 sq km';
    }
  };

  const handleGotoXY = () => {
    const lat = parseFloat(xyInput.lat);
    const lng = parseFloat(xyInput.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapView({ lat, lng, zoom: 15 });
    }
  };

  const handleBoundaryBounds = (bounds: [[number, number], [number, number]]) => {
    setLayerBounds(bounds);
    setFitToBounds(bounds);
  };

  const handleRoadBounds = (bounds: [[number, number], [number, number]]) => {
    setLayerBounds(bounds);
    setFitToBounds(bounds);
  };

  const handleWaterwayBounds = (bounds: [[number, number], [number, number]]) => {
    setLayerBounds(bounds);
    setFitToBounds(bounds);
  };

  const handleParcelLotsBounds = (bounds: [[number, number], [number, number]]) => {
    setLayerBounds(bounds);
    setFitToBounds(bounds);
  };

  const calculateDistance = (startPoint: string, endPoint: string) => {
    try {
      const startCoords = startPoint.split(',').map(coord => parseFloat(coord.trim()));
      const endCoords = endPoint.split(',').map(coord => parseFloat(coord.trim()));
      if (startCoords.length !== 2 || endCoords.length !== 2) return '0.00 km';
      const [startLat, startLng] = startCoords;
      const [endLat, endLng] = endCoords;
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) return '0.00 km';
      const R = 6371;
      const dLat = (endLat - startLat) * Math.PI / 180;
      const dLng = (endLng - startLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return `${(R * c).toFixed(2)} km`;
    } catch (error) { return '0.00 km'; }
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
      area: '0.00 sq km',
      isMeasuring: false, 
      measureType: 'distance',
      clickMode: 'start', 
      visualElements: { lines: [], markers: [], polygon: [] } 
    });
  };

  const handleBufferApply = () => {
    if (bufferInput.centerPoint && bufferInput.distance) {
      setBufferData({
        center: bufferInput.centerPoint,
        distance: bufferInput.distance,
        unit: bufferInput.unit
      });
    } else if (bufferInput.distance) {
      // If no center point selected, use current map view center
      setBufferData({
        center: { lat: 13.86, lng: 121.15 },
        distance: bufferInput.distance,
        unit: bufferInput.unit
      });
    }
  };

  const handleClearBuffer = () => {
    setBufferData(null);
    setBufferInput({ type: 'Point', distance: '', unit: 'Kilometers', centerPoint: null });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      // Using Nominatim (OpenStreetMap) geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapView({ lat: parseFloat(lat), lng: parseFloat(lon), zoom: 13 });
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching for location. Please try again.');
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#f8f9fa] overflow-hidden flex flex-col font-sans">
      <main className="flex-1 relative overflow-hidden">
        
        {/* Layer Control Panel */}
        <div className="absolute top-6 left-6 z-[1000] bg-white rounded-2xl shadow-lg p-5 w-60 border border-gray-100">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="mapType" checked={mapType === 'osm'} onChange={() => setMapType('osm')} className="w-4 h-4 accent-gray-600" />
              <span className="text-sm font-medium text-gray-700">Open Street Map</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="mapType" checked={mapType === 'satellite'} onChange={() => setMapType('satellite')} className="w-4 h-4 accent-orange-500" />
              <span className="text-sm font-medium text-gray-700">Satellite (Esri)</span>
            </label>
            <div className="h-px bg-gray-100 my-2" />
            
            {Object.entries(layers).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => setLayers(prev => ({ ...prev, [key]: !value }))}
                  className="w-4 h-4 accent-orange-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="w-full h-full z-0" ref={mapContainerRef}>
          <MapRenderer
            layers={[]}
            mapView={mapView}
            bufferData={bufferData}
            basemap={mapType}
            onMapClick={handleMapClick}
            isMeasuring={measureInput.isMeasuring}
            measureVisualElements={measureInput.visualElements}
            boundaryLayerVisible={layers.adminBoundary}
            roadNetworkLayerVisible={layers.roadNetworks}
            waterwaysLayerVisible={layers.rivers}
            parcelLotsVisible={layers.parcelLots}
            onBoundaryBoundsReady={layers.adminBoundary ? handleBoundaryBounds : undefined}
            onRoadBoundsReady={layers.roadNetworks ? handleRoadBounds : undefined}
            onWaterwayBoundsReady={layers.rivers ? handleWaterwayBounds : undefined}
            onParcelLotsBoundsReady={layers.parcelLots ? handleParcelLotsBounds : undefined}
            fitToBounds={fitToBounds}
            activeRightPanel={activeRightPanel}
            uploadedLayers={uploadedLayers.filter(layer => uploadedLayersVisibility[layer.id])}
          />
        </div>

        {/* Legends Box */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[1000] bg-white shadow-lg border border-gray-200 rounded-lg p-3 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-700 flex items-center">
              <Layers size={12} className="mr-1" /> Map Legends
            </h3>
            <button onClick={() => setLegendsOpen(!legendsOpen)} className="text-gray-500 hover:text-gray-700">
              {legendsOpen ? <X size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          
          {legendsOpen && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {Object.entries(layers).filter(([_, visible]) => visible).map(([key]) => (
                <div key={key} className="flex items-center space-x-2 text-xs">
                  {key === 'adminBoundary' && <div className="w-4 h-4 border-2 border-dashed" style={{ borderColor: '#0000FF', backgroundColor: 'transparent' }}></div>}
                  {key === 'roadNetworks' && <div className="w-4 h-1 bg-[#7d8b8f]"></div>}
                  {key === 'rivers' && (
                    <div className="w-4 h-4">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8 Q 8 2, 14 8 Q 8 14, 2 8" stroke="#1a6db4" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                  )}
                  {key === 'parcelLots' && <div className="w-4 h-4 border-2 rounded-sm border-[#ffffff] bg-[#fd9644]"></div>}
                  <div className="flex-1">
                    <div className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                </div>
              ))}
              
              {Object.values(layers).every(v => !v) && uploadedLayers.every(layer => !uploadedLayersVisibility[layer.id]) && <div className="text-[10px] text-gray-400 italic">No layers active</div>}
            </div>
          )}
        </div>

        {/* Right Toolbar */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-1">
          <ToolIcon active={activeRightPanel === 'basemap'} onClick={() => setActiveRightPanel('basemap')} icon={<Globe size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'measure'} onClick={() => setActiveRightPanel('measure')} icon={<Ruler size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'xy'} onClick={() => setActiveRightPanel('xy')} label="XY" brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'buffer'} onClick={() => setActiveRightPanel('buffer')} icon={<CircleDot size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'search'} onClick={() => setActiveRightPanel('search')} icon={<Search size={18} />} brandColor={brandColor} />
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
                   <div className="text-gray-300 text-xs">Click on map to set center point</div>
                   {bufferInput.centerPoint && (
                     <div className="text-green-400 text-xs">Center: {bufferInput.centerPoint.lat.toFixed(4)}, {bufferInput.centerPoint.lng.toFixed(4)}</div>
                   )}
                   <input type="text" placeholder="Distance (km)" value={bufferInput.distance} onChange={(e) => setBufferInput({...bufferInput, distance: e.target.value})} className="w-full text-white p-2 rounded bg-gray-700" />
                   <button onClick={handleBufferApply} style={{ backgroundColor: brandColor }} className="w-full text-white font-bold py-2 rounded">Apply Buffer</button>
                   <button onClick={handleClearBuffer} className="w-full bg-gray-600 text-white font-bold py-2 rounded">Clear</button>
                </div>
              )}
              {activeRightPanel === 'measure' && (
                <div className="space-y-3">
                   <div className="flex gap-2 mb-2">
                     <button 
                       onClick={() => setMeasureType('distance')} 
                       style={{ backgroundColor: measureInput.measureType === 'distance' ? brandColor : '#666' }} 
                       className="flex-1 text-white font-bold py-1.5 rounded text-xs"
                     >
                       Distance
                     </button>
                     <button 
                       onClick={() => setMeasureType('area')} 
                       style={{ backgroundColor: measureInput.measureType === 'area' ? brandColor : '#666' }} 
                       className="flex-1 text-white font-bold py-1.5 rounded text-xs"
                     >
                       Area
                     </button>
                   </div>
                   <button onClick={toggleMeasurementMode} style={{ backgroundColor: measureInput.isMeasuring ? brandColor : '#666' }} className="w-full text-white font-bold py-2 rounded mb-3">
                     {measureInput.isMeasuring ? 'Stop Measurement' : 'Start Measurement'}
                   </button>
                   {measureInput.measureType === 'distance' ? (
                     <>
                       <div className="flex items-center justify-between"><label>Start:</label><input type="text" value={measureInput.startPoint} readOnly className="w-24 text-white p-1 rounded bg-gray-700 text-xs" /></div>
                       <div className="flex items-center justify-between"><label>End:</label><input type="text" value={measureInput.endPoint} readOnly className="w-24 text-white p-1 rounded bg-gray-700 text-xs" /></div>
                       <div className="flex items-center justify-between"><label>Dist:</label><input type="text" value={measureInput.distance} readOnly className="w-24 text-white p-1 rounded bg-gray-700 text-xs" /></div>
                     </>
                   ) : (
                     <>
                       <div className="text-gray-300 text-xs mb-2">Click on map to add points (min 3 for area)</div>
                       <div className="flex items-center justify-between"><label>Points:</label><input type="text" value={measureInput.visualElements.markers.length} readOnly className="w-16 text-white p-1 rounded bg-gray-700 text-xs" /></div>
                       <div className="flex items-center justify-between"><label>Area:</label><input type="text" value={measureInput.area} readOnly className="w-24 text-white p-1 rounded bg-gray-700 text-xs" /></div>
                     </>
                   )}
                   <button onClick={handleClearMeasurement} style={{ backgroundColor: brandColor }} className="w-full text-white font-bold py-2 rounded">Clear</button>
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
    <button onClick={onClick} style={active ? { backgroundColor: brandColor } : { backgroundColor: '#333' }} className={`w-10 h-10 flex items-center justify-center border-b border-gray-600 text-white shadow-sm`}>
      {icon || <span className="font-bold text-xs">{label}</span>}
    </button>
  );
}