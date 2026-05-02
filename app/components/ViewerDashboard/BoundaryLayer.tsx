"use client";

import React, { useEffect, useState } from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import L from 'leaflet';

interface BoundaryLayerProps {
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
  isHighlighted = false,
  onBoundsReady 
}) => {
  const [boundariesData, setBoundariesData] = useState<any>(null);
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch boundaries data from database (same as superadmin)
  useEffect(() => {
    const fetchBoundariesData = async () => {
      try {
        setLoading(true);
        let bData = null;
        
        // Try to fetch from database first
        try {
          const bRes = await fetch('/api/boundaries');
          if (bRes.ok) {
            const result = await bRes.json();
            if (result.success && result.data && result.data.features) {
              bData = result.data;
            }
          }
        } catch (e) { 
          console.log("Boundaries DB route not ready, trying local file..."); 
        }
        
        // Fallback to local file if database fails
        if (!bData) {
          try {
            const localResponse = await fetch('/data/Ibaan_boundary.json');
            bData = await localResponse.json();
          } catch (e) { 
            console.log("No local boundary data found."); 
          }
        }
        
        setBoundariesData(bData);
        
        // Calculate and report bounds when data is loaded
        if (bData && onBoundsReady) {
          const transformed = transformCoordinates(bData);
          if (transformed && transformed.features && transformed.features.length > 0) {
            const bounds = L.geoJSON(transformed).getBounds();
            onBoundsReady([[bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]]);
          }
        }
      } catch (error) {
        console.error('Error fetching boundaries data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      fetchBoundariesData();
    }
  }, [isVisible]);

  // Transform coordinates from PRS92 to WGS84 (same as superadmin)
  const transformCoordinates = (geoData: any) => {
    if (!geoData || !geoData.features) return geoData;
    return {
      ...geoData,
      features: geoData.features
        .filter((feature: any) => {
          // Filter out features with invalid or tiny geometries
          if (!feature.geometry) return false;
          if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates) {
            // Check if polygon has reasonable size (not a tiny rectangle)
            const coords = feature.geometry.coordinates[0];
            if (coords && coords.length < 4) return false; // Need at least 4 points for a polygon
          }
          return true;
        })
        .map((feature: any) => {
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

  // Admin boundary styling (same as superadmin)
  const adminBoundaryStyle = (feature: any) => {
    const isSelected = feature.id === selectedBoundaryId;
    const hasCompleteData = feature.properties && feature.properties.brgy;

    return {
      color: isSelected ? '#3b82f6' : 'rgb(24, 49, 88)', // Blue when selected, dark blue when not
      weight: isSelected ? 4 : 2,
      fillColor: '#5432ff99', // Always blue fill color
      fillOpacity: hasCompleteData ? (isSelected ? 0.2 : 0.15) : 0, // Fill only if data is complete
      dashArray: isSelected ? '' : '5, 10', // Solid when selected, dotted when not
    };
  };

  // Handle boundary feature interactions (same as superadmin)
  const onEachBoundaryFeature = (feature: any, layer: any) => {
    layer.on({
      click: (e: any) => {
        setSelectedBoundaryId(feature.id);
        e.target._map.fitBounds(e.target.getBounds());
        
        // Show detailed popup with complete boundary information
        const props = feature.properties || {};
        const content = `<div class="p-3 min-w-[250px] text-xs">
          <h4 class="font-bold text-blue-700 mb-2">Administrative Boundary Details</h4>
          
          ${props.brgy ? `<div class="mb-2"><span class="font-semibold">Barangay:</span> ${props.brgy}</div>` : ''}
          ${props.lotno ? `<div><span class="font-semibold">Lot Number:</span> ${props.lotno}</div>` : ''}
          ${props.layer ? `<div><span class="font-semibold">Layer:</span> ${props.layer}</div>` : ''}
          ${props.SHAPE_Leng ? `<div><span class="font-semibold">Perimeter:</span> ${props.SHAPE_Leng.toFixed(2)} meters</div>` : ''}
          ${props.Shape_Area ? `<div><span class="font-semibold">Area:</span> ${(props.Shape_Area / 10000).toFixed(2)} hectares</div>` : ''}
          ${props.Shape_Le_1 ? `<div><span class="font-semibold">Secondary Perimeter:</span> ${props.Shape_Le_1.toFixed(2)} meters</div>` : ''}
          
          <div class="mt-2 pt-2 border-t border-gray-200">
            <div class="text-gray-600"><span class="font-semibold">Boundary ID:</span> ${feature.id}</div>
            <div class="text-gray-600"><span class="font-semibold">Geometry Type:</span> ${feature.geometry?.type || 'Polygon'}</div>
            ${props.path ? `<div class="text-gray-600"><span class="font-semibold">Source File:</span> ${props.path.split('\\').pop()}</div>` : ''}
          </div>
          
          <div class="mt-2 text-xs text-gray-500">
            <div>📍 Administrative Boundary of Ibaan, Batangas</div>
            <div>📐 CRS: PRS92 Philippines Zone III</div>
          </div>
        </div>`;
        
        layer.bindPopup(content).openPopup();
      },
      mouseover: (e: any) => {
        // Highlight on hover
        e.target.setStyle({ 
          weight: 4, 
          color: '#3b82f6', 
          fillOpacity: 0.2,
          dashArray: ''
        });
      },
      mouseout: (e: any) => {
        // Reset style on mouseout
        const isSelected = feature.id === selectedBoundaryId;
        e.target.setStyle(adminBoundaryStyle(feature));
      }
    });
    
    // Default popup for when not clicked
    layer.bindPopup(`<h4 class="font-bold text-blue-700">${feature.properties?.brgy || 'Administrative Boundary'}</h4>
      <div class="text-xs text-gray-600">
        ${feature.properties?.brgy ? `Barangay: ${feature.properties.brgy}` : 'Boundary Area'}
      </div>`);
  };

  if (!isVisible || loading || !boundariesData) {
    return null;
  }

  return (
    <GeoJSON 
      key={`admin-layer-${selectedBoundaryId}-${boundariesData.features.length}`}
      data={transformCoordinates(boundariesData)}
      style={adminBoundaryStyle}
      onEachFeature={onEachBoundaryFeature}
    />
  );
};

export default BoundaryLayer;
