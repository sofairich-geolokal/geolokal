"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Rectangle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in Next.js/React
const icon = L.divIcon({
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

const MapsDashboard = () => {
  const [mapType, setMapType] = useState('satellite');
  const [layers, setLayers] = useState({
    adminBoundary: true,
    evacuationCenter: true,
    hazardArea: true,
  });

  // Dynamic Data
  const centerPosition: [number, number] = [13.8242, 121.1311]; 

  const indicators = [
    { label: "Admin boundary", color: "bg-black" },
    { label: "Evacuation Centers", color: "bg-green-500" },
    { label: "Hazard Areas", color: "bg-orange-500" },
  ];

  const sidebarCategories = [
    { title: "DRRM", desc: "Data fetched from another portal" },
    { title: "Land Use", desc: "Local datasets and GeoNode Group" },
    { title: "Real Property and Revenue", desc: "Integration with existing portal (development)" },
    { title: "Socioeconomic & Development", desc: "Local + CBMS / Utilities layers" },
    { title: "Smart City and Environmental", desc: "Possible external data (Geo-portal)" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 bg-white font-sans">
      
      {/* Map Main Container */}
      <div className="relative flex-1 h-[500px] rounded-[32px] overflow-hidden shadow-2xl border border-gray-200">
        
        {/* TOP LEFT: LAYER SELECTOR (Floating Overlay) */}
        <div className="absolute top-6 left-6 z-[1000] bg-white rounded-2xl shadow-lg p-5 w-60 border border-gray-100">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="mapType" 
                checked={mapType === 'osm'} 
                onChange={() => setMapType('osm')} 
                className="w-4 h-4 accent-grey-100"
              />
              <span className="text-sm font-medium text-gray-700">Open Street Map</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="mapType" 
                checked={mapType === 'satellite'} 
                onChange={() => setMapType('satellite')} 
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Satellite (Esri)</span>
            </label>
            
            <div className="h-px bg-gray-100 my-2" />

            {Object.entries(layers).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={value} 
                  onChange={() => setLayers(prev => ({ ...prev, [key]: !value }))}
                  className="w-4 h-4 accent-grey-100 rounded"
                />
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* MIDDLE LEFT: COLOR INDICATORS (Floating Overlay) */}
        <div className="absolute top-[280px] left-6 z-[1000] bg-white rounded-2xl shadow-lg p-6 w-60 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Color Indicators</h3>
          <div className="space-y-3">
            {indicators.map((ind, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${ind.color} shadow-sm`} />
                <span className="text-sm font-semibold text-gray-600">{ind.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaflet Engine */}
        <MapContainer 
          center={centerPosition} 
          zoom={16} 
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer 
            url={mapType === 'osm' 
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            } 
          />

          {layers.hazardArea && (
            <Circle 
              center={centerPosition} 
              radius={250} 
              pathOptions={{ color: 'black', weight: 4, fillOpacity: 0.1, fillColor: 'black' }} 
            />
          )}

          {layers.adminBoundary && (
            <Rectangle 
              bounds={[ [13.8252, 121.1300], [13.8232, 121.1322] ]} 
              pathOptions={{ color: '#4ade80', weight: 5, fillOpacity: 0 }}
            />
          )}

          {layers.evacuationCenter && (
            <>
              <Marker position={[13.8245, 121.1318]} icon={icon}><Popup>Evacuation Center A</Popup></Marker>
              <Marker position={[13.8235, 121.1308]} icon={icon}><Popup>Evacuation Center B</Popup></Marker>
            </>
          )}
        </MapContainer>
      </div>

      {/* RIGHT SIDEBAR CATEGORIES */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4">
        {sidebarCategories.map((cat, i) => (
          <div key={i} className="p-4 bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <h3 className="text-lg font-bold text-gray-900">{cat.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{cat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapsDashboard;