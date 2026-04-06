"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamic imports for Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then((mod) => mod.Circle), { ssr: false });
const Rectangle = dynamic(() => import('react-leaflet').then((mod) => mod.Rectangle), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then((mod) => mod.Polygon), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const ZoomControl = dynamic(() => import('react-leaflet').then((mod) => mod.ZoomControl), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const BoundaryLayerWrapper = dynamic(() => import('../ViewerDashboard/BoundaryLayerWrapper').then((mod) => mod.default), { ssr: false });

// Type definitions for coordinates
type LatLngTuple = [number, number];
type LatLngExpression = LatLngTuple | LatLngTuple[];

interface Project {
  title: string;
  lgu: string;
  category: string;
}

interface MapPopupProps {
  project: Project;
  onClose: () => void;
}

const EnhancedMapPopup = ({ project, onClose }: MapPopupProps) => {
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('satellite');
  const [customIcon, setCustomIcon] = useState<any>(null);
  const [layers, setLayers] = useState({
    boundaries: true,
    roadNetworks: true,
    waterways: true,
    evacuation: true,
    hazard: true,
  });

  // Load Leaflet and create the icon ONLY on the client side
  useEffect(() => {
    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;
      
      const icon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.25));">
            <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#F59E0B"/>
              <circle cx="15" cy="15" r="5" fill="white"/>
            </svg>
          </div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });
      setCustomIcon(icon);
    };
    initLeaflet();
  }, []);

  const centerPosition: [number, number] = [13.7588, 121.1250]; // Ibaan center

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
      name: "Maharlika Highway",
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
    }
  ];

  const sidebarCategories = [
    { title: "🏛️ Boundaries", desc: "Administrative boundaries and barangay limits", layerKey: 'boundaries' as const, activeColor: 'border-[#dc2626]', textColor: 'text-[#dc2626]' },
    { title: "🛣️ Road Networks", desc: "National highways, provincial and municipal roads", layerKey: 'roadNetworks' as const, activeColor: 'border-[#000000]', textColor: 'text-[#000000]' },
    { title: "🌊 Waterways", desc: "Rivers, creeks, streams and irrigation canals", layerKey: 'waterways' as const, activeColor: 'border-[#1e40af]', textColor: 'text-[#1e40af]' },
    { title: "🏘️ Evacuation", desc: "Emergency evacuation centers and gathering points", layerKey: 'evacuation' as const, activeColor: 'border-[#22c55e]', textColor: 'text-[#22c55e]' },
    { title: "⚠️ Hazard Areas", desc: "Disaster-prone areas and risk zones", layerKey: 'hazard' as const, activeColor: 'border-[#ea580c]', textColor: 'text-[#ea580c]' },
  ];

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header Section */}
        <div className="px-8 py-4 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-tight">{project.title}</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
              {project.lgu} • {project.category}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 rounded-full transition-colors group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 overflow-hidden p-6 gap-6">
          <div className="relative flex-1 rounded-[32px] overflow-hidden border border-gray-100 shadow-inner">
            
            {/* Control Overlays */}
            <div className="absolute top-5 left-5 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-5 w-72 border border-gray-100">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" checked={mapType === 'osm'} onChange={() => setMapType('osm')} className="w-4 h-4 accent-gray-500" />
                    <span className="text-[13px] font-semibold text-gray-600">Open Street Map</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" checked={mapType === 'satellite'} onChange={() => setMapType('satellite')} className="w-4 h-4 accent-orange-500" />
                    <span className="text-[13px] font-bold text-gray-800">Satellite (Esri)</span>
                  </label>
                </div>
                <hr className="border-gray-100" />
                <div className="space-y-3">
                  {Object.entries(layers).map(([key, val]) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer">
                      <span className="text-[13px] font-semibold text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <input 
                        type="checkbox" 
                        checked={val} 
                        onChange={() => toggleLayer(key as keyof typeof layers)} 
                        className="w-4 h-4 rounded accent-gray-800"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="absolute top-5 right-5 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 w-64 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Legend</h3>
              <div className="space-y-2">
                {layers.boundaries && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-red-600"></div>
                    <span className="text-xs text-gray-600">Administrative Boundaries</span>
                  </div>
                )}
                {layers.roadNetworks && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-black"></div>
                    <span className="text-xs text-gray-600">Road Networks</span>
                  </div>
                )}
                {layers.waterways && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-blue-600"></div>
                    <span className="text-xs text-gray-600">Waterways</span>
                  </div>
                )}
                {layers.evacuation && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Evacuation Centers</span>
                  </div>
                )}
                {layers.hazard && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Hazard Areas</span>
                  </div>
                )}
              </div>
            </div>

            <MapContainer center={centerPosition} zoom={14} className="h-full w-full" zoomControl={false}>
              <TileLayer 
                url={mapType === 'osm' 
                  ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                  : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                } 
              />
              
              {/* Dynamic Administrative Boundaries Layer */}
              <BoundaryLayerWrapper
                isVisible={layers.boundaries}
                isHighlighted={true}
                areaType="municipal"
                onBoundarySelect={(location: any) => console.log('Selected boundary:', location)}
              />

              {/* Road Networks Layer */}
              {layers.roadNetworks && ibaRoadNetworks.map((road) => (
                <Polyline
                  key={road.id}
                  positions={road.points}
                  pathOptions={{
                    color: road.type === 'national_highway' ? '#1a1a1a' : '#333333', // Dark shades
                    weight: road.type === 'national_highway' ? 6 : 4,
                    opacity: 0.9
                  }}
                />
              ))}

              {/* Waterways Layer */}
              {layers.waterways && ibaWaterways.map((waterway) => (
                <Polyline
                  key={waterway.id}
                  positions={waterway.points}
                  pathOptions={{
                    color: '#87CEEB', // Sky blue color
                    weight: waterway.type === 'main_river' ? 5 : 3,
                    opacity: 0.8,
                    fillColor: '#87CEEB',
                    fillOpacity: 0.3
                  }}
                />
              ))}

              {/* Hazard Area Layer */}
              {layers.hazard && (
                <Circle center={centerPosition} radius={500} pathOptions={{ color: '#ea580c', weight: 4, fillOpacity: 0.1, fillColor: '#ea580c' }} />
              )}

              {/* Evacuation Centers Layer */}
              {layers.evacuation && customIcon && (
                <>
                  <Marker position={[13.8245, 121.1318]} icon={customIcon} />
                  <Marker position={[13.8235, 121.1308]} icon={customIcon} />
                  <Marker position={[13.8260, 121.1280]} icon={customIcon} />
                </>
              )}
              
              <ZoomControl position="bottomleft" />
            </MapContainer>
          </div>

          <div className="w-[420px] flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
            {sidebarCategories.map((cat, i) => {
              const isActive = layers[cat.layerKey];
              return (
                <div 
                  key={i} 
                  onClick={() => toggleLayer(cat.layerKey)}
                  className={`p-4 bg-white border-2 transition-all cursor-pointer group rounded-[10px] shadow-sm hover:shadow-md
                    ${isActive ? `${cat.activeColor} bg-gray-50/50` : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <h3 className={`text-[13px] font-black uppercase tracking-tight transition-colors
                    ${isActive ? cat.textColor : 'text-gray-900 group-hover:text-orange-500'}`}>
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-2 font-medium leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMapPopup;
