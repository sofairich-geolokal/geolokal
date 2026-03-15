"use client";

import React, { useEffect, useState } from 'react';
import SourceTypesChart from './SourceTypesChart';

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

export default function DashboardPage() {
  // Ensure the default state is an empty array with proper typing
  const [sourceData, setSourceData] = useState<SourceData[]>([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('/api/stats/sources');
        const data = await response.json();
        
        // CHECK: If data is not an array (e.g., an error object), fallback to []
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
      {/* Safety check: Only render if sourceData has items */}
      {sourceData.length > 0 ? (
        <SourceTypesChart data={sourceData} />
      ) : (
        <div className="text-center text-gray-500 text-sm">No data available for the chart.</div>
      )}
    </div>
  );
}