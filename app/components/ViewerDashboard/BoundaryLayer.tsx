"use client";

import React, { useEffect, useState } from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import L from 'leaflet';
import proj4 from 'proj4';

interface BoundaryLayerProps {
  isVisible: boolean;
  isHighlighted?: boolean;
  onBoundsReady?: (bounds: [[number, number], [number, number]]) => void;
}

// Correct PRS92 PTM Zone 3 Projection for Batangas (same as ParcelLots)
const PRS92_PTM3 = "+proj=tmerc +lat_0=0 +lon_0=121 +k=0.99995 +x_0=500000 +y_0=0 +ellps=clrk66 +towgs84=-127.62,-67.24,-47.04,-3.068,4.903,1.578,-1.06 +units=m +no_defs";
const WGS84 = "EPSG:4326";

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

  // Transform coordinates from PRS92 to WGS84 using proj4 (same as ParcelLots)
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
            const x = Number(coord[0]);
            const y = Number(coord[1]);
            // Data is already in WGS84 format (EPSG:4326), so no transformation needed
            // Check if coordinates are in valid WGS84 range
            if (x >= -180 && x <= 180 && y >= -90 && y <= 90) {
              return [x, y];
            }
            // If coordinates are in PRS92 format, apply transformation using proj4
            return proj4(PRS92_PTM3, WGS84, [x, y]);
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

  // Admin boundary styling - Blue border with transparent background
  const adminBoundaryStyle = (feature: any) => {
    const isSelected = feature.id === selectedBoundaryId;
    const hasCompleteData = feature.properties && feature.properties.brgy;

    return {
      color: isSelected ? '#0000FF' : '#0000FF', // Always blue outline
      weight: isSelected ? 4 : 2,
      fillColor: 'transparent', // Transparent background
      fillOpacity: 0, // No fill
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
          
          ${props.fid ? `<div class="mb-2"><span class="font-semibold">FID:</span> ${props.fid}</div>` : ''}
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
            <div>📐 CRS: EPSG:4326 (WGS84)</div>
          </div>
        </div>`;
        
        layer.bindPopup(content).openPopup();
      },
      mouseover: (e: any) => {
        // Highlight on hover
        e.target.setStyle({ 
          weight: 4, 
          color: '#0000FF', 
          fillOpacity: 0,
          dashArray: ''
        });
        
        // Show detailed hover information box
        const props = feature.properties || {};
        const labelContent = `<div class="bg-white px-4 py-3 rounded-lg shadow-xl border border-gray-300 text-xs" style="position: absolute; z-index: 1000; pointer-events: none; min-width: 280px; max-width: 350px;">
          <div class="border-b border-gray-200 pb-2 mb-2">
            <div class="font-bold text-blue-800 text-sm mb-1">${props.brgy || 'Administrative Boundary'}</div>
            <div class="text-gray-500 text-xs">Boundary Information</div>
          </div>
          
          <div class="space-y-1">
            ${props.fid ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">FID:</span><span class="text-gray-600">${props.fid}</span></div>` : ''}
            ${props.brgy ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Barangay:</span><span class="text-gray-600">${props.brgy}</span></div>` : ''}
            ${props.lotno ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Lot Number:</span><span class="text-gray-600">${props.lotno}</span></div>` : ''}
            ${props.layer ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Layer:</span><span class="text-gray-600">${props.layer}</span></div>` : ''}
            ${props.SHAPE_Leng ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Perimeter:</span><span class="text-gray-600">${props.SHAPE_Leng.toFixed(2)} m</span></div>` : ''}
            ${props.Shape_Area ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Area:</span><span class="text-gray-600">${(props.Shape_Area / 10000).toFixed(2)} ha</span></div>` : ''}
            ${props.Shape_Le_1 ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Secondary Perimeter:</span><span class="text-gray-600">${props.Shape_Le_1.toFixed(2)} m</span></div>` : ''}
          </div>
          
          <div class="border-t border-gray-200 pt-2 mt-2">
            <div class="text-gray-500 text-xs space-y-1">
              <div class="flex justify-between"><span class="font-semibold">Boundary ID:</span><span>${feature.id}</span></div>
              <div class="flex justify-between"><span class="font-semibold">Geometry:</span><span>${feature.geometry?.type || 'Polygon'}</span></div>
              ${props.path ? `<div class="flex justify-between"><span class="font-semibold">Source:</span><span class="truncate">${props.path.split('\\').pop()}</span></div>` : ''}
            </div>
          </div>
          
          <div class="bg-blue-50 px-2 py-1 rounded mt-2 text-xs text-blue-700">
            <div class="font-semibold">📍 Administrative Boundary</div>
            <div class="text-xs">Ibaan, Batangas • CRS: EPSG:4326 (WGS84)</div>
          </div>
        </div>`;
        
        // Create and show hover label
        const hoverLabel = L.divIcon({
          html: labelContent,
          className: 'boundary-hover-label',
          iconSize: [350, 200],
          iconAnchor: [175, -20]
        });
        
        const hoverMarker = L.marker(e.latlng, { icon: hoverLabel, zIndexOffset: 1000 });
        hoverMarker.addTo(e.target._map);
        e.target._hoverMarker = hoverMarker;
      },
      mouseout: (e: any) => {
        // Reset style on mouseout
        const isSelected = feature.id === selectedBoundaryId;
       
        e.target.setStyle(adminBoundaryStyle(feature));
        
        // Remove hover label
        if (e.target._hoverMarker) {
          e.target._map.removeLayer(e.target._hoverMarker);
          e.target._hoverMarker = null;
        }
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
      eventHandlers={{
        add: (e) => {
          const layer = e.target as L.GeoJSON;
          console.log('BoundaryLayer: Layer added to map with', boundariesData.features.length, 'features');
        }
      }}
    />
  );
};

export default BoundaryLayer;