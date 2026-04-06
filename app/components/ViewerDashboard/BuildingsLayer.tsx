"use client";

import React, { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface BuildingsLayerProps {
  isVisible: boolean;
  isHighlighted?: boolean;
}

// Sample building data - in a real app, this would come from your backend/API
const sampleBuildings = [
  { id: 1, name: "Building A", lat: 13.7595, lng: 121.1258, type: "commercial" },
  { id: 2, name: "Building B", lat: 13.7605, lng: 121.1268, type: "residential" },
  { id: 3, name: "Building C", lat: 13.7585, lng: 121.1248, type: "commercial" },
  { id: 4, name: "Building D", lat: 13.7615, lng: 121.1278, type: "office" },
  { id: 5, name: "Building E", lat: 13.7575, lng: 121.1238, type: "residential" },
  { id: 6, name: "Building F", lat: 13.7625, lng: 121.1288, type: "commercial" },
  { id: 7, name: "Building G", lat: 13.7565, lng: 121.1228, type: "office" },
  { id: 8, name: "Building H", lat: 13.7635, lng: 121.1298, type: "residential" },
];

const BuildingsLayer: React.FC<BuildingsLayerProps> = ({ 
  isVisible, 
  isHighlighted = false 
}) => {
  const [buildings, setBuildings] = useState(sampleBuildings);

  // Create custom icon for buildings
  const createBuildingIcon = (type: string, highlighted: boolean) => {
    const iconUrl = highlighted 
      ? '/icons/building-highlight.svg'
      : '/icons/building (1).png'; // Using the building icon from your public folder

    return L.icon({
      iconUrl: iconUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: highlighted ? 'building-marker-highlighted' : 'building-marker'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {buildings.map((building) => (
        <Marker
          key={building.id}
          position={[building.lat, building.lng]}
          icon={createBuildingIcon(building.type, isHighlighted)}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-semibold text-gray-800">{building.name}</h3>
              <p className="text-gray-600">Type: {building.type}</p>
              <p className="text-gray-500 text-xs">
                Lat: {building.lat.toFixed(4)}, Lng: {building.lng.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default BuildingsLayer;
