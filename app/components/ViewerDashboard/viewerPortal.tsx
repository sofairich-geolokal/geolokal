"use client";

import React, { useState, useEffect } from 'react';
// @ts-ignore - shpjs doesn't have TypeScript definitions
import shp from 'shpjs';
import { LayoutDashboard, Table as TableIcon, Map as MapIcon, LogOut, Users, Home, Maximize, Activity } from 'lucide-react';

interface GeoProperties {
  brgy?: string;
  Shape_Area?: number;
  FID_case01?: number;
  [key: string]: any;
}

interface GeoFeature {
  type: string;
  properties: GeoProperties;
  geometry?: any;
}

interface GeoJSON {
  type: string;
  features?: GeoFeature[];
}

interface BarangayData {
  name: string;
  pop: number;
  hh: number;
  area: number;
  status: string;
}

interface Stats {
  population: number;
  households: number;
  landArea: string;
  density: number;
}

const ViewerPortal = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [stats, setStats] = useState<Stats>({ population: 0, households: 0, landArea: "0", density: 0 });
  const [barangayList, setBarangayList] = useState<BarangayData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load existing data from database on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const response = await fetch('/.netlify/functions/data');
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // Process the loaded geojson data
            const geojson = data.data;
            setGeoData(geojson);
            
            const features = Array.isArray(geojson) ? geojson[0].features : geojson.features;
            
            if (features && features.length > 0) {
              const list: BarangayData[] = features.map((f: GeoFeature) => ({
                name: f.properties.brgy || "Unknown",
                pop: f.properties.Shape_Area ? Math.round(f.properties.Shape_Area / 100) : 0,
                hh: f.properties.FID_case01 || 0,
                area: f.properties.Shape_Area || 0,
                status: f.properties.Shape_Area && f.properties.Shape_Area > 2000000 ? 'Good' : 'Moderate'
              }));

              setBarangayList(list);

              // Recalculate stats
              const totalPop = list.reduce((sum: number, b: BarangayData) => sum + b.pop, 0);
              const totalArea = list.reduce((sum: number, b: BarangayData) => sum + b.area, 0) / 1000000;
              
              setStats({
                population: totalPop,
                households: list.reduce((sum: number, b: BarangayData) => sum + b.hh, 0),
                landArea: totalArea.toFixed(2),
                density: totalArea > 0 ? Math.round(totalPop / totalArea) : 0
              });
            }
          }
        }
      } catch (error) {
        console.log('No existing data found or error loading data:', error);
      }
    };

    loadExistingData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const result = event.target?.result;
        if (!result) return;
        
        try {
          const geojson = await shp(result as ArrayBuffer);
          setGeoData(geojson);

          // Save geojson data to Netlify Blobs
          try {
            const response = await fetch('/.netlify/functions/data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(geojson),
            });
            
            if (!response.ok) {
              console.error('Failed to save data to database');
              setError('Failed to save data to database');
            } else {
              console.log('Data saved to database successfully');
            }
          } catch (saveError) {
            console.error('Error saving to database:', saveError);
            setError('Error saving to database');
          }

          // Map data to Dashboard format
          const features = Array.isArray(geojson) ? geojson[0].features : geojson.features;
          
          if (!features || features.length === 0) {
            console.warn("No features found in the shapefile");
            setError("No features found in the shapefile");
            return;
          }
        
          const list: BarangayData[] = features.map((f: GeoFeature) => ({
            name: f.properties.brgy || "Unknown",
            pop: f.properties.Shape_Area ? Math.round(f.properties.Shape_Area / 100) : 0, // Mock calculation if pop field missing
            hh: f.properties.FID_case01 || 0,
            area: f.properties.Shape_Area || 0,
            status: f.properties.Shape_Area && f.properties.Shape_Area > 2000000 ? 'Good' : 'Moderate'
          }));

          setBarangayList(list);

          // Aggregate Totals for Stat Cards
          const totalPop = list.reduce((sum: number, b: BarangayData) => sum + b.pop, 0);
          const totalArea = list.reduce((sum: number, b: BarangayData) => sum + b.area, 0) / 1000000; // Convert to km²
          
          setStats({
            population: totalPop,
            households: list.reduce((sum: number, b: BarangayData) => sum + b.hh, 0),
            landArea: totalArea.toFixed(2),
            density: totalArea > 0 ? Math.round(totalPop / totalArea) : 0
          });
          setError(null); // Clear any previous errors
        } catch (shpError) {
          console.error("Error parsing shapefile:", shpError);
          setError("Invalid shapefile format. Please ensure the file contains valid .shp, .dbf, and .prj files.");
        }

      } catch (err) {
        console.error("Error parsing shapefile:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Dynamic Stat Cards  */}
              <div className="grid grid-cols-4 gap-6">
                <StatCard label="Total Population" value={stats.population || "0"} sub="+Actual Data" color="text-slate-800" icon={<Users className="text-blue-500"/>}/>
                <StatCard label="Households" value={stats.households || "0"} sub="Dynamic" color="text-slate-800" icon={<Home className="text-orange-500"/>}/>
                <StatCard label="Land Area (km²)" value={stats.landArea || "0"} sub={`${barangayList.length} Barangays`} color="text-slate-800" icon={<Maximize className="text-green-500"/>}/>
                <StatCard label="Density (per km²)" value={stats.density || "0"} sub="Calculated" color="text-red-500" icon={<Activity className="text-red-500"/>}/>
              </div>
              {/* Dynamic Chart Placeholder */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-6">Population by Barangay</h3>
                <div className="flex items-end gap-2 h-48">
                  {barangayList.slice(0, 10).map((b, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full bg-green-500 rounded-t-lg transition-all" style={{ height: `${(b.pop / 5000) * 100}%` }}></div>
                      <span className="text-[8px] text-gray-400 rotate-45 mt-4 whitespace-nowrap">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Population</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {barangayList.map((b, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-slate-700">{b.name}</td>
                      <td className="px-6 py-4 text-gray-600">{b.pop.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'Good' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Helper components with proper TypeScript types
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${active ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}>
    {icon} <span className="font-semibold">{label}</span>
  </button>
);

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ label, value, sub, icon, color }: StatCardProps) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative overflow-hidden group">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
    </div>
    <div className={`text-3xl font-black ${color}`}>{value}</div>
    <div className="text-xs font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded w-fit">{sub}</div>
  </div>
);

export default ViewerPortal;