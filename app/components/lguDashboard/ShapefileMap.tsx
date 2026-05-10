"use client";

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ShapefileMap.css';

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

// Function to get consistent layer colors based on layer type/title
const getLayerColor = (layerTitle: string) => {
  if (layerTitle.includes('Administrative') || layerTitle.includes('Boundary')) {
    return '#3b82f6'; // Blue for boundaries
  } else if (layerTitle.includes('Road') || layerTitle.includes('Network')) {
    return '#16a34a'; // Green for roads
  } else if (layerTitle.includes('Water') || layerTitle.includes('River') || layerTitle.includes('Waterway')) {
    return '#0ea5e9'; // Sky blue for water
  } else if (layerTitle.includes('Hazard') || layerTitle.includes('Risk')) {
    return '#dc2626'; // Red for hazards
  } else if (layerTitle.includes('Land Use')) {
    return '#86efac'; // Light green for land use
  } else if (layerTitle.includes('Population')) {
    return '#fca5a5'; // Light red for population
  } else if (layerTitle.includes('Infrastructure')) {
    return '#c084fc'; // Purple for infrastructure
  } else {
    return '#6b7280'; // Gray for other layers
  }
};

export default function ShapefileMap({ layers, basemap }: ShapefileMapProps) {
  const [loadedLayers, setLoadedLayers] = useState<any[]>([]);
  const [layerOpacity, setLayerOpacity] = useState<{ [key: string]: number }>({});

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    setLoadedLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );
  };

  // Update layer opacity
  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayerOpacity(prev => ({ ...prev, [layerId]: opacity }));
    setLoadedLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, opacity }
          : layer
      )
    );
  };

  // Check if layer is loaded
  const isLayerLoaded = (layerId: string) => {
    return loadedLayers.some(l => l.id === layerId && l.visible);
  };

  // Initialize layers when component mounts or layers prop changes
  useEffect(() => {
    const initializedLayers = layers.map(layer => ({
      ...layer,
      visible: true,
      opacity: layerOpacity[layer.id] || 0.7
    }));
    setLoadedLayers(initializedLayers);
  }, [layers]);

  const getBasemapUrl = (basemapName: string) => {
    switch (basemapName) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'none': // For pure Mapshaper "white background" look
        return '';
      case 'osm':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getLayerStyle = (layer: any) => {
    return {
      color: layer.color || getLayerColor(layer.title),
      fillColor: layer.color || getLayerColor(layer.title),
      fillOpacity: layer.opacity || 0.7,
      weight: 1.5,
      opacity: layer.opacity || 0.7
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
          
          <ZoomToLayer layers={loadedLayers.filter(l => l.visible)} />
          
          {/* Custom Layer Controls */}
          <div className="leaflet-control-layers leaflet-top-right">
            {loadedLayers.map((layer) => (
              <div key={layer.id} className="layer-control-item">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={layer.visible} 
                    onChange={() => toggleLayerVisibility(layer.id)}
                    className="mr-2"
                  />
                  <span className="text-sm">{layer.title}</span>
                </label>
              </div>
            ))}
          </div>
        </MapContainer>
      ) : (
        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
          Initializing map...
        </div>
      )}
    </div>
  );
}