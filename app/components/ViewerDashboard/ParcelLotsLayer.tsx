"use client";

import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import proj4 from 'proj4';
import ibaanLotsData from '@/data/ibaan_lots.json';

// Correct PRS92 PTM Zone 3 Projection for Batangas
const PRS92_PTM3 = "+proj=tmerc +lat_0=0 +lon_0=121 +k=0.99995 +x_0=500000 +y_0=0 +ellps=clrk66 +towgs84=-127.62,-67.24,-47.04,-3.068,4.903,1.578,-1.06 +units=m +no_defs";
const WGS84 = "EPSG:4326";

interface ParcelLotsLayerProps {
  isVisible: boolean;
  onBoundsReady?: (bounds: L.LatLngBounds) => void;
}

const ParcelLotsLayer = ({ isVisible, onBoundsReady }: ParcelLotsLayerProps) => {
  const [convertedData, setConvertedData] = useState<any>(null);

  useEffect(() => {
    if (ibaanLotsData && (ibaanLotsData as any).features) {
      const data = ibaanLotsData as any;
      const transformed = {
        ...data,
        features: data.features.map((feature: any) => {
          if (!feature.geometry || !feature.geometry.coordinates) return feature;

          const transformCoord = (coord: any) => {
            return proj4(PRS92_PTM3, WGS84, [Number(coord[0]), Number(coord[1])]);
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
  }, []);

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
    // Add hover effect
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.7, weight: 2, color: '#d35400' });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(lotStyle);
      }
    });

    if (feature.properties?.LotNumber) {
      layer.bindPopup(`<strong>Lot: ${feature.properties.LotNumber}</strong>`);
    }
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