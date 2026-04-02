'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, WMSTileLayer, LayersControl, FeatureGroup, useMap } from 'react-leaflet';
import { FeatureGroup as LeafletFeatureGroup } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const { BaseLayer, Overlay } = LayersControl;

interface MapLayer {
  id: number;
  name: string;
  type: 'wms' | 'vector' | 'raster';
  url?: string;
  visible: boolean;
  opacity: number;
  style?: any;
  bbox?: any;
  minZoom?: number;
  maxZoom?: number;
}

interface AdvancedGeoMapProps {
    onMapStateChange?: (state: any) => void;
    mapState?: any;
    activeTool?: string | null;
    activeCustomizer?: string | null;
    onToolSelect?: (tool: string) => void;
}

const AdvancedGeoMap = ({ onMapStateChange, mapState, activeTool, activeCustomizer, onToolSelect }: AdvancedGeoMapProps) => {
    const [layers, setLayers] = useState<MapLayer[]>([]);
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [showCoordinates, setShowCoordinates] = useState(false);
    const mapRef = useRef<any>(null);

    // Notify parent component when tool is selected
    useEffect(() => {
        if (activeTool && onToolSelect) {
            onToolSelect(activeTool);
        }
    }, [activeTool, onToolSelect]);

    // Handle highlighting based on active tool
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Clear existing highlights
        map.eachLayer((layer: any) => {
            if (layer.options?.isHighlight) {
                map.removeLayer(layer);
            }
        });

        // Add highlighting based on active tool
        if (activeTool === 'basemap') {
            // Highlight basemap controls
            const basemapContainer = map.getContainer()?.querySelector('.leaflet-control-layers') as HTMLElement;
            if (basemapContainer) {
                basemapContainer.style.border = '2px solid #3b82f6';
                basemapContainer.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
            }
        }

        if (activeTool === 'measure' || activeTool === 'calculator') {
            // Highlight drawing controls
            const drawContainer = map.getContainer()?.querySelector('.leaflet-draw') as HTMLElement;
            if (drawContainer) {
                drawContainer.style.border = '2px solid #10b981';
                drawContainer.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)';
            }
        }

        if (activeTool === 'buffer') {
            // Highlight buffer controls
            const bufferContainer = map.getContainer()?.querySelector('.buffer-controls') as HTMLElement;
            if (bufferContainer) {
                bufferContainer.style.border = '2px solid #f59e0b';
                bufferContainer.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.15)';
            }
        }

        if (activeTool === 'coordinates') {
            // Highlight coordinate controls
            const coordContainer = map.getContainer()?.querySelector('.coordinate-controls') as HTMLElement;
            if (coordContainer) {
                coordContainer.style.border = '2px solid #ef4444';
                coordContainer.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.15)';
            }
        }
    }, [activeTool]);

    // Handle map state changes
    useEffect(() => {
        if (onMapStateChange && mapRef.current) {
            const center = mapRef.current.getCenter();
            const zoom = mapRef.current.getZoom();
            onMapStateChange({
                center: [center.lat, center.lng],
                zoom: zoom,
                basemap: mapState?.basemap || 'streets'
            });
        }
    }, [mapState, onMapStateChange]);

    const MapEvents = () => {
        const map = useMap();
        mapRef.current = map;

        useEffect(() => {
            const handleMouseMove = (e: L.LeafletMouseEvent) => {
                if (showCoordinates) {
                    setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
                }
            };

            map.on('mousemove', handleMouseMove);

            return () => {
                map.off('mousemove', handleMouseMove);
            };
        }, [map, showCoordinates]);

        return null;
    };

    // Sample layers for demonstration
    const sampleLayers: MapLayer[] = [
        {
            id: 1,
            name: 'OpenStreetMap',
            type: 'raster',
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            visible: true,
            opacity: 1
        },
        {
            id: 2,
            name: 'Satellite',
            type: 'raster',
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            visible: false,
            opacity: 0.8
        }
    ];

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={[14.5995, 120.9842]}
                zoom={10}
                style={{ height: '100%' }}
                className="z-10"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Basemap Control */}
                <div className="leaflet-control-layers">
                    <h4 className="font-bold text-gray-700 text-sm mb-3">Basemap Options</h4>
                    <div className="space-y-2">
                        <button className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm border border-gray-300">
                            🗺️ Streets
                        </button>
                        <button className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm border border-gray-300">
                            🛰️ Satellite
                        </button>
                        <button 
                            onClick={() => {
                                const map = mapRef.current;
                                if (map) {
                                    console.log('Basemap changed to terrain');
                                }
                            }}
                            className="p-3 rounded-lg border border-gray-200 hover:border-gray-300"
                        >
                            <div className="text-2xl text-center">⛰️</div>
                            <div className="text-xs text-center mt-1">Terrain</div>
                        </button>
                        <button 
                            onClick={() => {
                                const map = mapRef.current;
                                if (map) {
                                    console.log('Basemap changed to dark');
                                }
                            }}
                            className="p-3 rounded-lg border border-gray-200 hover:border-gray-300"
                        >
                            <div className="text-2xl text-center">🌙</div>
                            <div className="text-xs text-center mt-1">Dark</div>
                        </button>
                        <button 
                            onClick={() => {
                                const map = mapRef.current;
                                if (map) {
                                    console.log('Basemap changed to light');
                                }
                            }}
                            className="p-3 rounded-lg border border-gray-200 hover:border-gray-300"
                        >
                            <div className="text-2xl text-center">☀️</div>
                            <div className="text-xs text-center mt-1">Light</div>
                        </button>
                        <button 
                            onClick={() => {
                                const map = mapRef.current;
                                if (map) {
                                    console.log('Basemap changed to hybrid');
                                }
                            }}
                            className="p-3 rounded-lg border border-gray-200 hover:border-gray-300"
                        >
                            <div className="text-2xl text-center">🌍</div>
                            <div className="text-xs text-center mt-1">Hybrid</div>
                        </button>
                    </div>
                </div>

                {/* Drawing Controls */}
                <div className="leaflet-draw">
                    <h4 className="font-bold text-gray-700 text-sm mb-3">Drawing Tools</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-xs border border-gray-300">
                            📍 Point
                        </button>
                        <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-xs border border-gray-300">
                            📏 Line
                        </button>
                        <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-xs border border-gray-300">
                            📐 Polygon
                        </button>
                        <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-xs border border-gray-300">
                            ⭕ Circle
                        </button>
                    </div>
                </div>

                {/* Buffer Controls */}
                <div className="buffer-controls">
                    <h4 className="font-bold text-gray-700 text-sm mb-3">Buffer Parameters</h4>
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-gray-600">Buffer Type</label>
                            <select className="w-full px-2 py-1 border border-gray-300 rounded text-xs">
                                <option value="point">Point</option>
                                <option value="line">Line</option>
                                <option value="circle">Circle</option>
                                <option value="polygon">Polygon</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Distance (meters)</label>
                            <input type="number" className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Enter distance..." />
                        </div>
                    </div>
                </div>

                {/* Coordinate Controls */}
                <div className="coordinate-controls">
                    <h4 className="font-bold text-gray-700 text-sm mb-3">Coordinate Navigation</h4>
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-gray-600">Latitude</label>
                            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Enter latitude..." />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Longitude</label>
                            <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Enter longitude..." />
                        </div>
                        <button className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                            Go
                        </button>
                    </div>
                </div>

                {/* Coordinate Display */}
                <AnimatePresence>
                    {showCoordinates && currentCoords && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-xl shadow-lg border border-gray-200"
                        >
                            <div className="text-sm text-gray-600">
                                <div>Latitude: <span className="font-medium">{currentCoords.lat.toFixed(6)}</span></div>
                                <div>Longitude: <span className="font-medium">{currentCoords.lng.toFixed(6)}</span></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <MapEvents />
            </MapContainer>
        </div>
    );
};

export default AdvancedGeoMap;
