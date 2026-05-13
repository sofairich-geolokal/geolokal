"use client";

import React, { useState } from 'react';
// Import the missing icons from lucide-react
import { Layers, X, ChevronRight } from 'lucide-react';

export default function GeoPortalMap() {
  // Define the missing state for toggling the legend
  const [legendsOpen, setLegendsOpen] = useState(true);

  // Define the missing 'layers' object. 
  // In a real scenario, this would likely come from props or a more complex state.
  const [layers, setLayers] = useState({
    adminBoundary: true,
    roadNetworks: true,
    rivers: true,
    parcelLots: true,
    landCover: true,
    climateType: true,
  });

  return (
    <div className="relative h-full w-full bg-gray-100">
      {/* Legends Box */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[1000] bg-white shadow-lg border border-gray-200 rounded-lg p-3 w-64">
        <div className="flex items-center justify-between mb-3 border-b pb-2 border-gray-100">
          <h3 className="text-xs font-bold text-gray-700 flex items-center uppercase tracking-wider">
            <Layers size={14} className="mr-2 text-green-600" /> Map Legends
          </h3>
          <button onClick={() => setLegendsOpen(!legendsOpen)} className="text-gray-400 hover:text-gray-600">
            {legendsOpen ? <X size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
        
        {legendsOpen && (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {Object.entries(layers).map(([key, isVisible]) => {
              // Only show the legend item if the layer is active
              if (!isVisible) return null;

              return (
                <div key={key} className="flex items-start space-x-3 text-[11px]">
                  {/* Visual Indicator/Icon */}
                  <div className="mt-1 flex-shrink-0">
                    {key === 'adminBoundary' && <div className="w-4 h-4 border-2 rounded-sm border-blue-500 bg-blue-500/20"></div>}
                    {key === 'roadNetworks' && <div className="w-4 h-1 bg-[#06a506] mt-1.5"></div>}
                    {key === 'rivers' && <div className="w-4 h-1 bg-[#2563eb] mt-1.5"></div>}
                    {key === 'parcelLots' && <div className="w-4 h-4 border-2 rounded-sm border-orange-500 bg-orange-500/20"></div>}
                    
                    {/* Categorical dots for NAMRIA/PAGASA layers */}
                    {(key === 'landCover' || key === 'climateType') && (
                      <div className="flex space-x-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${key === 'landCover' ? 'bg-green-600' : 'bg-orange-500'}`}></div>
                        <div className={`w-1.5 h-1.5 rounded-full ${key === 'landCover' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                        <div className={`w-1.5 h-1.5 rounded-full ${key === 'landCover' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      </div>
                    )}
                  </div>

                  {/* Label, Agency Source, and Percentage */}
                  <div className="flex-1 flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800 leading-tight">
                        {key === 'adminBoundary' && 'Administrative Boundaries'}
                        {key === 'roadNetworks' && 'Road Networks'}
                        {key === 'rivers' && 'Waterways'}
                        {key === 'landCover' && 'Land Cover (NAMRIA)'}
                        {key === 'climateType' && 'Climate Type (PAGASA)'}
                        {key === 'parcelLots' && 'Parcel Lots'}
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium uppercase mt-0.5">
                        {key === 'adminBoundary' || key === 'landCover' ? 'NAMRIA' : 
                         key === 'roadNetworks' ? 'DPWH' : 
                         key === 'rivers' ? 'DENR' : 
                         key === 'climateType' ? 'PAGASA' : 'LGU'}
                      </span>
                    </div>
                    
                    <div className="text-[10px] font-bold text-gray-400 ml-2">
                      {key === 'landCover' || key === 'climateType' ? '70%' : '50%'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}