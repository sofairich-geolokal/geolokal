"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
// Remove: import L from 'leaflet'; <--- This was the culprit
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then((mod) => mod.Circle), { ssr: false });
const Rectangle = dynamic(() => import('react-leaflet').then((mod) => mod.Rectangle), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const ZoomControl = dynamic(() => import('react-leaflet').then((mod) => mod.ZoomControl), { ssr: false });

interface Project {
  title: string;
  lgu: string;
  category: string;
}

interface MapPopupProps {
  project: Project;
  onClose: () => void;
}

const MapPopup = ({ project, onClose }: MapPopupProps) => {
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('satellite');
  const [customIcon, setCustomIcon] = useState<any>(null); // State for the icon
  const [layers, setLayers] = useState({
    admin: true,
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

  const centerPosition: [number, number] = [13.8242, 121.1311];

  const sidebarCategories = [
    { title: "DRRM", desc: `Data fetched for ${project.lgu} portal`, layerKey: 'hazard' as const, activeColor: 'border-[#ea580c]', textColor: 'text-[#ea580c]' },
    { title: "Land Use", desc: "Local datasets and GeoNode Group", layerKey: 'admin' as const, activeColor: 'border-black', textColor: 'text-black' },
    { title: "Real Property and Revenue", desc: "Integration with existing portal (development)", layerKey: 'admin' as const, activeColor: 'border-black', textColor: 'text-black' },
    { title: "Socioeconomic & Development", desc: "Local + CBMS / Utilities layers", layerKey: 'evacuation' as const, activeColor: 'border-[#22c55e]', textColor: 'text-[#22c55e]' },
    { title: "Smart City and Environmental", desc: "Possible external data (Geo-portal)", layerKey: 'hazard' as const, activeColor: 'border-[#ea580c]', textColor: 'text-[#ea580c]' },
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
            <div className="absolute top-5 left-5 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-5 w-56 border border-gray-100">
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
                      <span className="text-[13px] font-semibold text-gray-600 capitalize">{key} Boundary</span>
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

            <MapContainer center={centerPosition} zoom={15} className="h-full w-full" zoomControl={false}>
              <TileLayer 
                url={mapType === 'osm' 
                  ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                  : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                } 
              />
              
              {layers.hazard && (
                <Circle center={centerPosition} radius={300} pathOptions={{ color: 'black', weight: 4, fillOpacity: 0.1, fillColor: 'black' }} />
              )}
              {layers.admin && (
                <Rectangle bounds={[ [13.826, 121.129], [13.822, 121.133] ]} pathOptions={{ color: '#4ade80', weight: 4, fillOpacity: 0 }} />
              )}
              
              {/* Only render Marker if customIcon is loaded */}
              {layers.evacuation && customIcon && (
                <>
                  <Marker position={[13.8245, 121.1318]} icon={customIcon} />
                  <Marker position={[13.8235, 121.1308]} icon={customIcon} />
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

export default MapPopup;