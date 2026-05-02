"use client";

import { useEffect, useRef, useState } from 'react';
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

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.2/dist/images/marker-icon.png',
  iconAnchor: [12, 41]
});

// Demographic data interface matching the data table
interface DemographicData {
  location: string;
  area: string;
  population: number;
  households: number;
  povertyRate: string;
  employmentRate: string;
  status: string;
  agency: string;
  category: string;
  layerType: string;
}

// Helper function to calculate area in Sq Km
const calculateArea = (latlngs: number[][]) => {
  const closedCoords = [...latlngs];
  if (closedCoords.length > 0 && 
      (closedCoords[0][0] !== closedCoords[closedCoords.length - 1][0] || 
       closedCoords[0][1] !== closedCoords[closedCoords.length - 1][1])) {
    closedCoords.push(closedCoords[0]);
  }
  const poly = polygon([closedCoords]);
  const calculatedArea = area(poly);
  return (calculatedArea / 1000000).toFixed(2);
};

/**
 * Handles map instance events and programmatic movement
 */
const MapEvents = ({ mapView, onMapClick, isMeasuring, fitToBounds }: any) => {
  const map = useMap();

  // Fly to specific coordinates (Goto XY tool)
  useEffect(() => {
    if (mapView) {
      map.flyTo([mapView.lat, mapView.lng], mapView.zoom, { animate: true, duration: 1.5 });
    }
  }, [mapView, map]);

  // Auto-zoom to dynamic layer boundaries
  useEffect(() => {
    if (fitToBounds && map) {
      /**
       * PADDING ADJUSTMENT:
       * Setting a higher top padding (e.g., 100) helps center the area 
       * vertically if it's currently appearing too high.
       */
      map.fitBounds(fitToBounds, { 
        padding: [100, 50], 
        animate: true, 
        duration: 1.5 
      });
    }
  }, [fitToBounds, map]);

  useEffect(() => {
    if (!map || !onMapClick || !isMeasuring) return;
    const handleClick = (e: any) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    };
    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
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
  waterwaysLayerHighlighted,
  onBoundaryBoundsReady,
  onRoadBoundsReady,
  onWaterwayBoundsReady,
  fitToBounds,
  initialZoom = 18
}: any) => {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Set zoom controls at bottom-right
  useEffect(() => {
    const repositionZoomControl = () => {
      const zoomControl = document.querySelector('.leaflet-control-zoom');
      if (zoomControl) {
        (zoomControl as HTMLElement).style.position = 'absolute';
        (zoomControl as HTMLElement).style.bottom = '80px';
        (zoomControl as HTMLElement).style.right = '20px';
        (zoomControl as HTMLElement).style.top = 'auto';
        (zoomControl as HTMLElement).style.left = 'auto';
      }
    };
    setTimeout(repositionZoomControl, 500);
  }, []);

  const getBasemapUrl = (basemapName: string) => {
    switch (basemapName) {
      case 'Google Map': return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      case 'Satellite Map':
      case 'satellite': return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'Open Street Map':
      case 'osm': return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      default: return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  return (
    <div className="h-full w-full">
      {typeof window !== 'undefined' && (
        <MapContainer 
          center={[13.86, 121.15]} 
          zoom={initialZoom} 
          className="h-full w-full z-0"
          zoomControl={true}
          ref={mapRef}
        >
          <TileLayer 
            key={basemap}
            url={getBasemapUrl(basemap)} 
          />

          {/* Dynamic Layer Rendering */}
          {layers?.filter((l: any) => l.visible).map((layer: any) => {
            const style = layer.style_config ? {
              color: layer.style_config.color || '#0ea5e9',
              fillColor: layer.style_config.fillColor || '#dbeafe',
              fillOpacity: layer.style_config.fillOpacity || 0.15,
              weight: layer.style_config.weight || 3,
              opacity: layer.style_config.opacity || 1,
            } : {
              color: layer.layer_type === 'boundary' ? '#3b82f6' : 
                     layer.layer_type === 'road' ? '#16a34a' : '#0ea5e9',
              fillColor: layer.layer_type === 'road' ? 'transparent' : '#dbeafe',
              fillOpacity: 0.15,
              weight: 3,
            };

            return layer.geometry?.type === 'FeatureCollection' ? (
              <GeoJSON key={layer.id} data={layer.geometry} style={style} />
            ) : (
              <Polygon key={layer.id} positions={layer.geometry} pathOptions={style}>
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold">{layer.title}</h3>
                    {layer.geometry && !layer.layer_type && (
                       <p className="text-xs mt-1 text-blue-600">Area: {calculateArea(layer.geometry)} sq. km</p>
                    )}
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          <BoundaryLayer 
            isVisible={boundaryLayerVisible} 
            isHighlighted={boundaryLayerHighlighted} 
            onBoundsReady={onBoundaryBoundsReady}
          />
          <RoadNetworksLayer 
            isVisible={roadNetworkLayerVisible} 
            isHighlighted={roadNetworkLayerHighlighted} 
            onBoundsReady={onRoadBoundsReady}
          />
          <WaterwaysLayer 
            isVisible={waterwaysLayerVisible} 
            isHighlighted={waterwaysLayerHighlighted} 
            onBoundsReady={onWaterwayBoundsReady}
          />

          <MapEvents 
            mapView={mapView} 
            onMapClick={onMapClick} 
            isMeasuring={isMeasuring} 
            fitToBounds={fitToBounds} 
          />

          {mapView && <Marker position={[mapView.lat, mapView.lng]} icon={defaultIcon} />}

          {bufferData && mapView && (
            <Circle 
              center={[mapView.lat, mapView.lng]}
              radius={parseFloat(bufferData.distance) * 1000} 
              pathOptions={{ color: '#facc15', fillColor: '#facc15', fillOpacity: 0.3, weight: 2 }}
            />
          )}
        </MapContainer>
      )}
    </div>
  );
};

export default MapRenderer;