"use client";

import React, { useEffect, useState, Suspense } from 'react';

interface MapRendererProps {
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

const MapRenderer: React.FC<MapRendererProps> = ({ layers, selectedCategory }) => {
  const [isClient, setIsClient] = useState(false);
  const [MapContent, setMapContent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import MapContent only on client side
    import('./MapContent').then((mod) => {
      setMapContent(() => mod.default);
    });
  }, []);

  if (!isClient || !MapContent) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full w-full bg-gray-100">
          <div className="text-gray-600">Loading map...</div>
        </div>
      }>
        <MapContent layers={layers} selectedCategory={selectedCategory} />
      </Suspense>
    </div>
  );
};

export default MapRenderer;
