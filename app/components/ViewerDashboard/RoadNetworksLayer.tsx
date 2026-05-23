"use client";

import React, { useEffect, useState, useRef } from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import L from 'leaflet';
import proj4 from 'proj4';

interface RoadNetworksLayerProps {
  isVisible: boolean;
  isHighlighted?: boolean;
  onBoundsReady?: (bounds: [[number, number], [number, number]]) => void;
}

// Correct PRS92 PTM Zone 3 Projection for Batangas (same as ParcelLots)
const PRS92_PTM3 = "+proj=tmerc +lat_0=0 +lon_0=121 +k=0.99995 +x_0=500000 +y_0=0 +ellps=clrk66 +towgs84=-127.62,-67.24,-47.04,-3.068,4.903,1.578,-1.06 +units=m +no_defs";
const WGS84 = "EPSG:4326";

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
  const dataFetchedRef = useRef(false);

  // Fetch roads data from database (same as superadmin)
  useEffect(() => {
    const fetchRoadsData = async () => {
      try {
        setLoading(true);
        let rData = null;
        
        console.log('RoadNetworksLayer: Starting data fetch...');
        
        // Try local file first for faster loading
        try {
          console.log('RoadNetworksLayer: Trying local file first...');
          const lRes = await fetch('/data/Ibaan_roadnetworks.json');
          if (lRes.ok) {
            rData = await lRes.json();
            console.log('RoadNetworksLayer: Data loaded from local file, features:', rData?.features?.length);
          }
        } catch (e) { 
          console.log("RoadNetworksLayer: Local file not available, trying database...", e); 
        }

        // Fallback to database if local file fails
        if (!rData) {
          try {
            console.log('RoadNetworksLayer: Trying database...');
            const rRes = await fetch('/api/roads');
            console.log('RoadNetworksLayer: API response status:', rRes.status);
            if (rRes.ok) {
              const result = await rRes.json();
              console.log('RoadNetworksLayer: API response:', result);
              if (result.success && result.data && result.data.features) {
                rData = result.data;
                console.log('RoadNetworksLayer: Data loaded from database');
              }
            }
          } catch (e) { 
            console.log("RoadNetworksLayer: Database route not ready", e); 
          }
        }
        
        setRoadsData(rData);
        dataFetchedRef.current = true;
        console.log('RoadNetworksLayer: Final data state - has data:', !!rData, 'features:', rData?.features?.length);
        
        // Calculate and report bounds when data is loaded
        if (rData && onBoundsReady) {
          const transformed = transformRoadCoordinates(rData);
          if (transformed && transformed.features && transformed.features.length > 0) {
            const bounds = L.geoJSON(transformed).getBounds();
            onBoundsReady([[bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]]);
          }
        }
      } catch (error) {
        console.error('RoadNetworksLayer: Error fetching roads data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data once, not on every visibility toggle
    if (isVisible && !dataFetchedRef.current) {
      fetchRoadsData();
    }
  }, [isVisible]);

  // Transform road coordinates - data is already in WGS84 format
  const transformRoadCoordinates = (geoData: any) => {
    try {
      if (!geoData || !geoData.features || !Array.isArray(geoData.features)) return null;
      
      const transformCoord = (coord: any) => {
        const x = Number(coord[0]);
        const y = Number(coord[1]);
        // Check if coordinates are in valid WGS84 range
        if (x >= -180 && x <= 180 && y >= -90 && y <= 90) {
          return [x, y];
        }
        // If coordinates are in PRS92 format, apply transformation using proj4
        try {
          return proj4(PRS92_PTM3, WGS84, [x, y]);
        } catch (e) {
          return [x, y];
        }
      };

      const transformedData = {
        ...geoData,
        type: "FeatureCollection",
        features: geoData.features.filter((feature: any) => feature && feature.geometry && feature.geometry.coordinates).map((feature: any) => {
          let newCoords;
          const geomType = feature.geometry.type;

          // Convert Polygon to LineString for roads
          if (geomType === 'Polygon') {
            newCoords = feature.geometry.coordinates[0].map(transformCoord);
            return { ...feature, geometry: { type: 'LineString', coordinates: newCoords } };
          }
          // Convert MultiPolygon to MultiLineString for roads
          if (geomType === 'MultiPolygon') {
            newCoords = feature.geometry.coordinates.map((polygon: any) => polygon[0].map(transformCoord));
            return { ...feature, geometry: { type: 'MultiLineString', coordinates: newCoords } };
          }
          if (geomType === 'LineString') {
            newCoords = feature.geometry.coordinates.map(transformCoord);
          } else if (geomType === 'MultiLineString') {
            newCoords = feature.geometry.coordinates.map((line: any) => line.map(transformCoord));
          } else {
            return feature;
          }

          return { ...feature, geometry: { ...feature.geometry, coordinates: newCoords } };
        })
      };
      return transformedData;
    } catch (error) { 
      console.error('Error transforming road coordinates:', error);
      return null; 
    }
  };

  // Road styling - Dark grey color for high visibility
  const geoPortalRoadStyle = (feature: any) => ({ 
    color: '#2d2d2d', 
    weight: 4, 
    opacity: 1.0 
  });

  // Handle road feature interactions (same as superadmin)
  const onEachRoadFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => { 
        e.target.setStyle({ weight: 8, color: '#eab308' });
        
        // Show detailed hover information box
        const props = feature.properties || {};
        const labelContent = `<div class="bg-white px-4 py-3 rounded-lg shadow-xl border border-gray-300 text-xs" style="position: absolute; z-index: 1000; pointer-events: none; min-width: 280px; max-width: 350px;">
          <div class="border-b border-gray-200 pb-2 mb-2">
            <div class="font-bold text-green-800 text-sm mb-1">${props.Name || 'Road Segment'}</div>
            <div class="text-gray-500 text-xs">Road Network Information</div>
          </div>
          
          <div class="space-y-1">
            ${props.Name ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Road Name:</span><span class="text-gray-600">${props.Name}</span></div>` : ''}
            ${props.Type ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Road Type:</span><span class="text-gray-600">${props.Type}</span></div>` : ''}
            ${props.Brgy ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Barangay:</span><span class="text-gray-600">${props.Brgy}</span></div>` : ''}
            ${props.layer ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Layer:</span><span class="text-gray-600">${props.layer}</span></div>` : ''}
            ${props.path ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Source:</span><span class="text-gray-600">${props.path.split('/').pop()}</span></div>` : ''}
          </div>
          
          <div class="border-t border-gray-200 pt-2 mt-2">
            <div class="text-gray-500 text-xs space-y-1">
              <div class="flex justify-between"><span class="font-semibold">Feature ID:</span><span>${feature.id}</span></div>
              <div class="flex justify-between"><span class="font-semibold">Geometry:</span><span>${feature.geometry?.type || 'LineString'}</span></div>
            </div>
          </div>
          
          <div class="bg-green-50 px-2 py-1 rounded mt-2 text-xs text-green-700">
            <div class="font-semibold">🛣️ Road Network</div>
            <div class="text-xs">Ibaan, Batangas • CRS: EPSG:4326 (WGS84)</div>
          </div>
        </div>`;
        
        // Create and show hover label
        const hoverLabel = L.divIcon({
          html: labelContent,
          className: 'road-hover-label',
          iconSize: [350, 200],
          iconAnchor: [175, -20]
        });
        
        const hoverMarker = L.marker(e.latlng, { icon: hoverLabel, zIndexOffset: 1000 });
        hoverMarker.addTo(e.target._map);
        e.target._hoverMarker = hoverMarker;
      },
      mouseout: (e: any) => { 
        e.target.setStyle(geoPortalRoadStyle(feature));
        
        // Remove hover label
        if (e.target._hoverMarker) {
          e.target._map.removeLayer(e.target._hoverMarker);
          e.target._hoverMarker = null;
        }
      }
    });
  };

  if (!isVisible || loading || !roadsData) {
    console.log('RoadNetworksLayer: Not rendering - isVisible:', isVisible, 'loading:', loading, 'roadsData:', !!roadsData);
    return null;
  }

  const transformedRoadsData = transformRoadCoordinates(roadsData);
  if (!transformedRoadsData) {
    console.log('RoadNetworksLayer: Transformation failed');
    return null;
  }

  console.log('RoadNetworksLayer: Rendering', transformedRoadsData.features.length, 'features');

  return (
    <GeoJSON 
      key={`roads-${roadsData.features.length}-${isVisible}`}
      data={transformedRoadsData}
      style={geoPortalRoadStyle}
      onEachFeature={onEachRoadFeature}
      eventHandlers={{
        add: (e) => {
          const layer = e.target as L.GeoJSON;
          layer.bringToFront();
          console.log('RoadNetworksLayer: Layer added to map with', transformedRoadsData.features.length, 'features');
        }
      }}
    />
  );
};

export default RoadNetworksLayer;