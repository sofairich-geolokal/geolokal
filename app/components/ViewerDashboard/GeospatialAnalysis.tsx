'use client';

import React, { useState, useEffect } from 'react';
import * as turf from '@turf/turf';
import L from 'leaflet';

interface GeospatialAnalysisProps {
  map: L.Map | null;
  selectedFeatures: L.Layer[];
}

interface AnalysisResult {
  type: string;
  result: any;
  description: string;
}

const GeospatialAnalysis: React.FC<GeospatialAnalysisProps> = ({ map, selectedFeatures }) => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [bufferRadius, setBufferRadius] = useState(1000); // meters
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (selectedFeatures.length > 0) {
      performAnalysis();
    }
  }, [selectedFeatures]);

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    const results: AnalysisResult[] = [];

    try {
      // Convert selected features to GeoJSON
      const geojsonFeatures = selectedFeatures.map(feature => {
        if (feature instanceof L.Polygon || feature instanceof L.Polyline) {
          return feature.toGeoJSON();
        }
        return null;
      }).filter(Boolean);

      if (geojsonFeatures.length === 0) return;

      // Area Analysis
      geojsonFeatures.forEach((feature: any, index) => {
        if (feature.geometry.type === 'Polygon') {
          const area = turf.area(feature);
          const areaInSqKm = (area / 1000000).toFixed(2);
          const areaInHectares = (area / 10000).toFixed(2);
          
          results.push({
            type: 'Area',
            result: { sqKm: areaInSqKm, hectares: areaInHectares },
            description: `Feature ${index + 1}: ${areaInSqKm} km² (${areaInHectares} ha)`
          });
        }

        // Length Analysis
        if (feature.geometry.type === 'LineString') {
          const length = turf.length(feature, { units: 'kilometers' });
          results.push({
            type: 'Length',
            result: { km: length.toFixed(2) },
            description: `Feature ${index + 1}: ${length.toFixed(2)} km`
          });
        }
      });

      // Buffer Analysis
      if (geojsonFeatures.length > 0) {
        const bufferedFeatures = geojsonFeatures.map((feature: any) => {
          if (feature) {
            return turf.buffer(feature, bufferRadius, { units: 'meters' });
          }
          return null;
        }).filter(Boolean);

        const totalBufferArea = bufferedFeatures.reduce((total, buffer) => {
          return total + turf.area(buffer as any);
        }, 0);

        results.push({
          type: 'Buffer',
          result: { area: (totalBufferArea / 1000000).toFixed(2) },
          description: `Buffer Zone (${bufferRadius}m): ${(totalBufferArea / 1000000).toFixed(2)} km²`
        });
      }

      // Intersection Analysis (if multiple features)
      if (geojsonFeatures.length > 1) {
        try {
          // Filter out null features and take first two valid ones
          const validFeatures = geojsonFeatures.filter((feature): feature is any => feature !== null).slice(0, 2);
          
          if (validFeatures.length >= 2) {
            // Create a FeatureCollection for intersection analysis
            const featureCollection = {
              type: 'FeatureCollection' as const,
              features: validFeatures
            };
            
            const intersection = turf.intersect(featureCollection);
            if (intersection) {
              const intersectionArea = turf.area(intersection);
              results.push({
                type: 'Intersection',
                result: { area: (intersectionArea / 1000000).toFixed(2) },
                description: `Intersection Area: ${(intersectionArea / 1000000).toFixed(2)} km²`
              });
            }
          }
        } catch (error) {
          results.push({
            type: 'Intersection',
            result: null,
            description: 'No intersection found'
          });
        }
      }

      // Centroid Analysis
      geojsonFeatures.forEach((feature: any, index) => {
        if (feature) {
          const centroid = turf.centroid(feature);
          const [lng, lat] = centroid.geometry.coordinates;
          
          results.push({
            type: 'Centroid',
            result: { lat, lng },
            description: `Feature ${index + 1} Center: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          });
        }
      });

    } catch (error) {
      console.error('Analysis error:', error);
      results.push({
        type: 'Error',
        result: null,
        description: 'Analysis failed: ' + (error as Error).message
      });
    }

    setAnalysisResults(results);
    setIsAnalyzing(false);
  };

  const createBuffer = () => {
    if (!map || selectedFeatures.length === 0) return;

    selectedFeatures.forEach(feature => {
      if (feature instanceof L.Polygon || feature instanceof L.Polyline) {
        const geojson = feature.toGeoJSON();
        const buffered = turf.buffer(geojson, bufferRadius, { units: 'meters' });
        
        // Add buffer to map
        const bufferLayer = L.geoJSON(buffered, {
          style: {
            color: '#3B82F6',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.2
          }
        });
        
        bufferLayer.bindPopup(`Buffer Zone: ${bufferRadius}m`);
        bufferLayer.addTo(map);
      }
    });
  };

  const clearAnalysis = () => {
    setAnalysisResults([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 m-4 max-w-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Geospatial Analysis</h3>
      
      {/* Buffer Controls */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buffer Radius (meters)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={bufferRadius}
            onChange={(e) => setBufferRadius(Number(e.target.value))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="100"
            max="10000"
            step="100"
          />
          <button
            onClick={createBuffer}
            disabled={!map || selectedFeatures.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Create Buffer
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      <div className="space-y-2">
        {isAnalyzing ? (
          <div className="text-gray-600 text-sm">Analyzing...</div>
        ) : analysisResults.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">Results</h4>
              <button
                onClick={clearAnalysis}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            </div>
            {analysisResults.map((result, index) => (
              <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                <div className="font-medium text-gray-800">{result.type}</div>
                <div className="text-gray-600">{result.description}</div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-gray-500 text-sm">
            Select features on the map to analyze
          </div>
        )}
      </div>
    </div>
  );
};

export default GeospatialAnalysis;
