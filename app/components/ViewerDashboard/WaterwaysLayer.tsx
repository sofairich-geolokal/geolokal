"use client";

import React, { useEffect, useState } from 'react';
import { GeoJSON, Popup, Rectangle } from 'react-leaflet';
import L from 'leaflet';

interface WaterwaysLayerProps {
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
  isHighlighted = false,
  onBoundsReady 
}) => {
  const [waterwaysData, setWaterwaysData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch waterways data from database (same as superadmin)
  useEffect(() => {
    const fetchWaterwaysData = async () => {
      try {
        setLoading(true);
        let geoData = null;
        
        // Try to fetch from database first
        try {
          const dbResponse = await fetch('/api/waterways');
          if (dbResponse.ok) {
            const result = await dbResponse.json();
            if (result.success && result.data && result.data.features) {
                geoData = result.data;
            }
          }
        } catch (e) { 
          console.log("DB route not ready, trying local file..."); 
        }

        // Fallback to local file if database fails
        if (!geoData) {
          const localResponse = await fetch('/data/Ibaan_waterways.json');
          geoData = await localResponse.json();
        }
        
        setWaterwaysData(geoData);
        
        // Calculate and report bounds when data is loaded
        if (geoData && onBoundsReady) {
          const transformed = transformCoordinates(geoData);
          if (transformed && transformed.features && transformed.features.length > 0) {
            const bounds = L.geoJSON(transformed).getBounds();
            onBoundsReady([[bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]]);
          }
        }
      } catch (error) {
        console.error('Error fetching waterways data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      fetchWaterwaysData();
    }
  }, [isVisible]);

  // Transform coordinates from PRS92 to WGS84 (same as superadmin)
  const transformCoordinates = (geoData: any) => {
    if (!geoData || !geoData.features) return geoData;
    return {
      ...geoData,
      features: geoData.features.map((feature: any) => {
        if ((feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon') && feature.geometry?.coordinates) {
          const transformRing = (ring: any) => ring.map((coord: any) => {
            const x = coord[0], y = coord[1];
            if (x < 180 && x > -180) return [x, y];
            return [(x - 500000) / 100000 + 121.0, (y - 1520000) / 100000 + 13.8];
          });

          let newCoords;
          if (feature.geometry.type === 'Polygon') {
            newCoords = feature.geometry.coordinates.map(transformRing);
          } else {
            newCoords = feature.geometry.coordinates.map((poly: any) => poly.map(transformRing));
          }

          return { ...feature, geometry: { ...feature.geometry, coordinates: newCoords }};
        }
        return feature;
      })
    };
  };

  // Calculate river bounds for boundary rectangle (same as superadmin)
  const calculateRiverBounds = (geoData: any): [[number, number], [number, number]] | null => {
    if (!geoData || !geoData.features) return null;
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    geoData.features.forEach((feature: any) => {
      if (feature.geometry?.type === 'Polygon' && feature.geometry?.coordinates) {
        feature.geometry.coordinates.forEach((ring: any) => {
          ring.forEach((coord: any) => {
            const x = coord[0], y = coord[1];
            const lng = (x - 500000) / 100000 + 121.0;
            const lat = (y - 1520000) / 100000 + 13.8;
            minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
          });
        });
      }
    });
    if (minLng === Infinity) return null;
    const buffer = 0.02;
    return [[minLat - buffer, minLng - buffer], [maxLat + buffer, maxLng + buffer]];
  };

  // Waterway styling (same as superadmin)
  const geoPortalWaterwayStyle = (feature: any) => {
    if (feature.geometry?.type?.includes('Polygon')) {
      return { color: '#7dd3fc', weight: 2, fillColor: '#38bdf8', fillOpacity: 0.35 };
    }
    return { color: '#2563eb', weight: 3, opacity: 0.9 };
  };

  // Handle waterway feature interactions (same as superadmin)
  const onEachWaterwayFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => { 
        e.target.setStyle({ weight: 5, color: '#f97316', fillOpacity: 0.7 }); 
      },
      mouseout: (e: any) => { 
        e.target.setStyle(geoPortalWaterwayStyle(feature)); 
      }
    });
    layer.bindPopup(`<h4 class="font-bold">${feature.properties?.Name || 'Waterway'}</h4>`);
  };

  if (!isVisible || loading || !waterwaysData) {
    return null;
  }

  return (
    <>
      {/* Waterways GeoJSON layer (same as superadmin) */}
      <GeoJSON 
        key={`river-${waterwaysData.features.length}`}
        data={transformCoordinates(waterwaysData)}
        style={geoPortalWaterwayStyle}
        onEachFeature={onEachWaterwayFeature}
      />
    </>
  );
};

export default WaterwaysLayer;
