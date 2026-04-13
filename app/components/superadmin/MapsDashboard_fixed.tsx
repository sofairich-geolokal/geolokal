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
  // NEW: State for roads data
  const [roadsData, setRoadsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const centerPosition: [number, number] = [13.8242, 121.1311]; 

  const indicators = [
    { label: "Admin boundary", color: "bg-green-500" },
    { label: "Evacuation Centers", color: "bg-blue-500" },
    { label: "Road Networks", color: "bg-[#00ff00]" }, // UPDATED to bright neon green
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
    
    // Generate a unique ID every time the component mounts to prevent Leaflet crashes
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
        } catch (e) {
          console.log("DB route not ready, trying local file...");
        }

        if (!geoData) {
          const localResponse = await fetch('/data/Ibaan_waterways.json');
          geoData = await localResponse.json();
        }
        
        setWaterwaysData(geoData);
        console.log('Waterways data loaded:', geoData);
        console.log('Number of features:', geoData?.features?.length);
        console.log('Sample feature:', geoData?.features?.[0]);

        // NEW: Fetch Road Networks
        let rData = null;
        try {
          const rRes = await fetch('/api/roads');
          if (rRes.ok) {
            const result = await rRes.json();
            if (result.success && result.data && result.data.features) {
              rData = result.data;
            }
          }
        } catch (e) {
          console.log("Roads DB route not ready, trying local file...");
        }

        if (!rData) {
          try {
            const lRes = await fetch('/data/Ibaan_roadnetworks.json');
            rData = await lRes.json();
          } catch (e) {
             console.log("No local road data found.");
          }
        }
        setRoadsData(rData);
        console.log('Roads data loaded:', rData);
        console.log('Number of road features:', rData?.features?.length);
        console.log('Sample road feature:', rData?.features?.[0]);

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
    
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    
    geoData.features.forEach((feature: any) => {
      if (feature.geometry?.type === 'Polygon' && feature.geometry?.coordinates) {
        feature.geometry.coordinates.forEach((ring: any) => {
          ring.forEach((coord: any) => {
            // Transform projected coordinates to lat/lng
            const x = coord[0];
            const y = coord[1];
            const lng = (x - 500000) / 100000 + 121.0;
            const lat = (y - 1520000) / 100000 + 13.8;
            
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          });
        });
      }
    });
    
    if (minLng === Infinity) return null;
    
    // Add a small buffer around the bounds
    const buffer = 0.02;
    return [
      [minLat - buffer, minLng - buffer],
      [maxLat + buffer, maxLng + buffer]
    ];
  };

  const transformCoordinates = (geoData: any) => {
    if (!geoData || !geoData.features) return geoData;
    
    // Transform projected coordinates to lat/lng (approximate for this area)
    // This is a rough transformation - in production, use proper projection libraries
    const transformedData = {
      ...geoData,
      features: geoData.features.map((feature: any) => {
        if (feature.geometry?.type === 'Polygon' && feature.geometry?.coordinates) {
          return {
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates: feature.geometry.coordinates.map((ring: any) => 
                ring.map((coord: any) => {
                  // Rough transformation from projected to lat/lng
                  // These coordinates appear to be in UTM Zone 51N
                  const x = coord[0];
                  const y = coord[1];
                  
                  // Approximate transformation to lat/lng for Philippines area
                  const lng = (x - 500000) / 100000 + 121.0;
                  const lat = (y - 1520000) / 100000 + 13.8;
                  
                  return [lng, lat];
                })
              )
            }
          };
        }
        return feature;
      })
    };
    
    console.log('Transformed first feature:', transformedData.features[0]);
    return transformedData;
  };

  // NEW: Coordinate Transformer specific for Road LineStrings
  const transformRoadCoordinates = (geoData: any) => {
    if (!geoData || !geoData.features) return geoData;
    
    const transformedData = {
      ...geoData,
      features: geoData.features.map((feature: any) => {
        if (!feature.geometry || !feature.geometry.coordinates) return feature;

        const transformPt = (coord: any) => {
          const x = coord[0];
          const y = coord[1];
          // Skip transformation if data is already in standard lat/lng
          if (x < 180 && x > -180) return [x, y];
          const lng = (x - 500000) / 100000 + 121.0;
          const lat = (y - 1520000) / 100000 + 13.8;
          return [lng, lat];
        };

        let newCoords = feature.geometry.coordinates;

        if (feature.geometry.type === 'LineString') {
          newCoords = feature.geometry.coordinates.map(transformPt);
        } else if (feature.geometry.type === 'MultiLineString' || feature.geometry.type === 'Polygon') {
          newCoords = feature.geometry.coordinates.map((ring: any) => ring.map(transformPt));
        }

        return {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: newCoords
          }
        };
      })
    };
    
    return transformedData;
  };

  const geoPortalWaterwayStyle = (feature: any) => {
    if (feature.geometry?.type?.includes('Polygon')) {
      return { color: '#7dd3fc', weight: 2, fillColor: '#38bdf8', fillOpacity: 0.35 };
    }
    if (feature.geometry?.type?.includes('LineString')) {
      return { color: '#2563eb', weight: 3, opacity: 0.9 };
    }
    return { color: 'blue' }; 
  };

  // NEW: GeoPortal Style specifically for Roads
  const geoPortalRoadStyle = (feature: any) => {
    console.log('Road feature geometry type:', feature.geometry?.type);
    if (feature.geometry?.type?.includes('Polygon')) {
      return { 
        color: '#00ff00', // Bright Neon Green to match GeoPortal style
        weight: 2, 
        fillColor: '#00ff00',
        fillOpacity: 0.3 
      }; 
    }
    if (feature.geometry?.type?.includes('LineString')) {
      return { 
        color: '#00ff00', // Bright Neon Green to match GeoPortal style
        weight: 3, 
        opacity: 0.9 
      }; 
    }
    return { 
      color: '#00ff00', 
      weight: 2,
      opacity: 0.8
    }; 
  };

  const onEachWaterwayFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => {
        const target = e.target;
        target.setStyle({ weight: 5, color: '#f97316', fillOpacity: 0.7 });
        if (target.bringToFront) target.bringToFront(); 
      },
      mouseout: (e: any) => {
        const target = e.target;
        target.setStyle(geoPortalWaterwayStyle(feature));
      }
    });

    // Extract detailed information from feature properties
    const name = feature.properties?.Name || feature.properties?.name || 'Unnamed Waterway';
    const type = feature.properties?.Type || feature.properties?.type || 'Waterway';
    const classification = feature.properties?.Classification || feature.properties?.classification || 'Not specified';
    const area = feature.properties?.Area || feature.properties?.area || 'Unknown';
    const length = feature.properties?.Length || feature.properties?.length || 'Unknown';
    const description = feature.properties?.Description || feature.properties?.description || 'No description available';

    const popupContent = `
      <div class="p-3 min-w-[200px] font-sans bg-white rounded-lg shadow-lg">
        <h4 class="font-black text-lg text-blue-900 border-b-2 border-blue-200 pb-2 mb-3">${name}</h4>
        
        <div class="space-y-2 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-gray-600 font-medium">Type:</span>
            <span class="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold capitalize shadow-sm border border-blue-100">${type}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-gray-600 font-medium">Classification:</span>
            <span class="bg-green-50 text-green-700 px-2 py-1 rounded font-bold capitalize shadow-sm border border-green-100">${classification}</span>
          </div>
          
          ${area !== 'Unknown' ? `
          <div class="flex justify-between items-center">
            <span class="text-gray-600 font-medium">Area:</span>
            <span class="bg-purple-50 text-purple-700 px-2 py-1 rounded font-bold shadow-sm border border-purple-100">${area}</span>
          </div>
          ` : ''}
          
          ${length !== 'Unknown' ? `
          <div class="flex justify-between items-center">
            <span class="text-gray-600 font-medium">Length:</span>
            <span class="bg-orange-50 text-orange-700 px-2 py-1 rounded font-bold shadow-sm border border-orange-100">${length}</span>
          </div>
          ` : ''}
          
          ${description !== 'No description available' ? `
          <div class="mt-3 pt-2 border-t border-gray-200">
            <span class="text-gray-600 font-medium">Description:</span>
            <p class="text-gray-700 mt-1 text-xs leading-relaxed">${description}</p>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    layer.bindPopup(popupContent);
  };

  // NEW: Interaction Logic specifically for Roads
  const onEachRoadFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => {
        const target = e.target;
        // Highlight yellow on hover so it pops against the green map
        target.setStyle({ weight: 5, color: '#eab308', fillOpacity: 0.7 });
        if (target.bringToFront) target.bringToFront(); 
      },
      mouseout: (e: any) => {
        const target = e.target;
        target.setStyle(geoPortalRoadStyle(feature));
      }
    });

    const name = feature.properties?.Name || feature.properties?.name || 'Unnamed Road';
    const type = feature.properties?.Type || feature.properties?.type || 'Road Network';

    const popupContent = `
      <div class="p-2 min-w-[150px] font-sans bg-white rounded-lg shadow-sm">
        <h4 class="font-black text-sm text-gray-900 border-b border-gray-200 pb-2 mb-2">${name}</h4>
        <div class="flex justify-between items-center text-xs">
          <span class="text-gray-500 font-medium">Classification:</span>
          <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded font-bold capitalize shadow-sm border border-gray-200">${type}</span>
        </div>
      </div>
    `;
    layer.bindPopup(popupContent);
  };

  const getFilteredLocations = () => {
    let filtered = [...boundaryLocations];
    if (!layers.evacuationCenter) filtered = filtered.filter(loc => loc.type !== 'evacuation_center' && loc.type !== 'healthcare');
    if (!layers.adminBoundary) filtered = filtered.filter(loc => loc.type !== 'government' && loc.type !== 'barangay');
    if (!layers.roadNetworks) filtered = filtered.filter(loc => loc.category !== 'transportation');
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

        <div className="absolute top-[340px] left-6 z-[1000] bg-white rounded-2xl shadow-lg p-6 w-60 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Color Indicators</h3>
          <div className="space-y-3">
            {indicators.map((ind, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${ind.color} shadow-sm border border-gray-200`} />
                <span className="text-sm font-semibold text-gray-600">{ind.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MapContainer now uses mapKey to prevent container reuse crashes */}
        <MapContainer key={mapKey} center={centerPosition} zoom={13} className="h-full w-full" zoomControl={true}>
          
          {/* TileLayer now uses mapType as key to prevent appendChild crashes when switching styles */}
          <TileLayer 
            key={mapType}
            url={mapType === 'osm' 
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            } 
          />

          {layers.hazardArea && (
            <Circle center={centerPosition} radius={500} pathOptions={{ color: '#ea580c', weight: 3, fillOpacity: 0.15, fillColor: '#ea580c' }} />
          )}

          {layers.adminBoundary && (
            <Rectangle bounds={[ [13.8300, 121.1200], [13.8180, 121.1400] ]} pathOptions={{ color: '#4ade80', weight: 4, fillOpacity: 0, dashArray: '5, 10' }} />
          )}

          {layers.riverBoundary && waterwaysData && (
             <Rectangle 
               bounds={calculateRiverBounds(waterwaysData) || [[13.70, 121.00], [13.90, 121.30]]}
               pathOptions={{ 
                 color: '#87CEEB', 
                 weight: 2, 
                 fillColor: '#87CEEB', 
                 fillOpacity: 0.25,
                 dashArray: '8, 4'
               }}
             />
          )}

          {layers.rivers && waterwaysData && waterwaysData.features && (
             <GeoJSON 
               key={`river-${waterwaysData.features.length}`}
               data={transformCoordinates(waterwaysData)}
               filter={(feature) => {
                 console.log('Feature geometry type:', feature.geometry?.type);
                 return feature.geometry?.type?.includes('Polygon');
               }}
               style={geoPortalWaterwayStyle}
               onEachFeature={onEachWaterwayFeature}
             />
          )}

          {/* NEW: DYNAMIC ROAD NETWORKS */}
          {layers.roadNetworks && roadsData && roadsData.features && (
             <GeoJSON 
               key={`roads-${roadsData.features.length}`}
               data={transformRoadCoordinates(roadsData)}
               style={geoPortalRoadStyle}
               onEachFeature={onEachRoadFeature}
             />
          )}

          {layers.evacuationCenter && customIcon && (
            <>
              {getFilteredLocations().filter(loc => loc.type === 'evacuation_center' || loc.type === 'healthcare').map((location: any) => (
                <Marker key={location.id} position={[location.latitude, location.longitude]} icon={customIcon}>
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-bold text-sm">{location.name}</h4>
                      <p className="text-xs text-gray-600">{location.address}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>
      </div>

      <div className="w-full lg:w-[400px] flex flex-col gap-4">
        {sidebarCategories.map((cat: any, i: number) => (
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
