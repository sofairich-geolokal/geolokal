'use client';
import { useState, useEffect } from 'react';

interface Layer {
  id: number;
  layer_name: string;
  layer_type: 'wms' | 'vector' | 'raster';
  is_visible: boolean;
  is_downloadable: boolean;
  opacity: number;
  min_zoom: number;
  max_zoom: number;
  attribution: string;
  projection: string;
  z_index: number;
  style_config: any;
  bbox: any;
  project_categories?: {
    id: number;
    name: string;
  };
  city_muni_master?: {
    id: number;
    name: string;
  };
  users?: {
    id: number;
    username: string;
  };
}

interface Category {
  id: number;
  name: string;
}

interface LGU {
  id: number;
  name: string;
}

const LayerManager = () => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lgu, setLgu] = useState<LGU[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLayer, setEditingLayer] = useState<Layer | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState({
    category: '',
    lgu: '',
    type: '',
    search: '',
  });

  useEffect(() => {
    fetchLayers();
    fetchCategories();
    fetchLGUs();
  }, [filter]);

  const fetchLayers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.lgu) params.append('lguId', filter.lgu);
      if (filter.type) params.append('type', filter.type);

      const response = await fetch(`/api/layers?${params}`);
      const data = await response.json();
      
      if (data.success) {
        let filteredLayers = data.data;
        
        if (filter.search) {
          filteredLayers = filteredLayers.filter((layer: Layer) =>
            layer.layer_name.toLowerCase().includes(filter.search.toLowerCase())
          );
        }
        
        setLayers(filteredLayers);
      }
    } catch (error) {
      console.error('Failed to fetch layers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchLGUs = async () => {
    try {
      const response = await fetch('/api/lgus');
      const data = await response.json();
      if (data.success) {
        setLgu(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch LGUs:', error);
    }
  };

  const handleSaveLayer = async (layerData: Partial<Layer>) => {
    try {
      const url = editingLayer ? '/api/layers' : '/api/layers';
      const method = editingLayer ? 'PUT' : 'POST';
      
      const payload = editingLayer 
        ? { id: editingLayer.id, ...layerData }
        : layerData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success) {
        fetchLayers();
        setEditingLayer(null);
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to save layer:', error);
    }
  };

  const handleDeleteLayer = async (layerId: number) => {
    if (!confirm('Are you sure you want to delete this layer?')) return;
    
    try {
      const response = await fetch(`/api/layers?id=${layerId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (result.success) {
        fetchLayers();
      }
    } catch (error) {
      console.error('Failed to delete layer:', error);
    }
  };

  const handleToggleVisibility = async (layerId: number, visible: boolean) => {
    try {
      const response = await fetch('/api/layers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: layerId,
          is_visible: visible,
        }),
      });
      
      if (response.ok) {
        fetchLayers();
      }
    } catch (error) {
      console.error('Failed to update layer visibility:', error);
    }
  };

  const getLayerIcon = (type: string) => {
    const icons = {
      wms: '🗺️',
      vector: '📊',
      raster: '🖼️',
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  const LayerForm = ({ layer, onSave, onCancel }: { 
    layer?: Layer; 
    onSave: (data: Partial<Layer>) => void; 
    onCancel: () => void; 
  }) => {
    const [formData, setFormData] = useState({
      layer_name: layer?.layer_name || '',
      layer_type: layer?.layer_type || 'wms',
      category_id: layer?.project_categories?.id || '',
      lgu_id: layer?.city_muni_master?.id || '',
      opacity: layer?.opacity || 1.0,
      min_zoom: layer?.min_zoom || 0,
      max_zoom: layer?.max_zoom || 20,
      attribution: layer?.attribution || '',
      projection: layer?.projection || 'EPSG:4326',
      z_index: layer?.z_index || 0,
      is_visible: layer?.is_visible ?? true,
      is_downloadable: layer?.is_downloadable ?? false,
      style_config: layer?.style_config || {},
      bbox: layer?.bbox || {},
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-4">
          {layer ? 'Edit Layer' : 'Add New Layer'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Layer Name
              </label>
              <input
                type="text"
                required
                value={formData.layer_name}
                onChange={(e) => setFormData({ ...formData, layer_name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Layer Type
              </label>
              <select
                value={formData.layer_type}
                onChange={(e) => setFormData({ ...formData, layer_type: e.target.value as any })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="wms">WMS</option>
                <option value="vector">Vector</option>
                <option value="raster">Raster</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LGU
              </label>
              <select
                value={formData.lgu_id}
                onChange={(e) => setFormData({ ...formData, lgu_id: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Select LGU</option>
                {lgu.map((l: LGU) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opacity
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={formData.opacity}
                onChange={(e) => setFormData({ ...formData, opacity: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projection
              </label>
              <select
                value={formData.projection}
                onChange={(e) => setFormData({ ...formData, projection: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="EPSG:4326">EPSG:4326 (WGS 84)</option>
                <option value="EPSG:3857">EPSG:3857 (Web Mercator)</option>
                <option value="EPSG:3123">EPSG:3123 (Philippines Zone III)</option>
                <option value="EPSG:3124">EPSG:3124 (Philippines Zone IV)</option>
                <option value="EPSG:3125">EPSG:3125 (Philippines Zone V)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Zoom
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.min_zoom}
                onChange={(e) => setFormData({ ...formData, min_zoom: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Zoom
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.max_zoom}
                onChange={(e) => setFormData({ ...formData, max_zoom: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Z-Index
              </label>
              <input
                type="number"
                value={formData.z_index}
                onChange={(e) => setFormData({ ...formData, z_index: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attribution
              </label>
              <input
                type="text"
                value={formData.attribution}
                onChange={(e) => setFormData({ ...formData, attribution: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_visible}
                onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                className="mr-2"
              />
              Visible
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_downloadable}
                onChange={(e) => setFormData({ ...formData, is_downloadable: e.target.checked })}
                className="mr-2"
              />
              Downloadable
            </label>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {layer ? 'Update' : 'Create'} Layer
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading layers...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Layer Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Layer
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            placeholder="Search layers..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LGU</label>
          <select
            value={filter.lgu}
            onChange={(e) => setFilter({ ...filter, lgu: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">All LGUs</option>
            {lgu.map((l: LGU) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="wms">WMS</option>
            <option value="vector">Vector</option>
            <option value="raster">Raster</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={() => setFilter({ category: '', lgu: '', type: '', search: '' })}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Layer List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No layers found</div>
        ) : (
          layers.map((layer) => (
            <div key={layer.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{getLayerIcon(layer.layer_type)}</span>
                    <span className="font-medium text-gray-800">{layer.layer_name}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      layer.is_visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {layer.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                    {layer.is_downloadable && (
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        Downloadable
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Type:</span> {layer.layer_type.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span> {layer.project_categories?.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">LGU:</span> {layer.city_muni_master?.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Opacity:</span> {layer.opacity}
                    </div>
                    <div>
                      <span className="font-medium">Zoom:</span> {layer.min_zoom}-{layer.max_zoom}
                    </div>
                    <div>
                      <span className="font-medium">Projection:</span> {layer.projection}
                    </div>
                  </div>
                  
                  {layer.attribution && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Attribution:</span> {layer.attribution}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleVisibility(layer.id, !layer.is_visible)}
                    className={`p-2 rounded ${
                      layer.is_visible ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
                    } text-white`}
                    title={layer.is_visible ? 'Hide Layer' : 'Show Layer'}
                  >
                    {layer.is_visible ? '👁️' : '👁️‍🗨️'}
                  </button>
                  
                  <button
                    onClick={() => setEditingLayer(layer)}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    title="Edit Layer"
                  >
                    ✏️
                  </button>
                  
                  <button
                    onClick={() => handleDeleteLayer(layer.id)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                    title="Delete Layer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Forms */}
      {(showAddForm || editingLayer) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full max-h-screen overflow-y-auto">
            <LayerForm
              layer={editingLayer || undefined}
              onSave={handleSaveLayer}
              onCancel={() => {
                setShowAddForm(false);
                setEditingLayer(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerManager;
