import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Layers, Globe, Ruler, CircleDot, ChevronRight, X } from 'lucide-react';

const MapRenderer = dynamic(() => import('./MapRenderer').then(mod => ({ default: mod.default })), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center text-white">Initializing...</div> 
});

export default function GeoPortalMap() {
  const brandColor = "#318855";
  const [activeRightPanel, setActiveRightPanel] = useState<string | null>(null);
  const [mapType, setMapType] = useState('osm');
  
  // Layer visibility state matching LGU portal
  const [layers, setLayers] = useState({
    adminBoundary: true,
    evacuationCenter: true,
    hazardArea: true,
    roadNetworks: true,
    rivers: true,
    riverBoundary: true,
  });

  const [mapView, setMapView] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [bufferData, setBufferData] = useState<any>(null);
  const [legendsOpen, setLegendsOpen] = useState(true);
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

  return (
    <div className="relative h-screen w-full bg-[#f8f9fa] overflow-hidden flex flex-col font-sans">
      <main className="flex-1 relative overflow-hidden">
        
        {/* Layer Control Panel - Top Left (matching LGU portal) */}
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
                <input type="checkbox" checked={value} onChange={() => setLayers(prev => ({ ...prev, [key]: !value }))} className="w-4 h-4 accent-orange-500 rounded" />
                <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
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
            boundaryLayerHighlighted={false}
            roadNetworkLayerVisible={layers.roadNetworks}
            roadNetworkLayerHighlighted={false}
            waterwaysLayerVisible={layers.rivers}
            waterwaysLayerHighlighted={false}
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
          <ToolIcon active={activeRightPanel === 'basemap'} onClick={() => setActiveRightPanel('basemap')} icon={<Globe size={18} />} brandColor={brandColor} />
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
              {activeRightPanel === 'basemap' && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="basemap" checked={mapType === 'osm'} onChange={() => setMapType('osm')} className="accent-white" />
                    <span>Open Street Map</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="basemap" checked={mapType === 'satellite'} onChange={() => setMapType('satellite')} className="accent-white" />
                    <span>Satellite (Esri)</span>
                  </label>
                </div>
              )}

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