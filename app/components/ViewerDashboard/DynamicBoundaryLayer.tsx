"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { loadBoundaryData, BoundaryData, BoundaryLocation } from '../../utils/boundaryDataReader';

// Dynamic imports for Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then((mod) => mod.Circle), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then((mod) => mod.Polygon), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const ZoomControl = dynamic(() => import('react-leaflet').then((mod) => mod.ZoomControl), { ssr: false });

// Type definitions
type LatLngTuple = [number, number];

interface DynamicBoundaryLayerProps {
  isVisible: boolean;
  isHighlighted?: boolean;
  areaType?: string;
  onBoundarySelect?: (boundary: any) => void;
}

const DynamicBoundaryLayer: React.FC<DynamicBoundaryLayerProps> = ({ 
  isVisible, 
  isHighlighted = false,
  areaType = 'municipal',
  onBoundarySelect
}) => {
  const [boundaryData, setBoundaryData] = useState<BoundaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customIcon, setCustomIcon] = useState<any>(null);

  // Load boundary data
  useEffect(() => {
    if (isVisible) {
      loadBoundaryDataLocal();
    }
  }, [isVisible, areaType]);

  const loadBoundaryDataLocal = async () => {
    try {
      setLoading(true);
      const data = await loadBoundaryData(areaType);
      setBoundaryData(data);
    } catch (error) {
      console.error('Error loading boundary data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load custom icon
  useEffect(() => {
    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;
      
      const icon = L.divIcon({
        className: 'boundary-pin',
        html: `
          <div style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.25));">
            <svg width="32" height="45" viewBox="0 0 32 45" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.16344 0 0 7.16344 0 16C0 28 16 45 16 45C16 45 32 28 32 16C32 7.16344 24.8366 0 16 0Z" fill="#dc2626"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
              <circle cx="16" cy="16" r="3" fill="#dc2626"/>
            </svg>
          </div>`,
        iconSize: [32, 45],
        iconAnchor: [16, 45]
      });
      setCustomIcon(icon);
    };
    initLeaflet();
  }, []);

  if (!isVisible || loading || !boundaryData) {
    return null;
  }

  const { area, locations } = boundaryData;

  // Render boundary area
  const renderBoundaryArea = () => {
    if (!area) return null;

    const highlightColor = isHighlighted ? '#FFD700' : area.color;
    const fillOpacity = isHighlighted ? 0.3 : area.fill_opacity;
    const strokeWeight = isHighlighted ? 6 : area.stroke_weight;

    switch (area.boundary_type) {
      case 'circle':
        return (
          <Circle
            center={[area.center_latitude, area.center_longitude] as LatLngTuple}
            radius={(area.radius_km || 4.5) * 1000} // Convert km to meters
            pathOptions={{
              color: highlightColor,
              weight: strokeWeight,
              opacity: 0.9,
              fillColor: highlightColor,
              fillOpacity: fillOpacity
            }}
          />
        );
      
      case 'polygon':
        if (area.polygon_coordinates) {
          // Convert GeoJSON coordinates to Leaflet format
          const leafletCoords = area.polygon_coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon] as LatLngTuple
          );
          
          return (
            <Polygon
              positions={leafletCoords}
              pathOptions={{
                color: highlightColor,
                weight: strokeWeight,
                opacity: 0.9,
                fillColor: highlightColor,
                fillOpacity: fillOpacity
              }}
            />
          );
        }
        break;
      
      case 'rectangle':
        if (area.rectangle_bounds) {
          const bounds = area.rectangle_bounds;
          const rectangleCoords = [
            [bounds.south, bounds.west] as LatLngTuple,
            [bounds.north, bounds.west] as LatLngTuple,
            [bounds.north, bounds.east] as LatLngTuple,
            [bounds.south, bounds.east] as LatLngTuple,
            [bounds.south, bounds.west] as LatLngTuple
          ];
          
          return (
            <Polygon
              positions={rectangleCoords}
              pathOptions={{
                color: highlightColor,
                weight: strokeWeight,
                opacity: 0.9,
                fillColor: highlightColor,
                fillOpacity: fillOpacity
              }}
            />
          );
        }
        break;
      
      default:
        // Default to circle
        return (
          <Circle
            center={[area.center_latitude, area.center_longitude] as LatLngTuple}
            radius={(area.radius_km || 4.5) * 1000}
            pathOptions={{
              color: highlightColor,
              weight: strokeWeight,
              opacity: 0.9,
              fillColor: highlightColor,
              fillOpacity: fillOpacity
            }}
          />
        );
    }
    
    return null;
  };

  // Render location markers
  const renderLocationMarkers = () => {
    return locations.map((location: BoundaryLocation) => (
      <Marker
        key={location.id || location.name}
        position={[location.latitude, location.longitude] as LatLngTuple}
        icon={customIcon}
      >
        <Popup>
          <div className="text-xs p-2">
            <h4 className="font-bold text-red-800 mb-1">{location.name}</h4>
            <p className="text-gray-600 mb-1">{location.description}</p>
            <div className="space-y-1">
              <p className="text-gray-500">
                <span className="font-semibold">Type:</span> {location.location_type.replace('_', ' ')}
              </p>
              <p className="text-gray-500">
                <span className="font-semibold">Boundary:</span> {location.boundary_type}
              </p>
              <p className="text-gray-400 text-xs">
                {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
              </p>
            </div>
            {onBoundarySelect && (
              <button
                onClick={() => onBoundarySelect(location)}
                className="mt-2 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
              >
                Select Location
              </button>
            )}
          </div>
        </Popup>
      </Marker>
    ));
  };

  return (
    <>
      {renderBoundaryArea()}
      {renderLocationMarkers()}
    </>
  );
};

export default DynamicBoundaryLayer;
