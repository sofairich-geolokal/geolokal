"use client";

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, Polygon, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { area, polygon } from '@turf/turf';
import 'leaflet/dist/leaflet.css';

// Import layer components
import BoundaryLayer from './BoundaryLayer';
import RoadNetworksLayer from './RoadNetworksLayer';
import WaterwaysLayer from './WaterwaysLayer';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.2/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.2/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.2/dist/images/marker-shadow.png',
});

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

const MapEvents = ({ mapView, onMapClick, isMeasuring }: { mapView: any, onMapClick?: (lat: number, lng: number) => void, isMeasuring?: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (mapView) {
      map.flyTo([mapView.lat, mapView.lng], mapView.zoom, { animate: true, duration: 1.5 });
    }
  }, [mapView, map]);

  useEffect(() => {
    if (!map || !onMapClick || !isMeasuring) return;

    const handleClick = (e: any) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick, isMeasuring]);

  return null;
};

const MapRenderer = ({ 
  layers, 
  mapView, 
  bufferData, 
  basemap, 
  onMapClick, 
  isMeasuring,
  measureVisualElements,
  boundaryLayerVisible,
  boundaryLayerHighlighted,
  roadNetworkLayerVisible,
  roadNetworkLayerHighlighted,
  waterwaysLayerVisible,
  waterwaysLayerHighlighted
}: any) => {
  const mapRef = useRef<any>(null);

  // Cleanup map instance on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Reposition default zoom control to bottom right
  useEffect(() => {
    const repositionZoomControl = () => {
      const zoomControl = document.querySelector('.leaflet-control-zoom');
      if (zoomControl) {
        (zoomControl as HTMLElement).style.position = 'absolute';
        (zoomControl as HTMLElement).style.bottom = '80px';
        (zoomControl as HTMLElement).style.right = '20px';
        (zoomControl as HTMLElement).style.top = 'auto';
        (zoomControl as HTMLElement).style.left = 'auto';
        (zoomControl as HTMLElement).style.zIndex = '1000';
        (zoomControl as HTMLElement).style.display = 'block';
        (zoomControl as HTMLElement).style.visibility = 'visible';
      }
    };
    
    // Try after a delay to ensure map is ready
    setTimeout(repositionZoomControl, 100);
    setTimeout(repositionZoomControl, 500);
    setTimeout(repositionZoomControl, 1000);
  }, []);

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
      case 'NAMRIA Basemaps':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const isWMSLayer = (basemapName: string) => {
    // No longer using GeoNode WMS layers
    return false;
  };

  return (
    <div className="h-full w-full">
      {typeof window !== 'undefined' && typeof document !== 'undefined' ? (
        <MapContainer 
          center={[13.4124, 122.5619]} 
          zoom={6} 
          className="h-full w-full z-0"
          zoomControl={true}
          ref={mapRef}
        >
        
        <TileLayer 
          key={basemap || 'Open Street Map'}
          url={getBasemapUrl(basemap || 'Open Street Map')} 
        />

        {layers?.filter((layer: any) => layer.visible).map((layer: any) => {
          const getLayerStyle = (layer: any) => {
            if (layer.layer_type === 'boundary' || layer.title.includes('Administrative') || layer.title.includes('Boundary')) {
              return {
                color: '#3b82f6',
                fillColor: '#dbeafe',
                fillOpacity: 0.1,
                weight: 2,
                opacity: 0.8
              };
            } else if (layer.layer_type === 'road' || layer.title.includes('Road') || layer.title.includes('Network')) {
              return {
                color: '#16a34a',
                fillColor: 'transparent',
                fillOpacity: 0,
                weight: 3,
                opacity: 0.9
              };
            } else if (layer.layer_type === 'waterway' || layer.title.includes('River') || layer.title.includes('Water')) {
              return {
                color: '#0ea5e9',
                fillColor: '#dbeafe',
                fillOpacity: 0.2,
                weight: 2,
                opacity: 0.7
              };
            } else {
              return {
                color: '#d1d5db',
                fillColor: '#f3f4f6',
                fillOpacity: layer.opacity ? layer.opacity * 0.1 : 0.1,
                weight: 0.5,
                opacity: 0.3
              };
            }
          };

          const layerStyle = getLayerStyle(layer);

          if (layer.geometry && layer.geometry.type === 'FeatureCollection') {
            return (
              <GeoJSON
                key={layer.id}
                data={layer.geometry}
                style={layerStyle}
              >
                  <Popup>
                    <div className="bg-gray-900 text-white p-2 rounded text-xs min-w-[160px]">
                      <h3 className="font-bold border-b border-gray-600 pb-1 mb-2">{layer.title}</h3>
                      <p className="mb-1"><span className="text-gray-400">Agency:</span> {layer.agency}</p>
                      {layer.category && <p className="mb-1"><span className="text-gray-400">Category:</span> {layer.category}</p>}
                      {layer.layer_type && <p className="mb-1"><span className="text-gray-400">Type:</span> {layer.layer_type}</p>}
                      {layer.is_downloadable && <p className="mb-1 text-green-400">✓ Available for download</p>}
                      <div 
                        className="mt-2 h-1.5 w-full rounded" 
                        style={{ backgroundColor: layerStyle.color }}
                      ></div>
                    </div>
                  </Popup>
                </GeoJSON>
              );
            } else {
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
                      {layer.category && <p className="mb-1"><span className="text-gray-400">Category:</span> {layer.category}</p>}
                      {layer.layer_type && <p className="mb-1"><span className="text-gray-400">Type:</span> {layer.layer_type}</p>}
                      {layer.is_downloadable && <p className="mb-1 text-green-400">✓ Available for download</p>}
                      {layer.geometry && !layer.layer_type && (
                        <p className="font-bold text-[#facc15]">
                          Calculated Area: {calculateArea(layer.geometry)} sq. km
                        </p>
                      )}
                      <div 
                        className="mt-2 h-1.5 w-full rounded" 
                        style={{ backgroundColor: layerStyle.color }}
                      ></div>
                    </div>
                  </Popup>
                </Polygon>
              );
            }
        })}

        <BoundaryLayer 
          isVisible={boundaryLayerVisible} 
          isHighlighted={boundaryLayerHighlighted} 
        />
        <RoadNetworksLayer 
          isVisible={roadNetworkLayerVisible} 
          isHighlighted={roadNetworkLayerHighlighted} 
        />
        <WaterwaysLayer 
          isVisible={waterwaysLayerVisible} 
          isHighlighted={waterwaysLayerHighlighted} 
        />

        <MapEvents mapView={mapView} onMapClick={onMapClick} isMeasuring={isMeasuring} />

        {measureVisualElements && (
          <>
            {measureVisualElements.lines?.map((line: [number, number][], index: number) => (
              <Polygon
                key={`measure-line-${index}`}
                positions={line}
                pathOptions={{
                  color: '#000080',
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0,
                  dashArray: '5, 5'
                }}
              />
            ))}
            
            {measureVisualElements.markers?.map((marker: [number, number], index: number) => (
              <Circle
                key={`measure-marker-${index}`}
                center={marker}
                radius={5}
                pathOptions={{
                  color: '#000080',
                  fillColor: '#000080',
                  fillOpacity: 0.8,
                  weight: 2
                }}
              />
            ))}
          </>
        )}

        {mapView && <Marker position={[mapView.lat, mapView.lng]} icon={defaultIcon} />}

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
    ) : (
      <div className="h-full w-full bg-gray-800 flex items-center justify-center text-white">
        Initializing map...
      </div>
    )}
  </div>
  );
};
export default MapRenderer;