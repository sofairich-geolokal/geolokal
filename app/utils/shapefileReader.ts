"use client";

import shp from 'shpjs';

export interface ShapefileData {
  type: 'FeatureCollection' | 'Feature';
  features?: GeoJSON.Feature[];
  geometry?: GeoJSON.GeometryObject;
  properties?: Record<string, any>;
}

export interface LayerData {
  boundary: ShapefileData | null;
  roadNetworks: ShapefileData | null;
  waterways: ShapefileData | null;
}

export async function loadShapefile(shapefileBaseName: string): Promise<ShapefileData | null> {
  try {
    const response = await fetch(`/api/shapefiles/${shapefileBaseName}`);
    if (!response.ok) {
      console.warn(`Failed to load shapefile: ${shapefileBaseName}`);
      return null;
    }
    
    const geojson = await response.json();
    
    return geojson as ShapefileData;
  } catch (error) {
    console.error(`Error loading shapefile ${shapefileBaseName}:`, error);
    return null;
  }
}

export async function loadAllShapefiles(): Promise<LayerData> {
  const [boundary, roadNetworks, waterways] = await Promise.all([
    loadShapefile('Ibaan_boundary'),
    loadShapefile('Ibaan_roadnetworks'),
    loadShapefile('Ibaan_waterways')
  ]);

  return {
    boundary,
    roadNetworks,
    waterways
  };
}

// Utility function to get style properties for different layer types
export function getLayerStyle(layerType: string, isHighlighted: boolean = false, feature?: GeoJSON.Feature) {
  switch (layerType) {
    case 'boundary':
      return {
        color: isHighlighted ? '#FFD700' : '#ff0000', // Gold when highlighted, red when normal
        weight: isHighlighted ? 5 : 3,
        fillOpacity: isHighlighted ? 0.4 : 0.2,
        fillColor: isHighlighted ? '#FFD700' : '#ff0000',
        opacity: 1,
        dashArray: ''
      };
    case 'roadNetworks':
      return {
        color: isHighlighted ? '#FFD700' : '#000000', // Gold when highlighted, black when normal
        weight: isHighlighted ? 4 : 2,
        opacity: 0.9,
        dashArray: ''
      };
    case 'waterways':
      return {
        color: isHighlighted ? '#FFD700' : '#87CEEB', // Gold when highlighted, sky blue when normal
        weight: isHighlighted ? 4 : 2,
        opacity: 0.8,
        fillColor: isHighlighted ? '#FFD700' : '#87CEEB',
        fillOpacity: 0.4,
        dashArray: ''
      };
    default:
      return {
        color: isHighlighted ? '#FFD700' : '#3388ff', // Gold when highlighted, blue when normal
        weight: 2
      };
  }
}
