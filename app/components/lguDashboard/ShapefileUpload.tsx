"use client";

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Upload, X, Layers, Download, Trash2, Eye, MapPin } from 'lucide-react';
import shp from 'shpjs';
import JSZip from 'jszip';

const ShapefileMap = dynamic(() => import('./ShapefileMap'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Initializing...</div> 
});

interface UploadedLayer {
  id: string;
  name: string;
  geometry: any;
  color: string;
  visible: boolean;
}

export default function ShapefileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [uploadedLayers, setUploadedLayers] = useState<UploadedLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState('none');

  const [showAddLayerModal, setShowAddLayerModal] = useState(false);
  const [tempGeoJSON, setTempGeoJSON] = useState<any>(null);
  const [tempName, setTempName] = useState('');
  const [customLayerColor, setCustomLayerColor] = useState('#318855');
  const [saveToDatabase, setSaveToDatabase] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const colors = ['#333333', '#FF0000', '#0000FF', '#318855', '#FFA500', '#800080'];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fetchSavedLayers = async () => {
      try {
        const response = await fetch('/api/layers');
        if (response.ok) {
          const result = await response.json();
          const savedLayers = result.data
            .filter((layer: any) => layer.metadata?.geojson)
            .map((layer: any) => ({
              id: layer.id.toString(),
              name: layer.layer_name,
              geometry: layer.metadata.geojson,
              color: layer.metadata.color || layer.style_config?.color || '#333333',
              visible: layer.is_visible !== false
            }));
          setUploadedLayers(savedLayers);
        }
      } catch (err) {
        console.error('Error fetching saved layers:', err);
      }
    };

    if (mounted) {
      fetchSavedLayers();
    }
  }, [mounted]);

  const handleProcessFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const shpFile = files.find(f => f.name.toLowerCase().endsWith('.shp'));
      if (!shpFile) {
        throw new Error("Missing .shp file.");
      }
      
      const baseName = shpFile.name.replace(/\.[^/.]+$/, "");

      // Zip files together using JSZip
      const zip = new JSZip();
      await Promise.all(files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        zip.file(file.name, buffer);
      }));

      const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

      // shpjs can parse zipped shapefiles
      const geojson = await shp(zipBuffer);

      setTempGeoJSON(geojson);
      setTempName(baseName);
      setShowAddLayerModal(true);
    } catch (err: any) {
      console.error(err);
      setError("Failed to parse shapefile. Ensure you included .shp, .shx, and .dbf files.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmAddLayer = async () => {
    const newLayer: UploadedLayer = {
      id: Math.random().toString(36).substr(2, 9),
      name: tempName,
      geometry: tempGeoJSON,
      color: customLayerColor,
      visible: true
    };

    if (saveToDatabase) {
      setIsSaving(true);
      try {
        const payload = {
          layer_name: tempName,
          layer_type: 'vector',
          metadata: {
            geojson: tempGeoJSON,
            color: customLayerColor
          },
          style_config: {
            color: customLayerColor,
            fillColor: customLayerColor,
            fillOpacity: 0,
            weight: 1.5,
            opacity: 1
          },
          is_visible: true,
          is_downloadable: false
        };

        console.log('Saving layer with payload:', payload);
        const response = await fetch('/api/layers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (!response.ok) {
          throw new Error(`Failed to save layer: ${response.status} - ${responseText}`);
        }

        const result = JSON.parse(responseText);
        newLayer.id = result.data.id.toString();
      } catch (err: any) {
        console.error('Error saving layer:', err);
        setError(`Failed to save layer to database: ${err.message}. Layer added locally only.`);
      } finally {
        setIsSaving(false);
      }
    }

    setUploadedLayers([...uploadedLayers, newLayer]);
    setSelectedLayerId(newLayer.id);
    setShowAddLayerModal(false);
    setSaveToDatabase(false);
  };

  return (
    <div className="h-screen w-full bg-[#f8f9fa] flex flex-col">
      <main className="flex-1 relative overflow-hidden">
        
        {/* Left Control Panel */}
        <div className="absolute top-10 left-10 z-[1000] bg-white rounded-2xl shadow-xl p-5 w-80 max-h-[90vh] overflow-y-auto border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
            <Upload size={20} className="mr-2 text-[#318855]" />
            Import Structure
          </h2>

          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".shp,.shx,.dbf,.prj,.cpg"
              onChange={handleProcessFiles}
              className="hidden"
              id="shp-upload"
            />
            <label 
              htmlFor="shp-upload"
              className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-6 px-4 hover:border-[#318855] hover:bg-green-50 cursor-pointer transition-all"
            >
              <Upload className="text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600 text-center">Select individual files or drag them here</span>
              <span className="text-xs text-gray-400 mt-1">(.shp, .shx, .dbf)</span>
            </label>
            {isProcessing && <p className="text-xs text-[#318855] mt-2 animate-pulse">Processing geometry...</p>}
            {error && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">{error}</p>
                </div>
            )}
          </div>

          <div className="h-px bg-gray-100 my-4" />

          {/* Layer List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Layers</h3>
            {uploadedLayers.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-4">No layers added yet.</p>
            )}
            {uploadedLayers.map((layer) => (
              <div 
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${selectedLayerId === layer.id ? 'border-[#318855] bg-green-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: layer.color }} />
                  <span className="text-sm font-semibold text-gray-700 truncate">{layer.name}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedLayers(uploadedLayers.filter(l => l.id !== layer.id));
                  }}
                  className="text-gray-300 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Map View */}
        <div className="w-full h-full">
          {mounted && (
            <ShapefileMap 
              layers={uploadedLayers} 
              basemap={mapType}
            />
          )}
        </div>

        {/* Basemap Toggle */}
        <div className="absolute bottom-6 right-6 z-[1000] flex bg-white rounded-lg shadow-lg p-1 border border-gray-200">
          <button onClick={() => setMapType('none')} className={`px-3 py-1 text-xs rounded-md ${mapType === 'none' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}>Structure</button>
          <button onClick={() => setMapType('osm')} className={`px-3 py-1 text-xs rounded-md ${mapType === 'osm' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}>Map</button>
        </div>

        {/* Add Layer Modal */}
        {showAddLayerModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <h3 className="text-xl font-bold text-gray-800 mb-1">New Layer Detected</h3>
              <p className="text-sm text-gray-500 mb-6">Customize how the structure appears.</p>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Layer Name</label>
                  <input 
                    type="text" 
                    value={tempName} 
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#318855] outline-none text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Display Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setCustomLayerColor(c)}
                        className={`w-8 h-8 rounded-full border-2 ${customLayerColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveToDatabase"
                    checked={saveToDatabase}
                    onChange={(e) => setSaveToDatabase(e.target.checked)}
                    className="w-4 h-4 text-[#318855] rounded focus:ring-[#318855]"
                  />
                  <label htmlFor="saveToDatabase" className="text-sm text-gray-700">Save to database (visible in all map screens)</label>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowAddLayerModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all">Discard</button>
                <button onClick={confirmAddLayer} className="flex-1 py-3 text-sm font-bold bg-[#318855] text-white rounded-xl shadow-lg shadow-green-200 hover:bg-[#266a43] transition-all">Add Layer</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}