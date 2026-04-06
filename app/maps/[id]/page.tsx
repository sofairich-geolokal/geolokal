// app/maps/[id]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const MapDetailView = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  
  // Check authentication
  useAuth();

  useEffect(() => {
    // Fetch specific project data by ID
    const fetchProjectData = async () => {
      const response = await fetch(`/api/projects/${id}`);
      const data = await response.json();
      setProject(data);
    };
    if (id) fetchProjectData();
  }, [id]);

  if (!project) return <div className="p-10 text-center">Loading Map View...</div>;

  return (
    <div className="flex h-screen w-full bg-[#f4f4f4] p-4 gap-4 font-sans">
      {/* LEFT SIDE: THE MAP AREA */}
      <div className="relative flex-grow bg-gray-300 rounded-3xl overflow-hidden shadow-lg border-4 border-white">
        {/* Placeholder for actual Map (Leaflet/Google Maps) */}
        <div 
          className="w-full h-full bg-cover bg-center" 
          style={{ backgroundImage: `url('/api/placeholder/1200/800')` }} 
        >
          {/* Map Controls Overlay */}
          <div className="absolute top-4 left-4 bg-white p-4 rounded-2xl shadow-md w-48 text-sm">
            <div className="mb-2"><input type="radio" checked readOnly /> Satellite (Esri)</div>
            <hr className="my-2" />
            <div className="space-y-1">
              <div><input type="checkbox" checked readOnly /> Admin Boundary</div>
              <div><input type="checkbox" checked readOnly /> Hazard Area</div>
            </div>
          </div>

          {/* Color Indicators Overlay */}
          <div className="absolute bottom-20 left-4 bg-white p-4 rounded-2xl shadow-md w-48">
            <h4 className="font-bold text-xs mb-2">Color Indicators</h4>
            <div className="flex items-center gap-2 text-xs mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div> Evacuation Centers
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div> Hazard Areas
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-6 left-4 flex flex-col gap-1">
            <button className="bg-white w-8 h-8 rounded-lg shadow-md font-bold text-lg">+</button>
            <button className="bg-white w-8 h-8 rounded-lg shadow-md font-bold text-lg">-</button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: DYNAMIC CATEGORY LIST */}
      <div className="w-[400px] flex flex-col gap-3 overflow-y-auto">
        {[
          { label: "DRRM", desc: `Data fetched for ${project.title}` },
          { label: "Land Use", desc: "Local datasets and GeoNode Group" },
          { label: "Real Property", desc: "Integration with existing portal" },
          { label: "Socioeconomic", desc: `${project.category} layers active` },
          { label: "Environmental", desc: "Possible external data (Geo-portal)" }
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:border-blue-400">
            <h3 className="font-bold text-gray-800">{item.label}</h3>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapDetailView;