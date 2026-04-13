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
const GeoJSON = dynamic(() => import('react-leaflet').then((mod) => mod.GeoJSON), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

interface Project {
  id: number | string;
  title: string;
  lgu: string;
  category: string;
  latitude?: number;
  longitude?: number;
  coordinates?: [[number, number], [number, number]]; // [southwest, northeast] bounds
  address?: string;
  location?: string;
  area?: string;
}

interface MapPopupProps {
  project: Project;
  onClose: () => void;
}

const MapPopup = ({ project, onClose }: MapPopupProps) => {
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('satellite');
  const [customIcon, setCustomIcon] = useState<any>(null);
  const [projectIcon, setProjectIcon] = useState<any>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(true);
  const [layers, setLayers] = useState({
    adminBoundary: false,
    evacuationCenter: false,
    hazardArea: false,
    roadNetworks: false,
    rivers: false,
  });
  const [boundaryLocations, setBoundaryLocations] = useState<any[]>([]);
  const [waterwaysData, setWaterwaysData] = useState<any>(null);
  const [roadsData, setRoadsData] = useState<any>(null);
  const [boundariesData, setBoundariesData] = useState<any>(null);
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);

  // Load Leaflet icon and geographic data
  useEffect(() => {
    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;
      
      // Evacuation center icon (orange)
      const evacuationIcon = L.divIcon({
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
      setCustomIcon(evacuationIcon);

      // Project location icon (red/purple)
      const projectLocationIcon = L.divIcon({
        className: 'project-pin',
        html: `
          <div style="position: relative; display: flex; justify-content: center; align-items: center; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));">
            <img src="/icons/marker-icon.png" width="35" height="48" style="display: block;" />
          </div>`,
        iconSize: [35, 48],
        iconAnchor: [17.5, 48]
      });
      setProjectIcon(projectLocationIcon);
      console.log('Project icon created successfully');

      // Fetch geographic data from database with fallback to local files
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
        console.log('Waterways data loaded:', geoData?.features?.length || 0, 'features');

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
        console.log('Roads data loaded:', rData?.features?.length || 0, 'features');

        // Fetch Admin Boundaries
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
        console.log('Boundaries data loaded:', bData?.features?.length || 0, 'features');

      } catch (error) {
        console.error('Error loading geographic data:', error);
      } finally {
        setLoading(false);
        setMapLoading(false);
      }
    };

    initLeaflet();
  }, []);

  // Cleanup map container when component unmounts
  useEffect(() => {
    return () => {
      // Clear any lingering map instances
      const mapContainers = document.querySelectorAll('.leaflet-container');
      mapContainers.forEach(container => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });
    };
  }, []);

  const centerPosition: [number, number] = project.latitude && project.longitude 
    ? [project.latitude, project.longitude] 
    : [13.8242, 121.1311];

  const getProjectLocationAddress = () => {
    // Priority: address > location > coordinates > area
    if (project.address) return project.address;
    if (project.location) return project.location;
    if (project.area) return project.area;
    if (project.latitude && project.longitude) {
      return `${project.latitude.toFixed(4)}, ${project.longitude.toFixed(4)}`;
    }
    return 'Location not specified';
  };

  const createProjectAreaBoundary = (): [[number, number], [number, number]] | null => {
    if (project.latitude && project.longitude) {
      // Create a 200-meter boundary around the project point
      const lat = project.latitude;
      const lng = project.longitude;
      const delta = 0.001; // Approximately 100 meters
      
      return [
        [lat - delta, lng - delta], // Southwest corner
        [lat + delta, lng + delta]  // Northeast corner
      ];
    }
    return null;
  };

  const getFilteredLocations = () => {
    return boundaryLocations.filter((location: any) => 
      location.latitude && location.longitude && 
      !isNaN(location.latitude) && !isNaN(location.longitude) &&
      location.latitude >= 13 && location.latitude <= 14 &&
      location.longitude >= 121 && location.longitude <= 122
    );
  };

  const transformCoordinates = (geoData: any) => {
    try {
      if (!geoData || !geoData.features || !Array.isArray(geoData.features)) {
        console.warn('Invalid geoData structure:', geoData);
        return null;
      }
      
      const transformedData = {
        type: "FeatureCollection" as const,
        features: geoData.features.filter((feature: any) => {
          if (!feature || !feature.geometry || !feature.geometry.coordinates) {
            console.warn('Skipping invalid feature:', feature);
            return false;
          }
          return true;
        }).map((feature: any) => {
          const transformPt = (coord: any) => {
            if (!Array.isArray(coord) || coord.length < 2) {
              console.warn('Invalid coordinate:', coord);
              return coord;
            }
            const x = coord[0], y = coord[1];
            if (x < 180 && x > -180) return [x, y];
            return [(x - 500000) / 100000 + 121.0, (y - 1520000) / 100000 + 13.8];
          };

          let newCoords = feature.geometry.coordinates;
          try {
            if (feature.geometry.type === 'Polygon') {
              newCoords = feature.geometry.coordinates.map((ring: any) => ring.map(transformPt));
            } else if (feature.geometry.type === 'MultiPolygon') {
              newCoords = feature.geometry.coordinates.map((polygon: any) => polygon.map((ring: any) => ring.map(transformPt)));
            } else if (feature.geometry.type === 'LineString') {
              newCoords = feature.geometry.coordinates.map(transformPt);
            } else if (feature.geometry.type === 'MultiLineString') {
              newCoords = feature.geometry.coordinates.map((ring: any) => ring.map(transformPt));
            }
            return { ...feature, geometry: { ...feature.geometry, coordinates: newCoords } };
          } catch (error) {
            console.error('Error transforming feature:', error, feature);
            return feature; // Return original feature if transformation fails
          }
        })
      };
      
      console.log('Transformed coordinates for', transformedData.features.length, 'features out of', geoData.features.length);
      return transformedData;
    } catch (error) {
      console.error('Error in transformCoordinates:', error);
      return null;
    }
  };

  const transformRoadCoordinates = (geoData: any) => {
    try {
      if (!geoData || !geoData.features || !Array.isArray(geoData.features)) {
        console.warn('Invalid road geoData structure:', geoData);
        return null;
      }
      
      const transformedData = {
        type: "FeatureCollection" as const,
        features: geoData.features.filter((feature: any) => {
          if (!feature || !feature.geometry || !feature.geometry.coordinates) {
            console.warn('Skipping invalid road feature:', feature);
            return false;
          }
          return true;
        }).map((feature: any) => {
          const transformPt = (coord: any) => {
            if (!Array.isArray(coord) || coord.length < 2) {
              console.warn('Invalid road coordinate:', coord);
              return coord;
            }
            const x = coord[0], y = coord[1];
            if (x < 180 && x > -180) return [x, y];
            return [(x - 500000) / 100000 + 121.0, (y - 1520000) / 100000 + 13.8];
          };

          try {
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
          } catch (error) {
            console.error('Error transforming road feature:', error, feature);
            return feature; // Return original feature if transformation fails
          }
        })
      };
      
      console.log('Transformed road coordinates for', transformedData.features.length, 'features out of', geoData.features.length);
      return transformedData;
    } catch (error) { 
      console.error('Error in transformRoadCoordinates:', error);
      return null; 
    }
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
    const hasCompleteData = feature.properties && feature.properties.brgy;

    return {
      color: isSelected ? '#3b82f6' : 'rgb(24, 49, 88)',
      weight: isSelected ? 4 : 2,
      fillColor: '#5432ff99',
      fillOpacity: hasCompleteData ? (isSelected ? 0.2 : 0.15) : 0,
      dashArray: isSelected ? '' : '5, 10',
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
        
        const props = feature.properties || {};
        const content = `<div class="p-3 min-w-[250px] text-xs">
          <h4 class="font-bold text-blue-700 mb-2">Administrative Boundary Details</h4>
          
          ${props.brgy ? `<div class="mb-2"><span class="font-semibold">Barangay:</span> ${props.brgy}</div>` : ''}
          ${props.lotno ? `<div><span class="font-semibold">Lot Number:</span> ${props.lotno}</div>` : ''}
          <div><b>Boundary ID:</b> ${feature.id}</div>
          <div><b>Geometry Type:</b> ${feature.geometry.type}</div>
        </div>`;
        layer.bindPopup(content).openPopup();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header Section */}
        <div className="px-8 py-4 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-tight">{project.title}</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
              {project.lgu} · {project.category}
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
                {Object.entries(layers).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-[13px] font-semibold text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <input 
                      type="checkbox" 
                      checked={value} 
                      onChange={() => setLayers(prev => ({ ...prev, [key]: !value }))} 
                      className="w-4 h-4 rounded accent-orange-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Map Loading State */}
            {mapLoading ? (
              <div className="h-full w-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            ) : (
            <MapContainer 
              key={`map-${project.id || 'default'}-${Date.now()}`}
              center={centerPosition} 
              zoom={15} 
              className="h-full w-full" 
              zoomControl={false}
            >
              <TileLayer 
                url={mapType === 'osm' 
                  ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                  : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                } 
              />
              
              {layers.hazardArea && (
                <Circle center={centerPosition} radius={500} pathOptions={{ color: '#ea580c', weight: 3, fillOpacity: 0.15, fillColor: '#ea580c' }} />
              )}
              
              {/* ADMIN BOUNDARY LAYER */}
              {layers.adminBoundary && boundariesData && (
                (() => {
                  console.log('Rendering Admin Boundary layer with', boundariesData.features?.length || 0, 'features');
                  const transformedData = transformCoordinates(boundariesData);
                  if (!transformedData) {
                    console.error('Failed to transform admin boundary data');
                    return null;
                  }
                  return (
                    <GeoJSON 
                      key={`admin-layer-${selectedBoundaryId}-${boundariesData.features.length}`}
                      data={transformedData}
                      style={adminBoundaryStyle}
                      onEachFeature={onEachBoundaryFeature}
                    />
                  );
                })()
              )}

              {layers.rivers && waterwaysData && waterwaysData.features && (
                (() => {
                  console.log('Rendering Waterways layer with', waterwaysData.features.length, 'features');
                  const transformedData = transformCoordinates(waterwaysData);
                  if (!transformedData) {
                    console.error('Failed to transform waterways data');
                    return null;
                  }
                  return (
                    <GeoJSON 
                      key={`river-${waterwaysData.features.length}`}
                      data={transformedData}
                      style={geoPortalWaterwayStyle}
                      onEachFeature={onEachWaterwayFeature}
                    />
                  );
                })()
              )}

              {layers.roadNetworks && roadsData && roadsData.features && (
                (() => {
                  console.log('Rendering Road Networks layer with', roadsData.features.length, 'features');
                  const transformedData = transformRoadCoordinates(roadsData);
                  if (!transformedData) {
                    console.error('Failed to transform road networks data');
                    return null;
                  }
                  return (
                    <GeoJSON 
                      key={`roads-${roadsData.features.length}`}
                      data={transformedData}
                      style={geoPortalRoadStyle}
                      onEachFeature={onEachRoadFeature}
                    />
                  );
                })()
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

              {/* PROJECT AREA HIGHLIGHT - Always show when lat/lng available */}
              {(() => {
                // Use existing coordinates if available, otherwise create from lat/lng
                const projectBoundary = project.coordinates || createProjectAreaBoundary();
                
                if (projectBoundary) {
                  return (
                    <Rectangle 
                      bounds={projectBoundary}
                      pathOptions={{ 
                        color: '#000000',       // Black border
                        weight: 3,               // Medium thickness
                        fillOpacity: 0.25,      // More transparent background
                        fillColor: '#000000',   // Black fill
                        dashArray: ''           // Solid line (no dash)
                      }}
                    />
                  );
                }
                return null;
              })()}
              <ZoomControl position="bottomleft" />
            </MapContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPopup;