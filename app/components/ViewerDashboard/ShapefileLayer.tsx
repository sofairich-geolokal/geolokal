"use client";

import React, { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { loadShapefile, getLayerStyle, ShapefileData } from '../../utils/shapefileReader';

interface ShapefileLayerProps {
  layerName: string;
  filename: string;
  isVisible: boolean;
  isHighlighted?: boolean;
}

const ShapefileLayerComponent: React.FC<ShapefileLayerProps> = ({ 
  layerName, 
  filename, 
  isVisible,
  isHighlighted = false
}) => {
  const [shapefileData, setShapefileData] = useState<ShapefileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await loadShapefile(filename);
        if (data) {
          setShapefileData(data);
        } else {
          setError('Failed to load shapefile data');
        }
      } catch (err) {
        setError('Error loading shapefile');
        console.error('Shapefile loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filename, isVisible]);

  if (!isVisible || loading || error || !shapefileData) {
    return null;
  }

  const onEachFeature = (feature: any, layer: any) => {
    // Add popup with feature properties
    if (feature.properties) {
      const popupContent = Object.entries(feature.properties)
        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
        .join('<br>');
      layer.bindPopup(popupContent);
    }
    
    // Add hover effects
    layer.on({
      mouseover: (e: any) => {
        const targetLayer = e.target;
        if (targetLayer instanceof L.Path) {
          targetLayer.setStyle({
            weight: 3,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
          });
        }
      },
      mouseout: (e: any) => {
        const targetLayer = e.target;
        if (targetLayer instanceof L.Path) {
          targetLayer.setStyle(getLayerStyle(layerName));
        }
      }
    });
  };

  return (
    <GeoJSON
      data={shapefileData as GeoJSON.GeoJSON}
      style={() => getLayerStyle(layerName, isHighlighted)}
      onEachFeature={onEachFeature}
    />
  );
};

export default ShapefileLayerComponent;
