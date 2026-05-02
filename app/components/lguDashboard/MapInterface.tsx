"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Rectangle, Marker, ZoomControl, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Marker to match the orange location pin with white dot center
const orangePin = L.divIcon({
  className: 'custom-pin',
  html: `
    <div style="position: relative; display: flex; justify-content: center; align-items: center;">
      <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#F59E0B"/>
        <circle cx="15" cy="15" r="5" fill="white"/>
      </svg>
    </div>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42]
});

interface DatabaseLayer {
  id: number;
  layer_name: string;
  metadata: any;
  style_config: any;
  is_visible: boolean;
}

const PreciseMapInterface = () => {
  const [layers, setLayers] = useState({ admin: false, evacuation: false, hazard: false });
  const [mapType, setMapType] = useState('satellite');
  const [dbLayers, setDbLayers] = useState<DatabaseLayer[]>([]);
  const [visibleDbLayers, setVisibleDbLayers] = useState<Set<number>>(new Set());
  
  const center: [number, number] = [13.86, 121.15];

  useEffect(() => {
    fetchDatabaseLayers();
  }, []);

  const fetchDatabaseLayers = async () => {
    try {
      const response = await fetch('/api/layers?visible=true');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setDbLayers(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching database layers:', error);
    }
  };

  const toggleDbLayer = (layerId: number) => {
    setVisibleDbLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full h-screen bg-gray-100 p-4 md:p-10 flex items-center justify-center">
      <div className="relative w-full max-w-5xl aspect-square md:aspect-video lg:h-[750px] rounded-[32px] overflow-hidden shadow-2xl border-[1px] border-gray-200 bg-white">
        
        {/* --- TOP LEFT: LAYER SELECTOR --- */}
        <div className="absolute top-8 left-8 z-[1000] bg-white rounded-2xl shadow-lg border border-gray-100 p-5 w-64">
          <div className="space-y-4">
            {/* Basemap Radio Group */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${mapType === 'osm' ? 'border-orange-500' : 'border-gray-300'}`}>
                  {mapType === 'osm' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                </div>
                <input type="radio" className="hidden" checked={mapType === 'osm'} onChange={() => setMapType('osm')} />
                <span className="text-sm font-medium text-gray-700">Open Street Map</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${mapType === 'satellite' ? 'border-orange-500' : 'border-gray-300'}`}>
                  {mapType === 'satellite' && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                </div>
                <input type="radio" className="hidden" checked={mapType === 'satellite'} onChange={() => setMapType('satellite')} />
                <span className="text-sm font-medium text-gray-700">Satellite (Esri)</span>
              </label>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Feature Checkboxes */}
            <div className="space-y-3">
              {[
                { id: 'admin', label: 'Admin Boundary' },
                { id: 'evacuation', label: 'Evacuation Center' },
                { id: 'hazard', label: 'Hazard Area' }
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 accent-black" 
                    checked={layers[item.id as keyof typeof layers]}
                    onChange={() => setLayers(p => ({...p, [item.id]: !p[item.id as keyof typeof layers]}))}
                  />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>

            {dbLayers.length > 0 && (
              <>
                <div className="h-px bg-gray-100 w-full" />
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Uploaded Layers</h4>
                  {dbLayers.map((layer) => (
                    <label key={layer.id} className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 accent-black" 
                        checked={visibleDbLayers.has(layer.id)}
                        onChange={() => toggleDbLayer(layer.id)}
                      />
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: layer.style_config?.color || layer.metadata?.color || '#333333' }}
                        />
                        <span className="text-sm font-medium text-gray-700 truncate">{layer.layer_name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* --- MIDDLE LEFT: COLOR INDICATORS --- */}
        <div className="absolute top-[320px] left-8 z-[1000] bg-white rounded-2xl shadow-lg border border-gray-100 p-6 w-64">
          <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-tight">Color Indicators</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-black shadow-sm" />
              <span className="text-sm font-semibold text-gray-600">Admin boundary</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-[#52C47D] shadow-sm" />
              <span className="text-sm font-semibold text-gray-600">Evacuation Centers</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-[#F59E0B] shadow-sm" />
              <span className="text-sm font-semibold text-gray-600">Hazard Areas</span>
            </div>
          </div>
        </div>

        {/* --- MAP ENGINE --- */}
        <MapContainer 
          center={center} 
          zoom={20} 
          zoomControl={false} 
          className="w-full h-full z-0"
        >
          <TileLayer 
            url={mapType === 'osm' 
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            } 
          />
          
          {/* Black Hazard Circle */}
          {layers.hazard && (
            <Circle 
              center={center} 
              radius={180} 
              pathOptions={{ color: 'black', weight: 6, fillOpacity: 0 }} 
            />
          )}

          {/* Green Admin Rectangle */}
          {layers.admin && (
            <Rectangle 
              bounds={[[13.8248, 121.1298], [13.8236, 121.1315]]} 
              pathOptions={{ color: '#52C47D', weight: 6, fillOpacity: 0 }} 
            />
          )}

          {/* Custom Pin Markers */}
          {layers.evacuation && (
            <>
              <Marker position={[13.8242, 121.1305]} icon={orangePin} />
              <Marker position={[13.8244, 121.1320]} icon={orangePin} />
              <Marker position={[13.8234, 121.1310]} icon={orangePin} />
            </>
          )}

          {/* Database Layers */}
          {dbLayers.map((layer) => (
            visibleDbLayers.has(layer.id) && layer.metadata?.geojson ? (
              <GeoJSON
                key={layer.id}
                data={layer.metadata.geojson}
                style={{
                  color: layer.style_config?.color || layer.metadata?.color || '#333333',
                  weight: layer.style_config?.weight || 2,
                  opacity: layer.style_config?.opacity || 1,
                  fillOpacity: layer.style_config?.fillOpacity || 0.3,
                  fillColor: layer.style_config?.fillColor || layer.style_config?.color || layer.metadata?.color || '#333333'
                }}
              />
            ) : null
          ))}

          <ZoomControl position="bottomleft" />
        </MapContainer>

        {/* --- BOTTOM LEFT GOOGLE STYLE LOGO --- */}
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none opacity-80">
           <span className="text-white font-bold text-xl drop-shadow-md">Leaflet Map</span>
        </div>
      </div>
    </div>
  );
};

export default PreciseMapInterface;