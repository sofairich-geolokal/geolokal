"use client";

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.2/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.2/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.2/dist/images/marker-shadow.png',
});

interface ShapefileMapProps {
  layers: any[];
  basemap: string;
}

// Component to handle auto-zooming to layer bounds
function ZoomToLayer({ layers }: { layers: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (layers.length > 0) {
      const lastLayer = layers[layers.length - 1];
      const geoJsonLayer = L.geoJSON(lastLayer.geometry);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [layers, map]);
  return null;
}

export default function ShapefileMap({ layers, basemap }: ShapefileMapProps) {
  const getBasemapUrl = (basemapName: string) => {
    switch (basemapName) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'none': // For the pure Mapshaper "white background" look
        return '';
      case 'osm':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getLayerStyle = (layer: any) => {
    return {
      color: layer.color || '#333333', // Dark strokes like Mapshaper
      fillColor: layer.color || '#333333',
      fillOpacity: 0, // No fill by default for "structure" view
      weight: 1.5,    // Thinner, technical lines
      opacity: 1
    };
  };

  return (
    <div className="h-full w-full bg-white">
      {typeof window !== 'undefined' ? (
        <MapContainer 
          center={[13.4124, 122.5619]} 
          zoom={6} 
          className="h-full w-full z-0"
          zoomControl={true}
        >
          {basemap !== 'none' && <TileLayer url={getBasemapUrl(basemap)} />}
          
          <ZoomToLayer layers={layers} />

          {layers.filter(l => l.visible).map((layer) => (
            <GeoJSON
              key={layer.id}
              data={layer.geometry}
              style={() => getLayerStyle(layer)}
            />
          ))}
        </MapContainer>
      ) : (
        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
          Initializing map...
        </div>
      )}
    </div>
  );
}