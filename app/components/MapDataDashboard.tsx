"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MapCalculation {
    id: number;
    title: string;
    calculation_type: string;
    result_data: any;
    created_at: string;
}

interface MapCustomization {
    id: number;
    title: string;
    description?: string;
    created_at: string;
    is_public: boolean;
}

interface MapDataDashboardProps {
    userId?: string;
}

export default function MapDataDashboard({ userId = 'anonymous' }: MapDataDashboardProps) {
    const [calculations, setCalculations] = useState<MapCalculation[]>([]);
    const [customizations, setCustomizations] = useState<MapCustomization[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'calculations' | 'customizations'>('calculations');

    useEffect(() => {
        fetchMapData();
    }, []);

    const fetchMapData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/map-data?userId=${userId}`);
            const data = await response.json();
            
            if (data.success) {
                // Fetch calculations and customizations separately
                const [calcResponse, custResponse] = await Promise.all([
                    fetch(`/api/map-data?type=calculations&userId=${userId}`),
                    fetch(`/api/map-data?type=customizations&userId=${userId}`)
                ]);
                
                const calcData = await calcResponse.json();
                const custData = await custResponse.json();
                
                if (calcData.success) setCalculations(calcData.data);
                if (custData.success) setCustomizations(custData.data);
            }
        } catch (error) {
            console.error('Error fetching map data:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteCalculation = async (id: number) => {
        try {
            const response = await fetch(`/api/map-data?type=calculation&userId=${userId}&id=${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setCalculations(prev => prev.filter(calc => calc.id !== id));
            }
        } catch (error) {
            console.error('Error deleting calculation:', error);
        }
    };

    const deleteCustomization = async (id: number) => {
        try {
            const response = await fetch(`/api/map-data?type=customization&userId=${userId}&id=${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setCustomizations(prev => prev.filter(cust => cust.id !== id));
            }
        } catch (error) {
            console.error('Error deleting customization:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCalculationIcon = (type: string) => {
        const icons: { [key: string]: string } = {
            'area': '📐',
            'distance': '📏',
            'buffer': '⭕',
            'elevation': '⛰️',
            'volume': '📦'
        };
        return icons[type] || '🧮';
    };

    const getCalculationTypeName = (type: string) => {
        const names: { [key: string]: string } = {
            'area': 'Area Measurement',
            'distance': 'Distance Measurement',
            'buffer': 'Buffer Analysis',
            'elevation': 'Elevation Profile',
            'volume': 'Volume Calculation'
        };
        return names[type] || type;
    };

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Map Data Dashboard</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('calculations')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'calculations'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        🧮 Calculations ({calculations.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('customizations')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'customizations'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        🎨 Customizations ({customizations.length})
                    </button>
                </div>
            </div>

            {/* Calculations Tab */}
            {activeTab === 'calculations' && (
                <div>
                    {calculations.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">🧮</div>
                            <p className="text-gray-500">No saved calculations yet</p>
                            <p className="text-sm text-gray-400 mt-2">
                                Use the Map Calculator on the GeoPortal page to create calculations
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {calculations.map((calculation, index) => (
                                <motion.div
                                    key={calculation.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">
                                                    {getCalculationIcon(calculation.calculation_type)}
                                                </span>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {calculation.title}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">
                                                        {getCalculationTypeName(calculation.calculation_type)}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-2">
                                                <p className="text-sm text-gray-600">Result:</p>
                                                <p className="text-lg font-semibold text-blue-600">
                                                    {calculation.result_data?.formatted || 
                                                     JSON.stringify(calculation.result_data).substring(0, 50)}...
                                                </p>
                                            </div>
                                            
                                            <p className="text-xs text-gray-400">
                                                {formatDate(calculation.created_at)}
                                            </p>
                                        </div>
                                        
                                        <button
                                            onClick={() => deleteCalculation(calculation.id)}
                                            className="ml-4 text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Customizations Tab */}
            {activeTab === 'customizations' && (
                <div>
                    {customizations.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">🎨</div>
                            <p className="text-gray-500">No saved customizations yet</p>
                            <p className="text-sm text-gray-400 mt-2">
                                Use the Map Customizer on the GeoPortal page to create custom map styles
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {customizations.map((customization, index) => (
                                <motion.div
                                    key={customization.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">🗺️</span>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {customization.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {customization.is_public && (
                                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                                Public
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-500">
                                                            Map Customization
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {customization.description && (
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {customization.description}
                                                </p>
                                            )}
                                            
                                            <p className="text-xs text-gray-400">
                                                {formatDate(customization.created_at)}
                                            </p>
                                        </div>
                                        
                                        <button
                                            onClick={() => deleteCustomization(customization.id)}
                                            className="ml-4 text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
