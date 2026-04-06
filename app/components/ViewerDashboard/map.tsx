import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Menu, Layers, Globe, Ruler, CircleDot, 
  Download, ExternalLink, ChevronRight, 
  ChevronLeft, X, MoveUp, Save, Download as DownloadIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';

const MapRenderer = dynamic(() => import('./MapRenderer'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-gray-800 flex items-center justify-center text-white">Initializing...</div> 
});

export default function GeoPortalMap() {
  const brandColor = "#318855";

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [activeRightPanel, setActiveRightPanel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Layer Name');
  const [searchQuery, setSearchQuery] = useState('');

  // Static Available Layers with Realistic Geographic Boundaries
  const [availableLayers] = useState([
    { 
      id: 1, 
      title: 'Administrative Boundaries', 
      agency: 'NAMRIA', 
      geometry: [
        [14.0, 120.8], [14.2, 121.0], [14.5, 121.1], [14.8, 121.0], 
        [15.0, 120.9], [15.1, 120.7], [14.9, 120.5], [14.7, 120.4],
        [14.5, 120.5], [14.3, 120.6], [14.1, 120.7], [14.0, 120.8]
      ]
    },
    { 
      id: 2, 
      title: 'Hydrography (Rivers)', 
      agency: 'DENR', 
      geometry: [
        [13.8, 121.8], [13.9, 121.9], [14.0, 122.0], [14.1, 122.1],
        [14.2, 122.2], [14.3, 122.3], [14.4, 122.4], [14.5, 122.5],
        [14.4, 122.6], [14.3, 122.5], [14.2, 122.4], [14.1, 122.3],
        [14.0, 122.2], [13.9, 122.1], [13.8, 122.0], [13.8, 121.8]
      ]
    },
    { 
      id: 3, 
      title: 'Active Faults', 
      agency: 'PHIVOLCS', 
      geometry: [
        [15.0, 120.3], [15.1, 120.4], [15.2, 120.6], [15.3, 120.8],
        [15.4, 120.9], [15.5, 121.0], [15.4, 121.1], [15.3, 121.0],
        [15.2, 120.9], [15.1, 120.7], [15.0, 120.5], [15.0, 120.3]
      ]
    },
    { 
      id: 4, 
      title: 'Land Cover 2025', 
      agency: 'NAMRIA', 
      geometry: [
        [12.8, 121.0], [13.0, 121.1], [13.2, 121.3], [13.4, 121.4],
        [13.6, 121.5], [13.8, 121.6], [13.9, 121.5], [13.7, 121.4],
        [13.5, 121.3], [13.3, 121.2], [13.1, 121.1], [12.9, 121.0],
        [12.8, 121.0]
      ]
    },
    { 
      id: 5, 
      title: 'Protected Areas', 
      agency: 'DENR-PAWB', 
      geometry: [
        [13.5, 123.0], [13.7, 123.1], [13.9, 123.2], [14.1, 123.3],
        [14.0, 123.4], [13.8, 123.3], [13.6, 123.2], [13.4, 123.1],
        [13.5, 123.0]
      ]
    },
    { 
      id: 6, 
      title: 'Coastal Zones', 
      agency: 'NAMRIA', 
      geometry: [
        [12.5, 124.0], [12.8, 124.1], [13.1, 124.2], [13.4, 124.1],
        [13.2, 124.0], [12.9, 123.9], [12.6, 123.8], [12.5, 124.0]
      ]
    }
  ]);

  const [loadedLayers, setLoadedLayers] = useState<any[]>([]);
  const [mapView, setMapView] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [bufferData, setBufferData] = useState<any>(null);
  const [basemap, setBasemap] = useState('NAMRIA Basemaps');
  const [savedMaps, setSavedMaps] = useState<any[]>([]);
  const [mapNameInput, setMapNameInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState('guest'); // Can be updated with actual user auth
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Load saved maps from database on component mount
  useEffect(() => {
    loadSavedMapsFromDatabase();
  }, []);

  // Load saved maps from database
  const loadSavedMapsFromDatabase = async () => {
    try {
      const response = await fetch(`/api/maps?userId=${currentUserId}`);
      const data = await response.json();
      
      if (data.success) {
        // Transform database maps to component format
        const transformedMaps = data.maps.map((map: any) => ({
          id: map.id,
          name: map.name,
          layers: map.layers,
          basemap: map.basemap,
          mapView: map.mapView,
          timestamp: new Date(map.createdAt).toLocaleString(),
          isDatabase: true
        }));
        
        setSavedMaps(transformedMaps);
      }
    } catch (error) {
      console.error('Error loading saved maps from database:', error);
    }
  };

  const [xyInput, setXyInput] = useState({ lat: '', lng: '' });
  const [bufferInput, setBufferInput] = useState({ type: 'Point', distance: '', unit: 'Kilometers' });
  const [measureInput, setMeasureInput] = useState({ 
    startPoint: '', 
    endPoint: '', 
    distance: '0.00 km',
    isMeasuring: false,
    clickMode: 'start' // 'start' or 'end'
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

  // Save map functionality
  const saveMap = async () => {
    if (!mapNameInput.trim()) {
      alert('Please enter a name for your map');
      return;
    }

    const mapData = {
      name: mapNameInput,
      userId: currentUserId,
      basemap: basemap,
      layers: loadedLayers,
      mapView: mapView,
      settings: {
        bufferData: bufferData,
        measureInput: measureInput
      }
    };

    try {
      // Save to database
      const response = await fetch('/api/maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapData),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh saved maps from database
        await loadSavedMapsFromDatabase();
        setMapNameInput('');
        alert('Map saved successfully to database!');
      } else {
        throw new Error(data.error || 'Failed to save map');
      }
    } catch (error) {
      console.error('Error saving map to database:', error);
      alert('Failed to save map to database. Please try again.');
    }
  };

  const loadMap = (mapData: any) => {
    setLoadedLayers(mapData.layers || []);
    setBasemap(mapData.basemap || 'NAMRIA Basemaps');
    
    // Restore map view if available
    if (mapData.mapView) {
      setMapView(mapData.mapView);
    }
    
    // Restore additional settings if available
    if (mapData.settings) {
      if (mapData.settings.bufferData) {
        setBufferData(mapData.settings.bufferData);
      }
      if (mapData.settings.measureInput) {
        setMeasureInput(mapData.settings.measureInput);
      }
    }
    
    setActiveRightPanel(null);
  };

  const deleteMap = async (id: number) => {
    try {
      // Check if this is a database map
      const dbMap = savedMaps.find(map => map.id === id && map.isDatabase);
      
      if (dbMap) {
        // Delete from database
        const response = await fetch(`/api/maps?id=${id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          // Refresh saved maps from database
          await loadSavedMapsFromDatabase();
          alert('Map deleted successfully from database!');
        } else {
          throw new Error(data.error || 'Failed to delete map');
        }
      } else {
        // Remove from local state only
        setSavedMaps(savedMaps.filter(map => map.id !== id));
      }
    } catch (error) {
      console.error('Error deleting map:', error);
      alert('Failed to delete map. Please try again.');
    }
  };

  // Download map functionality
  const downloadMap = async (format: 'json' | 'geojson' | 'pdf' | 'image') => {
    if (format === 'image') {
      // Image download functionality - take actual screenshot of map
      if (!mapContainerRef.current) {
        alert('Map container not found. Please try again.');
        return;
      }

      try {
        // Show loading message
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 20px;
          border-radius: 8px;
          z-index: 10000;
          font-family: Arial, sans-serif;
        `;
        loadingDiv.textContent = 'Capturing screenshot...';
        document.body.appendChild(loadingDiv);

        // Use html2canvas to capture the map
        const canvas = await html2canvas(mapContainerRef.current, {
          backgroundColor: '#ffffff',
          scale: 2, // Higher resolution
          logging: false,
          useCORS: true,
          allowTaint: true
        });

        // Remove loading message
        document.body.removeChild(loadingDiv);

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `philippine-map-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');

      } catch (error) {
        console.error('Error capturing screenshot:', error);
        alert('Failed to capture screenshot. Please try again.');
      }
      
      return;
    }

    if (format === 'pdf') {
      // PDF download functionality
      const mapElement = document.querySelector('.w-full.h-full.z-0 > div');
      if (!mapElement) {
        alert('Map element not found. Please try again.');
        return;
      }

      // Create a canvas from the map element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const rect = mapElement.getBoundingClientRect();
      
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Simple PDF generation using basic approach
      const pdfContent = `
        Philippine Customized Map
        ==========================
        
        Generated: ${new Date().toLocaleString()}
        Basemap: ${basemap}
        Active Layers: ${loadedLayers.filter(l => l.visible).length} loaded
        
        Layer Details:
        ${loadedLayers.filter(l => l.visible).map(layer => 
          `- ${layer.title} (${layer.agency}) - Opacity: ${layer.opacity}`
        ).join('\n')}
        
        Map Configuration:
        ${JSON.stringify({
          basemap,
          layers: loadedLayers.filter(l => l.visible).map(layer => ({
            title: layer.title,
            agency: layer.agency,
            opacity: layer.opacity
          }))
        }, null, 2)}
      `;

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `philippine-map-${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      
      return;
    }

    const mapData = {
      name: `philippine-map-${new Date().toISOString().split('T')[0]}`,
      timestamp: new Date().toISOString(),
      basemap: basemap,
      layers: loadedLayers.map(layer => ({
        id: layer.id,
        title: layer.title,
        agency: layer.agency,
        visible: layer.visible,
        opacity: layer.opacity,
        color: layer.color,
        geometry: layer.geometry
      }))
    };

    if (format === 'json') {
      const dataStr = JSON.stringify(mapData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${mapData.name}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'geojson') {
      const geoJsonData = {
        type: 'FeatureCollection',
        features: loadedLayers.filter(layer => layer.visible).map(layer => ({
          type: 'Feature',
          properties: {
            id: layer.id,
            title: layer.title,
            agency: layer.agency,
            opacity: layer.opacity,
            color: layer.color
          },
          geometry: {
            type: 'Polygon',
            coordinates: [layer.geometry]
          }
        }))
      };
      
      const dataStr = JSON.stringify(geoJsonData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${mapData.name}.geojson`;
      link.click();
      URL.revokeObjectURL(url);
    }
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
          />
        </div>

        {/* Right Toolbar */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-1">
          <ToolIcon active={activeRightPanel === 'basemap'} onClick={() => setActiveRightPanel('basemap')} icon={<Globe size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'measure'} onClick={() => setActiveRightPanel('measure')} icon={<Ruler size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'xy'} onClick={() => setActiveRightPanel('xy')} label="XY" brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'buffer'} onClick={() => setActiveRightPanel('buffer')} icon={<CircleDot size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'save'} onClick={() => setActiveRightPanel('save')} icon={<Save size={18} />} brandColor={brandColor} />
          <ToolIcon active={activeRightPanel === 'download'} onClick={() => setActiveRightPanel('download')} icon={<DownloadIcon size={18} />} brandColor={brandColor} />
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
                  <option>Open Street Map</option>
                  <option>Google Map</option>
                  <option>Satellite Map</option>
                </select>
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
                     Save Current Map
                   </button>
                   <div className="border-t border-gray-600 pt-3">
                     <div className="text-xs font-bold mb-2">Saved Maps:</div>
                     {savedMaps.length === 0 ? (
                       <div className="text-gray-400 text-xs">No saved maps yet</div>
                     ) : (
                       <div className="space-y-2 max-h-32 overflow-y-auto">
                         {savedMaps.map((map) => (
                           <div key={map.id} className="flex items-center justify-between bg-gray-700 p-2 rounded text-xs">
                             <div className="flex-1">
                               <div className="font-medium">{map.name}</div>
                               <div className="text-gray-400 text-[10px]">{map.timestamp}</div>
                               <div className="text-gray-400 text-[10px]">{map.layers.length} layers</div>
                             </div>
                             <div className="flex gap-1">
                               <button 
                                 onClick={() => loadMap(map)} 
                                 className="text-green-400 hover:text-green-300 text-xs"
                               >
                                 Load
                               </button>
                               <button 
                                 onClick={() => deleteMap(map.id)} 
                                 className="text-red-400 hover:text-red-300 text-xs"
                               >
                                 Delete
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
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
                     <div className="text-xs text-gray-400">
                       <div className="mb-1">• JSON: Full map configuration</div>
                       <div className="mb-1">• GeoJSON: Geographic data only</div>
                       <div className="mb-1">• PDF: Map summary report</div>
                       <div className="mb-1">• Image: Visual map representation</div>
                       <div>• Only visible layers included in reports</div>
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