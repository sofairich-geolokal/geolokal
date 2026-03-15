'use client';
import { MapContainer, TileLayer, WMSTileLayer, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const { BaseLayer, Overlay } = LayersControl;

const GeoMap = () => {
  return (
    <MapContainer 
      center={[31.4504, 73.1350]} // Centered on Faisalabad
      zoom={14} 
      style={{ height: '600px', width: '100%', borderRadius: '15px' }}
    >
      <LayersControl position="topright">
        {/* Base Maps */}
        <BaseLayer checked name="Open Street Map">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </BaseLayer>
        
        <BaseLayer name="Satellite (Esri)">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        </BaseLayer>

        {/* Dynamic GeoServer Layers */}
        <Overlay checked name="Construction Areas">
          <WMSTileLayer
            url="http://localhost:8080/geoserver/wms"
            params={{
              layers: 'LGU:construction_sites', // Replace with your workspace:layer
              format: 'image/png',
              transparent: true,
              styles: 'construction_style' // The style you created in Step 1
            }}
          />
        </Overlay>

        <Overlay name="Built-up Areas">
          <WMSTileLayer
            url="http://localhost:8080/geoserver/wms"
            params={{
              layers: 'LGU:built_areas',
              format: 'image/png',
              transparent: true,
            }}
          />
        </Overlay>
      </LayersControl>

      {/* Manual Legend Overlay to match your reference image */}
      <div className="absolute bottom-10 left-10 z-[1000] bg-white p-4 rounded-xl shadow-lg border border-gray-200 min-w-[200px]">
        <h4 className="font-bold text-gray-700 text-sm mb-3 uppercase tracking-wider">Color Indicators</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-sm bg-orange-500 border border-orange-700"></span>
            <span className="text-xs font-medium text-gray-600">Construction Areas</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-sm bg-green-500 border border-green-700"></span>
            <span className="text-xs font-medium text-gray-600">Built-up Areas</span>
          </div>
        </div>
      </div>
    </MapContainer>
  );
};

export default GeoMap;