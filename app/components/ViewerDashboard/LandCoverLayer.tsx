"use client";

import React, { useEffect, useState } from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import L from 'leaflet';

interface LandCoverLayerProps {
  isVisible: boolean;
  isHighlighted?: boolean;
  onBoundsReady?: (bounds: [[number, number], [number, number]]) => void;
}

// Land cover type colors - unified yellow color as requested
const landCoverColors: { [key: string]: string } = {
  'Open Forest': '#FFFF00',
  'Brush/Shrubs': '#FFFF00', 
  'Grassland': '#FFFF00',
  'Perennial Crop': '#FFFF00',
  'Annual Crop': '#FFFF00',
  'Built-up': '#FFFF00',
  'Open/Barren': '#FFFF00',
  'Fishpond': '#FFFF00',
  'Inland Water': '#FFFF00',
  'Mangrove Forest': '#FFFF00',
  // Fallback colors for legacy classifications
  'Forest': '#FFFF00',
  'Agriculture': '#FFFF00',
  'Urban': '#FFFF00',
  'Water': '#FFFF00',
  'Wetland': '#FFFF00',
  'Barren': '#FFFF00',
  'Mangrove': '#FFFF00',
  'Shrubland': '#FFFF00',
  'default': '#FFFF00'
};

// Land cover style function
const getLandCoverStyle = (feature: any) => {
  const landCoverType = feature.properties?.LAND_COVER || 
                        feature.properties?.CLASS_NAME || 
                        feature.properties?.COVER_TYPE || 
                        'default';
  
  const color = landCoverColors[landCoverType] || landCoverColors['default'];
  
  return {
    fillColor: color,
    weight: 1,
    opacity: 0.8,
    color: '#000000',
    fillOpacity: 0.7,
    className: 'land-cover-polygon'
  };
};

