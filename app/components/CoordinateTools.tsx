'use client';
import { useState, useEffect } from 'react';
import proj4 from 'proj4';

interface CoordinatePoint {
  lat: number;
  lng: number;
  x?: number;
  y?: number;
}

interface Projection {
  code: string;
  name: string;
  proj4Def: string;
  unit: string;
}

const CoordinateTools = () => {
  const [inputCoords, setInputCoords] = useState<CoordinatePoint>({ lat: 0, lng: 0 });
  const [convertedCoords, setConvertedCoords] = useState<CoordinatePoint>({ lat: 0, lng: 0 });
  const [sourceProjection, setSourceProjection] = useState('EPSG:4326');
  const [targetProjection, setTargetProjection] = useState('EPSG:3857');
  const [batchInput, setBatchInput] = useState('');
  const [batchResults, setBatchResults] = useState<CoordinatePoint[]>([]);
  const [showBatch, setShowBatch] = useState(false);

  const projections: Projection[] = [
    {
      code: 'EPSG:4326',
      name: 'WGS 84 (Geographic)',
      proj4Def: '+proj=longlat +datum=WGS84 +no_defs',
      unit: 'degrees',
    },
    {
      code: 'EPSG:3857',
      name: 'Web Mercator',
      proj4Def: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs',
      unit: 'meters',
    },
    {
      code: 'EPSG:3123',
      name: 'PRSF92 / Philippines Zone III',
      proj4Def: '+proj=tmerc +lat_0=0 +lon_0=120 +k=0.99995 +x_0=500000 +y_0=0 +ellps=clrk66 +towgs84=-127.62,-67.24,47.04,-1.87,-4.95,-0.99,-1.39 +units=m +no_defs',
      unit: 'meters',
    },
    {
      code: 'EPSG:3124',
      name: 'PRSF92 / Philippines Zone IV',
      proj4Def: '+proj=tmerc +lat_0=0 +lon_0=123 +k=0.99995 +x_0=500000 +y_0=0 +ellps=clrk66 +towgs84=-127.62,-67.24,47.04,-1.87,-4.95,-0.99,-1.39 +units=m +no_defs',
      unit: 'meters',
    },
    {
      code: 'EPSG:3125',
      name: 'PRSF92 / Philippines Zone V',
      proj4Def: '+proj=tmerc +lat_0=0 +lon_0=125 +k=0.9999 +x_0=500000 +y_0=0 +ellps=clrk66 +towgs84=-127.62,-67.24,47.04,-1.87,-4.95,-0.99,-1.39 +units=m +no_defs',
      unit: 'meters',
    },
    {
      code: 'EPSG:3126',
      name: 'PRSF92 / Philippines Zone VI',
      proj4Def: '+proj=tmerc +lat_0=0 +lon_0=127 +k=0.9999 +x_0=500000 +y_0=0 +ellps=clrk66 +towgs84=-127.62,-67.24,47.04,-1.87,-4.95,-0.99,-1.39 +units=m +no_defs',
      unit: 'meters',
    },
  ];

  useEffect(() => {
    // Register projection definitions
    projections.forEach(proj => {
      proj4.defs(proj.code, proj.proj4Def);
    });
  }, []);

  const convertCoordinates = () => {
    try {
      const sourceProj = projections.find(p => p.code === sourceProjection);
      const targetProj = projections.find(p => p.code === targetProjection);
      
      if (!sourceProj || !targetProj) {
        throw new Error('Invalid projection selected');
      }

      let x, y;
      
      if (sourceProjection === 'EPSG:4326') {
        // Input is lat/lng (geographic)
        x = inputCoords.lng;
        y = inputCoords.lat;
      } else {
        // Input is projected coordinates
        x = inputCoords.x || 0;
        y = inputCoords.y || 0;
      }

      const result = proj4(sourceProjection, targetProjection, [x, y]);
      
      let converted: CoordinatePoint;
      
      if (targetProjection === 'EPSG:4326') {
        // Output is lat/lng (geographic)
        converted = { lng: result[0], lat: result[1] };
      } else {
        // Output is projected coordinates
        converted = { x: result[0], y: result[1], lat: 0, lng: 0 };
      }
      
      setConvertedCoords(converted);
    } catch (error) {
      console.error('Coordinate conversion error:', error);
      alert('Error converting coordinates. Please check your input values.');
    }
  };

  const batchConvert = () => {
    try {
      const lines = batchInput.trim().split('\n');
      const results: CoordinatePoint[] = [];
      
      const sourceProj = projections.find(p => p.code === sourceProjection);
      const targetProj = projections.find(p => p.code === targetProjection);
      
      if (!sourceProj || !targetProj) {
        throw new Error('Invalid projection selected');
      }

      lines.forEach((line, index) => {
        const coords = line.trim().split(/[\s,;]+/);
        if (coords.length >= 2) {
          let x, y;
          
          if (sourceProjection === 'EPSG:4326') {
            x = parseFloat(coords[1]); // longitude
            y = parseFloat(coords[0]); // latitude
          } else {
            x = parseFloat(coords[0]);
            y = parseFloat(coords[1]);
          }
          
          if (!isNaN(x) && !isNaN(y)) {
            const result = proj4(sourceProjection, targetProjection, [x, y]);
            
            let converted: CoordinatePoint;
            
            if (targetProjection === 'EPSG:4326') {
              converted = { lng: result[0], lat: result[1] };
            } else {
              converted = { x: result[0], y: result[1], lat: 0, lng: 0 };
            }
            
            results.push(converted);
          }
        }
      });
      
      setBatchResults(results);
    } catch (error) {
      console.error('Batch conversion error:', error);
      alert('Error in batch conversion. Please check your input format.');
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setInputCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your current location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const exportResults = () => {
    const data = showBatch ? batchResults : [convertedCoords];
    const sourceProj = projections.find(p => p.code === sourceProjection);
    const targetProj = projections.find(p => p.code === targetProjection);
    
    let csv = `Coordinate Conversion Results\n`;
    csv += `Source Projection: ${sourceProj?.name} (${sourceProjection})\n`;
    csv += `Target Projection: ${targetProj?.name} (${targetProjection})\n`;
    csv += `Generated: ${new Date().toISOString()}\n\n`;
    
    if (targetProjection === 'EPSG:4326') {
      csv += `Latitude,Longitude\n`;
      data.forEach(point => {
        csv += `${point.lat},${point.lng}\n`;
      });
    } else {
      csv += `X,Y\n`;
      data.forEach(point => {
        csv += `${point.x},${point.y}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coordinate-conversion-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCoordinate = (coord: CoordinatePoint, projection: string) => {
    if (projection === 'EPSG:4326') {
      return `Lat: ${coord.lat.toFixed(6)}, Lng: ${coord.lng.toFixed(6)}`;
    } else {
      return `X: ${coord.x?.toFixed(2)}, Y: ${coord.y?.toFixed(2)}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Coordinate System & Projection Tools</h2>

      {/* Single Point Conversion */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Single Point Conversion</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Input Coordinates</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Source Projection
                </label>
                <select
                  value={sourceProjection}
                  onChange={(e) => setSourceProjection(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  {projections.map((proj) => (
                    <option key={proj.code} value={proj.code}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              {sourceProjection === 'EPSG:4326' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={inputCoords.lat}
                      onChange={(e) => setInputCoords({ ...inputCoords, lat: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="e.g., 14.5995"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={inputCoords.lng}
                      onChange={(e) => setInputCoords({ ...inputCoords, lng: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="e.g., 120.9842"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      X Coordinate
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={inputCoords.x || ''}
                      onChange={(e) => setInputCoords({ ...inputCoords, x: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="e.g., 500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Y Coordinate
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={inputCoords.y || ''}
                      onChange={(e) => setInputCoords({ ...inputCoords, y: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="e.g., 1500000"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={getCurrentLocation}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                📍 Use Current Location
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Converted Coordinates</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Target Projection
                </label>
                <select
                  value={targetProjection}
                  onChange={(e) => setTargetProjection(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  {projections.map((proj) => (
                    <option key={proj.code} value={proj.code}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Result:</div>
                <div className="font-mono text-lg text-blue-600">
                  {formatCoordinate(convertedCoords, targetProjection)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Unit: {projections.find(p => p.code === targetProjection)?.unit}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={convertCoordinates}
                  className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  🔄 Convert
                </button>
                <button
                  onClick={exportResults}
                  className="flex-1 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                  📤 Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Conversion */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Batch Conversion</h3>
          <button
            onClick={() => setShowBatch(!showBatch)}
            className="text-blue-500 hover:text-blue-600"
          >
            {showBatch ? 'Hide' : 'Show'}
          </button>
        </div>

        {showBatch && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Input Coordinates (one per line, comma or space separated)
              </label>
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                className="w-full h-32 border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                placeholder={sourceProjection === 'EPSG:4326' 
                  ? "14.5995, 120.9842\n10.3157, 123.8854\n7.0731, 125.6128"
                  : "500000, 1500000\n600000, 1600000\n700000, 1700000"
                }
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={batchConvert}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                🔄 Batch Convert
              </button>
              <button
                onClick={() => setBatchResults([])}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Clear Results
              </button>
            </div>

            {batchResults.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Results ({batchResults.length} points)</h4>
                <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                  {batchResults.map((point, index) => (
                    <div key={index} className="font-mono text-sm text-gray-600">
                      {formatCoordinate(point, targetProjection)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Projection Information */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Projection Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projections.map((proj) => (
            <div key={proj.code} className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-800">{proj.name}</div>
              <div className="text-sm text-gray-600">{proj.code}</div>
              <div className="text-xs text-gray-500 mt-1">Unit: {proj.unit}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoordinateTools;
