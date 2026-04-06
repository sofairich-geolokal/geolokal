"use client";

import React, { useEffect, useState } from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

interface RoadNetworksLayerProps {
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

// Major roads in Ibaan, Batangas using PRS92 Zone III coordinates
const ibaRoadNetworks: Array<{
  id: number;
  name: string;
  points: [number, number][];
  type: string;
  classification: string;
}> = [
  { 
    id: 1, 
    name: "Maharlika Highway (National Highway)", 
    points: [
      [13.7421, 121.1089] as [number, number], // Entry point from San Jose
      [13.7485, 121.1150] as [number, number], // Near Sabang
      [13.7588, 121.1250] as [number, number], // Ibaan Town Proper
      [13.7691, 121.1350] as [number, number], // Near San Isidro
      [13.7756, 121.1412] as [number, number]  // Exit to Batangas City
    ],
    type: "national_highway",
    classification: "primary"
  },
  { 
    id: 2, 
    name: "Ibaan-Batangas City Road", 
    points: [
      [13.7588, 121.1250] as [number, number], // Ibaan Town Proper
      [13.7620, 121.1280] as [number, number], // Malarayat area
      [13.7680, 121.1320] as [number, number], // Towards Batangas City
      [13.7756, 121.1380] as [number, number]  // Batangas City boundary
    ],
    type: "provincial_road",
    classification: "secondary"
  },
  { 
    id: 3, 
    name: "Ibaan-Lipa City Road", 
    points: [
      [13.7588, 121.1250] as [number, number], // Ibaan Town Proper
      [13.7520, 121.1180] as [number, number], // Near Rosario
      [13.7450, 121.1120] as [number, number], // Towards Lipa City
      [13.7421, 121.1089] as [number, number]  // Lipa City boundary
    ],
    type: "provincial_road",
    classification: "secondary"
  },
  { 
    id: 4, 
    name: "San Isidro Access Road", 
    points: [
      [13.7588, 121.1250] as [number, number], // Ibaan Town Proper
      [13.7650, 121.1280] as [number, number], // Midway
      [13.7756, 121.1250] as [number, number]  // San Isidro
    ],
    type: "municipal_road",
    classification: "tertiary"
  },
  { 
    id: 5, 
    name: "Sabang Farm-to-Market Road", 
    points: [
      [13.7588, 121.1250] as [number, number], // Ibaan Town Proper
      [13.7550, 121.1220] as [number, number], // Midway
      [13.7421, 121.1250] as [number, number]  // Sabang
    ],
    type: "farm_to_market",
    classification: "tertiary"
  },
  { 
    id: 6, 
    name: "Tala-Paligawan Road", 
    points: [
      [13.7588, 121.1250] as [number, number], // Ibaan Town Proper
      [13.7588, 121.1310] as [number, number], // Towards Tala
      [13.7588, 121.1412] as [number, number], // Tala
      [13.7588, 121.1089] as [number, number]  // Paligawan
    ],
    type: "barangay_road",
    classification: "local"
  }
];

// Key road intersection points and landmarks
const roadMarkers = [
  { 
    id: 1, 
    name: "Ibaan Town Proper Junction", 
    lat: 13.7588, 
    lng: 121.1250, 
    type: "major_intersection",
    description: "Main intersection in Ibaan town center"
  },
  { 
    id: 2, 
    name: "Maharlika Highway - Sabang", 
    lat: 13.7485, 
    lng: 121.1150, 
    type: "highway_point",
    description: "National Highway access point"
  },
  { 
    id: 3, 
    name: "Maharlika Highway - San Isidro", 
    lat: 13.7691, 
    lng: 121.1350, 
    type: "highway_point",
    description: "Northern highway access point"
  },
  { 
    id: 4, 
    name: "Batangas City Road Junction", 
    lat: 13.7620, 
    lng: 121.1280, 
    type: "provincial_junction",
    description: "Junction to Batangas City"
  },
  { 
    id: 5, 
    name: "Lipa City Road Junction", 
    lat: 13.7520, 
    lng: 121.1180, 
    type: "provincial_junction",
    description: "Junction to Lipa City"
  }
];

const RoadNetworksLayer: React.FC<RoadNetworksLayerProps> = ({ 
  isVisible, 
  isHighlighted = false 
}) => {
  const [roads, setRoads] = useState(ibaRoadNetworks);

  // Create road icon based on classification
  const createRoadIcon = (type: string, highlighted: boolean) => {
    let iconUrl = '/images/road-sign.png'; // Default road icon from public/images
    
    // Different icons for different road types using public/images
    switch (type) {
      case 'major_intersection':
        iconUrl = '/images/intersection.png';
        break;
      case 'highway_point':
        iconUrl = '/images/highway.png';
        break;
      case 'provincial_junction':
        iconUrl = '/images/junction.png';
        break;
      default:
        iconUrl = '/images/road-sign.png';
    }

    return L.icon({
      iconUrl: iconUrl,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
      className: highlighted ? 'road-marker-highlighted' : 'road-marker'
    });
  };

  // Get style for road lines based on classification
  const getRoadStyle = (classification: string, highlighted: boolean) => {
    const baseColor = highlighted ? '#FFD700' : '#000000'; // Gold when highlighted, black when normal
    
    switch (classification) {
      case 'primary': // National highways
        return {
          color: baseColor,
          weight: highlighted ? 6 : 5,
          opacity: highlighted ? 1 : 0.95,
          dashArray: ''
        };
      case 'secondary': // Provincial roads
        return {
          color: baseColor,
          weight: highlighted ? 4 : 3,
          opacity: highlighted ? 1 : 0.9,
          dashArray: ''
        };
      case 'tertiary': // Municipal and farm-to-market roads
        return {
          color: baseColor,
          weight: highlighted ? 3 : 2,
          opacity: highlighted ? 1 : 0.8,
          dashArray: ''
        };
      case 'local': // Barangay roads
        return {
          color: baseColor,
          weight: highlighted ? 2 : 1,
          opacity: highlighted ? 1 : 0.7,
          dashArray: '5,3'
        };
      default:
        return {
          color: baseColor,
          weight: 2,
          opacity: 0.8
        };
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Road network lines */}
      {roads.map((road) => (
        <Polyline
          key={road.id}
          positions={road.points}
          pathOptions={getRoadStyle(road.classification, isHighlighted)}
        />
      ))}
      
      {/* Road intersection and landmark markers */}
      {roadMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={createRoadIcon(marker.type, isHighlighted)}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-semibold text-gray-800">{marker.name}</h3>
              <p className="text-gray-600">{marker.description}</p>
              <p className="text-gray-500 text-xs">
                Type: {marker.type.replace('_', ' ').toUpperCase()}
              </p>
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

export default RoadNetworksLayer;
