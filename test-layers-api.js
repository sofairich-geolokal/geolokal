const { PrismaClient } = require('@prisma/client');

async function testLayersAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if map_layers table exists and has data
    const layersCount = await prisma.map_layers.count();
    console.log(`📊 Found ${layersCount} layers in map_layers table`);
    
    if (layersCount === 0) {
      console.log('⚠️ No layers found. Creating sample data...');
      
      // Create sample layers
      const sampleLayers = [
        {
          layer_name: 'Ibaan Boundary',
          layer_type: 'boundary',
          metadata: { source: 'official', year: 2023 },
          is_visible: true,
          is_active: true,
        },
        {
          layer_name: 'Ibaan Road Network',
          layer_type: 'road',
          metadata: { source: 'GIS', year: 2023 },
          is_visible: true,
          is_active: true,
        },
        {
          layer_name: 'Ibaan Waterways',
          layer_type: 'waterway',
          metadata: { source: 'hydrology', year: 2023 },
          is_visible: true,
          is_active: true,
        }
      ];
      
      for (const layer of sampleLayers) {
        await prisma.map_layers.create({ data: layer });
        console.log(`✅ Created layer: ${layer.layer_name}`);
      }
      
      console.log('✅ Sample layers created successfully');
    } else {
      // Show existing layers
      const layers = await prisma.map_layers.findMany({
        select: {
          id: true,
          layer_name: true,
          layer_type: true,
          is_visible: true,
          created_at: true
        }
      });
      
      console.log('📋 Existing layers:');
      layers.forEach(layer => {
        console.log(`  - ${layer.id}: ${layer.layer_name} (${layer.layer_type}) - Visible: ${layer.is_visible}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLayersAPI();
