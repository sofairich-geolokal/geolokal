"use client";

import React, { useEffect, useState } from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import L from 'leaflet';

interface ClimateTypeLayerProps {
  isVisible: boolean;
  isHighlighted?: boolean;
  onBoundsReady?: (bounds: [[number, number], [number, number]]) => void;
}

// PAGASA Climate Type colors for styling
const climateTypeColors: { [key: string]: string } = {
  'Type I': '#FF6B35',      // Two pronounced seasons - dry season from November to April
  'Type II': '#4A90E2',     // No dry season, very pronounced maximum rain period from November to January
  'Type III': '#50C878',    // Seasons not very pronounced, relatively dry from November to April
  'Type IV': '#9B59B6',     // Rainfall more or less evenly distributed throughout the year
  'default': '#95A5A6'
};

// Climate type style function
const getClimateTypeStyle = (feature: any) => {
  const climateType = feature.properties?.CLIMATE_TYPE || 
                     feature.properties?.TYPE || 
                     feature.properties?.CLASSIFICATION || 
                     'default';
  
  const color = climateTypeColors[climateType] || climateTypeColors['default'];
  
  return {
    fillColor: color,
    weight: 1,
    opacity: 0.8,
    color: '#000000',
    fillOpacity: 0.6,
    className: 'climate-type-polygon'
  };
};

export default function ClimateTypeLayer({ isVisible, isHighlighted = false, onBoundsReady }: ClimateTypeLayerProps) {
  const [climateData, setClimateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch climate type data from PAGASA ArcGIS API
  const fetchClimateData = async () => {
    if (!isVisible) return; // Don't fetch if layer is not visible
    
    setLoading(true);
    setError(null);
    
    try {
      // PAGASA ArcGIS REST API endpoint for Climate Type
      const arcgisUrl = 'https://services3.arcgis.com/PDfv0I40sqpcaZxV/ArcGIS/rest/services/Philippine_ClimateType/FeatureServer/0/query';
      
      // Build query parameters
      const params = new URLSearchParams({
        f: 'json',
        where: '1=1', // Get all features
        outFields: '*', // Get all fields
        returnGeometry: 'true',
        outSR: '4326', // WGS84 coordinate system
        resultRecordCount: '1000' // Limit features for performance
      });
      
      console.log('Fetching climate type data from PAGASA ArcGIS API...');
      const response = await fetch(`${arcgisUrl}?${params.toString()}`, {
        headers: {
          'User-Agent': 'GeoLokal/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`PAGASA API error: ${response.status} ${response.statusText}`);
      }
      
      const arcgisData = await response.json();
      console.log('PAGASA response received:', arcgisData);
      
      // Check for ArcGIS API errors
      if (arcgisData.error) {
        throw new Error(`PAGASA API Error: ${arcgisData.error.message || JSON.stringify(arcgisData.error)}`);
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
              CLIMATE_TYPE: attributes.CLIMATE_TYPE || attributes.Type || 'Unknown',
              DESCRIPTION: attributes.DESCRIPTION || attributes.Description || '',
              REGION: attributes.REGION || attributes.Region || '',
              PROVINCE: attributes.PROVINCE || attributes.Province || '',
              Shape__Area: attributes.Shape__Area,
              Shape__Length: attributes.Shape__Length
            }
          };
        }) || []
      };
      
      console.log('Setting climate type data with', geoJsonData.features?.length, 'features');
      setClimateData(geoJsonData);
      
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
      console.error('Error fetching climate type data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when layer becomes visible
  useEffect(() => {
    console.log('ClimateTypeLayer useEffect triggered - isVisible:', isVisible);
    if (isVisible) {
      console.log('ClimateTypeLayer is visible, fetching data...');
      fetchClimateData();
    } else {
      console.log('ClimateTypeLayer is hidden, not fetching data');
    }
  }, [isVisible]);

  // Don't render anything if layer is not visible
  if (!isVisible) {
    console.log('ClimateTypeLayer: Not visible, returning null');
    return null;
  }

  console.log('ClimateTypeLayer: Checking render state - loading:', loading, 'error:', error, 'data length:', climateData?.features?.length);

  // Show loading state
  if (loading) {
    console.log('ClimateTypeLayer: Rendering loading state');
    return (
      <div className="absolute top-4 left-4 bg-white p-2 rounded shadow-lg z-[1000]">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-700">Loading Climate Type...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.log('ClimateTypeLayer: Rendering error state:', error);
    return (
      <div className="absolute top-4 left-4 bg-red-50 p-2 rounded shadow-lg z-[1000]">
        <div className="text-sm text-red-700">
          Error loading Climate Type: {error}
        </div>
      </div>
    );
  }

  // Show no data state
  if (!climateData || !climateData.features || climateData.features.length === 0) {
    console.log('ClimateTypeLayer: Rendering no data state');
    return (
      <div className="absolute top-4 left-4 bg-yellow-50 p-2 rounded shadow-lg z-[1000]">
        <div className="text-sm text-yellow-700">
          No Climate Type data available
        </div>
      </div>
    );
  }

  console.log('ClimateTypeLayer: About to render GeoJSON with data:', climateData ? climateData.features?.length : 'null');
  if (!climateData || !climateData.features || climateData.features.length === 0) {
    console.log('ClimateTypeLayer: No data to render, returning null');
    return null;
  }
  
  console.log('ClimateTypeLayer: Rendering GeoJSON component');
  return (
    <GeoJSON
      data={climateData}
      style={getClimateTypeStyle}
      onEachFeature={(feature, layer) => {
        // Add popup with climate type information
        if (feature.properties) {
          const popupContent = `
            <div style="min-width: 220px;">
              <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #333;">
                Climate Type Information
              </h4>
              <div style="margin-bottom: 4px;">
                <strong>Type:</strong> ${feature.properties.CLIMATE_TYPE || 'Unknown'}
              </div>
              <div style="margin-bottom: 4px;">
                <strong>Description:</strong> ${feature.properties.DESCRIPTION || 'N/A'}
              </div>
              ${feature.properties.REGION ? `<div style="margin-bottom: 4px;"><strong>Region:</strong> ${feature.properties.REGION}</div>` : ''}
              ${feature.properties.PROVINCE ? `<div style="margin-bottom: 4px;"><strong>Province:</strong> ${feature.properties.PROVINCE}</div>` : ''}
              <div style="margin-bottom: 4px;">
                <strong>Source:</strong> PAGASA Climate Classification
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
            layer.setStyle(getClimateTypeStyle(layer.feature));
          }
        });
      }}
    />
  );
}
