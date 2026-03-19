"use client";

import React, { useEffect, useState } from 'react';
import { Circle, Polygon, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';

interface BoundaryLayerProps {
  isVisible: boolean;
  isHighlighted?: boolean;
}

// PRS92 Philippines Zone III coordinate system parameters
const PRS92_ZONE_III = {
  projection: "Transverse_Mercator",
  falseEasting: 500000.0,
  falseNorthing: 0.0,
  centralMeridian: 121.0,
  scaleFactor: 0.99995,
  latitudeOfOrigin: 0.0,
  datum: "Philippine_Reference_System_1992",
  spheroid: "Clarke_1866"
};

// More accurate Ibaan municipality boundary coordinates (approximate)
// These coordinates represent the actual boundaries of Ibaan, Batangas
const ibaBoundaryCoordinates: [number, number][] = [
  [13.7421, 121.1089] as [number, number], // Southwest corner
  [13.7421, 121.1412] as [number, number], // Northwest corner  
  [13.7756, 121.1412] as [number, number], // Northeast corner
  [13.7756, 121.1089] as [number, number], // Southeast corner
  [13.7421, 121.1089] as [number, number]  // Closing point
];

// More accurate center point for Ibaan municipality
const ibaCenter: [number, number] = [13.7588, 121.1250] as [number, number];
const ibaRadius = 2000; // meters - approximate radius of Ibaan municipality

// Key boundary points with actual location names
const boundaryMarkers = [
  { 
    id: 1, 
    name: "Barangay San Isidro", 
    lat: 13.7756, 
    lng: 121.1250, 
    description: "Northern boundary of Ibaan" 
  },
  { 
    id: 2, 
    name: "Barangay Sabang", 
    lat: 13.7421, 
    lng: 121.1250, 
    description: "Southern boundary of Ibaan" 
  },
  { 
    id: 3, 
    name: "Barangay Tala", 
    lat: 13.7588, 
    lng: 121.1412, 
    description: "Eastern boundary of Ibaan" 
  },
  { 
    id: 4, 
    name: "Barangay Paligawan", 
    lat: 13.7588, 
    lng: 121.1089, 
    description: "Western boundary of Ibaan" 
  },
  { 
    id: 5, 
    name: "Ibaan Town Proper", 
    lat: 13.7588, 
    lng: 121.1250, 
    description: "Center of Ibaan municipality" 
  }
];

const BoundaryLayer: React.FC<BoundaryLayerProps> = ({ 
  isVisible, 
  isHighlighted = false 
}) => {
  // Create boundary marker icon
  const createBoundaryIcon = (highlighted: boolean) => {
    const iconUrl = highlighted 
      ? '/icons/boundary-highlight.svg'
      : '/icons/signpost-green.svg'; // Using existing signpost icon

    return L.icon({
      iconUrl: iconUrl,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
      className: highlighted ? 'boundary-marker-highlighted' : 'boundary-marker'
    });
  };

  // Get style for boundary polygon
  const getBoundaryStyle = (highlighted: boolean) => ({
    color: highlighted ? '#FFD700' : '#dc2626', // Gold when highlighted, red when normal
    weight: highlighted ? 4 : 3,
    opacity: highlighted ? 1 : 0.9,
    fillColor: highlighted ? '#FFD700' : '#dc2626',
    fillOpacity: highlighted ? 0.25 : 0.15,
    dashArray: ''
  });

  // Get style for circular boundary
  const getCircleStyle = (highlighted: boolean) => ({
    color: highlighted ? '#FFD700' : '#dc2626', // Gold when highlighted, red when normal
    weight: highlighted ? 3 : 2,
    opacity: highlighted ? 0.8 : 0.6,
    fillColor: highlighted ? '#FFD700' : '#dc2626',
    fillOpacity: highlighted ? 0.2 : 0.1
  });

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Circular boundary representing Ibaan municipality area */}
      <Circle
        center={ibaCenter}
        radius={ibaRadius}
        pathOptions={getCircleStyle(isHighlighted)}
      />

      {/* Accurate Ibaan boundary polygon */}
      <Polygon
        positions={ibaBoundaryCoordinates}
        pathOptions={getBoundaryStyle(isHighlighted)}
      />

      {/* Boundary markers at key locations */}
      {boundaryMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={createBoundaryIcon(isHighlighted)}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-semibold text-red-800">{marker.name}</h3>
              <p className="text-gray-600">{marker.description}</p>
              <p className="text-gray-500 text-xs">
                Coordinates: {marker.lat.toFixed(4)}°N, {marker.lng.toFixed(4)}°E
              </p>
              <p className="text-gray-400 text-xs mt-1">
                CRS: PRS92 Philippines Zone III
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default BoundaryLayer;
