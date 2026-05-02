require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testRoutesAPI() {
  console.log('Testing /api/routes endpoint logic...\n');
  
  try {
    const whereClause = {};
    
    const layers = await prisma.map_layers.findMany({
      where: whereClause,
      include: {
        project_categories: true,
        city_muni_master: true,
        users: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: [
        { layer_type: 'asc' },
        { layer_name: 'asc' },
      ],
    });
    
    console.log('✅ Prisma query successful');
    console.log('Found', layers.length, 'layers');
    
    const routeData = layers.map((layer) => {
      const metadata = layer.metadata;
      const bbox = layer.bbox;
      const layerAny = layer;

      const population = layerAny.population || null;
      const households = layerAny.households || null;
      const povertyRate = layerAny.poverty_rate || null;
      const employmentRate = layerAny.employment_rate || null;
      const status = layerAny.demographic_status || null;

      const latitude = bbox?.[1] || metadata?.center?.[0] || 13.86;
      const longitude = bbox?.[0] || metadata?.center?.[1] || 121.15;

      return {
        id: layer.id,
        location: `${layer.layer_name}`,
        population,
        households,
        povertyRate,
        employmentRate,
        status,
        agency: layer.city_muni_master?.name || 'Geolokal',
        category: layer.project_categories?.name || 'General',
        layerType: layer.layer_type || 'vector',
        opacity: Math.round((layer.opacity || 1.0) * 100),
        downloadable: layer.is_downloadable ? 'Yes' : 'No',
        latitude,
        longitude,
        bbox: bbox,
        metadata: metadata,
        lastUpdated: layerAny.demographic_last_updated,
      };
    });
    
    console.log('✅ Data transformation successful');
    console.log('Sample data:', JSON.stringify(routeData[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error in routes API logic:', error.message);
    console.error('Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testGeoportalAPI() {
  console.log('\nTesting /api/geoportal/layers endpoint logic...\n');
  
  const { Pool } = require('pg');
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  
  try {
    const whereConditions = ['is_active = true'];
    const queryParams = [];
    let paramIndex = 1;
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const queryText = `
      SELECT 
        layer_id,
        title,
        description,
        abstract,
        keywords,
        data_type,
        agency,
        download_url,
        service_url,
        metadata_url,
        bbox_xmin,
        bbox_ymin,
        bbox_xmax,
        bbox_ymax,
        coordinate_system,
        last_updated,
        is_active
      FROM geoportal_layers gl
      ${whereClause}
      ORDER BY last_updated DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(50, 0);
    
    console.log('Query:', queryText);
    console.log('Params:', queryParams);
    
    const layersResult = await pool.query(queryText, queryParams);
    
    console.log('✅ Geoportal query successful');
    console.log('Found', layersResult.rows.length, 'layers');
    
    if (layersResult.rows.length > 0) {
      console.log('Sample data:', JSON.stringify(layersResult.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error in geoportal API logic:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

async function runTests() {
  await testRoutesAPI();
  await testGeoportalAPI();
}

runTests();
