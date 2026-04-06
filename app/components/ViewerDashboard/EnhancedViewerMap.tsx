"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamic imports for Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then((mod) => mod.Polygon), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then((mod) => mod.Circle), { ssr: false });
const ZoomControl = dynamic(() => import('react-leaflet').then((mod) => mod.ZoomControl), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const BoundaryLayerWrapper = dynamic(() => import('./BoundaryLayerWrapper').then((mod) => mod.default), { ssr: false });

// Type definitions for coordinates
type LatLngTuple = [number, number];
type LatLngExpression = LatLngTuple | LatLngTuple[];

interface EnhancedViewerMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
}

const EnhancedViewerMap: React.FC<EnhancedViewerMapProps> = ({ 
  center = [13.7588, 121.1250], 
  zoom = 13,
  height = "600px"
}) => {
  const [mapType, setMapType] = useState<'osm' | 'satellite' | 'terrain'>('satellite');
  const [layers, setLayers] = useState({
    boundaries: true,
    roadNetworks: true,
    waterways: true,
    buildings: false,
    landUse: false,
  });
  const [customIcon, setCustomIcon] = useState<any>(null);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  // Load Leaflet and create icons
  useEffect(() => {
    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;
      
      const boundaryIcon = L.divIcon({
        className: 'boundary-marker',
        html: `<div style="background: #dc2626; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const roadIcon = L.divIcon({
        className: 'road-marker',
        html: `<div style="background: #000000; width: 10px; height: 10px; border-radius: 2px; border: 2px solid white;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const waterIcon = L.divIcon({
        className: 'water-marker',
        html: `<div style="background: #1e40af; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      setCustomIcon({ boundaryIcon, roadIcon, waterIcon });
    };
    initLeaflet();
  }, []);

  // Ibaan boundary coordinates
  const ibaBoundaryCoordinates: LatLngTuple[] = [
    [13.7421, 121.1089], // Southwest corner
    [13.7421, 121.1412], // Northwest corner  
    [13.7756, 121.1412], // Northeast corner
    [13.7756, 121.1089], // Southeast corner
    [13.7421, 121.1089]  // Closing point
  ];

  // Major roads in Ibaan
  const ibaRoadNetworks = [
    {
      id: 1,
      name: "Maharlika Highway (National Highway)",
      points: [
        [13.7421, 121.1089] as LatLngTuple, // Entry point from San Jose
        [13.7485, 121.1150] as LatLngTuple, // Near Sabang
        [13.7588, 121.1250] as LatLngTuple, // Ibaan Town Proper
        [13.7691, 121.1350] as LatLngTuple, // Near San Isidro
        [13.7756, 121.1412] as LatLngTuple  // Exit to Batangas City
      ],
      type: "national_highway"
    },
    {
      id: 2,
      name: "Ibaan-Batangas City Road",
      points: [
        [13.7588, 121.1250] as LatLngTuple, // Ibaan Town Proper
        [13.7620, 121.1280] as LatLngTuple, // Malarayat area
        [13.7680, 121.1320] as LatLngTuple, // Towards Batangas City
        [13.7756, 121.1380] as LatLngTuple  // Batangas City boundary
      ],
      type: "provincial_road"
    },
    {
      id: 3,
      name: "Ibaan-Lipa City Road",
      points: [
        [13.7588, 121.1250] as LatLngTuple, // Ibaan Town Proper
        [13.7520, 121.1180] as LatLngTuple, // Near Rosario
        [13.7450, 121.1120] as LatLngTuple, // Towards Lipa City
        [13.7421, 121.1089] as LatLngTuple  // Lipa City boundary
      ],
      type: "provincial_road"
    },
    {
      id: 4,
      name: "San Isidro Access Road",
      points: [
        [13.7588, 121.1250] as LatLngTuple, // Ibaan Town Proper
        [13.7650, 121.1280] as LatLngTuple, // Midway
        [13.7756, 121.1250] as LatLngTuple  // San Isidro
      ],
      type: "municipal_road"
    },
    {
      id: 5,
      name: "Sabang Farm-to-Market Road",
      points: [
        [13.7588, 121.1250] as LatLngTuple, // Ibaan Town Proper
        [13.7550, 121.1220] as LatLngTuple, // Midway
        [13.7421, 121.1250] as LatLngTuple  // Sabang
      ],
      type: "farm_to_market"
    }
  ];

  // Major waterways in Ibaan
  const ibaWaterways = [
    {
      id: 1,
      name: "Ibaan River (Main River)",
      points: [
        [13.7421, 121.1089] as LatLngTuple, // Source near San Jose boundary
        [13.7485, 121.1150] as LatLngTuple, // Near Sabang area
        [13.7588, 121.1250] as LatLngTuple, // Ibaan Town Proper
        [13.7650, 121.1320] as LatLngTuple, // Midway to San Isidro
        [13.7756, 121.1412] as LatLngTuple  // Confluence near Batangas City
      ],
      type: "main_river"
    },
    {
      id: 2,
      name: "Sabang Creek",
      points: [
        [13.7450, 121.1120] as LatLngTuple, // Upper Sabang
        [13.7485, 121.1150] as LatLngTuple, // Sabang proper
        [13.7520, 121.1180] as LatLngTuple, // Joins Ibaan River
        [13.7588, 121.1250] as LatLngTuple  // Confluence with main river
      ],
      type: "creek"
    },
    {
      id: 3,
      name: "San Isidro Tributary",
      points: [
        [13.7756, 121.1350] as LatLngTuple, // San Isidro area
        [13.7720, 121.1320] as LatLngTuple, // Midway
        [13.7680, 121.1280] as LatLngTuple, // Lower section
        [13.7650, 121.1320] as LatLngTuple  // Joins Ibaan River
      ],
      type: "tributary"
    },
    {
      id: 4,
      name: "Malarayat Stream",
      points: [
        [13.7620, 121.1280] as LatLngTuple, // Near Malarayat area
        [13.7588, 121.1250] as LatLngTuple, // Ibaan Town Proper
        [13.7550, 121.1220] as LatLngTuple, // Continuation
        [13.7520, 121.1180] as LatLngTuple  // End point
      ],
      type: "stream"
    }
  ];

  // Boundary markers
  const boundaryMarkers = [
    { 
      id: 1, 
      name: "Barangay San Isidro", 
      position: [13.7756, 121.1250] as LatLngTuple, 
      description: "Northern boundary of Ibaan" 
    },
    { 
      id: 2, 
      name: "Barangay Sabang", 
      position: [13.7421, 121.1250] as LatLngTuple, 
      description: "Southern boundary of Ibaan" 
    },
    { 
      id: 3, 
      name: "Barangay Tala", 
      position: [13.7588, 121.1412] as LatLngTuple, 
      description: "Eastern boundary of Ibaan" 
    },
    { 
      id: 4, 
      name: "Barangay Paligawan", 
      position: [13.7588, 121.1089] as LatLngTuple, 
      description: "Western boundary of Ibaan" 
    },
    { 
      id: 5, 
      name: "Ibaan Town Proper", 
      position: [13.7588, 121.1250] as LatLngTuple, 
      description: "Center of Ibaan municipality" 
    }
  ];

  // Road intersection markers
  const roadMarkers = [
    { 
      id: 1, 
      name: "Ibaan Town Proper Junction", 
      position: [13.7588, 121.1250] as LatLngTuple, 
      type: "major_intersection",
      description: "Main intersection in Ibaan town center"
    },
    { 
      id: 2, 
      name: "Maharlika Highway - Sabang", 
      position: [13.7485, 121.1150] as LatLngTuple, 
      type: "highway_point",
      description: "National Highway access point"
    },
    { 
      id: 3, 
      name: "Maharlika Highway - San Isidro", 
      position: [13.7691, 121.1350] as LatLngTuple, 
      type: "highway_point",
      description: "Northern highway access point"
    }
  ];

  // Waterway markers
  const waterwayMarkers = [
    { 
      id: 1, 
      name: "Ibaan River Bridge", 
      position: [13.7588, 121.1250] as LatLngTuple, 
      type: "river_crossing",
      description: "Main bridge over Ibaan River in town proper"
    },
    { 
      id: 2, 
      name: "Sabang Creek Confluence", 
      position: [13.7520, 121.1180] as LatLngTuple, 
      type: "confluence",
      description: "Where Sabang Creek meets Ibaan River"
    }
  ];

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
    setSelectedLayer(key);
  };

  const getLayerStyle = (layerType: string, isHighlighted: boolean) => {
    const highlightColor = '#FFD700'; // Gold for highlighted
    const baseColor = isHighlighted ? highlightColor : 
      layerType === 'boundaries' ? '#dc2626' :
      layerType === 'roadNetworks' ? '#000000' :
      layerType === 'waterways' ? '#1e40af' : '#3b82f6';
    
    return {
      color: baseColor,
      weight: isHighlighted ? 4 : 
        layerType === 'boundaries' ? 3 :
        layerType === 'roadNetworks' ? 3 : 2,
      opacity: isHighlighted ? 1 : 0.9,
      fillOpacity: isHighlighted ? 0.3 : 
        layerType === 'boundaries' ? 0.15 : 0.1,
      fillColor: baseColor
    };
  };

  return (
    <div className="relative w-full rounded-[32px] overflow-hidden shadow-2xl border border-gray-200 bg-white">
      
      {/* Layer Control Panel */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 w-80 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Map Layers</h3>
        
        {/* Basemap Selection */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 mb-2 block">Basemap</label>
          <div className="space-y-2">
            {[
              { value: 'osm', label: 'Open Street Map' },
              { value: 'satellite', label: 'Satellite (Esri)' },
              { value: 'terrain', label: 'Terrain Map' }
            ].map((type) => (
              <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="mapType" 
                  value={type.value}
                  checked={mapType === type.value} 
                  onChange={() => setMapType(type.value as any)} 
                  className="w-3 h-3 text-blue-600"
                />
                <span className="text-xs text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 mb-2 block">Data Layers</label>
          {[
            { key: 'boundaries', label: '🏛️ Administrative Boundaries', color: '#dc2626' },
            { key: 'roadNetworks', label: '🛣️ Road Networks', color: '#1a1a1a' },
            { key: 'waterways', label: '🌊 Waterways', color: '#87CEEB' },
            { key: 'buildings', label: '🏘️ Buildings', color: '#6b7280' },
            { key: 'landUse', label: '🗺️ Land Use', color: '#059669' }
          ].map((layer) => (
            <label key={layer.key} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: layer.color }}></div>
                <span className="text-xs text-gray-700">{layer.label}</span>
              </div>
              <input 
                type="checkbox" 
                checked={layers[layer.key as keyof typeof layers]} 
                onChange={() => toggleLayer(layer.key as keyof typeof layers)} 
                className="w-3 h-3 rounded"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Legend Panel */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 w-64 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Legend</h3>
        <div className="space-y-2 text-xs">
          {layers.boundaries && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-600"></div>
              <span className="text-gray-600">Administrative Boundaries</span>
            </div>
          )}
          {layers.roadNetworks && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-gray-800"></div>
              <span className="text-gray-600">Road Networks (Dark)</span>
            </div>
          )}
          {layers.waterways && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-sky-300"></div>
              <span className="text-gray-600">Waterways (Sky Blue)</span>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <MapContainer center={center} zoom={zoom} className="w-full" style={{ height }} zoomControl={false}>
        <TileLayer 
          url={mapType === 'osm' 
            ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            : mapType === 'satellite'
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            : "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          } 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Dynamic Administrative Boundaries Layer */}
        <BoundaryLayerWrapper
          isVisible={layers.boundaries}
          isHighlighted={selectedLayer === 'boundaries'}
          areaType="municipal"
          onBoundarySelect={(location: any) => console.log('Selected boundary:', location)}
        />

        {/* Road Networks Layer */}
        {layers.roadNetworks && ibaRoadNetworks.map((road) => (
          <Polyline
            key={road.id}
            positions={road.points}
            pathOptions={{
              color: selectedLayer === 'roadNetworks' ? '#FFD700' : 
                     road.type === 'national_highway' ? '#000000' : '#333333',
              weight: selectedLayer === 'roadNetworks' ? 6 : 
                     road.type === 'national_highway' ? 5 : 3,
              opacity: selectedLayer === 'roadNetworks' ? 1 : 0.9
            }}
          />
        ))}

        {/* Waterways Layer */}
        {layers.waterways && ibaWaterways.map((waterway) => (
          <Polyline
            key={waterway.id}
            positions={waterway.points}
            pathOptions={{
              color: selectedLayer === 'waterways' ? '#FFD700' : '#87CEEB', // Sky blue when normal
              weight: selectedLayer === 'waterways' ? 6 : 
                     waterway.type === 'main_river' ? 4 : 2,
              opacity: selectedLayer === 'waterways' ? 1 : 0.8,
              fillColor: selectedLayer === 'waterways' ? '#FFD700' : '#87CEEB',
              fillOpacity: selectedLayer === 'waterways' ? 0.4 : 0.2
            }}
          />
        ))}

        <ZoomControl position="bottomleft" />
      </MapContainer>
    </div>
  );
};

export default EnhancedViewerMap;
