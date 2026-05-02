"use client";

import React, { useEffect, useState } from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import L from 'leaflet';

interface RoadNetworksLayerProps {
  isVisible: boolean;
  isHighlighted?: boolean;
  onBoundsReady?: (bounds: [[number, number], [number, number]]) => void;
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
  isHighlighted = false,
  onBoundsReady 
}) => {
  const [roadsData, setRoadsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch roads data from database (same as superadmin)
  useEffect(() => {
    const fetchRoadsData = async () => {
      try {
        setLoading(true);
        let rData = null;
        
        // Try to fetch from database first
        try {
          const rRes = await fetch('/api/roads');
          if (rRes.ok) {
            const result = await rRes.json();
            if (result.success && result.data && result.data.features) {
              rData = result.data;
            }
          }
        } catch (e) { 
          console.log("Roads DB route not ready, trying local file..."); 
        }

        // Fallback to local file if database fails
        if (!rData) {
          try {
            const lRes = await fetch('/data/Ibaan_roadnetworks.json');
            rData = await lRes.json();
          } catch (e) { 
            console.log("No local road data found."); 
          }
        }
        
        setRoadsData(rData);
        
        // Calculate and report bounds when data is loaded
        if (rData && onBoundsReady) {
          const transformed = transformRoadCoordinates(rData);
          if (transformed && transformed.features && transformed.features.length > 0) {
            const bounds = L.geoJSON(transformed).getBounds();
            onBoundsReady([[bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]]);
          }
        }
      } catch (error) {
        console.error('Error fetching roads data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      fetchRoadsData();
    }
  }, [isVisible]);

  // Transform road coordinates from PRS92 to WGS84 (same as superadmin)
  const transformRoadCoordinates = (geoData: any) => {
    try {
      if (!geoData || !geoData.features || !Array.isArray(geoData.features)) return null;
      const transformedData = {
        ...geoData,
        type: "FeatureCollection",
        features: geoData.features.filter((feature: any) => feature && feature.geometry && feature.geometry.coordinates).map((feature: any) => {
          const transformPt = (coord: any) => {
            const x = coord[0], y = coord[1];
            if (x < 180 && x > -180) return [x, y];
            return [(x - 500000) / 100000 + 121.0, (y - 1520000) / 100000 + 13.8];
          };

          let newCoords = feature.geometry.coordinates;
          if (feature.geometry.type === 'Polygon') {
            newCoords = feature.geometry.coordinates[0].map(transformPt);
            return { ...feature, geometry: { type: 'LineString', coordinates: newCoords }};
          }
          if (feature.geometry.type === 'MultiPolygon') {
            newCoords = feature.geometry.coordinates.map((polygon: any) => polygon[0].map(transformPt));
            return { ...feature, geometry: { type: 'MultiLineString', coordinates: newCoords }};
          }
          if (feature.geometry.type === 'LineString') {
            newCoords = feature.geometry.coordinates.map(transformPt);
          } else if (feature.geometry.type === 'MultiLineString') {
            newCoords = feature.geometry.coordinates.map((ring: any) => ring.map(transformPt));
          }
          return { ...feature, geometry: { ...feature.geometry, coordinates: newCoords }};
        })
      };
      return transformedData;
    } catch (error) { return null; }
  };

  // Road styling (same as superadmin)
  const geoPortalRoadStyle = () => ({ color: '#06a506ee', weight: 3, opacity: 0.9 });

  // Handle road feature interactions (same as superadmin)
  const onEachRoadFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => { 
        e.target.setStyle({ weight: 5, color: '#eab308' }); 
      },
      mouseout: (e: any) => { 
        e.target.setStyle(geoPortalRoadStyle()); 
      },
      click: (e: any) => {
        const props = feature.properties || {};
        const content = `<div class="p-3 min-w-[200px] text-xs">
          <h4 class="font-bold mb-2">Road Details</h4>
          ${props.Name ? `<div><b>Name:</b> ${props.Name}</div>` : ''}
          ${props.Type ? `<div><b>Type:</b> ${props.Type}</div>` : ''}
          <div><b>Geometry:</b> ${feature.geometry.type}</div>
        </div>`;
        layer.bindPopup(content).openPopup();
      }
    });
  };

  if (!isVisible || loading || !roadsData) {
    return null;
  }

  const transformedRoadsData = transformRoadCoordinates(roadsData);
  if (!transformedRoadsData) {
    return null;
  }

  return (
    <GeoJSON 
      key={`roads-${roadsData.features.length}`}
      data={transformedRoadsData}
      style={geoPortalRoadStyle}
      onEachFeature={onEachRoadFeature}
    />
  );
};

export default RoadNetworksLayer;
