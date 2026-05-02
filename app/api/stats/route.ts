import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // 1. Fetch Current Counts (Using your actual column 'is_active')
    const [projectsResult, mapLayersResult, usersResult, logsResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM projects'),
      query(`
      SELECT COUNT(*) as count 
      FROM map_layers ml 
      WHERE ml.is_active = true
    `),
      query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      // Assuming 'action' or 'status' in audit_logs based on previous errors
      query("SELECT COUNT(*) as count FROM audit_logs") 
    ]);

    const projectsCount = parseInt(projectsResult.rows[0]?.count || '0');
    const mapLayersCount = parseInt(mapLayersResult.rows[0]?.count || '0');
    const activeUsers = parseInt(usersResult.rows[0]?.count || '0');
    const totalLogs = parseInt(logsResult.rows[0]?.count || '1'); // Avoid division by zero

    // 2. Fetch Historical Counts (for growth calculation)
    const [oldProjectsResult, oldMapLayersResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM projects WHERE created_at < $1', [thirtyDaysAgo]),
      query('SELECT COUNT(*) as count FROM map_layers WHERE created_at < $1', [thirtyDaysAgo])
    ]);

    const oldProjectsCount = parseInt(oldProjectsResult.rows[0]?.count || '0');
    const oldMapLayersCount = parseInt(oldMapLayersResult.rows[0]?.count || '0');

    // Helper functions
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      const diff = ((current - previous) / previous) * 100;
      return parseFloat(diff.toFixed(2));
    };

    const projectsGrowth = calculateGrowth(projectsCount, oldProjectsCount);
    const mapLayersGrowth = calculateGrowth(mapLayersCount, oldMapLayersCount);

    // Get audit logs count
    const auditLogsCount = totalLogs;

    const dynamicData = [
      { 
        title: "Total Projects", 
        value: projectsCount, 
        growth: Math.abs(projectsGrowth), 
        positive: projectsGrowth >= 0,
        bgColor: "bg-gray-50" 
      },
      { 
        title: "Map Layers", 
        value: mapLayersCount, 
        growth: Math.abs(mapLayersGrowth), 
        positive: mapLayersGrowth >= 0,
        bgColor: "bg-blue-50" 
      },
      { 
        title: "Audits", 
        value: auditLogsCount, 
        growth: 0, 
        positive: true,
        bgColor: "bg-gray-50" 
      },
      { 
        title: "Active Users", 
        value: activeUsers, 
        growth: 6.08, 
        positive: true,
        bgColor: "bg-blue-50" 
      },
    ];

    return NextResponse.json(dynamicData);
  }
   catch (error: any) {
    console.error("API Error in stats/sources:", error.message);
    
    // Return an empty array [] so the frontend doesn't show an error
    return NextResponse.json([]); 
  }
  
}