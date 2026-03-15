"use client";

import Cards from "../cards";
import SourceTypesChart from "../SourceTypesChart";
import Projectschart from "../projectschart";
import React, { useEffect, useState } from 'react';

interface SourceData {
  label: string;
  percentage: number;
  value: number;
  color: string;
  status: string;
  lastUpdated: string;
  source: string;
  description: string;
}

function DataChartWrapper() {
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('/api/stats/sources');
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setSourceData(data);
        } else {
          console.error("API did not return an array:", data);
          setSourceData([]);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setSourceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  if (loading) return <div className="py-10 text-center">Loading Sources...</div>;

  return (
    <div className="py-10 px-4 space-y-10 bg-gray-50 rounded-2xl">
      {sourceData.length > 0 ? (
        <SourceTypesChart data={sourceData} />
      ) : (
        <div className="text-center text-gray-500 text-sm">No data available for the chart.</div>
      )}
    </div>
  );
}

// import GeoMap from "../GeoMap";
export default function Dashboard(){
    return(
        <div className="bg-white px-2">
        <Cards />
                <div className="flex flex-col lg:flex-row gap-6 px-5 py-2">
                    <div className="flex-1 rounded-2x1">
                        <Projectschart />
                    </div>
                    <div className="flex-1 rounded-2xl">
                        <DataChartWrapper />
                    </div>
                </div>
        {/* <GeoMap /> */}
        </div>
    )
};
