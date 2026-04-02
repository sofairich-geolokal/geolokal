'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, WMSTileLayer, LayersControl, FeatureGroup, useMap } from 'react-leaflet';
import { FeatureGroup as LeafletFeatureGroup } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-measure-path/leaflet-measure-path.css';
import AdvancedToolsPanel from './AdvancedToolsPanel';

const { BaseLayer, Overlay } = LayersControl;

// --- Interfaces ---
interface MapLayer {
  id: number;
  name: string;
  type: 'wms' | 'vector' | 'raster';
  url?: string;
  visible: boolean;
  opacity: number;
  style?: any;
  bbox?: any;
  minZoom?: number;
  maxZoom?: number;
}

interface MeasurementData {
  id?: string;
  type: 'distance' | 'area';
  value: number;
  unit: string;
  coordinates: [number, number][];
}

interface DrawingData {
  type: 'point' | 'line' | 'polygon' | 'circle' | 'rectangle';
  geometry: any;
  properties: any;
}

interface AdvancedGeoMapProps {
  onMapStateChange?: (state: any) => void;
  mapState?: any;
  activeTool?: string | null;
  activeCustomizer?: string | null;
  onToolSelect?: (tool: string) => void;
}

const AdvancedGeoMap = ({ onMapStateChange, mapState, activeTool, onToolSelect }: AdvancedGeoMapProps) => {
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [selectedProjection, setSelectedProjection] = useState('EPSG:4326');
  
  const mapRef = useRef<any>(null);
  const sessionId = useRef(`session_${Date.now()}`);

  const projections = [
    { code: 'EPSG:4326', name: 'WGS 84' },
    { code: 'EPSG:3857', name: 'Web Mercator' },
    { code: 'EPSG:3123', name: 'PRSF92 / Zone III' },
  ];

  // --- Handlers ---
  const handleLayerToggle = (layerId: number, visible: boolean) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible } : l));
  };

  const handleOpacityChange = (layerId: number, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, opacity } : l));
  };

  const handleProjectionChange = (projection: string) => {
    setSelectedProjection(projection);
  };

  const exportMapConfig = () => {
    const config = { layers, measurements, drawings, projection: selectedProjection };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `map-config-${Date.now()}.json`;
    a.click();
  };

  // --- Map Sub-Components ---
  const MapEvents = () => {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
    }, [map]);
    return null;
  };

  const DrawingControls = () => {
    const map = useMap();
    // Implementation for Leaflet.Draw would go here
    return null;
  };

  return (
    <div className="relative w-full">
      <MapContainer 
        center={[13.4124, 122.5619]} 
        zoom={6} 
        style={{ height: '800px', width: '100%', borderRadius: '15px' }}
        ref={mapRef}
      >
        <MapEvents />
        <DrawingControls />
        
        <LayersControl position="topright">
          <BaseLayer checked name="Open Street Map">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </BaseLayer>

          {layers.map((layer) => (
            <Overlay key={layer.id} name={layer.name} checked={layer.visible}>
              {layer.type === 'wms' && layer.url && (
                <WMSTileLayer
                  url={layer.url}
                  params={{ layers: layer.name, format: 'image/png', transparent: true }}
                  opacity={layer.opacity}
                />
              )}
            </Overlay>
          ))}
        </LayersControl>

        <AdvancedToolsPanel />
      </MapContainer>

      {/* Floating UI Overlay */}
      <div className="absolute top-4 left-16 z-[1000] flex flex-col gap-4 pointer-events-none">
        {/* Projection & Export Panel */}
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 w-64 pointer-events-auto">
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600">Projection:</label>
            <select
              value={selectedProjection}
              onChange={(e) => handleProjectionChange(e.target.value)}
              className="w-full mt-1 text-xs border rounded px-2 py-1"
            >
              {projections.map(proj => (
                <option key={proj.code} value={proj.code}>{proj.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={exportMapConfig}
            className="w-full text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
          >
            Export Map Config
          </button>
        </div>

        {/* Layer Visibility Panel */}
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 w-64 pointer-events-auto">
          <h3 className="font-bold text-gray-700 text-sm mb-3">Layer Controls</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {layers.length === 0 && <p className="text-[10px] text-gray-400">No dynamic layers loaded.</p>}
            {layers.map((layer) => (
              <div key={layer.id} className="border-b border-gray-50 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 truncate w-40">{layer.name}</span>
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={(e) => handleLayerToggle(layer.id, e.target.checked)}
                    className="cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={layer.opacity}
                    onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-500 w-4 text-right">{layer.opacity.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Measurement Results */}
      <AnimatePresence>
        {measurements.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 z-[1000] bg-white p-4 rounded-xl shadow-lg border border-gray-200 max-w-sm pointer-events-auto"
          >
            <h3 className="font-bold text-gray-700 text-sm mb-2">Measurements</h3>
            <div className="space-y-1">
              {measurements.map((m, index) => (
                <div key={index} className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="text-xs text-gray-600">{m.type}: {m.value.toFixed(2)} {m.unit}</span>
                  <button
                    onClick={() => setMeasurements(prev => prev.filter((_, i) => i !== index))}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedGeoMap;