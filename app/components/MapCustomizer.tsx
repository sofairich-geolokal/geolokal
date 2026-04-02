"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MapCustomization {
    id?: number;
    title: string;
    description?: string;
    map_config: any;
    view_state?: any;
    is_public?: boolean;
    created_at?: string;
}

interface MapCustomizerProps {
    onCustomizationSave?: (customization: any) => void;
    onCustomizationLoad?: (customization: any) => void;
    currentMapState?: any;
}

export default function MapCustomizer({ onCustomizationSave, onCustomizationLoad, currentMapState }: MapCustomizerProps) {
    const [activeTab, setActiveTab] = useState<'layers' | 'style' | 'save'>('layers');
    const [savedCustomizations, setSavedCustomizations] = useState<MapCustomization[]>([]);
    const [currentConfig, setCurrentConfig] = useState<any>({
        basemap: 'streets',
        layers: [],
        styles: {
            opacity: 1,
            saturation: 1,
            contrast: 1
        }
    });
    const [customizationForm, setCustomizationForm] = useState({
        title: '',
        description: '',
        is_public: false
    });

    // Basemap options
    const basemapOptions = [
        { id: 'streets', name: 'Streets', icon: '🗺️' },
        { id: 'satellite', name: 'Satellite', icon: '🛰️' },
        { id: 'terrain', name: 'Terrain', icon: '⛰️' },
        { id: 'dark', name: 'Dark Mode', icon: '🌙' },
        { id: 'light', name: 'Light Mode', icon: '☀️' }
    ];

    // Layer options
    const layerOptions = [
        { id: 'boundaries', name: 'Administrative Boundaries', type: 'vector', icon: '🏢' },
        { id: 'roads', name: 'Roads', type: 'vector', icon: '🛣️' },
        { id: 'water', name: 'Water Bodies', type: 'vector', icon: '💧' },
        { id: 'elevation', name: 'Elevation Contours', type: 'raster', icon: '⛰️' },
        { id: 'landuse', name: 'Land Use', type: 'vector', icon: '🌳' },
        { id: 'population', name: 'Population Density', type: 'raster', icon: '👥' }
    ];

    // Fetch saved customizations
    const fetchSavedCustomizations = async () => {
        try {
            const response = await fetch('/api/map-data?type=customizations');
            const data = await response.json();
            if (data.success) {
                setSavedCustomizations(data.data);
            }
        } catch (error) {
            console.error('Error fetching saved customizations:', error);
        }
    };

    useEffect(() => {
        fetchSavedCustomizations();
    }, []);

    // Update current config
    const updateConfig = (key: string, value: any) => {
        setCurrentConfig((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };

    // Toggle layer
    const toggleLayer = (layerId: string) => {
        setCurrentConfig((prev: any) => ({
            ...prev,
            layers: prev.layers.some((l: any) => l.id === layerId)
                ? prev.layers.filter((l: any) => l.id !== layerId)
                : [...prev.layers, { id: layerId, visible: true, opacity: 1 }]
        }));
    };

    // Update layer property
    const updateLayerProperty = (layerId: string, property: string, value: any) => {
        setCurrentConfig((prev: any) => ({
            ...prev,
            layers: prev.layers.map((layer: any) =>
                layer.id === layerId ? { ...layer, [property]: value } : layer
            )
        }));
    };

    // Save customization
    const saveCustomization = async () => {
        try {
            const customizationData = {
                user_id: 'anonymous', // In real app, get from auth
                title: customizationForm.title,
                description: customizationForm.description,
                map_config: currentConfig,
                view_state: currentMapState,
                is_public: customizationForm.is_public
            };

            const response = await fetch('/api/map-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'customization', data: customizationData })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Customization saved:', result);
                fetchSavedCustomizations();
                onCustomizationSave?.(result);
                setCustomizationForm({ title: '', description: '', is_public: false });
            }
        } catch (error) {
            console.error('Error saving customization:', error);
        }
    };

    // Load customization
    const loadCustomization = (customization: MapCustomization) => {
        setCurrentConfig(customization.map_config);
        onCustomizationLoad?.(customization);
    };

    // Delete customization
    const deleteCustomization = async (id: number) => {
        try {
            const response = await fetch(`/api/map-data?type=customization&id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSavedCustomizations(prev => prev.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error('Error deleting customization:', error);
        }
    };

    return (
        <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto">
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Map Customizer</h3>
                
                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    {[
                        { id: 'layers', name: 'Layers', icon: '📊' },
                        { id: 'style', name: 'Style', icon: '🎨' },
                        { id: 'save', name: 'Save', icon: '💾' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span className="mr-1">{tab.icon}</span>
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Layers Tab */}
                <AnimatePresence>
                    {activeTab === 'layers' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Basemap Selection */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Basemap</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {basemapOptions.map((basemap) => (
                                        <button
                                            key={basemap.id}
                                            onClick={() => updateConfig('basemap', basemap.id)}
                                            className={`p-3 rounded-lg border transition-colors ${
                                                currentConfig.basemap === basemap.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="text-2xl text-center">{basemap.icon}</div>
                                            <div className="text-xs text-center mt-1">{basemap.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Layer Selection */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Data Layers</h4>
                                <div className="space-y-2">
                                    {layerOptions.map((layer) => {
                                        const isActive = currentConfig.layers.some((l: any) => l.id === layer.id);
                                        const layerConfig = currentConfig.layers.find((l: any) => l.id === layer.id);
                                        
                                        return (
                                            <motion.div
                                                key={layer.id}
                                                className={`p-3 rounded-lg border transition-colors ${
                                                    isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{layer.icon}</span>
                                                        <span className="text-sm font-medium">{layer.name}</span>
                                                        <span className="text-xs text-gray-500">({layer.type})</span>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleLayer(layer.id)}
                                                        className={`px-2 py-1 rounded text-xs ${
                                                            isActive
                                                                ? 'bg-red-500 text-white'
                                                                : 'bg-green-500 text-white'
                                                        }`}
                                                    >
                                                        {isActive ? 'Remove' : 'Add'}
                                                    </button>
                                                </div>
                                                
                                                {isActive && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <label className="text-xs text-gray-600">Opacity</label>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="1"
                                                                step="0.1"
                                                                value={layerConfig?.opacity || 1}
                                                                onChange={(e) => updateLayerProperty(layer.id, 'opacity', parseFloat(e.target.value))}
                                                                className="w-full"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Style Tab */}
                <AnimatePresence>
                    {activeTab === 'style' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <h4 className="font-medium text-gray-900 mb-2">Map Style</h4>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-gray-600">Overall Opacity</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={currentConfig.styles.opacity}
                                        onChange={(e) => updateConfig('styles', {
                                            ...currentConfig.styles,
                                            opacity: parseFloat(e.target.value)
                                        })}
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-500">{(currentConfig.styles.opacity * 100).toFixed(0)}%</div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600">Saturation</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={currentConfig.styles.saturation}
                                        onChange={(e) => updateConfig('styles', {
                                            ...currentConfig.styles,
                                            saturation: parseFloat(e.target.value)
                                        })}
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-500">{(currentConfig.styles.saturation * 100).toFixed(0)}%</div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600">Contrast</label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2"
                                        step="0.1"
                                        value={currentConfig.styles.contrast}
                                        onChange={(e) => updateConfig('styles', {
                                            ...currentConfig.styles,
                                            contrast: parseFloat(e.target.value)
                                        })}
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-500">{(currentConfig.styles.contrast * 100).toFixed(0)}%</div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600">Color Scheme</label>
                                    <div className="grid grid-cols-3 gap-2 mt-1">
                                        {['default', 'vibrant', 'pastel', 'dark', 'nature', 'urban'].map((scheme) => (
                                            <button
                                                key={scheme}
                                                onClick={() => updateConfig('colorScheme', scheme)}
                                                className={`px-3 py-2 rounded text-xs border ${
                                                    currentConfig.colorScheme === scheme
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200'
                                                }`}
                                            >
                                                {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Save Tab */}
                <AnimatePresence>
                    {activeTab === 'save' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <h4 className="font-medium text-gray-900 mb-2">Save Customization</h4>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={customizationForm.title}
                                        onChange={(e) => setCustomizationForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="Enter customization title..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={customizationForm.description}
                                        onChange={(e) => setCustomizationForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        rows={3}
                                        placeholder="Enter description..."
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="public"
                                        checked={customizationForm.is_public}
                                        onChange={(e) => setCustomizationForm(prev => ({ ...prev, is_public: e.target.checked }))}
                                        className="mr-2"
                                    />
                                    <label htmlFor="public" className="text-sm text-gray-700">
                                        Make public (others can view)
                                    </label>
                                </div>

                                <button
                                    onClick={saveCustomization}
                                    disabled={!customizationForm.title}
                                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                                >
                                    Save Customization
                                </button>
                            </div>

                            {/* Saved Customizations */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Saved Customizations</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {savedCustomizations.length === 0 ? (
                                        <p className="text-sm text-gray-500">No saved customizations</p>
                                    ) : (
                                        savedCustomizations.map((customization) => (
                                            <motion.div
                                                key={customization.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900 text-sm">{customization.title}</div>
                                                        {customization.description && (
                                                            <div className="text-xs text-gray-500 mt-1">{customization.description}</div>
                                                        )}
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {new Date(customization.created_at || '').toLocaleDateString()}
                                                            {customization.is_public && (
                                                                <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                                                                    Public
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => loadCustomization(customization)}
                                                            className="text-blue-500 hover:text-blue-700 text-sm"
                                                        >
                                                            Load
                                                        </button>
                                                        <button
                                                            onClick={() => customization.id && deleteCustomization(customization.id)}
                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
