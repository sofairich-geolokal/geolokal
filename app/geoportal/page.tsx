'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';

// Dynamically import components to avoid SSR issues
const AdvancedGeoMap = dynamic(() => import('../components/AdvancedGeoMapSimple'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading map...</div>,
});

const ActivityTracker = dynamic(() => import('../components/ActivityTracker'), {
  ssr: false,
});

const LayerManager = dynamic(() => import('../components/LayerManager'), {
  ssr: false,
});

const CoordinateTools = dynamic(() => import('../components/CoordinateTools'), {
  ssr: false,
});

const DataExport = dynamic(() => import('../components/DataExport'), {
  ssr: false,
});

const Map3DViewer = dynamic(() => import('../components/Map3DViewer'), {
  ssr: false,
});

const MapCalculator = dynamic(() => import('../components/MapCalculator'), {
  ssr: false,
});

const MapCustomizer = dynamic(() => import('../components/MapCustomizer'), {
  ssr: false,
});

export default function GeoPortalPage() {
  const [activeTab, setActiveTab] = useState('map');
  const [activeRightPanel, setActiveRightPanel] = useState<'basemap' | 'measure' | 'buffer' | 'coordinates' | 'layers' | 'tools' | 'styles' | null>(null);
  const [mapState, setMapState] = useState<any>({});

  const tabs = [
    { id: 'map', name: 'Map Viewer', icon: '🗺️' },
    { id: '3d', name: '3D Viewer', icon: '🌍' },
    { id: 'layers', name: 'Layer Manager', icon: '📊' },
    { id: 'coordinates', name: 'Coordinate Tools', icon: '📍' },
    { id: 'export', name: 'Data Export', icon: '💾' },
    { id: 'activity', name: 'Activity Log', icon: '📋' },
  ];

  const rightPanelOptions = [
    { id: 'basemap', name: 'Basemap', icon: '🗺️', description: 'Choose map type' },
    { id: 'measure', name: 'Measure', icon: '📏', description: 'Measure area and distance' },
    { id: 'buffer', name: 'Buffer', icon: '⭕', description: 'Create buffer zones' },
    { id: 'coordinates', name: 'Coordinates', icon: '📍', description: 'Navigate to coordinates' },
    { id: 'layers', name: 'Layers', icon: '📊', description: 'Manage map layers' },
    { id: 'tools', name: 'Tools', icon: '🛠️', description: 'Advanced tools' },
    { id: 'styles', name: 'Styles', icon: '🎨', description: 'Map styles and themes' },
    { id: 'calculator', name: 'Calculator', icon: '📝', description: 'Map calculator' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col"> {/* Added flex-col to keep footer at bottom */}
      <div className="flex flex-1"> {/* Wrapper for Sidebar + Main Content */}
        
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${activeRightPanel ? 'mr-80' : ''}`}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🗺️</div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">GeoPortal Philippines</h1>
                    <p className="text-sm text-gray-600">Advanced Geographic Information System</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Online</span>
                  </div>
                  
                  {/* Right Panel Options */}
                  <div className="flex gap-2">
                    {rightPanelOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setActiveRightPanel(option.id as any)}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          activeRightPanel === option.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title={option.description}
                      >
                        <span className="mr-2">{option.icon}</span>
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Navigation Tabs */}
          <nav className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Tab Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'map' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Interactive Map Viewer</h2>
                  <p className="text-gray-600 mt-2">
                    Advanced mapping tools with measurement, drawing, and layer management capabilities.
                  </p>
                </div>
                <AdvancedGeoMap 
                  onMapStateChange={setMapState}
                  mapState={mapState}
                  activeTool={activeRightPanel}
                  onToolSelect={(tool) => {
                    if (tool === 'basemap') setActiveRightPanel('basemap');
                  }}
                />
              </div>
            )}

            {activeTab === '3d' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">3D Map Viewer</h2>
                  <Map3DViewer />
                </div>
              </div>
            )}

            {activeTab === 'layers' && <LayerManager />}
            {activeTab === 'coordinates' && <CoordinateTools />}
            {activeTab === 'export' && <DataExport />}
            {activeTab === 'activity' && <ActivityTracker />}
          </main>
        </div>

        {/* Right Sidebar */}
        <AnimatePresence>
          {activeRightPanel && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="fixed right-0 top-0 h-full z-40 w-80 bg-white shadow-lg border-l border-gray-200"
            >
              <div className="p-4 h-full relative">
                {/* Close Button */}
                <button
                  onClick={() => setActiveRightPanel(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 z-50"
                >
                  ✕
                </button>

                {activeRightPanel === 'basemap' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🗺️ Basemap</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="p-3 rounded-lg border border-gray-200 hover:border-gray-300">🗺️ Streets</button>
                      <button className="p-3 rounded-lg border border-gray-200 hover:border-gray-300">🛰️ Satellite</button>
                    </div>
                  </div>
                )}

                {activeRightPanel === 'measure' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📏 Measure</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg">Area</button>
                        <button className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg">Distance</button>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-sm text-gray-700">Result: 25.50 hectares</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ... Add other panel conditionals here (buffer, coordinates, etc.) ... */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer - Now properly outside the main flex wrapper */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">About GeoPortal</h3>
              <p className="text-sm text-gray-600">Comprehensive GIS for the Philippines.</p>
            </div>
            {/* ... other footer columns ... */}
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-500">
            © 2024 GeoPortal Philippines. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}