"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports to prevent SSR issues with Leaflet
const EnhancedMapPopup = dynamic(() => import('../components/lguDashboard/EnhancedMapPopup'), { ssr: false });
const EnhancedViewerMap = dynamic(() => import('../components/ViewerDashboard/EnhancedViewerMap'), { ssr: false });

const MapLayersDemo = () => {
  const [showLGUMap, setShowLGUMap] = useState(false);
  const [selectedProject, setSelectedProject] = useState({
    title: "Ibaan Municipality GIS Project",
    lgu: "Ibaan, Batangas",
    category: "Comprehensive Mapping"
  });

  const sampleProject = {
    title: "Ibaan Municipality GIS Project",
    lgu: "Ibaan, Batangas",
    category: "Comprehensive Mapping"
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ GeoLokal Map Layers Demonstration
          </h1>
          <p className="text-gray-600">
            Interactive boundary, road network, and waterway layers for both LGU and Viewer interfaces
          </p>
        </div>

        {/* Layer Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Boundaries Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-600">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🏛️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Administrative Boundaries</h3>
                <p className="text-sm text-gray-600">Municipal and barangay limits</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Ibaan municipality boundary</p>
              <p>• 5 Key barangay markers</p>
              <p>• PRS92 Zone III coordinates</p>
              <p>• Red highlighting when active</p>
            </div>
          </div>

          {/* Road Networks Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-black">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🛣️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Road Networks</h3>
                <p className="text-sm text-gray-600">Transportation infrastructure</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Maharlika Highway (National)</p>
              <p>• Provincial roads to Batangas/Lipa</p>
              <p>• Municipal and farm-to-market roads</p>
              <p>• Black highlighting when active</p>
            </div>
          </div>

          {/* Waterways Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🌊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Waterways</h3>
                <p className="text-sm text-gray-600">Hydrological features</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Ibaan River (main waterway)</p>
              <p>• Sabang Creek and tributaries</p>
              <p>• Malarayat Stream system</p>
              <p>• Blue highlighting when active</p>
            </div>
          </div>
        </div>

        {/* Map Interface Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Map Interfaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowLGUMap(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3"
            >
              <span className="text-xl">🏢</span>
              <div className="text-left">
                <div className="font-semibold">LGU Map Interface</div>
                <div className="text-sm opacity-90">Administrative control panel with all layers</div>
              </div>
            </button>
            
            <div className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3">
              <span className="text-xl">👁️</span>
              <div className="text-left">
                <div className="font-semibold">Viewer Map Interface</div>
                <div className="text-sm opacity-90">Public access with interactive controls</div>
              </div>
            </div>
          </div>
        </div>

        {/* Viewer Map Display */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">👁️ Viewer Map Interface</h2>
          <div className="text-sm text-gray-600 mb-4">
            Interactive map with boundary, road network, and waterway layers. Toggle layers to see highlighting effects.
          </div>
          <EnhancedViewerMap height="500px" />
        </div>

        {/* Layer Features Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Layer Features & Highlighting</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Layer Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Normal State</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Highlighted State</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Interactive Features</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600 rounded"></div>
                      <span className="font-medium">Boundaries</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">Red boundary, 3px weight, 15% fill</td>
                  <td className="py-3 px-4">Gold (#FFD700), 4px weight, 25% fill</td>
                  <td className="py-3 px-4">Barangay markers, coordinate popups</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-black rounded"></div>
                      <span className="font-medium">Road Networks</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">Black lines, hierarchical weights</td>
                  <td className="py-3 px-4">Gold (#FFD700), increased weight</td>
                  <td className="py-3 px-4">Intersection markers, road classification</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded"></div>
                      <span className="font-medium">Waterways</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">Blue lines, width by classification</td>
                  <td className="py-3 px-4">Gold (#FFD700), increased width</td>
                  <td className="py-3 px-4">River crossings, confluence points</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Coordinates Reference */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📍 Key Location Coordinates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Municipal Center</h4>
              <p className="text-gray-600">13.7588°N, 121.1250°E</p>
              <p className="text-xs text-gray-500">Ibaan Town Proper</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Northern Boundary</h4>
              <p className="text-gray-600">13.7756°N, 121.1250°E</p>
              <p className="text-xs text-gray-500">Barangay San Isidro</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Southern Boundary</h4>
              <p className="text-gray-600">13.7421°N, 121.1250°E</p>
              <p className="text-xs text-gray-500">Barangay Sabang</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Eastern Boundary</h4>
              <p className="text-gray-600">13.7588°N, 121.1412°E</p>
              <p className="text-xs text-gray-500">Barangay Tala</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Western Boundary</h4>
              <p className="text-gray-600">13.7588°N, 121.1089°E</p>
              <p className="text-xs text-gray-500">Barangay Paligawan</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Coordinate System</h4>
              <p className="text-gray-600">PRS92 Zone III</p>
              <p className="text-xs text-gray-500">EPSG:3123</p>
            </div>
          </div>
        </div>
      </div>

      {/* LGU Map Popup Modal */}
      {showLGUMap && (
        <EnhancedMapPopup 
          project={sampleProject} 
          onClose={() => setShowLGUMap(false)} 
        />
      )}
    </div>
  );
};

export default MapLayersDemo;
