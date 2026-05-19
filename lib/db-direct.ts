import { Pool } from 'pg';

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please set up your database connection in .env.local');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Optimized connection pooling for faster login
  max: 10, // Reduced for faster connection
  min: 1, // Keep 1 connection ready
  idleTimeoutMillis: 10000, // Close idle connections after 10 seconds
  connectionTimeoutMillis: 10000, // Increased timeout to 10 seconds for better reliability
  maxUses: 500, // Reuse connections more frequently
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const maxRetries = 3;
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error: any) {
      lastError = error;
      console.error(`Database query attempt ${attempt} failed:`, error.message);
      
      // Don't retry on authentication errors
      if (error.message.includes('password') || error.message.includes('username')) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError;
}

export async function getMapLayers(bounds?: string, category?: string) {
  let whereClause = 'WHERE ml.is_active = true';
  const params: any[] = [];
  
  if (category && category !== 'all') {
    // Map semantic category names to database category names
    const categoryMapping: { [key: string]: string } = {
      'boundary': 'Administrative Boundaries',
      'road': 'Road Networks',
      'waterway': 'Waterways'
    };
    const categoryName = categoryMapping[category] || category;
    whereClause += ` AND pc.name = $${params.length + 1}`;
    params.push(categoryName);
  }
  
  // Note: bbox filtering disabled due to JSON filtering complexity
  // Can be re-enabled with proper PostgreSQL JSON operator implementation
  
  const queryText = `
    SELECT 
      ml.id,
      ml.layer_name as location,
      ml.population,
      ml.households,
      ml.poverty_rate,
      ml.employment_rate,
      ml.demographic_status as status,
      COALESCE(cmm.name, 'Geolokal') as agency,
      COALESCE(pc.name, 'General') as category,
      COALESCE(ml.layer_type, 'vector') as "layerType",
      ROUND(COALESCE(ml.opacity, 1.0) * 100) as opacity,
      CASE WHEN ml.is_downloadable = true THEN 'Yes' ELSE 'No' END as downloadable,
      CASE 
        WHEN ml.bbox IS NOT NULL THEN (ml.bbox->>1)
        WHEN ml.metadata IS NOT NULL THEN (ml.metadata->'center'->>0)
        ELSE '13.86'
      END as latitude,
      CASE 
        WHEN ml.bbox IS NOT NULL THEN (ml.bbox->>0)
        WHEN ml.metadata IS NOT NULL THEN (ml.metadata->'center'->>1)
        ELSE '121.15'
      END as longitude,
      ml.bbox,
      ml.metadata,
      ml.demographic_last_updated as "lastUpdated"
    FROM map_layers ml
    LEFT JOIN city_muni_master cmm ON ml.lgu_id = cmm.id
    LEFT JOIN project_categories pc ON ml.category_id = pc.id
    ${whereClause}
    ORDER BY COALESCE(ml.layer_type, 'vector') ASC, ml.layer_name ASC
  `;
  
  return query(queryText, params);
}