"use client";

import React, { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface HeatMapLayerProps {
  isVisible: boolean;
  isHighlighted?: boolean;
}

// Sample heatmap data points - in a real app, this would come from your backend/API
const sampleHeatMapPoints = [
  { id: 1, name: "Hotspot A", lat: 13.7595, lng: 121.1258, intensity: 0.9 },
  { id: 2, name: "Hotspot B", lat: 13.7605, lng: 121.1268, intensity: 0.7 },
  { id: 3, name: "Hotspot C", lat: 13.7585, lng: 121.1248, intensity: 0.8 },
  { id: 4, name: "Hotspot D", lat: 13.7615, lng: 121.1278, intensity: 0.6 },
  { id: 5, name: "Hotspot E", lat: 13.7575, lng: 121.1238, intensity: 0.95 },
  { id: 6, name: "Hotspot F", lat: 13.7625, lng: 121.1288, intensity: 0.5 },
  { id: 7, name: "Hotspot G", lat: 13.7565, lng: 121.1228, intensity: 0.75 },
  { id: 8, name: "Hotspot H", lat: 13.7635, lng: 121.1298, intensity: 0.85 },
];

const HeatMapLayer: React.FC<HeatMapLayerProps> = ({ 
  isVisible, 
  isHighlighted = false 
}) => {
  const [heatMapPoints, setHeatMapPoints] = useState(sampleHeatMapPoints);

  // Create custom icon for heatmap points based on intensity
  const createHeatMapIcon = (intensity: number, highlighted: boolean) => {
    // Color based on intensity (red = high, yellow = medium, green = low)
    let color = '#22c55e'; // green for low intensity
    if (intensity > 0.7) {
      color = '#ef4444'; // red for high intensity
    } else if (intensity > 0.4) {
      color = '#eab308'; // yellow for medium intensity
    }

    const iconUrl = highlighted 
      ? '/icons/map-pin-green.svg'
      : '/icons/map-pin-green.svg'; // Using map pin icon

    return L.icon({
      iconUrl: iconUrl,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
      className: highlighted ? 'heatmap-marker-highlighted' : 'heatmap-marker'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {heatMapPoints.map((point) => (
        <Marker
          key={point.id}
          position={[point.lat, point.lng]}
          icon={createHeatMapIcon(point.intensity, isHighlighted)}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-semibold text-gray-800">{point.name}</h3>
              <p className="text-gray-600">Intensity: {(point.intensity * 100).toFixed(0)}%</p>
              <p className="text-gray-500 text-xs">
                Lat: {point.lat.toFixed(4)}, Lng: {point.lng.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default HeatMapLayer;
