"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Calculation {
    id: number;
    title: string;
    calculation_type: string;
    input_data: any;
    result_data: any;
    units: string;
    created_at: string;
}

interface MapCalculatorProps {
    onCalculationSave?: (calculation: any) => void;
    mapState?: any;
    onMapUpdate?: (update: any) => void;
}

export default function MapCalculator({ onCalculationSave, mapState, onMapUpdate }: MapCalculatorProps) {
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [measureType, setMeasureType] = useState<'area' | 'distance'>('area');
    const [bufferType, setBufferType] = useState<'point' | 'line' | 'circle' | 'polygon'>('point');
    const [calculations, setCalculations] = useState<Calculation[]>([]);
    const [savedCalculations, setSavedCalculations] = useState<Calculation[]>([]);
    const [currentCalculation, setCurrentCalculation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [coordinates, setCoordinates] = useState({ latitude: '', longitude: '' });

    // Calculator tools configuration
    const calculatorTools = [
        {
            id: 'basemap',
            name: 'Basemap',
            icon: '🗺️',
            description: 'Choose map type'
        },
        {
            id: 'measure',
            name: 'Measure',
            icon: '📏',
            description: 'Measure area and distance',
            types: ['area', 'distance']
        },
        {
            id: 'buffer',
            name: 'Buffer',
            icon: '⭕',
            description: 'Create buffer zones',
            types: ['point', 'line', 'circle', 'polygon']
        },
        {
            id: 'coordinates',
            name: 'Coordinates',
            icon: '📍',
            description: 'Navigate to coordinates'
        }
    ];

    // Basemap options
    const basemapOptions = [
        { id: 'streets', name: 'Streets', icon: '🗺️' },
        { id: 'satellite', name: 'Satellite', icon: '🛰️' },
        { id: 'terrain', name: 'Terrain', icon: '⛰️' },
        { id: 'dark', name: 'Dark', icon: '🌙' },
        { id: 'light', name: 'Light', icon: '☀️' },
        { id: 'hybrid', name: 'Hybrid', icon: '🌍' }
    ];

    // Buffer types
    const bufferTypes = [
        { id: 'point', name: 'Point', icon: '📍' },
        { id: 'line', name: 'Line', icon: '📏' },
        { id: 'circle', name: 'Circle', icon: '⭕' },
        { id: 'polygon', name: 'Polygon', icon: '📐' }
    ];

    // Distance units
    const distanceUnits = ['kilometers', 'meters', 'miles', 'feet'];

    // Fetch saved calculations
    const fetchSavedCalculations = async () => {
        try {
            const response = await fetch('/api/map-data?type=calculations');
            const data = await response.json();
            if (data.success) {
                setSavedCalculations(data.data);
            }
        } catch (error) {
            console.error('Error fetching saved calculations:', error);
        }
    };

    useEffect(() => {
        fetchSavedCalculations();
    }, []);

    // Perform calculation based on tool type
    const performCalculation = (toolId: string, inputData: any) => {
        let result: any = {};

        switch (toolId) {
            case 'area':
                result = calculateArea(inputData);
                break;
            case 'distance':
                result = calculateDistance(inputData);
                break;
            case 'buffer':
                result = calculateBuffer(inputData);
                break;
        }

        setCurrentCalculation({
            tool: toolId,
            input: inputData,
            result: result,
            timestamp: new Date().toISOString()
        });
    };

    // Calculation functions
    const calculateArea = (inputData: any) => {
        const { coordinates, unit = 'hectares' } = inputData;
        
        // Simplified area calculation
        let area = 0;
        if (coordinates && coordinates.length > 2) {
            // Shoelace formula for polygon area
            for (let i = 0; i < coordinates.length; i++) {
                const j = (i + 1) % coordinates.length;
                area += coordinates[i][0] * coordinates[j][1];
                area -= coordinates[j][0] * coordinates[i][1];
            }
            area = Math.abs(area) / 2;
        }

        const conversions: { [key: string]: number } = {
            hectares: 0.0001,
            sqmeters: 1,
            sqkilometers: 0.000001
        };

        return {
            value: area * (conversions[unit] || 1),
            unit: unit,
            formatted: `${(area * (conversions[unit] || 1)).toFixed(2)} ${unit}`
        };
    };

    const calculateDistance = (inputData: any) => {
        const { points, unit = 'kilometers' } = inputData;
        
        let distance = 0;
        if (points && points.length >= 2) {
            for (let i = 0; i < points.length - 1; i++) {
                const dx = points[i + 1][0] - points[i][0];
                const dy = points[i + 1][1] - points[i][1];
                distance += Math.sqrt(dx * dx + dy * dy);
            }
        }

        const conversions: { [key: string]: number } = {
            kilometers: 1,
            meters: 1000,
            miles: 0.621371,
            feet: 5280
        };

        return {
            value: distance * (conversions[unit] || 1),
            unit: unit,
            formatted: `${(distance * (conversions[unit] || 1)).toFixed(2)} ${unit}`
        };
    };

    const calculateBuffer = (inputData: any) => {
        const { center, radius, unit = 'meters', type = bufferType } = inputData;
        
        const bufferArea = Math.PI * radius * radius;
        
        return {
            type: type,
            radius: { value: radius, unit: unit },
            area: { value: bufferArea, unit: `sq${unit}` },
            circumference: { value: 2 * Math.PI * radius, unit: unit }
        };
    };

    // Go to coordinates
    const goToCoordinates = () => {
        if (coordinates.latitude && coordinates.longitude) {
            const lat = parseFloat(coordinates.latitude);
            const lng = parseFloat(coordinates.longitude);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                onMapUpdate?.({
                    center: [lat, lng],
                    zoom: 12
                });
                
                // Save as calculation
                performCalculation('coordinates', {
                    latitude: lat,
                    longitude: lng
                });
            }
        }
    };

    // Update map when basemap is selected
    const updateBasemap = (basemapId: string) => {
        onMapUpdate?.({
            basemap: basemapId
        });
        
        // Save as calculation
        performCalculation('basemap', {
            basemap: basemapId
        });
    };

    // Save calculation
    const saveCalculation = async () => {
        if (!currentCalculation) return;

        setIsLoading(true);
        try {
            const tool = calculatorTools.find(t => t.id === currentCalculation.tool);
            const calculationData = {
                user_id: 'anonymous',
                title: `${tool?.name} - ${new Date().toLocaleString()}`,
                calculation_type: currentCalculation.tool,
                input_data: currentCalculation.input,
                result_data: currentCalculation.result,
                units: 'metric',
                map_state: mapState
            };

            const response = await fetch('/api/map-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'calculation', data: calculationData })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Calculation saved:', result);
                fetchSavedCalculations();
                onCalculationSave?.(result);
            }
        } catch (error) {
            console.error('Error saving calculation:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Delete saved calculation
    const deleteCalculation = async (id: number) => {
        try {
            const response = await fetch(`/api/map-data?type=calculation&id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSavedCalculations(prev => prev.filter(calc => calc.id !== id));
            }
        } catch (error) {
            console.error('Error deleting calculation:', error);
        }
    };

    return (
        <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto">
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Viewer Portal</h3>
                
                {/* Calculator Tools */}
                <div className="space-y-2 mb-6">
                    {calculatorTools.map((tool) => (
                        <motion.button
                            key={tool.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                            className={`w-full p-3 rounded-lg border transition-colors ${
                                activeTool === tool.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{tool.icon}</span>
                                <div className="text-left">
                                    <div className="font-medium text-gray-900">{tool.name}</div>
                                    <div className="text-xs text-gray-500">{tool.description}</div>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Tool-specific options */}
                <AnimatePresence>
                    {activeTool === 'basemap' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-gray-50 rounded-lg"
                        >
                            <h4 className="font-medium text-gray-900 mb-3">Choose Map Type</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {basemapOptions.map((basemap) => (
                                    <button
                                        key={basemap.id}
                                        onClick={() => updateBasemap(basemap.id)}
                                        className={`p-3 rounded-lg border transition-colors ${
                                            mapState?.basemap === basemap.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="text-2xl text-center">{basemap.icon}</div>
                                        <div className="text-xs text-center mt-1">{basemap.name}</div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTool === 'measure' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-gray-50 rounded-lg"
                        >
                            <h4 className="font-medium text-gray-900 mb-3">Measure</h4>
                            
                            {/* Measure Type Selection */}
                            <div className="flex gap-2 mb-3">
                                {(['area', 'distance'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setMeasureType(type)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            measureType === type
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {type === 'area' ? '1- Area' : '2- Distance'}
                                    </button>
                                ))}
                            </div>

                            {/* Input field */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {measureType === 'area' ? 'Draw polygon on map' : 'Draw line on map'}
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    rows={3}
                                    placeholder={measureType === 'area' ? 'Click on map to draw area...' : 'Click on map to measure distance...'}
                                    onChange={(e) => {
                                        const input = e.target.value;
                                        if (input) {
                                            // Mock coordinate parsing
                                            const coords = input.split(',').map(s => 
                                                s.trim().split(' ').map(Number)
                                            );
                                            performCalculation(measureType, { 
                                                coordinates: coords[0] || [],
                                                unit: 'hectares'
                                            });
                                        }
                                    }}
                                />
                            </div>
                            
                            {/* Result */}
                            {currentCalculation?.result && (
                                <div className="p-3 bg-white rounded border">
                                    <div className="text-sm font-medium text-gray-700 mb-1">Result:</div>
                                    <div className="text-lg font-semibold text-blue-600">
                                        {currentCalculation.result.formatted || 
                                         JSON.stringify(currentCalculation.result)}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTool === 'buffer' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-gray-50 rounded-lg"
                        >
                            <h4 className="font-medium text-gray-900 mb-3">Buffer</h4>
                            
                            {/* Buffer Type Selection */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {bufferTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setBufferType(type.id as any)}
                                            className={`p-2 rounded-lg text-sm border transition-colors ${
                                                bufferType === type.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className="text-lg mr-1">{type.icon}</span>
                                            {type.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Distance Parameter */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Distance Parameter</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="Enter distance..."
                                    onChange={(e) => {
                                        const distance = parseFloat(e.target.value);
                                        if (!isNaN(distance)) {
                                            performCalculation('buffer', { 
                                                type: bufferType,
                                                distance: distance,
                                                unit: 'meters'
                                            });
                                        }
                                    }}
                                />
                            </div>

                            {/* Units Selection */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    onChange={(e) => {
                                        if (currentCalculation?.input) {
                                            performCalculation('buffer', {
                                                ...currentCalculation.input,
                                                unit: e.target.value
                                            });
                                        }
                                    }}
                                >
                                    {distanceUnits.map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                            </div>
                        </motion.div>
                    )}

                    {activeTool === 'coordinates' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-gray-50 rounded-lg"
                        >
                            <h4 className="font-medium text-gray-900 mb-3">Coordinates</h4>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                    <input
                                        type="text"
                                        value={coordinates.latitude}
                                        onChange={(e) => setCoordinates(prev => ({ ...prev, latitude: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        placeholder="Enter latitude..."
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                    <input
                                        type="text"
                                        value={coordinates.longitude}
                                        onChange={(e) => setCoordinates(prev => ({ ...prev, longitude: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        placeholder="Enter longitude..."
                                    />
                                </div>
                                
                                <button
                                    onClick={goToCoordinates}
                                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                                >
                                    Go
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Save Calculation */}
                {currentCalculation && (
                    <div className="flex gap-2">
                        <button
                            onClick={saveCalculation}
                            disabled={isLoading}
                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={() => setCurrentCalculation(null)}
                            className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                        >
                            Clear
                        </button>
                    </div>
                )}

                {/* Saved Calculations */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-3">Saved Calculations</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {savedCalculations.length === 0 ? (
                            <p className="text-sm text-gray-500">No saved calculations</p>
                        ) : (
                            savedCalculations.map((calc) => (
                                <motion.div
                                    key={calc.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 text-sm">{calc.title}</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(calc.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-blue-600 mt-1">
                                                {JSON.stringify(calc.result_data).substring(0, 50)}...
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteCalculation(calc.id)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
