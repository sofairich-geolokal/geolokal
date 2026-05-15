"use client";

import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import proj4 from 'proj4';

// Correct PRS92 PTM Zone 3 Projection for Batangas
const PRS92_PTM3 = "+proj=tmerc +lat_0=0 +lon_0=121 +k=0.99995 +x_0=500000 +y_0=0 +ellps=clrk66 +towgs84=-127.62,-67.24,-47.04,-3.068,4.903,1.578,-1.06 +units=m +no_defs";
const WGS84 = "EPSG:4326";

interface ParcelLotsLayerProps {
  isVisible: boolean;
  onBoundsReady?: (bounds: L.LatLngBounds) => void;
}

const ParcelLotsLayer = ({ isVisible, onBoundsReady }: ParcelLotsLayerProps) => {
  const [convertedData, setConvertedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch lots data from database
  useEffect(() => {
    const fetchLotsData = async () => {
      try {
        setLoading(true);
        let geoData = null;
        
        // Try to fetch from database first
        try {
          const dbResponse = await fetch('/api/lots');
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
          try {
            const localResponse = await fetch('/data/ibaan_lots.json');
            geoData = await localResponse.json();
          } catch (e) { 
            console.log("No local lot data found."); 
          }
        }
        
        if (geoData && geoData.features) {
          const transformed = {
            ...geoData,
            features: geoData.features.map((feature: any) => {
              if (!feature.geometry || !feature.geometry.coordinates) return feature;

              const transformCoord = (coord: any) => {
                const x = Number(coord[0]);
                const y = Number(coord[1]);
                // Data is already in WGS84 format (EPSG:4326), so no transformation needed
                // Just return the coordinates as-is
                return [x, y];
              };

              const transformPolygon = (poly: any) => poly.map((ring: any) => ring.map(transformCoord));

              let newCoords = feature.geometry.type === 'Polygon' 
                ? transformPolygon(feature.geometry.coordinates)
                : feature.geometry.coordinates.map(transformPolygon);

              return { ...feature, geometry: { ...feature.geometry, coordinates: newCoords } };
            })
          };
          setConvertedData(transformed);
        }
      } catch (error) {
        console.error('Error fetching lots data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      fetchLotsData();
    }
  }, [isVisible]);

  if (!isVisible || !convertedData) return null;

  // STYLING TO MATCH IMAGE_4A3A00.JPG
  const lotStyle = {
    color: "#e67e22",      // Solid Orange Border
    weight: 1.5,           // Thin, sharp lines
    fillColor: "#fd9644",  // Lighter orange fill
    fillOpacity: 0.4,      // Semi-transparent as seen in the screenshot
    dashArray: "",         // Keep lines solid
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    // Add hover effect with detailed information
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.7, weight: 2, color: '#FFFFFF' });
        
        // Show detailed hover information box
        const props = feature.properties || {};
        const labelContent = `<div class="bg-white px-4 py-3 rounded-lg shadow-xl border border-gray-300 text-xs" style="position: absolute; z-index: 1000; pointer-events: none; min-width: 280px; max-width: 350px;">
          <div class="border-b border-gray-200 pb-2 mb-2">
            <div class="font-bold text-orange-800 text-sm mb-1">${props.LotNumber || 'Parcel Lot'}</div>
            <div class="text-gray-500 text-xs">Parcel Information</div>
          </div>
          
          <div class="space-y-1">
            ${props.LotNumber ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Lot Number:</span><span class="text-gray-600">${props.LotNumber}</span></div>` : ''}
            ${props.BlockNumbe ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Block Number:</span><span class="text-gray-600">${props.BlockNumbe}</span></div>` : ''}
            ${props.Area ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Area:</span><span class="text-gray-600">${props.Area} sqm</span></div>` : ''}
            ${props.Claimant ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Claimant:</span><span class="text-gray-600">${props.Claimant}</span></div>` : ''}
            ${props.BarangayNa ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Barangay:</span><span class="text-gray-600">${props.BarangayNa}</span></div>` : ''}
            ${props.SurveyPlan ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Survey Plan:</span><span class="text-gray-600">${props.SurveyPlan}</span></div>` : ''}
            ${props.ApplicantN ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Applicant:</span><span class="text-gray-600">${props.ApplicantN}</span></div>` : ''}
            ${props.ParcelId ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Parcel ID:</span><span class="text-gray-600">${props.ParcelId}</span></div>` : ''}
            ${props.SurveyId ? `<div class="flex justify-between"><span class="font-semibold text-gray-700">Survey ID:</span><span class="text-gray-600">${props.SurveyId}</span></div>` : ''}
          </div>
          
          <div class="border-t border-gray-200 pt-2 mt-2">
            <div class="text-gray-500 text-xs space-y-1">
              <div class="flex justify-between"><span class="font-semibold">Feature ID:</span><span>${feature.id}</span></div>
              <div class="flex justify-between"><span class="font-semibold">Geometry:</span><span>${feature.geometry?.type || 'Polygon'}</span></div>
              ${props.layer ? `<div class="flex justify-between"><span class="font-semibold">Layer:</span><span class="truncate">${props.layer}</span></div>` : ''}
            </div>
          </div>
          
          <div class="bg-orange-50 px-2 py-1 rounded mt-2 text-xs text-orange-700">
            <div class="font-semibold">📐 Parcel Lot</div>
            <div class="text-xs">Ibaan, Batangas • CRS: EPSG:4326 (WGS84)</div>
          </div>
        </div>`;
        
        // Create and show hover label
        const hoverLabel = L.divIcon({
          html: labelContent,
          className: 'parcel-hover-label',
          iconSize: [350, 200],
          iconAnchor: [175, -20]
        });
        
        const hoverMarker = L.marker(e.latlng, { icon: hoverLabel, zIndexOffset: 1000 });
        hoverMarker.addTo(e.target._map);
        e.target._hoverMarker = hoverMarker;
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(lotStyle);
        
        // Remove hover label
        if (e.target._hoverMarker) {
          e.target._map.removeLayer(e.target._hoverMarker);
          e.target._hoverMarker = null;
        }
      },
      click: (e) => {
        const props = feature.properties || {};
        const content = `<div class="p-3 min-w-[200px] text-xs">
          <h4 class="font-bold mb-2">Parcel Details</h4>
          ${props.LotNumber ? `<div><b>Lot Number:</b> ${props.LotNumber}</div>` : ''}
          ${props.BlockNumbe ? `<div><b>Block Number:</b> ${props.BlockNumbe}</div>` : ''}
          ${props.Area ? `<div><b>Area:</b> ${props.Area} sqm</div>` : ''}
          ${props.Claimant ? `<div><b>Claimant:</b> ${props.Claimant}</div>` : ''}
          ${props.BarangayNa ? `<div><b>Barangay:</b> ${props.BarangayNa}</div>` : ''}
          <div><b>Geometry:</b> ${feature.geometry.type}</div>
        </div>`;
        layer.bindPopup(content).openPopup();
      }
    });
    
    // Default popup for when not clicked
    layer.bindPopup(`<h4 class="font-bold">${feature.properties?.LotNumber || 'Parcel Lot'}</h4>
      <div class="text-xs text-gray-600">
        ${feature.properties?.BarangayNa ? `Barangay: ${feature.properties.BarangayNa}` : 'Parcel Area'}
      </div>`);
  };

  return (
    <GeoJSON 
      data={convertedData} 
      style={lotStyle}
      onEachFeature={onEachFeature}
      eventHandlers={{
        add: (e) => {
          const layer = e.target as L.GeoJSON;
          if (onBoundsReady) onBoundsReady(layer.getBounds());
          // Ensure this layer stays on top
          layer.bringToFront();
        }
      }}
    />
  );
};

export default ParcelLotsLayer;