'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMap, FeatureGroup } from 'react-leaflet';
import * as turf from '@turf/turf';
import L from 'leaflet';

// Import CSS for drawing tools
import 'leaflet-draw/dist/leaflet.draw.css';

// Type declarations for leaflet-draw
declare module 'leaflet' {
  namespace Control {
    interface Draw {
      options: any;
      addTo(map: L.Map): this;
      remove(): this;
    }
  }
}

interface AdvancedMapToolsProps {
  map: L.Map | null;
  measureMode: boolean;
  drawMode: boolean;
}

const AdvancedMapTools: React.FC<AdvancedMapToolsProps> = ({ map, measureMode, drawMode }) => {
  const [drawControl, setDrawControl] = useState<any>(null);
  const [measureControl, setMeasureControl] = useState<any>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Initialize drawing tools
    const initializeDrawingTools = async () => {
      try {
        // Create feature group for drawn items
        drawnItemsRef.current = new L.FeatureGroup();
        map.addLayer(drawnItemsRef.current);

        // Drawing controls
        if (drawMode) {
          // Import leaflet-draw dynamically
          const LD = await import('leaflet-draw');
          
          // Create draw control with proper typing
          const DrawControl = (LD.default as any).Control.Draw;
          const drawControl = new DrawControl({
            edit: {
              featureGroup: drawnItemsRef.current,
              edit: true,
              remove: true
            },
            draw: {
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: '#e1e100',
                  message: '<strong>Error:</strong> Shape edges cannot cross!'
                },
                shapeOptions: {
                  color: '#3B82F6',
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0.3
                }
              },
              polyline: {
                shapeOptions: {
                  color: '#10B981',
                  weight: 4,
                  opacity: 0.8
                }
              },
              rectangle: {
                shapeOptions: {
                  color: '#F59E0B',
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0.3
                }
              },
              circle: {
                shapeOptions: {
                  color: '#EF4444',
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0.3
                }
              },
              marker: true,
              circlemarker: false
            }
          });
          
          map.addControl(drawControl);
          setDrawControl(drawControl);

          // Handle drawn features
          const handleDrawCreated = (event: any) => {
            const layer = event.layer;
            drawnItemsRef.current?.addLayer(layer);
            
            // Calculate area/perimeter using Turf.js
            const geojson = layer.toGeoJSON();
            if (geojson.geometry.type === 'Polygon') {
              const area = turf.area(geojson);
              const areaInSqKm = (area / 1000000).toFixed(2);
              alert(`Area: ${areaInSqKm} km²`);
            } else if (geojson.geometry.type === 'LineString') {
              const length = turf.length(geojson, { units: 'kilometers' });
              alert(`Length: ${length.toFixed(2)} km`);
            }
          };

          // Try to find the event constant
          const EVENT_CREATED = 'draw:created';
          map.on(EVENT_CREATED, handleDrawCreated);
        }

        // Measurement tools using Turf.js instead of geodesy
        if (measureMode) {
          // Add measurement functionality
          let measurePoints: L.LatLng[] = [];
          let measureLine: L.Polyline | null = null;
          let measureMarker: L.Marker | null = null;

          const measureClick = (e: L.LeafletMouseEvent) => {
            measurePoints.push(e.latlng);

            if (measurePoints.length > 1) {
              // Calculate distance using Turf.js
              const point1 = [measurePoints[measurePoints.length - 2].lng, measurePoints[measurePoints.length - 2].lat];
              const point2 = [measurePoints[measurePoints.length - 1].lng, measurePoints[measurePoints.length - 1].lat];
              
              const distance = turf.distance(turf.point(point1), turf.point(point2), { units: 'kilometers' });
              const distanceKm = distance.toFixed(2);

              // Draw line
              if (measureLine) {
                map.removeLayer(measureLine);
              }
              measureLine = L.polyline(measurePoints, {
                color: '#EF4444',
                weight: 3,
                opacity: 0.8,
                dashArray: '10, 10'
              });
              map.addLayer(measureLine);

              // Add distance marker
              if (measureMarker) {
                map.removeLayer(measureMarker);
              }
              measureMarker = L.marker(e.latlng)
                .addTo(map)
                .bindPopup(`Distance: ${distanceKm} km`)
                .openPopup();
            }
          };

          map.on('click', measureClick);
          map.getContainer().style.cursor = 'crosshair';

          // Cleanup function
          return () => {
            map.off('click', measureClick);
            map.getContainer().style.cursor = '';
            if (measureLine) map.removeLayer(measureLine);
            if (measureMarker) map.removeLayer(measureMarker);
          };
        }
      } catch (error) {
        console.error('Error initializing drawing tools:', error);
      }
    };

    initializeDrawingTools();

    return () => {
      // Cleanup
      if (drawControl && map) {
        map.removeControl(drawControl);
      }
      if (drawnItemsRef.current && map) {
        map.removeLayer(drawnItemsRef.current);
      }
    };
  }, [map, drawMode, measureMode]);

  return null;
};

export default AdvancedMapTools;
