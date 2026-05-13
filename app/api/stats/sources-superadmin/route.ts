import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireSuperadminRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // For superadmin access, we need to handle the temporary context
    const lguUserId = request.headers.get('x-lgu-user-id');
    
    if (!lguUserId) {
      // Fallback to normal authentication if no superadmin context
      const userId = await requireSuperadminRole();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get LGU user data to determine which LGU to fetch data for
    let lguId;
    if (lguUserId) {
      // Added "as any" to fix 'result' is of type 'unknown'
      const userResult = (await query(
        'SELECT lgu_id FROM users WHERE id = $1 AND role = $2',
        [lguUserId, 'lgu']
      )) as any;
      lguId = userResult.rows[0]?.lgu_id;
    }

    // If no specific LGU ID, return default/empty data for superadmin
    if (!lguId) {
      return NextResponse.json([
        {
          label: "No Data",
          percentage: 0,
          value: 0,
          color: "#gray",
          status: "No Access",
          lastUpdated: new Date().toISOString(),
          source: "Superadmin Access",
          description: "No specific LGU data available"
        }
      ]);
    }

    // Fetch source data for the specific LGU
    // Added "as any" to fix 'result' is of type 'unknown'
    const result = (await query(`
      SELECT 
        source_type as label,
        COUNT(*) as value,
        MAX(created_at) as last_updated
      FROM projects 
      WHERE lgu_id = $1 AND source_type IS NOT NULL
      GROUP BY source_type
      ORDER BY value DESC
    `, [lguId])) as any;

    const totalProjects = result.rows.reduce((sum: number, row: any) => sum + row.value, 0);

    const sourceData = result.rows.map((row: any) => ({
      label: row.label || 'Unknown',
      percentage: totalProjects > 0 ? Math.round((row.value / totalProjects) * 100) : 0,
      value: row.value,
      color: getColorForSource(row.label),
      status: 'Active',
      lastUpdated: new Date(row.last_updated).toISOString(),
      source: row.label,
      description: `Projects from ${row.label} sources`
    }));

    return NextResponse.json(sourceData);

  } catch (error) {
    console.error('Error fetching source data for superadmin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getColorForSource(source: string): string {
  const colors: { [key: string]: string } = {
    'drone': '#10b981',
    'satellite': '#3b82f6', 
    'ground_survey': '#f59e0b',
    'government': '#ef4444',
    'community': '#8b5cf6',
    'default': '#6b7280'
  };
  
  const sourceLower = (source || '').toLowerCase();
  for (const [key, color] of Object.entries(colors)) {
    if (sourceLower.includes(key)) {
      return color;
    }
  }
  return colors.default;
}