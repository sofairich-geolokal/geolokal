"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Layers } from 'lucide-react';
import shp from 'shpjs';
import JSZip from 'jszip';

interface UploadedLayer {
  id: string;
  name: string;
  geometry: any;
  color: string;
  visible: boolean;
}

export default function LayerUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [uploadedLayers, setUploadedLayers] = useState<UploadedLayer[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showAddLayerModal, setShowAddLayerModal] = useState(false);
  const [tempGeoJSON, setTempGeoJSON] = useState<any>(null);
  const [tempName, setTempName] = useState('');
  const [customLayerColor, setCustomLayerColor] = useState('#318855');
  const [saveToDatabase, setSaveToDatabase] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const colors = ['#333333', '#FF0000', '#0000FF', '#318855', '#FFA500', '#800080', '#F59E0B', '#52C47D'];

  useEffect(() => { setMounted(true); }, []);

  const handleProcessFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      let filesToProcess = files;
      
      // Check if a zip file is uploaded
      const zipFile = files.find(f => f.name.toLowerCase().endsWith('.zip'));
      if (zipFile) {
        const zip = new JSZip();
        const zipBuffer = await zipFile.arrayBuffer();
        const loadedZip = await zip.loadAsync(zipBuffer);
        
        // Extract all files from zip
        const extractedFiles: File[] = [];
        for (const [filename, file] of Object.entries(loadedZip.files)) {
          if (!file.dir) {
            const blob = await file.async('blob');
            const extractedFile = new File([blob], filename, { type: blob.type });
            extractedFiles.push(extractedFile);
          }
        }
        filesToProcess = extractedFiles;
      }

      const shpFile = filesToProcess.find(f => f.name.toLowerCase().endsWith('.shp'));
      const shxFile = filesToProcess.find(f => f.name.toLowerCase().endsWith('.shx'));
      const dbfFile = filesToProcess.find(f => f.name.toLowerCase().endsWith('.dbf'));

      if (!shpFile) {
        throw new Error("Missing .shp file. Please select all required shapefile components (.shp, .shx, .dbf) or a zip file containing them.");
      }
      if (!shxFile) {
        throw new Error("Missing .shx file. Please select all required shapefile components (.shp, .shx, .dbf) or a zip file containing them.");
      }
      if (!dbfFile) {
        throw new Error("Missing .dbf file. Please select all required shapefile components (.shp, .shx, .dbf) or a zip file containing them.");
      }
      
      const baseName = shpFile.name.replace(/\.[^/.]+$/, "");

      // Zip files together using JSZip for shpjs
      const zip = new JSZip();
      await Promise.all(filesToProcess.map(async (file) => {
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
      setError(err.message || "Failed to parse shapefile. Ensure you included .shp, .shx, and .dbf files.");
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

        const response = await fetch('/api/layers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
          setError(`Failed to save layer: ${result.error || 'Unknown error'}. Layer added locally only.`);
        } else {
          newLayer.id = result.data.id.toString();
          setSuccess(`Layer "${tempName}" saved to database successfully!`);
        }
      } catch (err: any) {
        console.error('Error saving layer:', err);
        setError(`Failed to save layer to database. Layer added locally only.`);
      } finally {
        setIsSaving(false);
      }
    }

    setUploadedLayers([...uploadedLayers, newLayer]);
    setShowAddLayerModal(false);
    setSaveToDatabase(false);
  };

  const toggleLayerVisibility = (id: string) => {
    setUploadedLayers(uploadedLayers.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const deleteLayer = (id: string) => {
    setUploadedLayers(uploadedLayers.filter(l => l.id !== id));
  };

  if (!mounted) return null;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
        <Upload size={20} className="mr-2 text-[#318855]" />
        Upload Map Layer
      </h2>

      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".shp,.shx,.dbf,.prj,.cpg,.zip"
          onChange={handleProcessFiles}
          className="hidden"
          id="layer-upload"
        />
        <label 
          htmlFor="layer-upload"
          className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-8 px-4 hover:border-[#318855] hover:bg-green-50 cursor-pointer transition-all"
        >
          <Upload className="text-gray-400 mb-2" size={32} />
          <span className="text-sm font-medium text-gray-600 text-center">Select shapefile files or a zip file</span>
          <span className="text-xs text-gray-400 mt-1">Required: .shp, .shx, .dbf (optional: .prj, .cpg) or upload a .zip file</span>
        </label>
        {isProcessing && <p className="text-xs text-[#318855] mt-2 animate-pulse">Processing geometry...</p>}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-600">{success}</p>
          </div>
        )}
      </div>

      <div className="h-px bg-gray-100 my-4" />

      {/* Layer List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Uploaded Layers</h3>
        {uploadedLayers.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center py-4">No layers uploaded yet.</p>
        )}
        {uploadedLayers.map((layer) => (
          <div 
            key={layer.id}
            className="p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <button
                  onClick={() => toggleLayerVisibility(layer.id)}
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${layer.visible ? 'opacity-100' : 'opacity-30'}`}
                  style={{ backgroundColor: layer.color }}
                />
                <span className="text-sm font-semibold text-gray-700 truncate">{layer.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${layer.visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {layer.visible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <button 
                onClick={() => deleteLayer(layer.id)}
                className="text-gray-300 hover:text-red-500 ml-2"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Layer Modal */}
      {showAddLayerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-1">New Layer Detected</h3>
            <p className="text-sm text-gray-500 mb-6">Customize how the layer appears on the map.</p>
            
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
                <label htmlFor="saveToDatabase" className="text-sm text-gray-700">Save to database (visible in Viewer and LGU dashboards)</label>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAddLayerModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all">Discard</button>
              <button onClick={confirmAddLayer} disabled={isSaving} className="flex-1 py-3 text-sm font-bold bg-[#318855] text-white rounded-xl shadow-lg shadow-green-200 hover:bg-[#266a43] transition-all disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Add Layer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
