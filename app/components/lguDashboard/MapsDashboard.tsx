"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// DYNAMICALLY IMPORT ALL LEAFLET COMPONENTS
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then((mod) => mod.Circle), { ssr: false });
const Rectangle = dynamic(() => import('react-leaflet').then((mod) => mod.Rectangle), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then((mod) => mod.GeoJSON), { ssr: false });

const MapsDashboard = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  
  // THE FIX: Unique key to prevent Leaflet container reuse bugs during Hot Reloads
  const [mapKey, setMapKey] = useState<string>(''); 

  const [mapType, setMapType] = useState('satellite');
  const [customIcon, setCustomIcon] = useState<any>(null);
  
  const [layers, setLayers] = useState({
    adminBoundary: true,
    evacuationCenter: true,
    hazardArea: true,
    roadNetworks: true,
    rivers: true,
    riverBoundary: true, 
  });
  
  const [boundaryLocations, setBoundaryLocations] = useState<any[]>([]);
  const [waterwaysData, setWaterwaysData] = useState<any>(null);
  const [roadsData, setRoadsData] = useState<any>(null);
  const [boundariesData, setBoundariesData] = useState<any>(null); // NEW: State for Boundary Layer
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<number | null>(null); // NEW: Selection highlight
  const [loading, setLoading] = useState(true);

  const centerPosition: [number, number] = [13.8242, 121.1311]; 

  const indicators = [
    { label: "Admin boundary", color: "bg-green-500" },
    { label: "Evacuation Centers", color: "bg-blue-500" },
    { label: "Road Networks", color: "bg-[#00ff00]" }, 
    { label: "Rivers", color: "bg-blue-600" },
    { label: "River Boundary", color: "bg-sky-300" },
    { label: "Hazard Areas", color: "bg-orange-500" },
  ];

  const sidebarCategories = [
    { title: "DRRM", desc: "Data fetched from another portal" },
    { title: "Land Use", desc: "Local datasets and GeoNode Group" },
    { title: "Real Property and Revenue", desc: "Integration with existing portal (development)" },
    { title: "Socioeconomic & Development", desc: "Local + CBMS / Utilities layers" },
    { title: "Smart City and Environmental", desc: "Possible external data (Geo-portal)" },
  ];

  useEffect(() => {
    setIsMounted(true);
    setMapKey(Date.now().toString() + Math.random().toString());

    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;
      const icon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div style="position: relative; display: flex; justify-content: center; align-items: center; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
            <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#F59E0B"/>
              <circle cx="15" cy="15" r="5" fill="white"/>
            </svg>
          </div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });
      setCustomIcon(icon);
      setLeafletReady(true);
    };
    initLeaflet();
  }, []);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);
        
        // Fetch locations
        fetch('/api/boundary-locations')
          .then(res => res.json())
          .then(result => {
            if (result.success && result.data) {
              setBoundaryLocations(Object.values(result.data).flat());
            }
          }).catch(err => console.error(err));

        // Fetch Waterways
        let geoData = null;
        try {
          const dbResponse = await fetch('/api/waterways');
          if (dbResponse.ok) {
            const result = await dbResponse.json();
            if (result.success && result.data && result.data.features) {
                geoData = result.data;
            }
          }
        } catch (e) { console.log("DB route not ready, trying local file..."); }

        if (!geoData) {
          const localResponse = await fetch('/data/Ibaan_waterways.json');
          geoData = await localResponse.json();
        }
        setWaterwaysData(geoData);

        // Fetch Road Networks
        let rData = null;
        try {
          const rRes = await fetch('/api/roads');
          if (rRes.ok) {
            const result = await rRes.json();
            if (result.success && result.data && result.data.features) {
              rData = result.data;
            }
          }
        } catch (e) { console.log("Roads DB route not ready, trying local file..."); }

        if (!rData) {
          try {
            const lRes = await fetch('/data/Ibaan_roadnetworks.json');
            rData = await lRes.json();
          } catch (e) { console.log("No local road data found."); }
        }
        setRoadsData(rData);

        // NEW: Fetch Admin Boundaries
        let bData = null;
        try {
          const bRes = await fetch('/api/boundaries');
          if (bRes.ok) {
            const result = await bRes.json();
            if (result.success && result.data && result.data.features) {
              bData = result.data;
            }
          }
        } catch (e) { console.log("Boundaries DB route not ready."); }
        setBoundariesData(bData);

      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        setLoading(false); 
      }
    };
    fetchMapData();
  }, []);

  const calculateRiverBounds = (geoData: any): [[number, number], [number, number]] | null => {
    if (!geoData || !geoData.features) return null;
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    geoData.features.forEach((feature: any) => {
      if (feature.geometry?.type === 'Polygon' && feature.geometry?.coordinates) {
        feature.geometry.coordinates.forEach((ring: any) => {
          ring.forEach((coord: any) => {
            const x = coord[0], y = coord[1];
            const lng = (x - 500000) / 100000 + 121.0;
            const lat = (y - 1520000) / 100000 + 13.8;
            minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
          });
        });
      }
    });
    if (minLng === Infinity) return null;
    const buffer = 0.02;
    return [[minLat - buffer, minLng - buffer], [maxLat + buffer, maxLng + buffer]];
  };

  const transformCoordinates = (geoData: any) => {
    if (!geoData || !geoData.features) return geoData;
    return {
      ...geoData,
      features: geoData.features.map((feature: any) => {
        if ((feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon') && feature.geometry?.coordinates) {
          const transformRing = (ring: any) => ring.map((coord: any) => {
            const x = coord[0], y = coord[1];
            if (x < 180 && x > -180) return [x, y];
            return [(x - 500000) / 100000 + 121.0, (y - 1520000) / 100000 + 13.8];
          });

          let newCoords;
          if (feature.geometry.type === 'Polygon') {
            newCoords = feature.geometry.coordinates.map(transformRing);
          } else {
            newCoords = feature.geometry.coordinates.map((poly: any) => poly.map(transformRing));
          }

          return { ...feature, geometry: { ...feature.geometry, coordinates: newCoords }};
        }
        return feature;
      })
    };
  };

  const transformRoadCoordinates = (geoData: any) => {
    try {
      if (!geoData || !geoData.features || !Array.isArray(geoData.features)) return null;
      const transformedData = {
        ...geoData,
        type: "FeatureCollection",
        features: geoData.features.filter((feature: any) => feature && feature.geometry && feature.geometry.coordinates).map((feature: any) => {
          const transformPt = (coord: any) => {
            const x = coord[0], y = coord[1];
            if (x < 180 && x > -180) return [x, y];
            return [(x - 500000) / 100000 + 121.0, (y - 1520000) / 100000 + 13.8];
          };

          let newCoords = feature.geometry.coordinates;
          if (feature.geometry.type === 'Polygon') {
            newCoords = feature.geometry.coordinates[0].map(transformPt);
            return { ...feature, geometry: { type: 'LineString', coordinates: newCoords }};
          }
          if (feature.geometry.type === 'MultiPolygon') {
            newCoords = feature.geometry.coordinates.map((polygon: any) => polygon[0].map(transformPt));
            return { ...feature, geometry: { type: 'MultiLineString', coordinates: newCoords }};
          }
          if (feature.geometry.type === 'LineString') {
            newCoords = feature.geometry.coordinates.map(transformPt);
          } else if (feature.geometry.type === 'MultiLineString') {
            newCoords = feature.geometry.coordinates.map((ring: any) => ring.map(transformPt));
          }
          return { ...feature, geometry: { ...feature.geometry, coordinates: newCoords }};
        })
      };
      return transformedData;
    } catch (error) { return null; }
  };

  const geoPortalWaterwayStyle = (feature: any) => {
    if (feature.geometry?.type?.includes('Polygon')) {
      return { color: '#7dd3fc', weight: 2, fillColor: '#38bdf8', fillOpacity: 0.35 };
    }
    return { color: '#2563eb', weight: 3, opacity: 0.9 };
  };

  const geoPortalRoadStyle = () => ({ color: '#06a506ee', weight: 3, opacity: 0.9 });

  const adminBoundaryStyle = (feature: any) => {
    const isSelected = feature.id === selectedBoundaryId;
    const hasCompleteData = feature.properties && feature.properties.brgy; // Check if 'brgy' property exists

    return {
      color: isSelected ? '#3b82f6' : 'rgb(24, 49, 88)', // Blue when selected, green when not
      weight: isSelected ? 4 : 2,
      fillColor: '#5432ff99', // Always blue fill color
      fillOpacity: hasCompleteData ? (isSelected ? 0.2 : 0.15) : 0, // Fill only if data is complete
      dashArray: isSelected ? '' : '5, 10', // Solid when selected, dotted when not
    };
  };

  const onEachWaterwayFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => { e.target.setStyle({ weight: 5, color: '#f97316', fillOpacity: 0.7 }); },
      mouseout: (e: any) => { e.target.setStyle(geoPortalWaterwayStyle(feature)); }
    });
    layer.bindPopup(`<h4 class="font-bold">${feature.properties?.Name || 'Waterway'}</h4>`);
  };

  const onEachRoadFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => { e.target.setStyle({ weight: 5, color: '#eab308' }); },
      mouseout: (e: any) => { e.target.setStyle(geoPortalRoadStyle()); },
      click: (e: any) => {
        const props = feature.properties || {};
        const content = `<div class="p-3 min-w-[200px] text-xs">
          <h4 class="font-bold mb-2">Road Details</h4>
          ${props.Name ? `<div><b>Name:</b> ${props.Name}</div>` : ''}
          ${props.Type ? `<div><b>Type:</b> ${props.Type}</div>` : ''}
          <div><b>Geometry:</b> ${feature.geometry.type}</div>
        </div>`;
        layer.bindPopup(content).openPopup();
      }
    });
  };

  const onEachBoundaryFeature = (feature: any, layer: any) => {
    layer.on({
      click: (e: any) => {
        setSelectedBoundaryId(feature.id);
        e.target._map.fitBounds(e.target.getBounds());
        
        // Show detailed popup with complete boundary information
        const props = feature.properties || {};
        const content = `<div class="p-3 min-w-[250px] text-xs">
          <h4 class="font-bold text-blue-700 mb-2">Administrative Boundary Details</h4>
          
          ${props.brgy ? `<div class="mb-2"><span class="font-semibold">Barangay:</span> ${props.brgy}</div>` : ''}
          ${props.lotno ? `<div><span class="font-semibold">Lot Number:</span> ${props.lotno}</div>` : ''}
          ${props.layer ? `<div><span class="font-semibold">Layer:</span> ${props.layer}</div>` : ''}
          ${props.SHAPE_Leng ? `<div><span class="font-semibold">Perimeter:</span> ${props.SHAPE_Leng.toFixed(2)} meters</div>` : ''}
          ${props.Shape_Area ? `<div><span class="font-semibold">Area:</span> ${(props.Shape_Area / 10000).toFixed(2)} hectares</div>` : ''}
          ${props.Shape_Le_1 ? `<div><span class="font-semibold">Secondary Perimeter:</span> ${props.Shape_Le_1.toFixed(2)} meters</div>` : ''}
          
          <div class="mt-2 pt-2 border-t border-gray-200">
            <div class="text-gray-600"><span class="font-semibold">Boundary ID:</span> ${feature.id}</div>
            <div class="text-gray-600"><span class="font-semibold">Geometry Type:</span> ${feature.geometry?.type || 'Polygon'}</div>
            ${props.path ? `<div class="text-gray-600"><span class="font-semibold">Source File:</span> ${props.path.split('\\').pop()}</div>` : ''}
          </div>
          
          <div class="mt-2 text-xs text-gray-500">
            <div>📍 Administrative Boundary of Ibaan, Batangas</div>
            <div>📐 CRS: PRS92 Philippines Zone III</div>
          </div>
        </div>`;
        
        layer.bindPopup(content).openPopup();
      },
      mouseover: (e: any) => {
        // Highlight on hover
        e.target.setStyle({ 
          weight: 4, 
          color: '#3b82f6', 
          fillOpacity: 0.2,
          dashArray: ''
        });
      },
      mouseout: (e: any) => {
        // Reset style on mouseout
        const isSelected = feature.id === selectedBoundaryId;
        e.target.setStyle(adminBoundaryStyle(feature));
      }
    });
    
    // Default popup for when not clicked
    layer.bindPopup(`<h4 class="font-bold text-blue-700">${feature.properties?.brgy || 'Administrative Boundary'}</h4>
      <div class="text-xs text-gray-600">
        ${feature.properties?.brgy ? `Barangay: ${feature.properties.brgy}` : 'Boundary Area'}
      </div>`);
  };

  const getFilteredLocations = () => {
    let filtered = [...boundaryLocations];
    if (!layers.evacuationCenter) filtered = filtered.filter(loc => loc.type !== 'evacuation_center' && loc.type !== 'healthcare');
    if (!layers.adminBoundary) filtered = filtered.filter(loc => loc.type !== 'government' && loc.type !== 'barangay');
    return filtered;
  };

  if (!isMounted || !mapKey || !leafletReady) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 bg-white font-sans">
      <div className="relative flex-1 h-[650px] rounded-[32px] overflow-hidden shadow-2xl border border-gray-200">
        
        {loading && (
          <div className="absolute inset-0 z-[2000] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="mt-4 font-bold text-gray-700">Loading spatial data...</p>
          </div>
        )}

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

        <MapContainer key={mapKey} center={centerPosition} zoom={13} className="h-full w-full">
          <TileLayer 
            key={mapType}
            url={mapType === 'osm' 
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            } 
          />

          {layers.hazardArea && <Circle center={centerPosition} radius={500} pathOptions={{ color: '#ea580c', weight: 3, fillOpacity: 0.15, fillColor: '#ea580c' }} />}

          {/* ADMIN BOUNDARY LAYER */}
          {layers.adminBoundary && boundariesData && (
             <GeoJSON 
               key={`admin-layer-${selectedBoundaryId}-${boundariesData.features.length}`}
               data={transformCoordinates(boundariesData)}
               style={adminBoundaryStyle}
               onEachFeature={onEachBoundaryFeature}
             />
          )}

          {layers.riverBoundary && waterwaysData && (
             <Rectangle 
               bounds={calculateRiverBounds(waterwaysData) || [[13.70, 121.00], [13.90, 121.30]]}
               pathOptions={{ color: '#87CEEB', weight: 2, fillOpacity: 0.25, dashArray: '8, 4' }}
             />
          )}

          {layers.rivers && waterwaysData && waterwaysData.features && (
             <GeoJSON 
               key={`river-${waterwaysData.features.length}`}
               data={transformCoordinates(waterwaysData)}
               style={geoPortalWaterwayStyle}
               onEachFeature={onEachWaterwayFeature}
             />
          )}

          {layers.roadNetworks && roadsData && roadsData.features && transformRoadCoordinates(roadsData) && (
             <GeoJSON 
               key={`roads-${roadsData.features.length}`}
               data={transformRoadCoordinates(roadsData)!}
               style={geoPortalRoadStyle}
               onEachFeature={onEachRoadFeature}
             />
          )}

          {layers.evacuationCenter && customIcon && getFilteredLocations().map((location: any) => (
            <Marker key={location.id} position={[location.latitude, location.longitude]} icon={customIcon}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-bold text-sm">{location.name}</h4>
                  <p className="text-xs text-gray-600">{location.address}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="w-full lg:w-[400px] flex flex-col gap-4">
        {sidebarCategories.map((cat, i) => (
          <div key={i} className="p-5 bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer">
            <h3 className="text-lg font-bold text-gray-900">{cat.title}</h3>
            <p className="text-sm text-gray-500 mt-2">{cat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapsDashboard;