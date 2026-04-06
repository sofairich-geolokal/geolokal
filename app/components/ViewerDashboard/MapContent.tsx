"use client";
import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, FeatureGroup, useMap } from 'react-leaflet';
import ShapefileLayer from './ShapefileLayer';
import ZoomControl from './ZoomControl';
import AdvancedMapTools from './AdvancedMapTools';
import GeospatialAnalysis from './GeospatialAnalysis';
import BuildingsLayer from './BuildingsLayer';
import HeatMapLayer from './HeatMapLayer';
import BoundaryLayer from './BoundaryLayer';
import RoadNetworksLayer from './RoadNetworksLayer';
import WaterwaysLayer from './WaterwaysLayer';
import L from 'leaflet';

// Map component with shapefile layers, zoom controls, and advanced geospatial tools
interface MapContentProps {
  layers: {
    street: boolean;
    satellite: boolean;
    heatMap: boolean;
    buildings: boolean;
    measure: boolean;
    boundary: boolean;
    roadNetworks: boolean;
    waterways: boolean;
  };
  selectedCategory?: string | null;
}

const MapContent: React.FC<MapContentProps> = ({ layers, selectedCategory }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<L.Layer[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [measureMode, setMeasureMode] = useState(layers.measure);

  // Handle map instance
  const MapEvents = () => {
    const map = useMap();
    
    React.useEffect(() => {
      setMap(map);
    }, [map]);

    // Handle feature selection
    React.useEffect(() => {
      const handleFeatureClick = (e: any) => {
        const layer = e.layer;
        if (!selectedFeatures.includes(layer)) {
          setSelectedFeatures(prev => [...prev, layer]);
          // Highlight selected feature
          if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
            layer.setStyle({
              color: '#EF4444',
              weight: 4,
              opacity: 1
            });
          }
        }
      };

      map.on('layeradd', handleFeatureClick);
      
      return () => {
        map.off('layeradd', handleFeatureClick);
      };
    }, [map, selectedFeatures]);

    return null;
  };

  const clearSelection = () => {
    selectedFeatures.forEach(feature => {
      // Reset style
      if (feature instanceof L.Polygon || feature instanceof L.Polyline) {
        feature.setStyle({
          color: '#3B82F6',
          weight: 3,
          opacity: 0.8
        });
      }
    });
    setSelectedFeatures([]);
  };

  const toggleAnalysis = () => {
    setShowAnalysis(!showAnalysis);
  };

  const toggleDrawMode = () => {
    setDrawMode(!drawMode);
    setMeasureMode(false); // Only one mode at a time
  };

  const toggleMeasureMode = () => {
    setMeasureMode(!measureMode);
    setDrawMode(false); // Only one mode at a time
  };

  return (
    <>
      <MapContainer
        center={[13.7595, 121.1258]} // Center of Batangas area
        zoom={12}
        style={{ height: '90%', width: '100%' }}
        className="z-0"
        zoomControl={false} // Disable default zoom control
      >
        <MapEvents />
        
        {/* Custom Zoom Control positioned at bottom right */}
        <ZoomControl />
        
        {/* Feature Group for drawn items */}
        <FeatureGroup>
          {/* This will contain drawn features */}
        </FeatureGroup>
        
        {/* Base Layers */}
        {layers.street && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        )}

        {layers.satellite && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          />
        )}

        {/* Buildings Layer */}
        <BuildingsLayer
          isVisible={layers.buildings}
          isHighlighted={selectedCategory === 'buildings'}
        />

        {/* Heat Map Layer */}
        <HeatMapLayer
          isVisible={layers.heatMap}
          isHighlighted={selectedCategory === 'heatMap'}
        />

        {/* Shapefile Layers */}
        <BoundaryLayer
          isVisible={layers.boundary}
          isHighlighted={selectedCategory === 'boundary'}
        />

        <RoadNetworksLayer
          isVisible={layers.roadNetworks}
          isHighlighted={selectedCategory === 'roadNetworks'}
        />

        <WaterwaysLayer
          isVisible={layers.waterways}
          isHighlighted={selectedCategory === 'waterways'}
        />

        {/* Enhanced Layer Integration */}
        {layers.boundary && (
          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-lg shadow-lg p-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-red-600"></div>
              <span className="text-gray-700">Administrative Boundaries: Active</span>
            </div>
          </div>
        )}
        
        {layers.roadNetworks && (
          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-lg shadow-lg p-2 text-xs mt-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-gray-800"></div>
              <span className="text-gray-700">Road Networks: Active (Dark)</span>
            </div>
          </div>
        )}
        
        {layers.waterways && (
          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-lg shadow-lg p-2 text-xs mt-16">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-sky-300"></div>
              <span className="text-gray-700">Waterways: Active (Sky Blue)</span>
            </div>
          </div>
        )}

        {/* Advanced Map Tools */}
        <AdvancedMapTools 
          map={map} 
          measureMode={measureMode}
          drawMode={drawMode}
        />
      </MapContainer>

      
      {/* Geospatial Analysis Panel */}
      {showAnalysis && (
        <GeospatialAnalysis 
          map={map} 
          selectedFeatures={selectedFeatures}
        />
      )}
    </>
  );
};

export default MapContent;
