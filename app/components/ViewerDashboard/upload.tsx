"use client";

import React, { useState, useCallback } from 'react';

const GISUploadComponent = () => {
  const [uploading, setUploading] = useState(false);
  const [layerType, setLayerType] = useState('waterways'); // Default category
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const files = (e.target as HTMLFormElement).elements.namedItem('gisFiles') as HTMLInputElement;
    const fileList = files.files;

    if (!fileList || fileList.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least the .dbf file.' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    // 1. Add metadata for Dashboard/Database categorization
    formData.append('layerType', layerType);

    // 2. Append all associated files (.dbf, .prj, .shp, etc.)
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]);
    }

    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/spatial/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Successfully processed ${result.count} new ${layerType} features. Duplicates ignored.` 
        });
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">GIS Data Importer</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        {/* Layer Type Selection for Dashboard Counters */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Data Category</label>
          <select 
            value={layerType} 
            onChange={(e) => setLayerType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
          >
            <option value="waterways">Waterways (Creeks, Rivers)</option>
            <option value="roads">Road Networks</option>
            <option value="boundaries">Administrative Boundaries</option>
          </select>
        </div>

        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input 
            type="file" 
            name="gisFiles" 
            multiple 
            accept=".dbf,.prj,.shp,.qmd"
            className="hidden" 
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-blue-600 font-semibold">Click to upload</span> or drag and drop
            <p className="text-xs text-gray-500 mt-1">Upload .dbf and .prj files for {layerType}</p>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
            uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {uploading ? 'Processing Spatial Data...' : 'Save to Database'}
        </button>
      </form>

      {message.text && (
        <div className={`mt-4 p-3 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default GISUploadComponent;