"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProjectData {
  month: string;
  active: number;
  completed: number;
  total: number;
}

interface ProjectsChartProps {
  data?: ProjectData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="text-sm font-semibold mb-2">{`Month: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const defaultData: ProjectData[] = [
  { month: 'Jan', active: 12, completed: 8, total: 20 },
  { month: 'Feb', active: 15, completed: 10, total: 25 },
  { month: 'Mar', active: 18, completed: 12, total: 30 },
  { month: 'Apr', active: 14, completed: 15, total: 29 },
  { month: 'May', active: 20, completed: 18, total: 38 },
  { month: 'Jun', active: 22, completed: 20, total: 42 },
];

export default function SuperadminProjectsChart({ data = defaultData }: ProjectsChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#ddd' }}
          />
          <YAxis 
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#ddd' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar 
            dataKey="active" 
            fill="#3B82F6" 
            name="Active Projects"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="completed" 
            fill="#10B981" 
            name="Completed Projects"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
