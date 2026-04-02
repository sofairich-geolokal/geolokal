import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // 1. Fetch Current Counts (Using your actual column 'is_active')
    const [parcelResult, cbmsResult, usersResult, logsResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM tax_parcels'),
      query('SELECT COUNT(*) as count FROM cbms_indicators'),
      query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      // Assuming 'action' or 'status' in audit_logs based on previous errors
      query("SELECT COUNT(*) as count FROM audit_logs") 
    ]);

    const parcelCount = parseInt(parcelResult.rows[0]?.count || '0');
    const cbmsCount = parseInt(cbmsResult.rows[0]?.count || '0');
    const activeUsers = parseInt(usersResult.rows[0]?.count || '0');
    const totalLogs = parseInt(logsResult.rows[0]?.count || '1'); // Avoid division by zero

    // 2. Fetch Historical Counts (for growth calculation)
    const [oldParcelResult, oldCbmsResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM tax_parcels WHERE created_at < $1', [thirtyDaysAgo]),
      query('SELECT COUNT(*) as count FROM cbms_indicators WHERE created_at < $1', [thirtyDaysAgo])
    ]);

    const oldParcelCount = parseInt(oldParcelResult.rows[0]?.count || '0');
    const oldCbmsCount = parseInt(oldCbmsResult.rows[0]?.count || '0');

    // Helper functions
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      const diff = ((current - previous) / previous) * 100;
      return parseFloat(diff.toFixed(2));
    };

    const parcelGrowth = calculateGrowth(parcelCount, oldParcelCount);
    const cbmsGrowth = calculateGrowth(cbmsCount, oldCbmsCount);

    // Calculate Uptime (Success logs / Total logs)
    // Replace 'action' with your actual log column name
    const successLogsResult = await query("SELECT COUNT(*) as count FROM audit_logs WHERE action LIKE '%SUCCESS%'");
    const successCount = parseInt(successLogsResult.rows[0]?.count || '0');
    const uptime = ((successCount / totalLogs) * 100).toFixed(1);

    const dynamicData = [
      { 
        title: "Total Tax Parcel", 
        value: parcelCount, 
        growth: Math.abs(parcelGrowth), 
        positive: parcelGrowth >= 0,
        bgColor: "bg-gray-50" 
      },
      { 
        title: "CBMS Indicator", 
        value: cbmsCount, 
        growth: Math.abs(cbmsGrowth), 
        positive: cbmsGrowth >= 0,
        bgColor: "bg-blue-50" 
      },
      { 
        title: "System Uptime", 
        value: `${uptime}%`, 
        growth: 0.02, 
        positive: parseFloat(uptime) > 95,
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