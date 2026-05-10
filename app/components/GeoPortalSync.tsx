"use client";

import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface SyncStatus {
  success: boolean;
  message: string;
  data?: any;
}

export default function GeoPortalSync() {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<SyncStatus | null>(null);

  const syncGeoPortalLayers = async () => {
    setSyncing(true);
    setStatus(null);
    
    try {
      const response = await fetch('/api/geoportal/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setStatus({
          success: true,
          message: result.message,
          data: result.data
        });
        
        // Trigger a refresh of map layers
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('layersUpdated', { 
            detail: { timestamp: Date.now() } 
          }));
        }, 1000);
      } else {
        setStatus({
          success: false,
          message: result.error || 'Sync failed'
        });
      }
    } catch (error) {
      setStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync on component mount
  useEffect(() => {
    syncGeoPortalLayers();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">GeoPortal Layers</h3>
        <button
          onClick={syncGeoPortalLayers}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Sync Layers
            </>
          )}
        </button>
      </div>

      {status && (
        <div className={`p-3 rounded-md mb-3 ${
          status.success 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {status.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm font-medium">{status.message}</span>
          </div>
          
          {status.data && (
            <div className="mt-2 text-sm">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="font-semibold">Total:</span> {status.data.total}
                </div>
                <div>
                  <span className="font-semibold">Created:</span> {status.data.created}
                </div>
                <div>
                  <span className="font-semibold">Updated:</span> {status.data.updated}
                </div>
              </div>
              {status.data.layers && status.data.layers.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="font-semibold">Layers:</span>
                  <ul className="mt-1 space-y-1">
                    {status.data.layers.map((layer: any, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          layer.action === 'created' ? 'bg-green-500' : 
                          layer.action === 'updated' ? 'bg-blue-500' : 
                          'bg-red-500'
                        }`} />
                        {layer.layer}: {layer.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p className="mb-2">
          <strong>Auto-synced layers:</strong>
        </p>
        <ul className="space-y-1 text-xs">
          <li>• 2020 Land Cover Map of Region 4-A</li>
          <li>• Climate Type</li>
          <li>• Landslide 1:10,000 Susceptibility</li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">
          These layers are automatically fetched from https://geoportal.gov.ph and displayed on both Viewer and LGU map pages.
        </p>
      </div>
    </div>
  );
}
