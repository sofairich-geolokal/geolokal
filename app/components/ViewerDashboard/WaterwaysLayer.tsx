"use client";

import React, { useEffect, useState } from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

interface WaterwaysLayerProps {
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

// Major waterways in Ibaan, Batangas using PRS92 Zone III coordinates
const ibaWaterways: Array<{
  id: number;
  name: string;
  points: [number, number][];
  type: string;
  classification: string;
  length: number; // approximate length in km
}> = [
  { 
    id: 1, 
    name: "Ibaan River (Main River)", 
    points: [
      [13.7421, 121.1089] as [number, number], // Source near San Jose boundary
      [13.7485, 121.1150] as [number, number], // Near Sabang area
      [13.7588, 121.1250] as [number, number], // Ibaan Town Proper
      [13.7650, 121.1320] as [number, number], // Midway to San Isidro
      [13.7756, 121.1412] as [number, number]  // Confluence near Batangas City
    ],
    type: "main_river",
    classification: "primary",
    length: 8.5
  },
  { 
    id: 2, 
    name: "Sabang Creek", 
    points: [
      [13.7450, 121.1120] as [number, number], // Upper Sabang
      [13.7485, 121.1150] as [number, number], // Sabang proper
      [13.7520, 121.1180] as [number, number], // Joins Ibaan River
      [13.7588, 121.1250] as [number, number]  // Confluence with main river
    ],
    type: "creek",
    classification: "secondary",
    length: 3.2
  },
  { 
    id: 3, 
    name: "San Isidro Tributary", 
    points: [
      [13.7756, 121.1350] as [number, number], // San Isidro area
      [13.7720, 121.1320] as [number, number], // Midway
      [13.7680, 121.1280] as [number, number], // Lower section
      [13.7650, 121.1320] as [number, number]  // Joins Ibaan River
    ],
    type: "tributary",
    classification: "secondary",
    length: 2.8
  },
  { 
    id: 4, 
    name: "Malarayat Stream", 
    points: [
      [13.7620, 121.1280] as [number, number], // Near Malarayat area
      [13.7588, 121.1250] as [number, number], // Ibaan Town Proper
      [13.7550, 121.1220] as [number, number], // Continuation
      [13.7520, 121.1180] as [number, number]  // End point
    ],
    type: "stream",
    classification: "tertiary",
    length: 1.8
  },
  { 
    id: 5, 
    name: "Tala Irrigation Canal", 
    points: [
      [13.7588, 121.1250] as [number, number], // Main canal start
      [13.7588, 121.1310] as [number, number], // Towards Tala
      [13.7588, 121.1380] as [number, number], // Tala area
      [13.7588, 121.1412] as [number, number]  // Canal end
    ],
    type: "irrigation_canal",
    classification: "tertiary",
    length: 2.1
  },
  { 
    id: 6, 
    name: "Paligawan Drainage Channel", 
    points: [
      [13.7588, 121.1250] as [number, number], // Channel start
      [13.7588, 121.1180] as [number, number], // Midway
      [13.7588, 121.1120] as [number, number], // Near Paligawan
      [13.7588, 121.1089] as [number, number]  // Channel end
    ],
    type: "drainage",
    classification: "local",
    length: 1.6
  }
];

// Key waterway points and landmarks
const waterwayMarkers = [
  { 
    id: 1, 
    name: "Ibaan River Bridge", 
    lat: 13.7588, 
    lng: 121.1250, 
    type: "river_crossing",
    description: "Main bridge over Ibaan River in town proper"
  },
  { 
    id: 2, 
    name: "Sabang Creek Confluence", 
    lat: 13.7520, 
    lng: 121.1180, 
    type: "confluence",
    description: "Where Sabang Creek meets Ibaan River"
  },
  { 
    id: 3, 
    name: "San Isidro River Access", 
    lat: 13.7680, 
    lng: 121.1280, 
    type: "river_access",
    description: "Northern river access point"
  },
  { 
    id: 4, 
    name: "Malarayat Stream Source", 
    lat: 13.7620, 
    lng: 121.1280, 
    type: "stream_source",
    description: "Source of Malarayat Stream"
  },
  { 
    id: 5, 
    name: "Tala Irrigation Head", 
    lat: 13.7588, 
    lng: 121.1250, 
    type: "irrigation_head",
    description: "Main irrigation canal headworks"
  },
  { 
    id: 6, 
    name: "Paligawan Drainage Outlet", 
    lat: 13.7588, 
    lng: 121.1089, 
    type: "drainage_outlet",
    description: "Western drainage system outlet"
  }
];

const WaterwaysLayer: React.FC<WaterwaysLayerProps> = ({ 
  isVisible, 
  isHighlighted = false 
}) => {
  const [waterways, setWaterways] = useState(ibaWaterways);

  // Create waterway icon based on type
  const createWaterwayIcon = (type: string, highlighted: boolean) => {
    let iconUrl = '/images/water-drop.png'; // Default water icon from public/images
    
    // Different icons for different waterway types using public/images
    switch (type) {
      case 'river_crossing':
        iconUrl = '/images/bridge.png';
        break;
      case 'confluence':
        iconUrl = '/images/confluence.png';
        break;
      case 'river_access':
        iconUrl = '/images/river-access.png';
        break;
      case 'stream_source':
        iconUrl = '/images/source.png';
        break;
      case 'irrigation_head':
        iconUrl = '/images/irrigation.png';
        break;
      case 'drainage_outlet':
        iconUrl = '/images/drainage.png';
        break;
      default:
        iconUrl = '/images/water-drop.png';
    }

    return L.icon({
      iconUrl: iconUrl,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
      className: highlighted ? 'waterway-marker-highlighted' : 'waterway-marker'
    });
  };

  // Get style for waterway lines based on classification
  const getWaterwayStyle = (classification: string, highlighted: boolean) => {
    const baseColor = highlighted ? '#FFD700' : '#1e40af'; // Gold when highlighted, blue when normal
    
    switch (classification) {
      case 'primary': // Main rivers
        return {
          color: baseColor,
          weight: highlighted ? 5 : 4,
          opacity: highlighted ? 1 : 0.9,
          fillColor: baseColor,
          fillOpacity: 0.2,
          dashArray: ''
        };
      case 'secondary': // Creeks and tributaries
        return {
          color: baseColor,
          weight: highlighted ? 3 : 2,
          opacity: highlighted ? 1 : 0.8,
          fillColor: baseColor,
          fillOpacity: 0.15,
          dashArray: ''
        };
      case 'tertiary': // Streams and irrigation canals
        return {
          color: baseColor,
          weight: highlighted ? 2 : 1.5,
          opacity: highlighted ? 1 : 0.7,
          fillColor: baseColor,
          fillOpacity: 0.1,
          dashArray: ''
        };
      case 'local': // Drainage channels
        return {
          color: baseColor,
          weight: highlighted ? 1.5 : 1,
          opacity: highlighted ? 1 : 0.6,
          fillColor: baseColor,
          fillOpacity: 0.1,
          dashArray: '3,2'
        };
      default:
        return {
          color: baseColor,
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.1
        };
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Waterway lines */}
      {waterways.map((waterway) => (
        <Polyline
          key={waterway.id}
          positions={waterway.points}
          pathOptions={getWaterwayStyle(waterway.classification, isHighlighted)}
        />
      ))}
      
      {/* Waterway point markers and landmarks */}
      {waterwayMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={createWaterwayIcon(marker.type, isHighlighted)}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-semibold text-blue-800">{marker.name}</h3>
              <p className="text-gray-600">{marker.description}</p>
              <p className="text-gray-500 text-xs">
                Type: {marker.type.replace('_', ' ').toUpperCase()}
              </p>
              <p className="text-gray-500 text-xs">
                Classification: {marker.type.includes('river') ? 'PRIMARY' : 
                              marker.type.includes('creek') || marker.type.includes('tributary') ? 'SECONDARY' :
                              marker.type.includes('stream') || marker.type.includes('irrigation') ? 'TERTIARY' : 'LOCAL'}
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

export default WaterwaysLayer;