export default function LandCoverLayer({ isVisible, isHighlighted = false, onBoundsReady }: LandCoverLayerProps) {
  const [landCoverData, setLandCoverData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch land cover data directly from ArcGIS API
  const fetchLandCoverData = async () => {
    if (!isVisible) return; // Don't fetch if layer is not visible
    
    setLoading(true);
    setError(null);
    
    try {
      // ArcGIS REST API endpoint
      const arcgisUrl = 'https://services3.arcgis.com/pNwij5WvjK23c10k/ArcGIS/rest/services/Land_Cover__NAMRIA_2020_/FeatureServer/0/query';
      
      // Build query parameters
      const params = new URLSearchParams({
        f: 'json',
        where: '1=1', // Get all features
        outFields: '*', // Get all fields
        returnGeometry: 'true',
        outSR: '4326', // WGS84 coordinate system
        resultRecordCount: '1000' // Limit features for performance
      });
      
      console.log('Fetching land cover data from ArcGIS API...');
      const response = await fetch(`${arcgisUrl}?${params.toString()}`, {
        headers: {
          'User-Agent': 'GeoLokal/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`ArcGIS API error: ${response.status} ${response.statusText}`);
      }
      
      const arcgisData = await response.json();
      console.log('ArcGIS response received:', arcgisData);
      
      // Check for ArcGIS API errors
      if (arcgisData.error) {
        throw new Error(`ArcGIS API Error: ${arcgisData.error.message || JSON.stringify(arcgisData.error)}`);
      }
      
      // Transform ArcGIS features to GeoJSON format
      const geoJsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: arcgisData.features?.map((feature: any) => {
          const { attributes, geometry } = feature;
          
          // Convert ESRI polygon geometry to GeoJSON if needed
          let geoJsonGeometry = geometry;
          if (geometry && geometry.rings) {
            // ESRI rings format: first ring is exterior, subsequent rings are holes
            const coordinates = geometry.rings.map((ring: number[][]) => 
              ring.map(coord => [coord[0], coord[1]]) // [longitude, latitude]
            );
            geoJsonGeometry = {
              type: 'Polygon',
              coordinates: coordinates
            };
          }
          
          return {
            type: 'Feature',
            geometry: geoJsonGeometry,
            properties: {
              ...attributes,
              // Keep original ArcGIS attributes
              OBJECTID: attributes.OBJECTID,
              CLASS_ID: attributes.CLASS_ID,
              CLASS_NAME: attributes.CLASS_NAME,
              PROVINCE: attributes.PROVINCE,
              REG_CODE: attributes.REG_CODE,
              REG_NAME: attributes.REG_NAME,
              AREA_HA: attributes.AREA_HA,
              Shape__Area: attributes.Shape__Area,
              Shape__Length: attributes.Shape__Length
            }
          };
        }) || []
      };
      
      console.log('Setting land cover data with', geoJsonData.features?.length, 'features');
      setLandCoverData(geoJsonData);
      
      // Notify parent component about bounds if data is available
      if (onBoundsReady && geoJsonData.features && geoJsonData.features.length > 0) {
        const bounds = L.geoJSON(geoJsonData).getBounds();
        if (bounds.isValid()) {
          onBoundsReady([
            [bounds.getSouth(), bounds.getWest()],
            [bounds.getNorth(), bounds.getEast()]
          ]);
        }
      }
      
    } catch (error) {
      console.error('Error fetching land cover data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when layer becomes visible
  useEffect(() => {
    console.log('LandCoverLayer useEffect triggered - isVisible:', isVisible);
    if (isVisible) {
      console.log('LandCoverLayer is visible, fetching data...');
      fetchLandCoverData();
    } else {
      console.log('LandCoverLayer is hidden, not fetching data');
    }
  }, [isVisible]);

  // Don't render anything if layer is not visible
  if (!isVisible) {
    console.log('LandCoverLayer: Not visible, returning null');
    return null;
  }

  console.log('LandCoverLayer: Checking render state - loading:', loading, 'error:', error, 'data length:', landCoverData?.features?.length);

  // Show loading state
  if (loading) {
    console.log('LandCoverLayer: Rendering loading state');
    return (
      <div className="absolute top-4 left-4 bg-white p-2 rounded shadow-lg z-[1000]">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-700">Loading Land Cover...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.log('LandCoverLayer: Rendering error state:', error);
    return (
      <div className="absolute top-4 left-4 bg-red-50 p-2 rounded shadow-lg z-[1000]">
        <div className="text-sm text-red-700">
          Error loading Land Cover: {error}
        </div>
      </div>
    );
  }

  // Show no data state
  if (!landCoverData || !landCoverData.features || landCoverData.features.length === 0) {
    console.log('LandCoverLayer: Rendering no data state');
    return (
      <div className="absolute top-4 left-4 bg-yellow-50 p-2 rounded shadow-lg z-[1000]">
        <div className="text-sm text-yellow-700">
          No Land Cover data available
        </div>
      </div>
    );
  }

  console.log('LandCoverLayer: About to render GeoJSON with data:', landCoverData ? landCoverData.features?.length : 'null');
  if (!landCoverData || !landCoverData.features || landCoverData.features.length === 0) {
    console.log('LandCoverLayer: No data to render, returning null');
    return null;
  }
  
  console.log('LandCoverLayer: Rendering GeoJSON component');
  return (
    <GeoJSON
      data={landCoverData}
      style={getLandCoverStyle}
      onEachFeature={(feature, layer) => {
        // Add popup with land cover information
        if (feature.properties) {
          const popupContent = `
            <div style="min-width: 220px;">
              <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #333;">
                Land Cover Information
              </h4>
              <div style="margin-bottom: 4px;">
                <strong>Classification:</strong> ${feature.properties.CLASS_NAME || 'Unknown'}
              </div>
              ${feature.properties.CLASS_ID ? `<div style="margin-bottom: 4px;"><strong>Class ID:</strong> ${feature.properties.CLASS_ID}</div>` : ''}
              ${feature.properties.PROVINCE ? `<div style="margin-bottom: 4px;"><strong>Province:</strong> ${feature.properties.PROVINCE}</div>` : ''}
              ${feature.properties.REG_NAME ? `<div style="margin-bottom: 4px;"><strong>Region:</strong> ${feature.properties.REG_NAME}</div>` : ''}
              ${feature.properties.AREA_HA ? `<div style="margin-bottom: 4px;"><strong>Area (ha):</strong> ${feature.properties.AREA_HA.toLocaleString()}</div>` : ''}
              ${feature.properties.Shape__Area ? `<div style="margin-bottom: 4px;"><strong>Shape Area:</strong> ${parseFloat(feature.properties.Shape__Area).toFixed(2)}</div>` : ''}
              <div style="margin-bottom: 4px;">
                <strong>Source:</strong> NAMRIA 2020
              </div>
            </div>
          `;
          
          layer.bindPopup(popupContent);
        }
        
        // Add hover effect
        layer.on({
          mouseover: function(e) {
            const layer = e.target;
            layer.setStyle({
              weight: 2,
              color: '#ff0000',
              fillOpacity: 0.8
            });
            layer.bringToFront();
          },
          mouseout: function(e) {
            const layer = e.target;
            layer.setStyle(getLandCoverStyle(layer.feature));
          }
        });
      }}
    />
  );
}
