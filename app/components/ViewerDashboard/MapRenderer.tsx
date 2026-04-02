"use client";

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { area, polygon } from '@turf/turf';
import 'leaflet/dist/leaflet.css';

// Create a default icon for markers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.2/dist/images/marker-icon.png',
  iconAnchor: [12, 41]
});

// Helper function to calculate area in Sq Km using Turf.js
const calculateArea = (latlngs: number[][]) => {
  // Ensure polygon is closed by adding first point to end if needed
  const closedCoords = [...latlngs];
  if (closedCoords.length > 0 && 
      (closedCoords[0][0] !== closedCoords[closedCoords.length - 1][0] || 
       closedCoords[0][1] !== closedCoords[closedCoords.length - 1][1])) {
    closedCoords.push(closedCoords[0]);
  }
  
  // Create polygon using Turf.js polygon helper and calculate area
  const poly = polygon([closedCoords]);
  const calculatedArea = area(poly);
  return (calculatedArea / 1000000).toFixed(2); // Convert sq meters to sq km
};

function MapController({ mapView }: any) {
  const map = useMap();
  useEffect(() => {
    if (mapView) {
      map.flyTo([mapView.lat, mapView.lng], mapView.zoom, { animate: true, duration: 1.5 });
    }
  }, [mapView, map]);
  return null;
}

const MapRenderer = ({ layers, mapView, bufferData, basemap, onMapClick, isMeasuring }: any) => {
  const mapRef = useRef<any>(null);

  const getWMSUrl = (basemapName: string) => {
    if (!process.env.NEXT_PUBLIC_GEONODE_URL) return null;
    const baseUrl = `${process.env.NEXT_PUBLIC_GEONODE_URL}/geoserver/wms`;
    
    // Different layer configurations for different basemap types
    let layers = '';
    let format = 'image/png';
    
    if (basemapName.includes('Streets')) {
      layers = 'geonode:osm_streets'; // Street layer
      format = 'image/png';
    } else if (basemapName.includes('Satellite')) {
      layers = 'geonode:satellite_imagery'; // Satellite layer
      format = 'image/jpeg';
    }
    
    // WMS URL template with bbox parameter for Leaflet
    return `${baseUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=${layers}&FORMAT=${format}&TRANSPARENT=false&SRS=EPSG:4326&WIDTH=256&HEIGHT=256&BBOX={bbox}`;
  };

  const getBasemapUrl = (basemapName: string) => {
    switch (basemapName) {
      case 'Google Map':
        return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      case 'Satellite Map':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'Open Street Map':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'Terrain Map':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'GeoNode Streets':
        // Use a real street map service as fallback if GeoNode not configured
        return process.env.NEXT_PUBLIC_GEONODE_URL ? 
          getWMSUrl(basemapName)! : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'GeoNode Satellite':
        // Use a real satellite service as fallback if GeoNode not configured
        return process.env.NEXT_PUBLIC_GEONODE_URL ? 
          getWMSUrl(basemapName)! : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'NAMRIA Basemaps':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const isWMSLayer = (basemapName: string) => {
    return basemapName.includes('GeoNode') && process.env.NEXT_PUBLIC_GEONODE_URL;
  };

  return (
    <div className="h-full w-full">
      <MapContainer 
        key={`map-container-${Date.now()}`}
        center={[13.4124, 122.5619]} 
        zoom={6} 
        className="h-full w-full z-0"
        zoomControl={false}
        ref={mapRef}
      >
        {/* Basemap Logic - Updates immediately when prop changes */}
        {isWMSLayer(basemap) && process.env.NEXT_PUBLIC_GEONODE_URL ? (
          <TileLayer
            key={basemap}
            url={getWMSUrl(basemap)!}
            attribution="GeoNode"
          />
        ) : (
          <TileLayer 
            key={basemap} 
            url={getBasemapUrl(basemap || 'Open Street Map')!} 
          />
        )}

        {/* Dynamic Layer Rendering with appropriate styles for different layer types */}
        {layers?.filter((layer: any) => layer.visible).map((layer: any) => {
          // Determine layer styling based on layer type
          const getLayerStyle = (title: string) => {
            if (title.includes('Administrative')) {
              return {
                color: '#3b82f6',           // Light blue border
                fillColor: '#dbeafe',         // Very light blue fill
                fillOpacity: 0.1,             // Very transparent
                weight: 0.5,                   // Very thin border
                opacity: 0.3                   // Border barely visible
              };
            } else if (title.includes('Land Use')) {
              return {
                color: '#86efac',           // Light green border
                fillColor: '#dcfce7',         // Very light green fill
                fillOpacity: 0.15,
                weight: 0.5,
                opacity: 0.3
              };
            } else if (title.includes('Population')) {
              return {
                color: '#fca5a5',           // Light red border
                fillColor: '#fee2e2',         // Very light red fill
                fillOpacity: 0.1,
                weight: 0.5,
                opacity: 0.3
              };
            } else if (title.includes('Infrastructure')) {
              return {
                color: '#c084fc',           // Light purple border
                fillColor: '#ede9fe',         // Very light purple fill
                fillOpacity: 0.1,
                weight: 0.5,
                opacity: 0.3
              };
            } else {
              // Default styling - very subtle
              return {
                color: '#d1d5db',           // Light gray border
                fillColor: '#f3f4f6',         // Very light gray fill
                fillOpacity: layer.opacity ? layer.opacity * 0.1 : 0.1,
                weight: 0.5,
                opacity: 0.3
              };
            }
          };

          const layerStyle = getLayerStyle(layer.title);

          return (
            <Polygon
              key={layer.id}
              positions={layer.geometry}
              pathOptions={layerStyle}
            >
              <Popup>
                <div className="bg-gray-900 text-white p-2 rounded text-xs min-w-[160px]">
                  <h3 className="font-bold border-b border-gray-600 pb-1 mb-2">{layer.title}</h3>
                  <p className="mb-1"><span className="text-gray-400">Agency:</span> {layer.agency}</p>
                  <p className="font-bold text-[#facc15]">
                    Calculated Area: {calculateArea(layer.geometry)} sq. km
                  </p>
                  <div 
                    className="mt-2 h-1.5 w-full rounded" 
                    style={{ backgroundColor: layerStyle.color }}
                  ></div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        <MapController mapView={mapView} />

        {/* Target Marker for XY */}
        {mapView && <Marker position={[mapView.lat, mapView.lng]} icon={defaultIcon} />}

        {/* Buffer Visualization */}
        {bufferData && mapView && (
          <Circle 
            center={[mapView.lat, mapView.lng]}
            radius={bufferData.distance * 1000} 
            pathOptions={{ 
              color: '#facc15', 
              fillColor: '#facc15', 
              fillOpacity: 0.3,
              weight: 2
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapRenderer;